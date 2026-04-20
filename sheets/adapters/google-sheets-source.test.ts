import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { parseSpecRows } from "../spec-parser.ts";
import type { FetchFn } from "../google-sheets-api.ts";
import { createGoogleSheetsSource, type TokenProvider } from "./google-sheets-source.ts";

/** FetchFn 시그니처로 고정된 `vi.fn` 생성. */
function mockFetch(impl: FetchFn) {
  return vi.fn<FetchFn>(impl);
}

const HEADER_LINE_1 =
  ",,,,,,,,,,pageName(as-is),pageName(to-be),sectionName(as-is),sectionName(to-be),actionName(as-is),actionName(to-be),eventType(as-is),eventType(to-be),,,,,,,,,,,,";
const HEADER_LINE_2 =
  "신규로그상태,status,신규로그배포일,version,registeredBy,reviewedBy,appliedAt,로깅구현,로깅확인,event 발생경로,pageName(as-is),pageName(to-be),objectContainer(as-is),objectContainer(to-be),objectType(as-is),objectType(to-be),eventType(as-is),eventType(to-be),logType,eventName,비고,object (string),extension,eventName,eventName,,event 설명,비고";

const SAMPLE_ROWS: string[][] = [
  HEADER_LINE_1.split(","),
  HEADER_LINE_2.split(","),
  [
    "검수완료", "applied", "", "0", "A", "B", "2025-09-02", "C", "D",
    "매장상세", "shopDetail", "shopDetail", "appDown", "appDown", "app", "app",
    "click", "click", "bottomsheet", "click__app", "", "",
    "$shopRef, $shopName", "shopDetail_appDown_app_click_",
    "shopDetail_appDown_app_click", "", "", "",
  ],
];

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface TokenCalls {
  getToken: boolean[]; // interactive 인자 이력
  removeToken: string[];
  clearAll: number;
}

/** 호출 이력을 기록하는 fake TokenProvider. */
function createFakeTokenProvider(
  tokens: string[] = ["tok-1"],
): TokenProvider & { calls: TokenCalls } {
  const calls: TokenCalls = { getToken: [], removeToken: [], clearAll: 0 };
  let index = 0;
  return {
    calls,
    async getToken(interactive: boolean) {
      calls.getToken.push(interactive);
      const token = tokens[Math.min(index, tokens.length - 1)]!;
      index += 1;
      return token;
    },
    async removeToken(token: string) {
      calls.removeToken.push(token);
    },
    async clearAll() {
      calls.clearAll += 1;
    },
  };
}

describe("createGoogleSheetsSource", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("listTabs가 Sheets API 응답을 SheetTab 배열로 변환한다", async () => {
    const fetchFn = mockFetch(async () =>
      jsonRes({
        sheets: [
          { properties: { sheetId: 0, title: "main" } },
          { properties: { sheetId: 10, title: "search" } },
        ],
      }),
    );
    const source = createGoogleSheetsSource({
      fetchFn,
      tokenProvider: createFakeTokenProvider(),
      spreadsheetId: "sid",
    });

    const tabs = await source.listTabs();
    expect(tabs).toEqual([
      { title: "main", gid: 0 },
      { title: "search", gid: 10 },
    ]);
  });

  it("fetchRows가 돌려준 rows는 parseSpecRows에 투입 가능하다", async () => {
    const fetchFn = mockFetch(async () => jsonRes({ values: SAMPLE_ROWS }));
    const source = createGoogleSheetsSource({
      fetchFn,
      tokenProvider: createFakeTokenProvider(),
      spreadsheetId: "sid",
    });

    const rows = await source.fetchRows("main");
    const { specs, warnings } = parseSpecRows(rows);

    expect(warnings).toEqual([]);
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({
      amplitudeEventName: "shopDetail_appDown_app_click",
      humanEventName: "click__app",
      pageName: "shopDetail",
      params: ["shopRef", "shopName"],
    });
  });

  it("데이터 호출은 silent 토큰을 먼저 시도한다", async () => {
    const fetchFn = mockFetch(async () => jsonRes({ values: [["x"]] }));
    const tokenProvider = createFakeTokenProvider();
    const source = createGoogleSheetsSource({
      fetchFn,
      tokenProvider,
      spreadsheetId: "sid",
    });

    await source.fetchRows("main");
    expect(tokenProvider.calls.getToken).toEqual([false]);
  });

  it("silent 발급 실패 시 대화형으로 승급한다", async () => {
    const fetchFn = mockFetch(async () => jsonRes({ values: [["x"]] }));
    const calls: TokenCalls = { getToken: [], removeToken: [], clearAll: 0 };
    const tokenProvider: TokenProvider = {
      async getToken(interactive) {
        calls.getToken.push(interactive);
        if (!interactive) throw new Error("no cache");
        return "fresh";
      },
      async removeToken() {},
      async clearAll() {},
    };
    const source = createGoogleSheetsSource({
      fetchFn,
      tokenProvider,
      spreadsheetId: "sid",
    });

    await source.fetchRows("main");
    expect(calls.getToken).toEqual([false, true]);
  });

  it("401 응답이면 토큰을 폐기하고 대화형 재발급 후 한 번 재시도한다", async () => {
    const fetchFn = mockFetch(async () => jsonRes({ values: [["x"]] }));
    fetchFn
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(jsonRes({ values: [["x"]] }));
    const tokenProvider = createFakeTokenProvider(["stale", "fresh"]);

    const source = createGoogleSheetsSource({
      fetchFn,
      tokenProvider,
      spreadsheetId: "sid",
    });

    const rows = await source.fetchRows("main");
    expect(rows).toEqual([["x"]]);
    expect(tokenProvider.calls.removeToken).toEqual(["stale"]);
    // 최초 silent → 재발급 interactive
    expect(tokenProvider.calls.getToken).toEqual([false, true]);
    const secondInit = fetchFn.mock.calls[1]?.[1] as RequestInit;
    expect((secondInit.headers as Record<string, string>).Authorization).toBe(
      "Bearer fresh",
    );
  });

  it("403 응답도 401과 같은 재인증 경로로 복구한다", async () => {
    const fetchFn = mockFetch(async () => jsonRes({ values: [["ok"]] }));
    fetchFn
      .mockResolvedValueOnce(new Response("forbidden", { status: 403 }))
      .mockResolvedValueOnce(jsonRes({ values: [["ok"]] }));
    const tokenProvider = createFakeTokenProvider(["stale", "fresh"]);

    const source = createGoogleSheetsSource({
      fetchFn,
      tokenProvider,
      spreadsheetId: "sid",
    });

    const rows = await source.fetchRows("main");
    expect(rows).toEqual([["ok"]]);
    expect(tokenProvider.calls.removeToken).toEqual(["stale"]);
    expect(tokenProvider.calls.getToken).toEqual([false, true]);
  });

  it("429 응답이면 백오프 후 한 번 재시도한다", async () => {
    const fetchFn = mockFetch(async () => jsonRes({ values: [["ok"]] }));
    fetchFn
      .mockResolvedValueOnce(new Response("rate", { status: 429 }))
      .mockResolvedValueOnce(jsonRes({ values: [["ok"]] }));
    const sleepFn = vi.fn(async (_ms: number) => {});
    const source = createGoogleSheetsSource({
      fetchFn,
      tokenProvider: createFakeTokenProvider(),
      sleepFn,
      spreadsheetId: "sid",
    });

    const rows = await source.fetchRows("main");
    expect(rows).toEqual([["ok"]]);
    expect(sleepFn).toHaveBeenCalledTimes(1);
  });

  it("재시도 후에도 실패하면 에러가 전파된다(단일 분기)", async () => {
    const fetchFn = mockFetch(async () => new Response("x", { status: 401 }));
    fetchFn
      .mockResolvedValueOnce(new Response("x", { status: 401 }))
      .mockResolvedValueOnce(new Response("x", { status: 401 }));
    const source = createGoogleSheetsSource({
      fetchFn,
      tokenProvider: createFakeTokenProvider(["a", "b"]),
      spreadsheetId: "sid",
    });

    await expect(source.fetchRows("main")).rejects.toThrow(/401/);
  });

  it("authenticate는 interactive=true로 토큰을 요청한다", async () => {
    const tokenProvider = createFakeTokenProvider();
    const source = createGoogleSheetsSource({
      fetchFn: mockFetch(async () => jsonRes({})),
      tokenProvider,
      spreadsheetId: "sid",
    });
    await source.authenticate();
    expect(tokenProvider.calls.getToken).toEqual([true]);
  });

  it("signOut은 캐시 토큰을 명시적으로 폐기한 뒤 clearAll을 호출한다", async () => {
    const tokenProvider = createFakeTokenProvider(["cached"]);
    const source = createGoogleSheetsSource({
      fetchFn: mockFetch(async () => jsonRes({})),
      tokenProvider,
      spreadsheetId: "sid",
    });
    await source.signOut();
    expect(tokenProvider.calls.getToken).toEqual([false]);
    expect(tokenProvider.calls.removeToken).toEqual(["cached"]);
    expect(tokenProvider.calls.clearAll).toBe(1);
  });

  it("signOut은 캐시 토큰이 없어도 clearAll까지 도달한다", async () => {
    const calls: TokenCalls = { getToken: [], removeToken: [], clearAll: 0 };
    const tokenProvider: TokenProvider = {
      async getToken() {
        calls.getToken.push(false);
        throw new Error("no cached token");
      },
      async removeToken(token) {
        calls.removeToken.push(token);
      },
      async clearAll() {
        calls.clearAll += 1;
      },
    };
    const source = createGoogleSheetsSource({
      fetchFn: mockFetch(async () => jsonRes({})),
      tokenProvider,
      spreadsheetId: "sid",
    });
    await source.signOut();
    expect(calls.removeToken).toEqual([]);
    expect(calls.clearAll).toBe(1);
  });
});

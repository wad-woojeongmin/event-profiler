import { describe, expect, it, vi } from "vitest";
import {
  fetchSheetValues,
  fetchSpreadsheetTabs,
  SheetsApiError,
  type FetchFn,
} from "./google-sheets-api.ts";

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
}

/** FetchFn 시그니처를 유지하며 `vi.fn`으로 감싸 mock 호출 기록을 남긴다. */
function mockFetch(impl: FetchFn) {
  return vi.fn<FetchFn>(impl);
}

describe("fetchSpreadsheetTabs", () => {
  it("탭 메타데이터를 SheetTab 목록으로 변환한다", async () => {
    const fetchFn = mockFetch(async () =>
      jsonResponse({
        sheets: [
          { properties: { sheetId: 0, title: "main" } },
          { properties: { sheetId: 123, title: "search list" } },
        ],
      }),
    );

    const tabs = await fetchSpreadsheetTabs(fetchFn, "tok", "sid");

    expect(tabs).toEqual([
      { title: "main", gid: 0 },
      { title: "search list", gid: 123 },
    ]);
    const call = fetchFn.mock.calls[0]!;
    const url = call[0] as string;
    const init = call[1] as RequestInit | undefined;
    expect(url).toContain("/spreadsheets/sid");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok",
    );
  });

  it("properties가 불완전한 항목은 건너뛴다", async () => {
    const fetchFn = mockFetch(async () =>
      jsonResponse({
        sheets: [
          { properties: { title: "noId" } },
          { properties: { sheetId: 1, title: "ok" } },
          {},
        ],
      }),
    );
    const tabs = await fetchSpreadsheetTabs(fetchFn, "tok", "sid");
    expect(tabs).toEqual([{ title: "ok", gid: 1 }]);
  });

  it("비정상 응답이면 SheetsApiError를 던진다", async () => {
    const fetchFn = mockFetch(async () => new Response("nope", { status: 401 }));
    const err = await fetchSpreadsheetTabs(fetchFn, "tok", "sid").catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(SheetsApiError);
    expect((err as SheetsApiError).status).toBe(401);
  });
});

describe("fetchSheetValues", () => {
  it("values 배열을 그대로 돌려준다", async () => {
    const rows = [
      ["a", "b", "c"],
      ["1", "2"],
    ];
    const fetchFn = mockFetch(async () =>
      jsonResponse({ range: "main!A1:ZZ", values: rows }),
    );
    const out = await fetchSheetValues(fetchFn, "tok", "main", "sid");
    expect(out).toEqual(rows);
    const url = fetchFn.mock.calls[0]![0] as string;
    expect(url).toContain("/values/");
    expect(url).toContain(encodeURIComponent("main!A1:ZZ"));
  });

  it("values가 없으면 빈 배열", async () => {
    const fetchFn = mockFetch(async () => jsonResponse({}));
    const out = await fetchSheetValues(fetchFn, "tok", "main", "sid");
    expect(out).toEqual([]);
  });

  it("공백이 포함된 탭 제목은 따옴표로 감싼다", async () => {
    const fetchFn = mockFetch(async () => jsonResponse({ values: [] }));
    await fetchSheetValues(fetchFn, "tok", "search list", "sid");
    const url = fetchFn.mock.calls[0]![0] as string;
    expect(url).toContain(encodeURIComponent("'search list'!A1:ZZ"));
  });

  it("숫자로만 된 탭명도 따옴표로 감싼다(API 400 방어)", async () => {
    const fetchFn = mockFetch(async () => jsonResponse({ values: [] }));
    await fetchSheetValues(fetchFn, "tok", "2024", "sid");
    const url = fetchFn.mock.calls[0]![0] as string;
    expect(url).toContain(encodeURIComponent("'2024'!A1:ZZ"));
  });

  it("한글 탭명도 따옴표로 감싼다", async () => {
    const fetchFn = mockFetch(async () => jsonResponse({ values: [] }));
    await fetchSheetValues(fetchFn, "tok", "메인", "sid");
    const url = fetchFn.mock.calls[0]![0] as string;
    expect(url).toContain(encodeURIComponent("'메인'!A1:ZZ"));
  });

  it("탭 제목 안의 작은따옴표는 두 개로 escape", async () => {
    const fetchFn = mockFetch(async () => jsonResponse({ values: [] }));
    await fetchSheetValues(fetchFn, "tok", "it's", "sid");
    const url = fetchFn.mock.calls[0]![0] as string;
    expect(url).toContain(encodeURIComponent("'it''s'!A1:ZZ"));
  });

  it("429면 SheetsApiError(429)", async () => {
    const fetchFn = mockFetch(async () => new Response("rate", { status: 429 }));
    const err = await fetchSheetValues(fetchFn, "tok", "main", "sid").catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(SheetsApiError);
    expect((err as SheetsApiError).status).toBe(429);
  });
});

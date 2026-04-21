// messaging-background-client 어댑터 단위 테스트.
//
// 메시징 경로(`sendMessage`)는 `@webext-core/messaging`의 동일 컨텍스트 제약
// (한 프로세스당 리스너 1개 + 실제 브라우저 채널 필요) 때문에 unit 테스트에서
// 실구현을 그대로 돌리면 테스트 간 간섭이 발생한다. 따라서 공용 인스턴스를 mock해
// 호출 페이로드를 검증한다. 어댑터↔메시징 통합은 수동 확장 로드로 담보한다.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing";

import type { RecordingSessionState } from "@/types/messages.ts";
import type { EventSpec } from "@/types/spec.ts";
import { SPECS_CACHE_KEY } from "@/types/storage.ts";

const sendMessageMock = vi.fn();
const fetchSheetRowsMock = vi.fn(async (_title: string) => [] as string[][]);
const listSheetTabsMock = vi.fn(async () => [{ title: "main", gid: 0 }]);
const parseSpecRowsMock = vi.fn((_rows: string[][], _opts?: unknown) => ({
  specs: [] as EventSpec[],
  warnings: [],
}));

vi.mock("@/messaging/extension-messaging.ts", () => ({
  sendMessage: (...args: unknown[]) => sendMessageMock(...args),
  onMessage: vi.fn(),
}));

vi.mock("@/sheets/index.ts", () => ({
  authenticate: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  hasCachedToken: vi.fn(async () => false),
  fetchSheetRows: (title: string) => fetchSheetRowsMock(title),
  listSheetTabs: () => listSheetTabsMock(),
  parseSpecRows: (rows: string[][], opts?: unknown) =>
    parseSpecRowsMock(rows, opts),
  // 어댑터가 실제 사용하는 패턴을 그대로 노출한다. 실 모듈과 드리프트되지 않도록
  // constants.ts와 동일 정의를 복제(실제 구현과 diff 시 테스트도 업데이트).
  LOG_DEFINITION_TAB_PATTERN: /^\d+\.\s*.*신규\s*로그\s*설계/,
}));

const ACTIVE: RecordingSessionState = {
  session: {
    id: "sess-1",
    startedAt: 1_000,
    endedAt: undefined,
    tabId: 42,
    targetEventNames: ["a"],
    capturedCount: 0,
  },
  capturedCount: 0,
  targetEventNames: ["a"],
};

const { createMessagingBackgroundClient } = await import(
  "./messaging-background-client.ts"
);

beforeEach(() => {
  fakeBrowser.reset();
  sendMessageMock.mockReset();
  fetchSheetRowsMock.mockReset();
  fetchSheetRowsMock.mockImplementation(async () => [] as string[][]);
  listSheetTabsMock.mockReset();
  listSheetTabsMock.mockImplementation(async () => [
    { title: "main", gid: 0 },
  ]);
  parseSpecRowsMock.mockReset();
  parseSpecRowsMock.mockImplementation(() => ({ specs: [], warnings: [] }));
});

function makeSpec(amplitudeEventName: string, sourceSheet: string): EventSpec {
  return {
    amplitudeEventName,
    humanEventName: amplitudeEventName,
    pageName: "p",
    sectionName: undefined,
    actionName: undefined,
    eventType: "click",
    logType: undefined,
    params: [],
    referencedExtensions: [],
    rawExtension: "",
    status: "",
    sourceRow: 2,
    sourceSheet,
  };
}

describe("createMessagingBackgroundClient", () => {
  it("loadSpecs는 로그 정의 탭 패턴과 일치하는 탭만 병렬 로드하여 specs를 합친다", async () => {
    // 컨벤션·가이드·AI요약 등 무관한 탭이 섞여 있어야 버그 재발 방지.
    listSheetTabsMock.mockResolvedValue([
      { title: "00. Convention Rule", gid: 1 },
      { title: "FY26-로그설계 Guide", gid: 2 },
      { title: "AI올인원 요약", gid: 3 },
      { title: "03. 메인_신규로그설계", gid: 4 },
      { title: "07. 타임라인_신규 로그설계 (최종완)", gid: 5 },
      { title: "22.전환이 필요한 로그_신규로그설계", gid: 6 },
    ]);
    fetchSheetRowsMock.mockImplementation(async (title: string) => [
      [title, "row"],
    ]);
    parseSpecRowsMock.mockImplementation((_rows, opts) => {
      const sheet = (opts as { sheetName?: string } | undefined)?.sheetName ?? "?";
      return { specs: [makeSpec(`e_${sheet}`, sheet)], warnings: [] };
    });

    const client = createMessagingBackgroundClient();
    const specs = await client.loadSpecs();

    // 정의 탭 3개만 fetch되었는지 — 무관한 탭으로는 호출되지 않아야.
    expect(fetchSheetRowsMock).toHaveBeenCalledTimes(3);
    const fetched = fetchSheetRowsMock.mock.calls.map((c) => c[0]);
    expect(fetched).toEqual([
      "03. 메인_신규로그설계",
      "07. 타임라인_신규 로그설계 (최종완)",
      "22.전환이 필요한 로그_신규로그설계",
    ]);

    // 합쳐진 specs는 탭 순서대로 누적된다.
    expect(specs.map((s) => s.amplitudeEventName)).toEqual([
      "e_03. 메인_신규로그설계",
      "e_07. 타임라인_신규 로그설계 (최종완)",
      "e_22.전환이 필요한 로그_신규로그설계",
    ]);
  });

  it("setCachedSpecs는 specs를 local:specsCache에 기록해 리포트 어셈블러가 읽을 수 있게 한다", async () => {
    // 이 기록이 빠지면 M8 `reportAssembler.run()`이 specs=null을 읽어 null을 반환하고,
    // "리포트 생성 (새 탭)" 버튼이 조용히 no-op이 된다(PR #11 회귀 재발 방지).
    // 기록 책임은 `loadSpecsAtom`이 지지만 실제 스토리지 접근 경로는 이 어댑터이므로
    // 어댑터 레이어에서 "SPECS_CACHE_KEY에 올바르게 쓴다"는 계약을 여기서 검증한다.
    const expected = [makeSpec("e1", "03. 메인_신규로그설계")];
    const client = createMessagingBackgroundClient();
    await client.setCachedSpecs(expected);

    const { storage } = await import("wxt/utils/storage");
    const cached = await storage.getItem<EventSpec[] | null>(SPECS_CACHE_KEY);
    expect(cached).toEqual(expected);
  });

  it("loadSpecs(title)로 명시되면 해당 탭만 단일 로드한다", async () => {
    fetchSheetRowsMock.mockResolvedValue([["x"]]);
    parseSpecRowsMock.mockReturnValue({
      specs: [makeSpec("only", "03. 메인_신규로그설계")],
      warnings: [],
    });

    const client = createMessagingBackgroundClient();
    const specs = await client.loadSpecs("03. 메인_신규로그설계");

    expect(listSheetTabsMock).not.toHaveBeenCalled();
    expect(fetchSheetRowsMock).toHaveBeenCalledWith("03. 메인_신규로그설계");
    expect(specs).toHaveLength(1);
  });

  it("loadSpecs는 매칭 탭이 없으면 안내 에러를 throw한다", async () => {
    listSheetTabsMock.mockResolvedValue([
      { title: "00. Convention Rule", gid: 1 },
      { title: "AI올인원 요약", gid: 2 },
    ]);
    const client = createMessagingBackgroundClient();
    await expect(client.loadSpecs()).rejects.toThrow(/로그 정의 탭/);
    expect(fetchSheetRowsMock).not.toHaveBeenCalled();
  });

  it("startRecording은 배열 복사본과 tabId를 담아 전송한다", async () => {
    sendMessageMock.mockResolvedValue(undefined);
    const targets = ["a", "b"];
    const client = createMessagingBackgroundClient();
    await client.startRecording(targets, 7);

    expect(sendMessageMock).toHaveBeenCalledWith("startRecording", {
      targetEventNames: ["a", "b"],
      tabId: 7,
    });
    // 입력 배열의 참조가 보존되면 호출자 측 변조에 노출되므로 복사본이어야 한다.
    const sent = sendMessageMock.mock.calls[0]![1].targetEventNames;
    expect(sent).not.toBe(targets);
  });

  it("stopRecording·generateReport는 undefined 페이로드로 전송한다", async () => {
    sendMessageMock.mockResolvedValue(undefined);
    const client = createMessagingBackgroundClient();
    await client.stopRecording();
    await client.generateReport();

    expect(sendMessageMock).toHaveBeenNthCalledWith(1, "stopRecording", undefined);
    expect(sendMessageMock).toHaveBeenNthCalledWith(2, "generateReport", undefined);
  });

  it("getSessionState는 응답을 그대로 반환한다", async () => {
    sendMessageMock.mockResolvedValue(ACTIVE);
    const client = createMessagingBackgroundClient();
    expect(await client.getSessionState()).toEqual(ACTIVE);
  });

  it("subscribeSession은 최초 1회 + interval tick마다 onChange를 호출한다", async () => {
    sendMessageMock.mockResolvedValue(ACTIVE);
    const timers: Array<() => void> = [];
    const client = createMessagingBackgroundClient({
      setIntervalFn: (fn) => {
        timers.push(fn);
        return timers.length;
      },
      clearIntervalFn: () => {
        timers.length = 0;
      },
      pollIntervalMs: 10,
    });

    const received: RecordingSessionState[] = [];
    const unsubscribe = client.subscribeSession((s) => received.push(s));

    // 최초 즉시 호출
    await flushMicrotasks();
    expect(received).toHaveLength(1);

    // 한 tick 진행 → 두 번째 호출.
    timers[0]?.();
    await flushMicrotasks();
    expect(received).toHaveLength(2);

    unsubscribe();
    // 해제 후 tick은 무시된다.
    timers[0]?.();
    await flushMicrotasks();
    expect(received).toHaveLength(2);
  });

  it("subscribeSession은 폴링 중 일시 실패를 삼키고 다음 tick에서 복구된다", async () => {
    sendMessageMock
      .mockRejectedValueOnce(new Error("일시 실패"))
      .mockResolvedValue(ACTIVE);

    const timers: Array<() => void> = [];
    const client = createMessagingBackgroundClient({
      setIntervalFn: (fn) => {
        timers.push(fn);
        return timers.length;
      },
      clearIntervalFn: () => {
        timers.length = 0;
      },
      pollIntervalMs: 10,
    });

    const received: RecordingSessionState[] = [];
    const unsubscribe = client.subscribeSession((s) => received.push(s));

    // 첫 tick은 실패 — throw가 밖으로 새지 않고 received는 아직 비어있어야 한다.
    await flushMicrotasks();
    expect(received).toHaveLength(0);

    // 다음 tick은 성공 응답으로 복구.
    timers[0]?.();
    await flushMicrotasks();
    expect(received).toEqual([ACTIVE]);

    unsubscribe();
  });

  it("getActiveTab은 id와 url을 반환하고, 활성 탭이 없으면 throw", async () => {
    const client = createMessagingBackgroundClient();
    fakeBrowser.tabs.query = async () =>
      [
        {
          id: 123,
          url: "https://www.catchtable.co.kr/orders",
          index: 0,
          highlighted: true,
          active: true,
          pinned: false,
          incognito: false,
          windowId: 1,
        },
      ] as never;
    expect(await client.getActiveTab()).toEqual({
      id: 123,
      url: "https://www.catchtable.co.kr/orders",
    });

    // url은 호스트 권한이 없으면 undefined가 올 수 있다 — 그대로 전달한다.
    fakeBrowser.tabs.query = async () =>
      [
        {
          id: 7,
          index: 0,
          highlighted: true,
          active: true,
          pinned: false,
          incognito: false,
          windowId: 1,
        },
      ] as never;
    expect(await client.getActiveTab()).toEqual({ id: 7, url: undefined });

    fakeBrowser.tabs.query = async () => [] as never;
    await expect(client.getActiveTab()).rejects.toThrow(/활성 탭/);
  });
});

/** 폴링 tick 결과를 마이크로태스크 큐 flush 후 관찰한다. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

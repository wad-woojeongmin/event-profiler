// messaging-background-client 어댑터 단위 테스트.
//
// 메시징 경로(`sendMessage`)는 `@webext-core/messaging`의 동일 컨텍스트 제약
// (한 프로세스당 리스너 1개 + 실제 브라우저 채널 필요) 때문에 unit 테스트에서
// 실구현을 그대로 돌리면 테스트 간 간섭이 발생한다. 따라서 공용 인스턴스를 mock해
// 호출 페이로드를 검증한다. 어댑터↔메시징 통합은 수동 확장 로드로 담보한다.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing";

import type { RecordingSessionState } from "@/types/messages.ts";

const sendMessageMock = vi.fn();

vi.mock("@/messaging/extension-messaging.ts", () => ({
  sendMessage: (...args: unknown[]) => sendMessageMock(...args),
  onMessage: vi.fn(),
}));

vi.mock("@/sheets/index.ts", () => ({
  authenticate: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  fetchSheetRows: vi.fn(async () => [] as string[][]),
  listSheetTabs: vi.fn(async () => [{ title: "main", gid: 0 }]),
  parseSpecRows: vi.fn(() => ({ specs: [], warnings: [] })),
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
});

describe("createMessagingBackgroundClient", () => {
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

  it("getActiveTabId는 활성 탭 id를 반환하고, 없으면 throw", async () => {
    const client = createMessagingBackgroundClient();
    fakeBrowser.tabs.query = async () =>
      [
        {
          id: 123,
          index: 0,
          highlighted: true,
          active: true,
          pinned: false,
          incognito: false,
          windowId: 1,
        },
      ] as never;
    expect(await client.getActiveTabId()).toBe(123);

    fakeBrowser.tabs.query = async () => [] as never;
    await expect(client.getActiveTabId()).rejects.toThrow(/활성 탭/);
  });
});

/** 폴링 tick 결과를 마이크로태스크 큐 flush 후 관찰한다. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// 녹화 아톰의 상태 전이·액션 호출 검증.

import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import type { RecordingSessionState } from "@/types/messages.ts";

import { backgroundClientAtom } from "./client-atom.ts";
import {
  clearSelectionAtom,
  generateReportAtom,
  hydrateSessionAtom,
  recordingPhaseAtom,
  recordingSessionAtom,
  selectedEventNamesAtom,
  setSelectionAtom,
  startRecordingAtom,
  stopRecordingAtom,
  toggleSelectionAtom,
} from "./recording-atoms.ts";
import {
  createFakeBackgroundClient,
  type FakeBackgroundClient,
} from "./test-fixtures.test-util.ts";

const activeSession: RecordingSessionState = {
  session: {
    id: "sess-1",
    startedAt: 1_000,
    endedAt: undefined,
    tabId: 42,
    targetEventNames: ["a", "b"],
    capturedCount: 0,
  },
  capturedCount: 0,
  targetEventNames: ["a", "b"],
};

const endedSession: RecordingSessionState = {
  session: { ...activeSession.session!, endedAt: 2_000, capturedCount: 3 },
  capturedCount: 3,
  targetEventNames: ["a", "b"],
};

let store: ReturnType<typeof createStore>;
let client: FakeBackgroundClient;

beforeEach(() => {
  store = createStore();
  client = createFakeBackgroundClient();
  store.set(backgroundClientAtom, client);
});

describe("selectedEventNames 액션", () => {
  it("toggle로 포함/제외가 전환된다", () => {
    store.set(toggleSelectionAtom, "a");
    expect(store.get(selectedEventNamesAtom).has("a")).toBe(true);
    store.set(toggleSelectionAtom, "a");
    expect(store.get(selectedEventNamesAtom).has("a")).toBe(false);
  });

  it("setSelection은 새 Set으로 교체된다", () => {
    store.set(setSelectionAtom, ["x", "y"]);
    expect([...store.get(selectedEventNamesAtom)]).toEqual(["x", "y"]);
  });

  it("clearSelection은 빈 Set을 남긴다", () => {
    store.set(setSelectionAtom, ["x"]);
    store.set(clearSelectionAtom);
    expect(store.get(selectedEventNamesAtom).size).toBe(0);
  });
});

describe("recordingPhaseAtom", () => {
  it("세션 없음 → idle", () => {
    expect(store.get(recordingPhaseAtom)).toBe("idle");
  });
  it("endedAt undefined → recording", () => {
    store.set(recordingSessionAtom, activeSession);
    expect(store.get(recordingPhaseAtom)).toBe("recording");
  });
  it("endedAt 세팅 → recording_done", () => {
    store.set(recordingSessionAtom, endedSession);
    expect(store.get(recordingPhaseAtom)).toBe("recording_done");
  });
});

describe("startRecordingAtom", () => {
  it("선택 0건이면 클라이언트를 호출하지 않는다", async () => {
    await store.set(startRecordingAtom);
    expect(client.calls.startRecording).toHaveLength(0);
  });

  it("선택된 이벤트와 현재 탭 id를 전송하고 세션 상태를 갱신한다", async () => {
    store.set(setSelectionAtom, ["a", "b"]);
    client.setActiveTab({ id: 99, url: "https://www.catchtable.co.kr/" });
    client.setSessionState(activeSession);

    await store.set(startRecordingAtom);

    expect(client.calls.startRecording).toEqual([
      { targetEventNames: ["a", "b"], tabId: 99 },
    ]);
    expect(store.get(recordingSessionAtom)).toEqual(activeSession);
    expect(store.get(recordingPhaseAtom)).toBe("recording");
  });

  it("활성 탭이 catchtable 호스트가 아니면 클라이언트를 호출하지 않는다", async () => {
    store.set(setSelectionAtom, ["a"]);
    client.setActiveTab({ id: 99, url: "https://example.com/" });
    await store.set(startRecordingAtom);
    expect(client.calls.startRecording).toHaveLength(0);
  });

  it("활성 탭 url이 undefined면(권한 없음) no-op", async () => {
    store.set(setSelectionAtom, ["a"]);
    client.setActiveTab({ id: 99, url: undefined });
    await store.set(startRecordingAtom);
    expect(client.calls.startRecording).toHaveLength(0);
  });
});

describe("stopRecordingAtom", () => {
  it("stopRecording 호출 후 세션을 재조회해 반영한다", async () => {
    client.setSessionState(endedSession);
    await store.set(stopRecordingAtom);
    expect(client.calls.stopRecording).toBe(1);
    expect(store.get(recordingSessionAtom)).toEqual(endedSession);
    expect(store.get(recordingPhaseAtom)).toBe("recording_done");
  });
});

describe("generateReportAtom", () => {
  it("클라이언트의 generateReport를 호출한다", async () => {
    await store.set(generateReportAtom);
    expect(client.calls.generateReport).toBe(1);
  });
});

describe("hydrateSessionAtom", () => {
  it("초기 스냅샷을 반영하고 구독 후 emit 시 상태가 갱신된다", async () => {
    client.setSessionState(activeSession);
    const unsubscribe = await store.set(hydrateSessionAtom);
    expect(store.get(recordingSessionAtom)).toEqual(activeSession);

    client.emit(endedSession);
    expect(store.get(recordingSessionAtom)).toEqual(endedSession);

    unsubscribe();
    // unsubscribe 후 emit은 반영되지 않아야 한다.
    client.emit(activeSession);
    expect(store.get(recordingSessionAtom)).toEqual(endedSession);
  });
});

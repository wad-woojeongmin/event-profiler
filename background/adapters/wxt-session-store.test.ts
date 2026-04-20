// WxtSessionStore 어댑터 통합 테스트.
//
// WxtVitest 플러그인이 `browser.storage.session`을 fake-browser로 자동
// 폴리필하므로 in-memory fake를 별도로 만들 필요가 없다(03-conventions §테스트).

import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing";

import type { RecordingSession } from "@/types/event.ts";

import { createWxtSessionStore } from "./wxt-session-store.ts";

const SAMPLE: RecordingSession = {
  id: "sess-1",
  startedAt: 1_000,
  endedAt: undefined,
  tabId: 7,
  targetEventNames: ["a", "b"],
  capturedCount: 3,
};

describe("createWxtSessionStore", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("초기 상태에서 getRecording은 null", async () => {
    const store = createWxtSessionStore();
    expect(await store.getRecording()).toBeNull();
  });

  it("set 후 get으로 동일 객체 반환", async () => {
    const store = createWxtSessionStore();
    await store.setRecording(SAMPLE);
    expect(await store.getRecording()).toEqual(SAMPLE);
  });

  it("null을 set하면 값이 제거되어 다시 null을 반환", async () => {
    const store = createWxtSessionStore();
    await store.setRecording(SAMPLE);
    await store.setRecording(null);
    expect(await store.getRecording()).toBeNull();
  });
});

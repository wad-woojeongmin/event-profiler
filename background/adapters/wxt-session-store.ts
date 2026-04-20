// `wxt/storage` 기반 SessionStore 어댑터.
//
// `session:*` 영역은 브라우저 세션(윈도우 열려 있는 동안) 단위로 유지되므로
// SW가 재시작되어도 복구 가능하다. 포트 외부에는 WxtStorageItem 인스턴스를
// 노출하지 않는다(철칙 1).

import { storage } from "wxt/utils/storage";

import type { RecordingSession } from "@/types/event.ts";

import type { SessionStore } from "../ports/session-store.ts";

const recordingItem = storage.defineItem<RecordingSession | null>(
  "session:recordingState",
  { fallback: null },
);

export function createWxtSessionStore(): SessionStore {
  return {
    async getRecording() {
      return recordingItem.getValue();
    },
    async setRecording(session) {
      if (session === null) {
        await recordingItem.removeValue();
        return;
      }
      await recordingItem.setValue(session);
    },
  };
}

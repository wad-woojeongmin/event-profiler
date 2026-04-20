// `wxt/storage` 기반 SessionStore 어댑터.
//
// `session:*` 영역은 브라우저 세션(윈도우가 열려 있는 동안) 범위에서 유지되므로
// SW가 idle→깨어날 때 상태를 복구할 수 있다. `WxtStorageItem`은 내부 필드로만
// 보관하고 포트 밖으로 노출하지 않는다(SOLID 철칙 1).

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
      // null은 `setValue(null)`이 아니라 `removeValue()`로 처리 —
      // storage에 `null` 값이 그대로 남지 않고 키가 제거된다.
      if (session === null) {
        await recordingItem.removeValue();
        return;
      }
      await recordingItem.setValue(session);
    },
  };
}

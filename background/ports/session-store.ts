// 녹화 세션의 영속 상태 포트.
//
// 어댑터는 `wxt/storage`의 `session:*` 영역을 쓰지만 외부에는 `RecordingSession`만
// 노출. SW가 idle→깨어날 때 이 포트를 읽어 상태를 복구한다(윈도우가 열려 있는
// 동안 session 영역은 유지됨).

import type { RecordingSession } from "@/types/event.ts";

export interface SessionStore {
  /** @returns 진행 중이거나 최근 종료된 세션 1건. 없으면 null. */
  getRecording(): Promise<RecordingSession | null>;
  /**
   * 세션을 덮어쓴다. `null`을 넘기면 해제(storage에서 키 제거).
   * `endedAt`이 설정된 상태로 저장해 두면 복구 시 종료된 세션으로 인식된다.
   */
  setRecording(session: RecordingSession | null): Promise<void>;
}

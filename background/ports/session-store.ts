// 현재 녹화 세션의 영속 상태 포트.
//
// 실제 저장소는 `wxt/storage`의 `session:*` 영역이지만 포트 외부에는 도메인
// 타입(`RecordingSession`)만 노출한다. SW가 재시작되어도 `session` 영역은
// 살아있으므로 복구 지점은 이 포트를 통해 재로딩된다.

import type { RecordingSession } from "@/types/event.ts";

export interface SessionStore {
  /** 현재 진행 중이거나 최근에 종료된 세션. 없으면 null. */
  getRecording(): Promise<RecordingSession | null>;
  /** null을 주면 세션 해제. */
  setRecording(session: RecordingSession | null): Promise<void>;
}

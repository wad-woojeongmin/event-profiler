// 리포트 어셈블러가 의존하는 "세션 읽기" 포트.
//
// ReportAssembler는 녹화 세션 메타(RecordingSession + targetEventNames)와
// 현재까지 캡처된 이벤트만 필요하므로, RecordingSessionController의 전체 API가
// 아니라 이 두 read 메서드만 노출하는 최소 포트로 분리한다(ISP). 테스트에서도
// in-memory fake를 이 인터페이스로 명시 주입한다.

import type { CapturedEvent } from "@/types/event.ts";
import type { RecordingSessionState } from "@/types/messages.ts";

export interface SessionSource {
  /** 현재 세션 메타 + targetEventNames + capturedCount. */
  getState(): Promise<RecordingSessionState>;
  /** 현재 세션에 속한 캡처 이벤트. 세션이 없으면 빈 배열. */
  listCurrentEvents(): Promise<CapturedEvent[]>;
}

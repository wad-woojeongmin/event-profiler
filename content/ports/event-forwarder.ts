// Content Script → Background 포워딩 포트.
//
// 어댑터는 `@webext-core/messaging`의 공용 `sendMessage('captureEvent', ...)`을
// 사용한다. 포트 경계에는 라이브러리 타입을 노출하지 않는다.

import type { CapturedEvent } from "@/types/event.ts";

export interface EventForwarder {
  /**
   * 정규화된 이벤트를 background로 전달한다.
   *
   * - `id`/`screenshotId`는 background가 채우는 필드이므로 포워딩 단계에서는 제외.
   * - background가 꺼져 있거나 메시지가 실패해도 조용히 삼킨다(수용 기준:
   *   실패 시 재시도 없이 drop).
   */
  forward(event: Omit<CapturedEvent, "id" | "screenshotId">): Promise<void>;
}

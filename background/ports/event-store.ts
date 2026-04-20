// 이벤트 영속 저장소 포트.
//
// 쓰기·읽기를 분리해 소비자마다 최소 권한만 갖도록 한다(ISP). M3는 Writer,
// M7/M8은 Reader만 의존.

import type { CapturedEvent } from "@/types/event.ts";

export interface EventWriter {
  /**
   * 이벤트 1건을 저장한다. 같은 `id`가 이미 있으면 덮어쓴다(멱등).
   * @param event - `id` 포함 완성된 레코드. 호출자가 id·screenshotId를 확정해 전달.
   */
  add(event: CapturedEvent): Promise<void>;
  /** store 전체를 삭제. 세션 경계에서 `clearSession()`이 호출. */
  clear(): Promise<void>;
}

export interface EventReader {
  /**
   * 세션에 속한 이벤트를 `timestamp` 오름차순으로 반환.
   *
   * Phase 1은 세션 히스토리를 유지하지 않으므로 `sessionId`와 무관하게 현재
   * store의 전체 이벤트를 돌려준다. 히스토리 도입 시 `sessionId` 인덱스 추가 예정.
   * @returns 빈 세션이면 빈 배열.
   */
  listBySession(sessionId: string): Promise<CapturedEvent[]>;
}

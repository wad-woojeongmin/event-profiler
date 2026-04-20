// 이벤트 영속 저장소 포트.
//
// 쓰기(EventWriter)와 읽기(EventReader)를 분리하여 소비자마다 최소 권한을
// 받도록 한다(ISP). 구현체는 IndexedDB 등 어댑터에서 처리하고 포트 외부에는
// 런타임 객체를 노출하지 않는다.

import type { CapturedEvent } from "@/types/event.ts";

export interface EventWriter {
  /** 수집된 이벤트 한 건을 append. 같은 id가 이미 있으면 overwrite. */
  add(event: CapturedEvent): Promise<void>;
  /** 세션 경계에서 호출. 전체 store를 비운다. */
  clear(): Promise<void>;
}

export interface EventReader {
  /**
   * 특정 세션에 속한 이벤트만 반환.
   *
   * Phase 1에서는 세션 단위 히스토리를 유지하지 않으므로 현재 세션의 전체
   * 이벤트를 timestamp 오름차순으로 돌려준다. 세션 경계가 바뀌면 `clear()`가
   * 호출되어 이전 세션 데이터는 남지 않는다.
   */
  listBySession(sessionId: string): Promise<CapturedEvent[]>;
}

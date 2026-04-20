// M8 리포트 라이터 포트.
//
// `local:reportData`로 최종 `ValidationReport`를 write한다. 뷰어(M4 popup)는
// 같은 키를 구독해 UI를 갱신한다. 읽기는 소비자 책임.

import type { ReportPayload } from "@/types/storage.ts";

export interface ReportWriter {
  /** 리포트를 저장한다. `null`을 주면 "리포트 없음" 상태로 되돌린다. */
  write(report: ReportPayload): Promise<void>;
}

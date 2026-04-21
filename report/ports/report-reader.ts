// M8 리포트 리더 포트.
//
// `local:reportData`를 읽어 뷰어가 소비할 수 있게 한다. 쓰기는 `ReportWriter`의
// 책임이고, 리더는 read-only로만 선언된다(docs/02-contracts.md §공용 스토리지 키).

import type { ReportPayload } from "@/types/storage.ts";

export interface ReportReader {
  /** 현재 저장된 리포트. 아직 생성된 적이 없으면 `null`. */
  read(): Promise<ReportPayload>;
}

// M8 스펙 캐시 리더 포트.
//
// 어셈블 시점의 `local:specsCache`를 read-only로 가져온다. 쓰기 권한이 없는
// 이유는 공용 스토리지 키의 소유자가 M3 SettingsStore이기 때문이다
// (docs/02-contracts.md §공용 스토리지 키).

import type { SpecsCachePayload } from "@/types/storage.ts";

export interface SpecsCacheReader {
  /**
   * 캐시된 `EventSpec[]`을 읽는다.
   * @returns 캐시 없으면 null. 소비자가 "아직 시트 미로딩" 상태를 감지.
   */
  read(): Promise<SpecsCachePayload>;
}

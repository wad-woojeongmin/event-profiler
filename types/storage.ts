// 공용 스토리지 키 스키마 — 여러 모듈이 read/write하는 `wxt/storage` 키의 단일 소스.
//
// 드리프트 차단을 위해 키 이름과 payload 타입을 여기서만 export하고, 각 모듈은
// 어댑터 내부에서 이 심볼을 import하여 `storage.defineItem<T>(KEY)`로 선언한다.
// docs/02-contracts.md §공용 스토리지 키 참고.

import type { EventSpec } from "./spec.ts";
import type { ValidationReport } from "./validation.ts";

/** `local:specsCache` 키 상수. 변경 시 M5/M3/M4/M8 동시 영향. */
export const SPECS_CACHE_KEY = "local:specsCache" as const;

/**
 * `local:specsCache` payload.
 *
 * - 소유자(쓰기): M5 sheets 로딩 경로(현재는 M3 SettingsStore가 read/write 모두 담당).
 * - 소비자(읽기): M4 popup, M8 report SW 어셈블러.
 * - `null`은 "아직 시트를 불러온 적 없음"을 명시한다(빈 배열과 구분).
 */
export type SpecsCachePayload = EventSpec[] | null;

/**
 * `local:specsCache` 초기값. 모든 어댑터의 `defineItem` fallback이 이 상수를
 * 공유해야 "캐시 없음" 의미가 모듈별로 갈라지지 않는다.
 */
export const SPECS_CACHE_FALLBACK: SpecsCachePayload = null;

/** `local:reportData` 키 상수. M8이 write, M4가 read. */
export const REPORT_DATA_KEY = "local:reportData" as const;

/**
 * 어셈블된 리포트 본체.
 *
 * 뷰어(M4)가 추가 메시지 없이 즉시 렌더할 수 있도록, SW 단계에서 스크린샷을
 * base64 data URL로 pre-load해 `screenshotDataUrls`에 담는다. `report` 내부의
 * `CapturedEvent.screenshotId`를 키로 조회한다. 로드 실패한 id는 맵에서 누락.
 */
export interface ReportData {
  report: ValidationReport;
  /** screenshotId → `data:image/...;base64,...` */
  screenshotDataUrls: Record<string, string>;
}

/**
 * `local:reportData` payload.
 *
 * - 소유자(쓰기): M8 report SW 어셈블러.
 * - 소비자(읽기): M4 popup 뷰어.
 * - `null`은 "아직 리포트 생성된 적 없음"을 명시(초기 상태).
 */
export type ReportPayload = ReportData | null;

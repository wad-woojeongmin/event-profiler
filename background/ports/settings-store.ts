// 팝업이 복원해야 할 사용자 설정과 스펙 캐시 포트.
//
// Settings는 공개 계약(types/)이 아니라 M3가 소유하는 모듈 타입이다. 필드
// 추가는 이 포트와 어댑터의 fallback을 함께 갱신하면 된다(비즈니스 상 파괴적
// 변경이 아님).

import type { EventSpec } from "@/types/spec.ts";

/**
 * Popup이 재열릴 때 복원하는 영속 환경 설정.
 *
 * - `lastSelectedEventNames`: 마지막 녹화에서 체크했던 스펙 목록
 * - `lastSelectedSheetTitle`: 마지막으로 선택한 시트 탭 (Phase 2 확장 여지)
 */
export interface Settings {
  lastSelectedEventNames: string[];
  lastSelectedSheetTitle: string | undefined;
}

export const DEFAULT_SETTINGS: Settings = {
  lastSelectedEventNames: [],
  lastSelectedSheetTitle: undefined,
};

export interface SettingsStore {
  /** 저장된 설정(없으면 기본값)을 반환. */
  get(): Promise<Settings>;
  /** 부분 필드만 patch하여 저장. */
  update(partial: Partial<Settings>): Promise<void>;
  /** 직전에 로드한 스펙 스냅샷 (없으면 null). */
  getSpecsCache(): Promise<EventSpec[] | null>;
  /** 스펙 스냅샷을 덮어써 저장. */
  setSpecsCache(specs: EventSpec[]): Promise<void>;
}

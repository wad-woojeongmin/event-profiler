// 팝업 복원용 사용자 설정·스펙 캐시 포트.
//
// `Settings`는 공개 계약(`types/`)이 아니라 M3 모듈 전용 타입이다. 필드 추가는
// 이 포트와 어댑터 fallback만 함께 갱신하면 된다(다른 모듈 파급 없음).

import type { EventSpec } from "@/types/spec.ts";

/** 팝업이 재열릴 때 복원하는 영속 설정. */
export interface Settings {
  /** 마지막 녹화에서 체크했던 스펙 이름 목록. */
  lastSelectedEventNames: string[];
  /** 마지막으로 선택한 시트 탭. Phase 2 다중 시트 확장 여지. */
  lastSelectedSheetTitle: string | undefined;
}

export const DEFAULT_SETTINGS: Settings = {
  lastSelectedEventNames: [],
  lastSelectedSheetTitle: undefined,
};

export interface SettingsStore {
  /** @returns 저장된 설정. 저장 이력이 없으면 `DEFAULT_SETTINGS`. */
  get(): Promise<Settings>;
  /** 지정한 필드만 머지해 저장(생략 필드는 기존값 유지). */
  update(partial: Partial<Settings>): Promise<void>;
  /**
   * 스펙 스냅샷을 로드. 팝업이 시트 재요청 없이 즉시 체크박스를 표시하기 위함.
   * @returns 캐시가 비어있으면 null.
   */
  getSpecsCache(): Promise<EventSpec[] | null>;
  /** 스펙 스냅샷을 통째로 덮어쓴다. 부분 업데이트 없음. */
  setSpecsCache(specs: EventSpec[]): Promise<void>;
}

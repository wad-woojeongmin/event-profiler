// M3가 공식 구현 시 이 파일을 소유. 데모 단계에서 계약 타입만 먼저 고정.
// docs/02-contracts.md §types/event.ts 참고.

/** 수집된 단일 이벤트. background에서 uuid와 screenshotId를 할당한 뒤 저장. */
export interface CapturedEvent {
  /** background가 할당하는 uuid */
  id: string;
  /** Phase 1은 amplitude만 */
  provider: "amplitude";
  /** `EventSpec.amplitudeEventName`과 매칭되는 키 */
  eventName: string;
  params: Record<string, unknown>;
  /** Date.now() ms 기준 타임스탬프 */
  timestamp: number;
  pageUrl: string;
  pageTitle: string;
  tabId: number;
  /** IndexedDB `screenshots` store 키 */
  screenshotId: string | undefined;
}

/** 한 번의 녹화 세션 메타데이터. chrome.storage.session에 유지되어 SW 재시작에도 살아남음. */
export interface RecordingSession {
  id: string;
  startedAt: number;
  endedAt: number | undefined;
  tabId: number;
  /** 녹화 시작 시 popup에서 선택된 스펙의 amplitudeEventName 리스트 */
  targetEventNames: string[];
  capturedCount: number;
}

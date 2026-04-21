export const EVENT_TYPES = [
  "view",
  "click",
  "impr",
  "scroll",
  "swipe",
  "done",
  "capture",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const LOG_TYPES = ["screen", "event", "popup", "bottomsheet"] as const;
export type LogType = (typeof LOG_TYPES)[number];

export interface EventSpec {
  /** 런타임 매칭 키로 쓰이는 Amplitude 이벤트명. 예: "shopDetail_appDown_banner_click" */
  amplitudeEventName: string;
  /** 사람이 읽기 쉬운 이벤트명. 예: "click__banner" */
  humanEventName: string;

  pageName: string;
  sectionName: string | undefined;
  actionName: string | undefined;
  eventType: EventType | string;
  logType: LogType | string | undefined;

  /** `$` 접두어와 설명 텍스트를 제거한 파라미터 키 목록. `object` + `extension` 셀 통합 결과 */
  params: string[];
  /** "검색 관련 동작 공통 Extension" 같은 공용 확장 참조 — 현재는 resolve하지 않고 보존만 함 */
  referencedExtensions: string[];
  /** 원본 extension 셀 — 디버깅 및 리포트 역추적용 */
  rawExtension: string;

  status: string;
  /** 1-indexed 시트 행 번호. 리포트에서 원본 위치를 역추적할 때 사용 */
  sourceRow: number;
  sourceSheet: string | undefined;
}

export type ParseWarningCode =
  | "missing_header"
  | "skipped_empty_row"
  | "skipped_anchor_row"
  | "missing_event_name"
  | "unknown_event_type"
  | "unknown_log_type"
  | "param_unparseable_token"
  | "ambiguous_header_resolution"
  | "no_logtype_boundary";

export interface ParseWarning {
  code: ParseWarningCode;
  row: number;
  message: string;
  detail?: string;
}

export interface ParseResult {
  specs: EventSpec[];
  warnings: ParseWarning[];
}

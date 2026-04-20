// M7이 공식 구현 시 이 파일을 소유. 데모 단계에서 계약 타입만 먼저 고정.
// docs/02-contracts.md §types/validation.ts 참고.

import type { CapturedEvent, RecordingSession } from "./event.ts";
import type { EventSpec } from "./spec.ts";

export type Severity = "error" | "warning" | "info";

export type IssueType =
  | "missing_param"
  | "empty_param"
  | "not_collected"
  | "suspect_duplicate"
  | "unexpected_event"
  | "param_unreferenced";

export interface ValidationIssue {
  type: IssueType;
  severity: Severity;
  param?: string;
  message: string;
}

export interface ValidationResult {
  spec: EventSpec;
  captured: CapturedEvent[];
  issues: ValidationIssue[];
  status: "pass" | "fail" | "not_collected" | "suspect_duplicate";
}

export interface ValidationReport {
  sessionId: string;
  generatedAt: number;
  session: RecordingSession;
  results: ValidationResult[];
  /** 타겟으로 선택되지 않았지만 녹화 중 수집된 이벤트 */
  unexpected: CapturedEvent[];
  stats: {
    totalCaptured: number;
    totalSpecs: number;
    pass: number;
    fail: number;
    notCollected: number;
    suspectDuplicate: number;
  };
}

import type { CapturedEvent } from "../../types/event.ts";
import type { EventSpec } from "../../types/spec.ts";
import type { IssueType, ValidationIssue } from "../../types/validation.ts";

/**
 * 규칙이 한 스펙을 평가할 때 받는 컨텍스트.
 *
 * `captured`는 `spec.amplitudeEventName`과 이름이 일치하는 이벤트만 필터된 것.
 * `allCaptured`는 타 스펙·예외 이벤트까지 모두 포함하며, 교차 분석(R5 등) 필요 시 참조한다.
 */
export interface ValidationContext {
  spec: EventSpec;
  captured: CapturedEvent[];
  allCaptured: CapturedEvent[];
  targetEventNames: ReadonlySet<string>;
}

/**
 * 검증 규칙 플러그인. 새 규칙은 파일 1개 추가 + `rules/index.ts`에 등록만으로 완료(OCP).
 *
 * 규칙은 순수 함수여야 하며, 외부 I/O나 시간 의존 호출을 해서는 안 된다.
 */
export interface ValidationRule {
  readonly code: IssueType;
  evaluate(ctx: ValidationContext): ValidationIssue[];
}

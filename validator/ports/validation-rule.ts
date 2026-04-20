import type { CapturedEvent } from "../../types/event.ts";
import type { EventSpec } from "../../types/spec.ts";
import type { IssueType, ValidationIssue } from "../../types/validation.ts";

/**
 * 규칙이 단일 스펙을 평가할 때 받는 입력.
 *
 * @remarks
 * - per-spec 규칙(R1~R4, R6)은 `captured`만으로 판정 가능하도록 코어가 사전 필터.
 * - 교차 분석이 필요한 규칙(예: 다른 스펙의 이벤트를 참조)은 `allCaptured`를 사용한다.
 *   현재 R5는 코어가 직접 처리하므로 플러그인에서 `allCaptured` 사용 사례는 없음.
 */
export interface ValidationContext {
  /** 평가 대상 스펙. */
  spec: EventSpec;
  /** `spec.amplitudeEventName`과 이름이 일치하는 이벤트만 필터된 배열. */
  captured: CapturedEvent[];
  /** 타 스펙·예외 이벤트까지 포함한 세션 수집 전체(교차 분석용). */
  allCaptured: CapturedEvent[];
  /**
   * Popup에서 선택된 스펙 이름 집합. R5 판정 기준.
   *
   * 현재 R5는 코어가 처리해 플러그인에서의 실사용은 없지만, 교차 분석형 규칙
   * (예: "선택 안 된 스펙과 중복되는 파라미터")을 열어두기 위해 포트에 유지한다.
   */
  targetEventNames: ReadonlySet<string>;
}

/**
 * 검증 규칙 플러그인(OCP).
 *
 * 새 규칙 추가는 파일 1개 + `rules/index.ts` 등록만으로 완료하고, 기존 규칙은 수정하지 않는다.
 * `validate()`의 판정 로직은 참조 투명하게 유지되므로 규칙도 I/O·시간·난수에 의존해서는 안 된다
 * (`generatedAt` 타임스탬프는 결과 동등성과 무관한 코어 경계 예외 — `validator.ts` 참조).
 */
export interface ValidationRule {
  /** 이 규칙이 발행하는 `ValidationIssue.type`. 규칙 주입 시 식별자로 쓰임. */
  readonly code: IssueType;
  /** 컨텍스트를 받아 이슈 배열을 반환. 이슈가 없으면 빈 배열. */
  evaluate(ctx: ValidationContext): ValidationIssue[];
}

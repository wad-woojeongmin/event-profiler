import type { ValidationIssue } from "../../types/validation.ts";
import type { ValidationRule } from "../ports/validation-rule.ts";

/**
 * R2 — 스펙 `params`에 선언되어 있지만 수집 이벤트의 `params`에 key 자체가 없음.
 *
 * 같은 스펙에 여러 이벤트가 매칭되더라도 동일 파라미터의 missing은 한 번만 리포트한다.
 * (ValidationIssue는 이벤트 참조 필드를 갖지 않기 때문에, 이벤트별 중복 보고는 의미가 없음)
 */
export const missingParamRule: ValidationRule = {
  code: "missing_param",
  evaluate(ctx) {
    if (ctx.captured.length === 0) return [];
    if (ctx.spec.params.length === 0) return [];

    const issues: ValidationIssue[] = [];
    // 시트 편집 실수로 동일 key가 `spec.params`에 중복 등장하는 경우를 막는 방어막.
    // 파서는 dedupe하지만 포트 계약이 unique를 보장하지 않으므로 규칙 계층에서도 방어.
    const reported = new Set<string>();
    for (const key of ctx.spec.params) {
      const missingInAny = ctx.captured.some(
        (event) => !Object.prototype.hasOwnProperty.call(event.params, key),
      );
      if (missingInAny && !reported.has(key)) {
        reported.add(key);
        issues.push({
          type: "missing_param",
          severity: "warning",
          param: key,
          message: `파라미터 "${key}"가 수집 이벤트에 포함되지 않았습니다.`,
        });
      }
    }
    return issues;
  },
};

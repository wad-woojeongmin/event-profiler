import type { ValidationIssue } from "../../types/validation.ts";
import type { ValidationRule } from "../ports/validation-rule.ts";

/**
 * R2 — 스펙 `params`에 선언돼 있지만 수집 이벤트 `params`에 key 자체가 부재.
 *
 * @remarks
 * - 스펙당 동일 파라미터는 **한 번만** 보고. `ValidationIssue`는 이벤트 참조 필드를
 *   갖지 않으므로 이벤트별 중복 보고는 정보를 더하지 않는다.
 * - 수집 0건(R1 소관)이나 스펙 params 미정의는 조기 반환한다.
 */
export const missingParamRule: ValidationRule = {
  code: "missing_param",
  evaluate(ctx) {
    if (ctx.captured.length === 0) return [];
    if (ctx.spec.params.length === 0) return [];

    const issues: ValidationIssue[] = [];
    // 시트 편집 실수로 `spec.params`에 같은 key가 중복 등장하는 경우 방어.
    // Spec Parser가 dedupe하지만 포트 계약은 unique를 보장하지 않으므로 규칙 계층에서도 이중화.
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

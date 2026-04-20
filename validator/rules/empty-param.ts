import type { ValidationIssue } from "../../types/validation.ts";
import type { ValidationRule } from "../ports/validation-rule.ts";

/**
 * R3 — 수집 이벤트에 key는 존재하지만 값이 `undefined`/`null`/빈 문자열.
 *
 * `0`, `false` 같은 falsy 값은 유효한 값으로 간주한다.
 */
export const emptyParamRule: ValidationRule = {
  code: "empty_param",
  evaluate(ctx) {
    if (ctx.captured.length === 0) return [];
    if (ctx.spec.params.length === 0) return [];

    const issues: ValidationIssue[] = [];
    const reported = new Set<string>();
    for (const key of ctx.spec.params) {
      const emptyInAny = ctx.captured.some((event) => {
        if (!Object.prototype.hasOwnProperty.call(event.params, key)) return false;
        const v = event.params[key];
        return v === undefined || v === null || v === "";
      });
      if (emptyInAny && !reported.has(key)) {
        reported.add(key);
        issues.push({
          type: "empty_param",
          severity: "warning",
          param: key,
          message: `파라미터 "${key}"가 빈 값(undefined/null/"")으로 수집되었습니다.`,
        });
      }
    }
    return issues;
  },
};

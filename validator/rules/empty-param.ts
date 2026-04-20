import type { ValidationIssue } from "../../types/validation.ts";
import type { ValidationRule } from "../ports/validation-rule.ts";

/**
 * R3 — key는 존재하지만 값이 `undefined`/`null`/빈 문자열.
 *
 * @remarks
 * - `0`, `false`는 **유효한 값**으로 취급(수량 0, 플래그 off 등 정상 비즈니스 값).
 *   단순 falsy 검사로 바꾸지 말 것.
 * - key 자체가 없는 경우는 R2 소관이므로 여기서 이슈 없음.
 * - `reported` Set: R2와 동일 이유로 `spec.params` 중복 key 방어.
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

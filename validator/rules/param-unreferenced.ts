import type { ValidationIssue } from "../../types/validation.ts";
import type { ValidationRule } from "../ports/validation-rule.ts";

/**
 * R6 — 수집된 param 중 스펙의 `params`에 선언되지 않은 키.
 *
 * 같은 스펙에 동일 미선언 키가 여러 이벤트에서 반복되어도 한 번만 보고한다.
 */
export const paramUnreferencedRule: ValidationRule = {
  code: "param_unreferenced",
  evaluate(ctx) {
    if (ctx.captured.length === 0) return [];
    const specKeys = new Set(ctx.spec.params);

    const issues: ValidationIssue[] = [];
    const reported = new Set<string>();
    for (const event of ctx.captured) {
      for (const key of Object.keys(event.params)) {
        if (specKeys.has(key) || reported.has(key)) continue;
        reported.add(key);
        issues.push({
          type: "param_unreferenced",
          severity: "info",
          param: key,
          message: `파라미터 "${key}"가 수집되었으나 스펙에 선언되지 않았습니다.`,
        });
      }
    }
    return issues;
  },
};

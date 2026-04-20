import type { ValidationIssue } from "../../types/validation.ts";
import type { ValidationRule } from "../ports/validation-rule.ts";

/**
 * R6 — 수집되었으나 스펙 `params`에 선언되지 않은 파라미터 key.
 *
 * @remarks
 * - 스펙당 동일 미선언 key는 **한 번만** 보고. 여러 이벤트에 반복되어도 중복 이슈는 만들지 않는다.
 * - severity는 `info` — 시트에 타입/enum 스펙이 없어(Phase 2 예정) 경고 대신 참고 수준으로 취급.
 *   상태 결정(`determineStatus`)의 `fail` 조건(error/warning)에 영향을 주지 않는다.
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

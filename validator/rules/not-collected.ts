import type { ValidationRule } from "../ports/validation-rule.ts";

/**
 * R1 — 선택된 스펙이 녹화 기간 중 한 건도 수집되지 않음.
 *
 * @remarks
 * - QA가 "이 이벤트가 아예 빠졌다"를 즉시 식별하기 위한 규칙.
 * - severity는 `info`지만 `determineStatus`에서 최상위(`not_collected`) 상태로 승격되어
 *   별도 카테고리로 리포트된다(즉, `pass`/`fail`에 섞이지 않음).
 */
export const notCollectedRule: ValidationRule = {
  code: "not_collected",
  evaluate(ctx) {
    if (ctx.captured.length > 0) return [];
    return [
      {
        type: "not_collected",
        severity: "info",
        message: `"${ctx.spec.amplitudeEventName}" 이벤트가 녹화 기간 중 수집되지 않았습니다.`,
      },
    ];
  },
};

import type { ValidationRule } from "../ports/validation-rule.ts";

/** R1 — 선택된 스펙이지만 녹화 기간 중 0건 수집. */
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

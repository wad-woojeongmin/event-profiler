import type { ValidationIssue } from "../../types/validation.ts";
import type { ValidationRule } from "../ports/validation-rule.ts";

/** 과수집 의심 임계값: 같은 이벤트가 이 간격보다 짧게 연속 발생하면 R4 발동. */
export const SUSPECT_DUPLICATE_THRESHOLD_MS = 500;

/**
 * R4 — 동일 eventName이 500ms 이내 2회 이상 발생.
 *
 * `ctx.captured`는 이미 `spec.amplitudeEventName`으로 필터되어 있으므로 이름 비교 불필요.
 * 시간순 정렬 후 인접 쌍의 간격을 확인하고, 각 인접 쌍에 대해 개별 이슈를 발행한다.
 */
export const suspectDuplicateRule: ValidationRule = {
  code: "suspect_duplicate",
  evaluate(ctx) {
    if (ctx.captured.length < 2) return [];

    const sorted = [...ctx.captured].sort((a, b) => a.timestamp - b.timestamp);
    const issues: ValidationIssue[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (!prev || !curr) continue;
      const gap = curr.timestamp - prev.timestamp;
      if (gap < SUSPECT_DUPLICATE_THRESHOLD_MS) {
        issues.push({
          type: "suspect_duplicate",
          severity: "warning",
          message: `"${ctx.spec.amplitudeEventName}" 이벤트가 ${gap}ms 간격으로 연속 발생했습니다.`,
        });
      }
    }
    return issues;
  },
};

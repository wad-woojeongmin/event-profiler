import type { ValidationIssue } from "../../types/validation.ts";
import type { ValidationRule } from "../ports/validation-rule.ts";

/** 과수집 의심 임계값(ms). 같은 이벤트의 인접 간격이 이 값 미만이면 R4 발동. */
export const SUSPECT_DUPLICATE_THRESHOLD_MS = 500;

/**
 * R4 — 같은 eventName이 짧은 간격으로 연속 발생(과수집 의심).
 *
 * @remarks
 * - `ctx.captured`는 이미 스펙 이름으로 필터되어 있어 규칙 내 이름 비교 불필요.
 * - 시간순 정렬 후 인접 쌍을 확인 — N연속 발생 시 N-1개의 이슈가 생성된다.
 * - severity는 `warning`이지만 `determineStatus`에서 `suspect_duplicate` 상태로 승격되어
 *   `stats.suspectDuplicate`로 별도 집계된다. M8 리포트에서 일반 `fail`과 분리 표기할 수 있다.
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

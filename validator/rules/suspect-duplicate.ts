import type { CapturedEvent } from "../../types/event.ts";
import type { ValidationIssue } from "../../types/validation.ts";
import type { ValidationRule } from "../ports/validation-rule.ts";

/** 과수집 의심 임계값(ms). 이어서 발생한 두 이벤트의 시간 차가 이 값 미만이면 R4 발동. */
export const SUSPECT_DUPLICATE_THRESHOLD_MS = 500;

/**
 * 파라미터 값 전체로 만든 그룹 서명.
 *
 * 같은 eventName이라도 다른 대상(예: 다른 매장 카드)을 가리키는 이벤트는
 * 파라미터 값이 달라 서로 다른 서명을 받는다. 이렇게 하면 동시 렌더링 같은
 * 정상 상황이 R4 경고로 오탐되지 않는다.
 *
 * 주의: 파라미터에 매 호출마다 바뀌는 값(타임스탬프, UUID 등)이 섞여 있으면
 * 서명이 항상 달라져 R4가 사실상 꺼진 상태가 된다 — 그런 스펙은 R4로 잡을 수 없다.
 */
function paramsSignature(params: Record<string, unknown>): string {
  const sortedKeys = Object.keys(params).sort();
  return JSON.stringify(sortedKeys.map((k) => [k, params[k]]));
}

/**
 * R4 — 같은 eventName·같은 파라미터 값이 짧은 간격으로 연속 발생(과수집 의심).
 *
 * @remarks
 * - `ctx.captured`는 이미 스펙 이름으로 필터되어 있다.
 * - 파라미터 서명으로 한 번 더 그룹핑해 "같은 대상"끼리만 시간 차를 잰다.
 * - 각 그룹 안에서 시간순으로 정렬한 뒤 앞뒤로 이어진 이벤트끼리 비교 — N번 연속이면 N-1개 이슈.
 * - severity는 `warning`이지만 `determineStatus`에서 `suspect_duplicate` 상태로 옮겨져
 *   `stats.suspectDuplicate`로 별도 집계된다.
 */
export const suspectDuplicateRule: ValidationRule = {
  code: "suspect_duplicate",
  evaluate(ctx) {
    if (ctx.captured.length < 2) return [];

    const groups = new Map<string, CapturedEvent[]>();
    for (const ev of ctx.captured) {
      const sig = paramsSignature(ev.params);
      const bucket = groups.get(sig);
      if (bucket) bucket.push(ev);
      else groups.set(sig, [ev]);
    }

    const issues: ValidationIssue[] = [];
    for (const bucket of groups.values()) {
      if (bucket.length < 2) continue;
      const sorted = [...bucket].sort((a, b) => a.timestamp - b.timestamp);
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
    }
    return issues;
  },
};

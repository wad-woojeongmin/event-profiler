import type { CapturedEvent, RecordingSession } from "../types/event.ts";
import type { EventSpec } from "../types/spec.ts";
import type {
  ValidationIssue,
  ValidationReport,
  ValidationResult,
} from "../types/validation.ts";
import type {
  ValidationContext,
  ValidationRule,
} from "./ports/validation-rule.ts";

/**
 * 녹화 세션을 기준으로 `EventSpec[]`와 `CapturedEvent[]`를 비교해
 * `ValidationReport`를 생성한다.
 *
 * 순수 함수로 유지(OCP). 규칙은 `rules` 인자로 주입받으며, 기본 세트는
 * `validator/rules/index.ts`의 `defaultRules`를 사용한다.
 *
 * - 매칭 키: `CapturedEvent.eventName === EventSpec.amplitudeEventName`
 * - 예외 이벤트(R5)는 `report.unexpected`에 집계 — 규칙 플러그인과 별개 경로.
 * - 상태 결정 우선순위:
 *   1) captured 0건 → `not_collected`
 *   2) `suspect_duplicate` 이슈 존재 → `suspect_duplicate`
 *   3) error/warning severity 이슈 존재 → `fail`
 *   4) 그 외 → `pass`
 *
 * @param specs 대상 스펙 목록
 * @param captured 세션 중 수집된 이벤트 전체
 * @param targetEventNames popup에서 선택된 amplitudeEventName 리스트 (R5 판정 기준)
 * @param session 녹화 세션 메타 (`sessionId`로 리포트 식별)
 * @param rules 주입할 규칙 세트
 */
export function validate(
  specs: EventSpec[],
  captured: CapturedEvent[],
  targetEventNames: string[],
  session: RecordingSession,
  rules: ValidationRule[],
): ValidationReport {
  const targetSet: ReadonlySet<string> = new Set(targetEventNames);
  const capturedByName = groupByEventName(captured);

  const results: ValidationResult[] = specs.map((spec) => {
    const matched = capturedByName.get(spec.amplitudeEventName) ?? [];
    const ctx: ValidationContext = {
      spec,
      captured: matched,
      allCaptured: captured,
      targetEventNames: targetSet,
    };
    const issues = rules.flatMap((rule) => rule.evaluate(ctx));
    return {
      spec,
      captured: matched,
      issues,
      status: determineStatus(matched, issues),
    };
  });

  // R5 — 타겟으로 선택되지 않았는데 수집된 이벤트
  const unexpected = captured.filter((e) => !targetSet.has(e.eventName));

  return {
    sessionId: session.id,
    generatedAt: Date.now(),
    session,
    results,
    unexpected,
    stats: computeStats(results, captured.length, specs.length),
  };
}

/** 이벤트명별 인덱스. specs 수 × captured 수의 중첩 필터를 O(N+M)로 줄인다. */
function groupByEventName(
  captured: CapturedEvent[],
): Map<string, CapturedEvent[]> {
  const map = new Map<string, CapturedEvent[]>();
  for (const event of captured) {
    const bucket = map.get(event.eventName);
    if (bucket) bucket.push(event);
    else map.set(event.eventName, [event]);
  }
  return map;
}

function determineStatus(
  captured: CapturedEvent[],
  issues: ValidationIssue[],
): ValidationResult["status"] {
  if (captured.length === 0) return "not_collected";
  if (issues.some((i) => i.type === "suspect_duplicate")) {
    return "suspect_duplicate";
  }
  if (issues.some((i) => i.severity === "error" || i.severity === "warning")) {
    return "fail";
  }
  return "pass";
}

function computeStats(
  results: ValidationResult[],
  totalCaptured: number,
  totalSpecs: number,
): ValidationReport["stats"] {
  let pass = 0;
  let fail = 0;
  let notCollected = 0;
  let suspectDuplicate = 0;
  for (const r of results) {
    switch (r.status) {
      case "pass":
        pass += 1;
        break;
      case "fail":
        fail += 1;
        break;
      case "not_collected":
        notCollected += 1;
        break;
      case "suspect_duplicate":
        suspectDuplicate += 1;
        break;
    }
  }
  return { totalCaptured, totalSpecs, pass, fail, notCollected, suspectDuplicate };
}

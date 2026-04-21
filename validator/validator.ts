import { canonicalEventName } from "../shared/canonical-event-name.ts";
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
 * 스펙·수집 이벤트 비교 검증의 단일 진입점.
 *
 * M8 리포트 렌더링의 입력(`ValidationReport`)을 생성한다. 매칭·규칙 평가·상태 결정·
 * stats 집계 로직은 참조 투명(동일 입력 → 동일 결과)하게 유지하며 `browser.*`/I/O/난수
 * 접근을 금지한다. 단 `report.generatedAt`만은 예외로 `Date.now()` 호출 시각 스탬프이며,
 * 이 필드를 비교·검증 로직 어디에서도 참조하지 않아 결과 동등성에는 영향이 없다.
 * (시간 고정 테스트가 필요하면 `vi.useFakeTimers()`로 랩핑.)
 *
 * ### 매칭
 * - 키: `canonicalEventName(captured) === EventSpec.amplitudeEventName` 완전 일치
 * - `canonicalEventName`은 `params.pageName/sectionName/actionName/eventType`을 `_`로 이어
 *   스펙 시트 컨벤션(docs/05-sheet-spec.md)의 `amplitudeEventName`을 재구성한다. 웹앱이
 *   Amplitude에 실제로 쏘는 `eventName`은 `humanEventName` 포맷(`click__foo`)이라 스펙의
 *   `amplitudeEventName`(`page_section_action_click`)과 바로 매칭되지 않기 때문.
 *   params가 비어있으면 원본 `eventName`으로 폴백 — 테스트 픽스처 및 웹앱이 이미 canonical
 *   이름을 쏘는 구현까지 회귀 없이 지원된다.
 * - 같은 이벤트가 여러 번 수집되면 해당 스펙의 `captured[]`에 모두 누적
 *
 * ### R5 예외 이벤트 특별 처리
 * 결과 포맷이 `ValidationIssue[]`가 아닌 `CapturedEvent[]`라 플러그인 계약을 오염시키지
 * 않도록 규칙이 아닌 코어에서 `report.unexpected`로 직접 집계한다.
 *
 * ### 상태 우선순위(단일 귀속)
 * 1. captured 0건 → `not_collected`
 * 2. `suspect_duplicate` 이슈 존재 → `suspect_duplicate`
 * 3. error/warning severity 이슈 존재 → `fail`
 * 4. 그 외 → `pass`
 *
 * ### stats 불변식
 * `pass + fail + notCollected + suspectDuplicate === totalSpecs`.
 * 한 스펙이 `suspect_duplicate`이면서 `missing_param` 이슈를 같이 가져도
 * `stats.suspectDuplicate`만 증가한다(복합 상태가 여러 카운터에 동시 귀속되지 않음).
 * M8 리포트의 차트·퍼센트 계산을 단순화하려는 트레이드오프이며, 세부 이슈는
 * `result.issues[]`로 전부 노출되므로 정보 손실은 없다.
 *
 * @param specs            대상 이벤트 스펙 목록
 * @param captured         세션 중 수집된 이벤트 전체
 * @param targetEventNames Popup에서 선택된 스펙 이름 목록(R5 판정 기준)
 * @param session          녹화 세션 메타. `session.id`가 `report.sessionId`로 반영
 * @param rules            주입 필수. 표준 세트는 `rules/index.ts`의 `defaultRules`를
 *                         import해 전달(TS 기본 인자 아님)
 * @returns                M8 리포트가 소비할 `ValidationReport`
 */
export function validate(
  specs: EventSpec[],
  captured: CapturedEvent[],
  targetEventNames: string[],
  session: RecordingSession,
  rules: ValidationRule[],
): ValidationReport {
  const targetSet: ReadonlySet<string> = new Set(targetEventNames);
  const capturedByName = groupByCanonicalName(captured);

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

  // R5 — 코어 전담. 규칙 플러그인과 결과 포맷이 달라(CapturedEvent[]) 여기서 직접 집계.
  // 매칭 키와 같은 canonical 이름으로 판정해야 "매칭은 됐는데 unexpected에도 뜸"이 안 생긴다.
  const unexpected = captured.filter(
    (e) => !targetSet.has(canonicalEventName(e)),
  );

  return {
    sessionId: session.id,
    generatedAt: Date.now(),
    session,
    results,
    unexpected,
    stats: computeStats(results, captured.length, specs.length),
  };
}

/**
 * 이벤트명 기준 버킷 인덱스 생성. 키는 `canonicalEventName`.
 *
 * 순진한 구현(`specs.map(…captured.filter…)`)의 O(N×M)을 O(N+M)로 낮춰
 * 1000 × 100 규모(≤500ms) 성능 기준을 충족한다.
 */
function groupByCanonicalName(
  captured: CapturedEvent[],
): Map<string, CapturedEvent[]> {
  const map = new Map<string, CapturedEvent[]>();
  for (const event of captured) {
    const key = canonicalEventName(event);
    const bucket = map.get(key);
    if (bucket) bucket.push(event);
    else map.set(key, [event]);
  }
  return map;
}

/**
 * 이슈 목록과 수집 여부를 단일 status로 환원.
 *
 * 우선순위 규칙이므로 조건문 순서를 바꾸지 말 것 — 복합 상태(예:
 * `suspect_duplicate` + `missing_param`)에서 상위 상태가 채택된다.
 */
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

/**
 * 최종 status 기준 카운트 집계.
 *
 * 단일 귀속 불변식(`pass + fail + notCollected + suspectDuplicate === totalSpecs`)을
 * 구조적으로 강제하기 위해 status별 switch로만 증가시키고, 이슈 단위 집계는 하지 않는다.
 */
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

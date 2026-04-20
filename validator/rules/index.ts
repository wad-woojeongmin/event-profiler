import type { ValidationRule } from "../ports/validation-rule.ts";
import { emptyParamRule } from "./empty-param.ts";
import { missingParamRule } from "./missing-param.ts";
import { notCollectedRule } from "./not-collected.ts";
import { paramUnreferencedRule } from "./param-unreferenced.ts";
import { suspectDuplicateRule } from "./suspect-duplicate.ts";

export { emptyParamRule } from "./empty-param.ts";
export { missingParamRule } from "./missing-param.ts";
export { notCollectedRule } from "./not-collected.ts";
export { paramUnreferencedRule } from "./param-unreferenced.ts";
export { suspectDuplicateRule, SUSPECT_DUPLICATE_THRESHOLD_MS } from "./suspect-duplicate.ts";

/**
 * 기본 규칙 세트(per-spec).
 *
 * R5 예외 이벤트는 결과 포맷(`CapturedEvent[]`)이 달라 플러그인 계약을 오염시키지 않도록
 * `validator.ts` 코어가 `report.unexpected`로 직접 집계한다(이 배열에 포함되지 않음).
 * 순서는 결과의 `issues[]` 순서에만 영향을 주며 상태 판정 결과와는 무관하다.
 */
export const defaultRules: ValidationRule[] = [
  notCollectedRule,
  missingParamRule,
  emptyParamRule,
  suspectDuplicateRule,
  paramUnreferencedRule,
];

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
 * 기본 규칙 세트(per-spec). R5 예외 이벤트는 결과 포맷이 달라(별도 `unexpected` 배열)
 * 규칙 플러그인이 아닌 `validator.ts`의 코어 로직이 직접 계산한다.
 */
export const defaultRules: ValidationRule[] = [
  notCollectedRule,
  missingParamRule,
  emptyParamRule,
  suspectDuplicateRule,
  paramUnreferencedRule,
];

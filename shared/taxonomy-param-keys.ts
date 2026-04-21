// 스펙 시트의 **컬럼 레벨** 분류 키 — `object`/`extension` 셀이 아닌 헤더 컬럼으로
// 선언되는 값들이라 `EventSpec.params`에는 들어가지 않는다. 웹앱은 모든 이벤트에 이 키들을
// 기본으로 실어 보내므로 R6(param_unreferenced)에서 "미선언"으로 잡히면 거짓 양성이 된다.
//
// - pageName / sectionName / actionName / eventType: canonical 이름 구성 4키 (docs/05-sheet-spec.md §1)
// - logType: 별도 컬럼이지만 항상 수집되는 분류 키
// - objectContainer / objectType: 시트 원본 헤더명. 내부에서는 sectionName/actionName으로
//   매핑되지만 웹앱이 원본 이름 그대로 쏘는 케이스가 있어 동의어로 함께 허용한다.
// - object: 이벤트 대상 식별 값을 실어 보내는 분류 키(base property 아님).
export const TAXONOMY_PARAM_KEYS: readonly string[] = [
  "pageName",
  "sectionName",
  "actionName",
  "eventType",
  "logType",
  "objectContainer",
  "objectType",
  "object",
];

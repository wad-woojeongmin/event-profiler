// 웹앱이 모든 이벤트에 기본으로 실어 보내는 **베이스 프로퍼티** 키들.
// 스펙 시트의 `object`/`extension` 셀로 선언되지 않아 `EventSpec.params`에는 들어가지 않지만
// 모든 이벤트에 실려오므로, R6(param_unreferenced)에서 "미선언"으로 잡히면 거짓 양성이 된다.
// spec.params와 union해 암묵 선언으로 취급한다.
//
// 분류 출처: docs 상의 Base Event Property 표
// - 앱 환경: isNativeApp / deviceType / buildVersion / nativeAppVersion / deviceId
// - 유입경로: entryHost / isExternalEntry / referrerUrl / referrerDomain
// - UTM: source / medium / campaign / content / term
// - 기타: eventTimeStamp
// (`object`는 taxonomy 계열로 분리 — `TAXONOMY_PARAM_KEYS` 참조)
export const BASE_EVENT_PARAM_KEYS: readonly string[] = [
  "isNativeApp",
  "deviceType",
  "buildVersion",
  "nativeAppVersion",
  "deviceId",
  "entryHost",
  "isExternalEntry",
  "referrerUrl",
  "referrerDomain",
  "source",
  "medium",
  "campaign",
  "content",
  "term",
  "eventTimeStamp",
];

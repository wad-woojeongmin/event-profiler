// 캡처된 이벤트의 canonical amplitude 이름 재구성 헬퍼.
//
// 웹앱이 Amplitude SDK에 쏘는 eventName(`humanEventName` 포맷, 예: "view__shopDetail")은
// 스펙 시트의 amplitudeEventName(예: "shopDetail_view")과 다르다. 이 함수는 params에
// 실려온 pageName/sectionName/actionName/eventType으로부터 스펙 키와 동일한 canonical
// 이름을 되짚어 매칭·게이트에 사용한다.
//
// 두 호출처(validator 매칭, background 스크린샷 게이트)가 공유해야 해서 레이어 중립 위치인
// `shared/`에 둔다. 이 파일은 I/O 없는 순수 함수만 포함.

import type { CapturedEvent } from "@/types/event.ts";

/**
 * 캐치테이블 로그 스펙 컨벤션(docs/05-sheet-spec.md): `amplitudeEventName`은
 * `[pageName, sectionName, actionName, eventType]`을 빈 값 제외 후 `_`로 join.
 *
 * 연속 중복(웹앱이 sectionName과 actionName을 같은 값으로 중복 채우는 케이스)은
 * 인접 dedup으로 흡수한다. 스펙 시트는 둘이 같을 때 한쪽만 쓰는 관행이다.
 * 재구성 결과가 공백이거나 한 토큰뿐이면 원본 `eventName`으로 폴백 — 테스트 픽스처나
 * 이미 canonical 이름을 쏘는 웹앱까지 회귀 없이 지원.
 */
export function canonicalEventName(e: CapturedEvent): string {
  const p = e.params;
  const raw = [
    asNonEmpty(p["pageName"]),
    asNonEmpty(p["sectionName"]),
    asNonEmpty(p["actionName"]),
    asNonEmpty(p["eventType"]),
  ].filter((x): x is string => x !== null);
  const parts: string[] = [];
  for (const tok of raw) {
    if (parts[parts.length - 1] !== tok) parts.push(tok);
  }
  return parts.length >= 2 ? parts.join("_") : e.eventName;
}

function asNonEmpty(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

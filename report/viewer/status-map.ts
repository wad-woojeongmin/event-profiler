// 타임라인 마커·필름스트립 dot 색 결정용 lookup 맵.
//
// `CapturedEvent.eventName`(웹앱이 Amplitude로 쏜 원본, 예: "view__shopDetail")과
// `EventSpec.amplitudeEventName`(시트 canonical, 예: "shopDetail_view")은 포맷이
// 달라, spec 기준으로 맵을 만들면 lookup이 전부 miss돼 모든 마커가 pass로 떨어지는
// 문제가 있었다(PR #26 리뷰 참고). 같은 실수가 다시 나지 않도록 captured의 raw
// 이름 기준으로만 채운다.

import type { ValidationResult } from "@/types/validation.ts";

export function buildStatusByEventName(
  results: readonly ValidationResult[],
): Map<string, ValidationResult["status"]> {
  const map = new Map<string, ValidationResult["status"]>();
  for (const r of results) {
    for (const c of r.captured) map.set(c.eventName, r.status);
  }
  return map;
}

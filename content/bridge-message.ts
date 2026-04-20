// 웹앱이 보낸 postMessage 페이로드를 검증·정규화하는 순수 함수.
//
// I/O 없이 입력값만으로 판정 가능하게 격리하여 단위 테스트만으로 수용 기준
// ("잘못된 origin/source/version 은 무시")을 덮는다.

import type { BridgeMessage } from "@/types/messages.ts";

/** `BridgeMessage.source` 상수. 다른 라이브러리 postMessage와 구별용. */
export const BRIDGE_SOURCE = "catchtable-event-validator" as const;
/** 호환성 검사용 브리지 프로토콜 버전. 깨는 변경 시 증가. */
export const BRIDGE_VERSION = 1 as const;

/**
 * 수신 postMessage의 페이로드를 `BridgeMessage`로 좁힌다.
 *
 * @param eventOrigin — `MessageEvent.origin`
 * @param expectedOrigin — 현재 페이지 origin (`location.origin`). cross-origin
 *   스푸핑 차단을 위해 정확히 일치해야 한다.
 * @param data — `MessageEvent.data` (신뢰 불가 입력 → `unknown`)
 * @returns 검증 통과 시 `BridgeMessage`, 아니면 `null`.
 */
export function parseBridgeMessage(
  eventOrigin: string,
  expectedOrigin: string,
  data: unknown,
): BridgeMessage | null {
  if (eventOrigin !== expectedOrigin) return null;
  if (!isRecord(data)) return null;
  if (data["source"] !== BRIDGE_SOURCE) return null;
  // 정확 일치 정책: Phase 1은 단일 버전만 지원하므로 v2 메시지도 drop한다.
  // 멀티 버전 공존이 필요해지면 `version <= BRIDGE_VERSION`으로 완화.
  if (data["version"] !== BRIDGE_VERSION) return null;
  const payload = data["payload"];
  if (!isRecord(payload)) return null;
  if (payload["provider"] !== "amplitude") return null;
  if (typeof payload["eventName"] !== "string") return null;
  if (typeof payload["timestamp"] !== "number") return null;
  const params = payload["params"];
  if (!isRecord(params)) return null;
  return {
    source: BRIDGE_SOURCE,
    version: BRIDGE_VERSION,
    payload: {
      provider: "amplitude",
      eventName: payload["eventName"],
      params: { ...params },
      timestamp: payload["timestamp"],
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

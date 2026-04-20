// `ctx.addEventListener(window, 'message', ...)` 기반 BridgeReceiver 어댑터.
//
// 확장 컨텍스트가 무효화되면 WXT가 리스너를 자동 정리하므로
// `window.addEventListener` 직접 호출은 금지 (docs/04-wxt-rules §Content Script).
// 파싱은 순수 `parseBridgeMessage`에 위임하여 어댑터는 "이벤트 펌핑"만 담당.

import type { ContentScriptContext } from "wxt/utils/content-script-context";

import type { BridgeMessage } from "@/types/messages.ts";

import { parseBridgeMessage } from "../bridge-message.ts";
import type { BridgeReceiver } from "../ports/bridge-receiver.ts";

/**
 * BridgeReceiver의 실제 구현.
 *
 * @param getExpectedOrigin — 허용 origin을 조회하는 함수. 기본값은
 *   `location.origin`. 테스트에서는 jsdom `window` 없이 임의 문자열 주입.
 */
export function createWindowBridgeReceiver(
  getExpectedOrigin: () => string = () => location.origin,
): BridgeReceiver {
  return {
    subscribe(ctx: ContentScriptContext, handler) {
      const listener = (event: MessageEvent) => {
        const parsed = parseBridgeMessage(
          event.origin,
          getExpectedOrigin(),
          event.data,
        );
        if (parsed === null) return;
        handler(parsed as BridgeMessage);
      };

      // `ctx`로 등록하면 확장 재설치/업데이트/비활성화 시 자동 정리.
      ctx.addEventListener(window, "message", listener);

      return () => {
        // 수동 해제는 **fallback** 경로 — 일반적인 정리는 `ctx` 무효화가
        // 담당한다. 수동 해제 후 ctx가 무효화되면 이미 제거된 리스너를 다시
        // removeEventListener 호출하지만 DOM 스펙상 no-op이라 안전.
        window.removeEventListener("message", listener);
      };
    },
  };
}

// 웹앱(M1) → Content Script 경계의 수신 포트.
//
// 컨텍스트 무효화 시 리스너를 자동 정리하기 위해 `ContentScriptContext`를
// 주입받는다 (docs/03-conventions SOLID 철칙 1의 공식 예외).

import type { ContentScriptContext } from "wxt/utils/content-script-context";

import type { BridgeMessage } from "@/types/messages.ts";

export interface BridgeReceiver {
  /**
   * 브리지 메시지 구독 시작.
   *
   * @param ctx — 엔트리포인트 `main(ctx)`에서 받은 컨텍스트. 확장 재설치·
   *   업데이트·비활성화 시 WXT가 리스너를 자동 정리한다.
   * @param handler — 검증을 통과한 `BridgeMessage`만 전달된다(무효 메시지는
   *   어댑터에서 드롭).
   * @returns 수동 구독 해제 함수. `ctx` 무효화로도 정리되므로 호출 자체는
   *   선택사항.
   */
  subscribe(
    ctx: ContentScriptContext,
    handler: (message: BridgeMessage) => void,
  ): () => void;
}

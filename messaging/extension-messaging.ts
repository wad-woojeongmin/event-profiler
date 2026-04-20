// 확장 전체에서 공유하는 @webext-core/messaging 인스턴스.
//
// 사용 규칙:
// - background / content / popup 어느 레이어든 `sendMessage` / `onMessage`는
//   반드시 이 파일의 export를 쓴다.
// - vanilla `browser.runtime.sendMessage` / `onMessage` 직접 호출 금지
//   (docs/04-wxt-rules.md §메시징 사용 규칙).
// - 프로토콜(ExtensionProtocol)은 types/messages.ts에 있으며 공개 계약이다.

import { defineExtensionMessaging } from "@webext-core/messaging";
import type { ExtensionProtocol } from "@/types/messages.ts";

/**
 * 확장 공용 메시징 인스턴스.
 *
 * - `sendMessage('captureEvent', payload)` 로 타입 안전 전송
 * - `onMessage('captureEvent', handler)` 로 타입 안전 수신
 * - `handler`의 `sender`는 `Browser.runtime.MessageSender` 타입
 */
export const { sendMessage, onMessage } =
  defineExtensionMessaging<ExtensionProtocol>();

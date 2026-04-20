// M2 Content Script 모듈의 공개 API.
//
// 엔트리포인트(`entrypoints/content.ts`)는 여기서 re-export된 팩토리만 조립.
// 어댑터 내부 구현(MessageEvent·messaging 라이브러리 타입 등)은 외부에
// 노출하지 않는다.

export { createWindowBridgeReceiver } from "./adapters/window-bridge-receiver.ts";
export { createMessagingEventForwarder } from "./adapters/messaging-event-forwarder.ts";
export {
  createMessagingTabIdResolver,
  UNKNOWN_TAB_ID,
} from "./adapters/messaging-tab-id-resolver.ts";
export type { BridgeReceiver } from "./ports/bridge-receiver.ts";
export type { EventForwarder } from "./ports/event-forwarder.ts";
export type { TabIdResolver } from "./ports/tab-id-resolver.ts";

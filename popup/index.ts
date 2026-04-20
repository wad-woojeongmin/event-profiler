// 팝업 모듈 공개 API. 엔트리포인트(`entrypoints/popup/`)가 조립에 필요한
// 최소 심볼만 re-export한다. 다른 모듈은 팝업 내부를 직접 import하지 않는다.

export { PopupApp } from "./popup-app.tsx";
export type { BackgroundClient } from "./ports/background-client.ts";
export { createMessagingBackgroundClient } from "./adapters/messaging-background-client.ts";

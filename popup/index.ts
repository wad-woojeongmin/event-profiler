// 팝업 모듈 공개 API. 엔트리포인트(`entrypoints/popup/`)가 조립에 필요한
// 최소 심볼만 re-export한다. 다른 모듈은 팝업 내부를 직접 import하지 않는다.
//
// 포트 타입(`BackgroundClient`)은 외부로 노출하지 않는다. 엔트리는 팩토리로
// 인스턴스만 얻어 `PopupApp`에 주입하면 되므로 타입까지 열어줄 이유가 없다.

export { PopupApp } from "./popup-app.tsx";
export { createMessagingBackgroundClient } from "./adapters/messaging-background-client.ts";

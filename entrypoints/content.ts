// M2 Content Script 엔트리포인트 — 얇은 조립 계층.
//
// 비즈니스 로직은 `content/` 모듈이 책임지고, 여기서는 매치 패턴 선언과
// 어댑터 조립만 수행(SRP). 런타임 API(`window`·`document`·messaging)는
// 반드시 `main(ctx)` 콜백 내부에서만 접근한다(docs/04-wxt-rules §엔트리포인트
// 런타임 코드 제약).

import {
  createMessagingEventForwarder,
  createMessagingTabIdResolver,
  createWindowBridgeReceiver,
} from "@/content/index.ts";

export default defineContentScript({
  // 초기 매치 host. M4 설정 UI가 확장되면 `wxt.config.ts`의 manifest와 함께
  // 조정. `document_start`에서 등록해 웹앱 초기 postMessage도 놓치지 않는다.
  matches: ["https://*.catchtable.co.kr/*"],
  runAt: "document_start",

  main(ctx) {
    const receiver = createWindowBridgeReceiver();
    const forwarder = createMessagingEventForwarder();
    const tabIdResolver = createMessagingTabIdResolver();

    receiver.subscribe(ctx, (message) => {
      // ctx.isValid 체크로 확장 무효화 이후의 runtime 호출을 차단한다.
      if (!ctx.isValid) return;
      void forwardMessage();

      async function forwardMessage(): Promise<void> {
        const tabId = await tabIdResolver.get();
        if (!ctx.isValid) return;
        await forwarder.forward({
          provider: message.payload.provider,
          eventName: message.payload.eventName,
          params: message.payload.params,
          timestamp: message.payload.timestamp,
          pageUrl: location.href,
          pageTitle: document.title,
          tabId,
        });
      }
    });
  },
});

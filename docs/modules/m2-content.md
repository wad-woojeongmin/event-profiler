# M2 — Chrome Extension Content Script

**파일**:
- `entrypoints/content.ts` — `defineContentScript({ matches, main })` 조립 진입점
- `content/ports/*`, `content/adapters/*` — 로직

**필독**: [02-contracts](../02-contracts.md), [04-wxt-rules §Content Script 컨텍스트](../04-wxt-rules.md#content-script-컨텍스트), `.claude/wxt-docs/guide/essentials/content-scripts.md`

## 포트 정의 (변경은 M3와 협의)

```typescript
import type { ContentScriptContext } from "wxt/utils/content-script-context";

// ports/bridge-receiver.ts
export interface BridgeReceiver {
  /** 메시지 수신 시작. ctx에 바인딩하여 확장 컨텍스트 무효화 시 자동 정리.
   *  반환된 함수 호출로 수동 구독 해제도 가능. */
  subscribe(
    ctx: ContentScriptContext,
    handler: (msg: BridgeMessage) => void,
  ): () => void;
}

// ports/event-forwarder.ts
export interface EventForwarder {
  forward(event: Omit<CapturedEvent, "id" | "screenshotId">): Promise<void>;
}
```

> `ContentScriptContext`는 WXT 런타임 타입이지만 "컨텍스트 무효화 처리"라는 구체적 책임을 가지므로 포트에 노출하는 것이 정당 ([03-conventions 철칙 1의 예외](../03-conventions.md#solid-철칙-poc-제약)).

## 책임

웹앱 측 ValidatorBridge의 메시지를 수신하여 background로 정규화된 이벤트로 전달.
**내부에서 사용하는 `MessageEvent`/메시징 라이브러리 내부 구현은 절대 공개 API에 노출하지 말 것.**

## 요구사항

1. `defineContentScript`의 `matches` 옵션으로 host 지정 (CatchTable 도메인 — 정확한 host 목록은 M4가 설정 UI로 관리, 초기값 `https://*.catchtable.co.kr/*`). WXT가 이 값을 스캔해 manifest `content_scripts` 블록에 자동 주입.
2. `runAt: 'document_start'`에서 등록.
3. **반드시 `main(ctx)`의 `ctx.addEventListener(window, 'message', handler)`**로 리스너 설치 — 확장 컨텍스트 무효화(재설치/업데이트/비활성화) 시 WXT가 자동 정리.
   - `event.origin === location.origin` 검증
   - `event.data?.source === 'catchtable-event-profiler'` 검증
   - `version === 1` 검증 (호환성)
   - vanilla `window.addEventListener` 직접 사용 금지.
4. 수신 메시지를 `@webext-core/messaging`의 `sendMessage('captureEvent', { ... })`로 포워딩. `tabId`, `pageUrl`, `pageTitle`는 이 시점에 채워서 보냄.
5. **녹화 상태와 무관하게 항상 포워딩** — 녹화 중 필터링은 background에서. (Content Script가 toggle 관리하면 SW 재시작 시 동기화 이슈)
6. 비동기 작업은 `ctx.isValid`로 가드하여 무효화된 컨텍스트에서 `browser.runtime` 호출 방지.
7. 로그/에러는 `console.debug`로만 남김 (콘솔 오염 금지).

## 수용 기준

- [ ] 잘못된 origin의 postMessage는 무시
- [ ] `source` 필드가 다른 메시지는 무시
- [ ] `sendMessage` 실패 시 재시도 없이 조용히 drop (background 꺼진 경우 대비)
- [ ] 확장 비활성화 후에도 `context invalidated` 경고 없이 리스너가 정리됨 (`ctx` 활용 검증)
- [ ] 단위 테스트: 유효/무효 메시지 구분 (Vitest + `fakeBrowser`)

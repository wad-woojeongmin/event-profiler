# 02 — 공통 계약 (타입 / 메시지 / 스토리지)

> 이 문서의 타입·메시지 키·스토리지 키는 **공개 계약**. 임의 변경 금지. 변경이 필요하면 PR 설명에 영향 범위 명시.

## 타입 계약

모듈 간 공유되는 도메인 타입은 `types/`에만 정의. 모듈 고유 타입(구현 디테일)은 해당 모듈 내에 숨김.

### `types/spec.ts` ✅ 구현 완료

```typescript
export type EventType =
  | "view" | "click" | "impr" | "scroll" | "swipe" | "done" | "capture";
export type LogType = "screen" | "event" | "popup" | "bottomsheet";

export interface EventSpec {
  amplitudeEventName: string; // Primary matching key
  humanEventName: string;     // e.g. "click__banner"
  pageName: string;
  sectionName: string | undefined;
  actionName: string | undefined;
  eventType: EventType | string;
  logType: LogType | string | undefined;
  params: string[];                  // Normalized keys, no "$" prefix
  referencedExtensions: string[];
  rawExtension: string;
  status: string;
  sourceRow: number;                 // 1-indexed
  sourceSheet: string | undefined;
}
```

### `types/event.ts` (M3 담당)

```typescript
export interface CapturedEvent {
  id: string;                                  // uuid, assigned by background
  provider: "amplitude";                       // Phase 1: amplitude only
  eventName: string;                           // matches EventSpec.amplitudeEventName
  params: Record<string, unknown>;
  timestamp: number;                           // Date.now() ms
  pageUrl: string;
  pageTitle: string;
  tabId: number;
  screenshotId: string | undefined;            // IndexedDB key
}

export interface RecordingSession {
  id: string;
  startedAt: number;
  endedAt: number | undefined;
  tabId: number;
  targetEventNames: string[];
  capturedCount: number;
}
```

### `types/validation.ts` (M7 담당)

```typescript
export type Severity = "error" | "warning" | "info";

export type IssueType =
  | "missing_param"
  | "empty_param"
  | "not_collected"
  | "suspect_duplicate"
  | "unexpected_event"     // captured but not in target list
  | "param_unreferenced";  // captured param not declared in spec

export interface ValidationIssue {
  type: IssueType;
  severity: Severity;
  param?: string;
  message: string;
}

export interface ValidationResult {
  spec: EventSpec;
  captured: CapturedEvent[];
  issues: ValidationIssue[];
  status: "pass" | "fail" | "not_collected" | "suspect_duplicate";
}

export interface ValidationReport {
  sessionId: string;
  generatedAt: number;
  session: RecordingSession;
  results: ValidationResult[];
  unexpected: CapturedEvent[];
  stats: {
    totalCaptured: number;
    totalSpecs: number;
    pass: number;
    fail: number;
    notCollected: number;
    suspectDuplicate: number;
  };
}
```

### `types/messages.ts` (M2 담당)

```typescript
// webapp → content script (window.postMessage)
export interface BridgeMessage {
  source: "catchtable-event-validator";
  version: 1;
  payload: {
    provider: "amplitude";
    eventName: string;
    params: Record<string, unknown>;
    timestamp: number;
  };
}

// content script ↔ background — @webext-core/messaging ProtocolMap
export interface ExtensionProtocol {
  captureEvent(event: Omit<CapturedEvent, "id" | "screenshotId">): void;
  /** content script가 자신의 tabId를 알아내는 유일한 경로. background가 sender.tab.id로 응답. */
  getMyTabId(): number;
  startRecording(input: { targetEventNames: string[]; tabId: number }): void;
  stopRecording(): void;
  getSessionState(): RecordingSessionState;
  generateReport(): void;
}

export interface RecordingSessionState {
  session: RecordingSession | null;
  capturedCount: number;
  targetEventNames: string[];
}
```

## 메시지 프로토콜

### 웹앱 → Content Script

- 채널: `window.postMessage(msg, location.origin)` (vanilla DOM API — 확장과 웹페이지 경계).
- **반드시 `source === 'catchtable-event-validator'` 체크**로 다른 라이브러리의 postMessage와 구분.
- Content Script는 `event.origin === location.origin`도 검증 (cross-origin 스푸핑 방어).
- 리스너는 **`ctx.addEventListener(window, 'message', ...)`**로 등록하여 확장 컨텍스트 무효화 시 자동 정리 (M2 참고).

### Content Script ↔ Background

- 라이브러리: [`@webext-core/messaging`](https://webext-core.aklinker1.io/messaging/). (WXT 공식 권장 — `.claude/wxt-docs/guide/essentials/messaging.md`)
- 공용 인스턴스: `messaging/extension-messaging.ts`에서 `defineExtensionMessaging<ExtensionProtocol>()`의 결과(`sendMessage`, `onMessage`)를 export.
- vanilla `browser.runtime.sendMessage`/`onMessage` 어댑터 내부에서도 **직접 사용 금지**.
- 발신자 식별이 필요하면 두 번째 인자(`sender: Browser.runtime.MessageSender`) 활용.

## 스토리지 레이아웃

| 저장소                    | 키/Store                     | 용도                                   | 크기 가이드    |
| ------------------------- | ---------------------------- | -------------------------------------- | -------------- |
| `wxt/storage` `local:*`   | `local:settings`             | 최근 선택 이벤트, 탭 선택 등 (시트 URL은 `sheets/constants.ts`에 고정) | <50KB          |
| `wxt/storage` `local:*`   | `local:specsCache`           | 마지막으로 불러온 `EventSpec[]`        | <500KB         |
| `wxt/storage` `local:*`   | `local:reportData`           | 뷰어 모드 리포트 payload (M8)          | <20MB          |
| `wxt/storage` `session:*` | `session:recordingState`     | 현재 녹화 세션 상태 (SW 재시작 대비)   | <10KB          |
| IndexedDB `events`        | `CapturedEvent` 전체         | 이벤트 로그                            | 세션당 수백 건 |
| IndexedDB `screenshots`   | `{ id: string, blob: Blob }` | 썸네일(JPEG)                           | 장당 수십 KB   |

- `chrome.storage.*`/`browser.storage.*` 직접 사용 금지. **`wxt/storage.defineItem<T>('local:key')` 패턴**만 사용 (`.claude/wxt-docs/storage.md`).
- IndexedDB는 `wxt/storage` 범위 밖 → 어댑터에서 직접 사용하되, 포트는 도메인 타입만 노출 (03-conventions §부작용 격리).
- **세션 경계**: 새 녹화 시작 시 `events`/`screenshots` store를 clear. 이전 세션은 리포트 생성 후 파기(Phase 1). Phase 2에서 세션 히스토리 도입.

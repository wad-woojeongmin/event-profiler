# M3 — Chrome Extension Background Service Worker

**파일**:
- `entrypoints/background.ts` — `defineBackground(() => { ... })` 조립 진입점
- `background/ports/*`, `background/adapters/*`, `background/recording-session.ts` — 로직

**필독**: [02-contracts](../02-contracts.md), [04-wxt-rules §스토리지 사용 규칙](../04-wxt-rules.md#스토리지-사용-규칙), `.claude/wxt-docs/storage.md`

## 포트 정의

```typescript
// ports/event-store.ts
export interface EventWriter {
  add(event: CapturedEvent): Promise<void>;
  clear(): Promise<void>;
}
export interface EventReader {
  listBySession(sessionId: string): Promise<CapturedEvent[]>;
}

// ports/screenshot-store.ts
export interface ScreenshotWriter { save(id: string, image: Blob): Promise<void>; }
export interface ScreenshotReader { load(id: string): Promise<Blob | null>; }

// ports/screenshot-capture.ts
export interface ScreenshotCapture {
  /** 캡처 실패 시 null 반환 (호출자가 이전 screenshotId 재사용 결정) */
  capture(tabId: number): Promise<Blob | null>;
}

// ports/session-store.ts — session 스토리지 추상화
export interface SessionStore {
  getRecording(): Promise<RecordingSession | null>;
  setRecording(session: RecordingSession | null): Promise<void>;
}

// ports/settings-store.ts — local 스토리지 추상화
export interface SettingsStore {
  get(): Promise<Settings>;
  update(partial: Partial<Settings>): Promise<void>;
  getSpecsCache(): Promise<EventSpec[] | null>;
  setSpecsCache(specs: EventSpec[]): Promise<void>;
}
```

> 어댑터 구현: `SessionStore`/`SettingsStore`는 `wxt/storage.defineItem<T>('session:recordingState')` / `defineItem<T>('local:settings')` 등을 내부 필드로 보관하고 포트 메서드는 그 `getValue()`/`setValue()`를 호출. 기본값과 마이그레이션은 `defineItem` 옵션으로 선언.

## 책임

- 메시지 라우팅 (`@webext-core/messaging.onMessage`)
- 포트 구현체 조립 (`entrypoints/background.ts`의 `defineBackground` 콜백 내부)
- 세션 로직 (`recording-session.ts`는 포트만 의존, 순수 테스트 가능)
- 스크린샷 캡처 디바운스 로직 (순수)

## 요구사항

### 스토리지 구성

- `RecordingSession`은 `storage.defineItem<RecordingSession | null>('session:recordingState', { fallback: null })` (SW 재시작에도 녹화 유지)
- 이벤트는 IndexedDB `events` store, 스크린샷은 `screenshots` store (어댑터에서 직접 IDB 접근)
- `Settings`/`specsCache`는 `storage.defineItem`의 `local:` 스키마
- 세션 경계 정리(`clearSession()`): 두 IDB store 비우기 + `recordingState.removeValue()`
- 포트 인터페이스만 외부로 노출. `wxt/storage` 타입/인스턴스는 포트 구현체 내부에 숨김.

### 스크린샷

- `browser.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 60 })` 사용 (`wxt/browser` 경유)
- 디바운스 500ms (마지막 이벤트로부터 500ms 내 캡처 시도 생략하고 이전 스크린샷 ID 재사용)
- `createImageBitmap` + OffscreenCanvas로 **최대 width 480px**로 리사이즈, JPEG quality 0.6
- Blob으로 변환하여 IndexedDB에 저장, ID 반환
- **captureVisibleTab 초당 2회 제한** 고려: 에러 발생 시 조용히 skip하고 이전 screenshotId 재사용

### 메시지 라우팅

`@webext-core/messaging`의 `onMessage<MessageKey>` 리스너 (공용 인스턴스 `messaging/extension-messaging.ts` import):

| 메시지            | 동작                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `captureEvent`    | 녹화 중이 아니면 drop. 녹화 중이면: uuid 부여 → 스크린샷 캡처 예약 → screenshotId 할당 → `addEvent()` + `capturedCount++` |
| `startRecording`  | 기존 세션 있으면 `clearSession()` 후 새 `RecordingSession` 생성, `targetEventNames`, `tabId` 기록. 아이콘 배지 `REC`     |
| `stopRecording`   | `endedAt` 세팅, 배지 해제                                                                                                |
| `getSessionState` | 현재 `RecordingSession` + `capturedCount`, `targetEventNames` 반환                                                       |
| `generateReport`  | M8 호출 (새 탭 열기). 본 모듈에서는 trigger만                                                                            |

- 아이콘 배지: 녹화 중 `REC` (빨강), 녹화 완료 `✓` (초록), 기본 없음 — `browser.action.setBadgeText` 사용
- SW 재시작 시 `session:recordingState.getValue()` 읽어 상태 복구

## 수용 기준

- [ ] 녹화 시작 → 10건 이벤트 발송 → 종료 후 IndexedDB에 10건 존재
- [ ] 스크린샷 500ms 디바운스 동작 (초당 다발 이벤트에 스크린샷 ID 공유)
- [ ] SW가 30초 이상 idle 후 이벤트 수신 시에도 세션 유지
- [ ] `clearSession()` 후 IndexedDB 비어있음

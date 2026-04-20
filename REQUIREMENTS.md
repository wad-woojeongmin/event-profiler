# Event Validator — 요구사항 명세서 v2

> 이 문서는 여러 AI 에이전트가 병렬로 개발할 수 있도록 모듈 단위로 쪼개져 있습니다.
> 각 에이전트는 **§3 공통 계약**을 먼저 읽고, 자신이 맡은 **§5 모듈** 섹션을 구현하면 됩니다.

---

## 0. 이 문서 사용법

- **§1~4**: 모든 에이전트 필독 (프로젝트 배경/아키텍처/공통 계약)
- **§5**: 모듈별 요구사항. 에이전트는 자신이 맡은 모듈 + 의존 모듈의 계약만 보면 됨
- **§6~9**: 레퍼런스 (시트 구조, 환경, Phase, Decision Log)

공통 계약(타입, 메시지 프로토콜, 스토리지 키)을 **임의로 변경하지 말 것**. 변경이 필요하면 PR 설명에 명시하고 다른 모듈에 영향을 표시.

---

## 1. 프로젝트 개요

### 목적

수집된 이벤트 로그를 구글 시트에 정의된 스펙과 비교하여, **QA/PM 등 비개발자도 확인 가능한 리포트**를 생성하는 크롬 익스텐션.

### 배경

- CatchTable B2C 웹앱은 `@catchtable-b2c/event-logger`로 Amplitude/Airbridge/GA4/Hackle 4개 프로바이더에 이벤트를 팬아웃 발송.
- 이벤트 스펙은 구글 시트에 정의되어 있으나 실제 구현과의 일치 여부를 수동 검증 중.
- QA/PM이 녹화하듯 앱을 사용하면 자동으로 검증 리포트를 받을 수 있게 한다.

### 성공 기준 (Phase 1)

- 녹화된 세션에서 스펙의 이벤트가 발생했는지, 선언된 파라미터가 빠지지 않았는지 리포트로 확인 가능.
- 서버 인프라 불필요 (모든 데이터 로컬 저장).
- 단일 HTML 리포트로 슬랙/메일 공유 가능.

### 대상 사용자

- QA 엔지니어
- 프로덕트 매니저
- 이벤트 스펙 오너 (DA)

### Scope 명확화

- **Amplitude 하나만 인터셉트.** 다른 프로바이더로의 팬아웃 일치 여부는 범위 밖 (Phase 3+).
- **존재 검증만.** 파라미터 타입/enum 검증은 시트에 타입 컬럼이 없어 Phase 2에서 추가.
- **녹화 기반.** 연속 모니터링이 아닌, 사용자가 명시적으로 시작/종료하는 세션 기반 검증.

---

## 2. 아키텍처 개요

```
┌───────────────────────────────────────────────────────────────┐
│ Web App (ct-catchtable-frontend)                              │
│  ┌─────────────────────────────┐                              │
│  │ @catchtable-b2c/event-logger│                              │
│  │   ├─ Amplitude              │                              │
│  │   ├─ GA4, Airbridge, Hackle │                              │
│  │   └─ ValidatorBridge (M1)   │─── window.postMessage ──┐    │
│  └─────────────────────────────┘                         │    │
└──────────────────────────────────────────────────────────┼────┘
                                                           │
┌──────────────────────────────────────────────────────────▼────┐
│ Chrome Extension (Manifest V3)                                │
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────┐    │
│  │  Popup (M4) │◄─►│ Content Script   │──►│ Background    │   │
│  │             │   │ (M2)             │   │ Service       │   │
│  │             │   │   - bridge recv  │   │ Worker (M3)   │   │
│  │             │   │   - forward      │   │  - routing    │   │
│  └─────────────┘   └──────────────────┘   │  - screenshot │   │
│         ▲                                 │  - storage    │   │
│         │                                 └──────┬────────┘   │
│         │                                        ▼            │
│         │                        ┌───────────────────────┐    │
│         │                        │ IndexedDB + storage   │    │
│         │                        │ (screenshots, events, │    │
│         │                        │  settings, session)   │    │
│         │                        └───────────┬───────────┘    │
│         ▼                                    ▼                 │
│  ┌─────────────────┐         ┌──────────────────────────┐     │
│  │ Google Sheets   │         │ Validator (M7)           │     │
│  │ integration (M5)│────────►│  - match by eventName    │     │
│  │ (OAuth + API)   │ EventSpec│  - rule checks           │     │
│  └─────────────────┘         └──────────┬───────────────┘     │
│         ▲                               ▼                      │
│         │                    ┌────────────────────────┐        │
│         │                    │ Spec Parser (M6) DONE  │        │
│         │                    └────────────────────────┘        │
│         │                               ▼                      │
│         │                    ┌────────────────────────┐        │
│         │                    │ Report Generator (M8)  │──► new │
│         │                    │  - HTML rendering      │    tab │
│         │                    │  - self-contained      │    or  │
│         │                    └────────────────────────┘  .html │
└────────────────────────────────────────────────────────────────┘
```

### 주요 데이터 흐름

1. 사용자가 팝업에서 시트 URL 입력 → **M5** OAuth로 Sheets API 호출 → CSV text → **M6 Spec Parser** → `EventSpec[]`
2. 사용자가 녹화 시작 → **M2** Content Script가 `window.postMessage` 리스닝 활성화
3. 웹앱에서 이벤트 발송 → **M1 ValidatorBridge**가 postMessage로 emit → **M2** → **M3** Background가 IndexedDB에 저장 + `chrome.tabs.captureVisibleTab` (디바운스 500ms) + 썸네일화
4. 사용자가 녹화 종료 → **M7 Validator**가 수집 이벤트 × 스펙 매칭 → `ValidationResult[]`
5. **M8 Report Generator**가 HTML 렌더 → 새 탭 or 파일 다운로드

---

## 3. 공통 계약 (필독)

### 3.1. 프로젝트 구조

WXT 컨벤션에 따라 **빌드 타겟(`entrypoints/`)과 로직(`src/`)을 분리**합니다.
`entrypoints/` 파일은 얇은 **조립 계층**이며, 실제 로직은 `src/<module>/`에 포트/어댑터 구조로 존재합니다.

```
event-profiler/sun-valley/              (Chrome Extension 레포)
├── REQUIREMENTS.md                     (이 문서)
├── package.json                        (type=module, wxt + vitest)
├── tsconfig.json
├── wxt.config.ts                       (M4 담당 생성, manifest 선언 포함)
├── entrypoints/                        # WXT 빌드 타겟 — 얇은 조립만
│   ├── background.ts                   # defineBackground — M3 조립
│   ├── content.ts                      # defineContentScript — M2 조립
│   └── popup/
│       ├── index.html                  # React 마운트 포인트
│       └── main.tsx                    # createRoot + 최상위 조립
├── src/                                # 모든 실제 로직 (포트/어댑터)
│   ├── types/                          # 모듈 간 공유 도메인 타입만
│   │   ├── spec.ts                     ✅ 구현됨 (M6)
│   │   ├── event.ts                    (M3 담당 생성)
│   │   ├── validation.ts               (M7 담당 생성)
│   │   └── messages.ts                 (M2 담당 생성)
│   ├── sheets/                         # M5 + M6
│   │   ├── index.ts                    # 공개 API re-export
│   │   ├── ports/
│   │   │   └── sheets-source.ts        # SheetsSource 인터페이스
│   │   ├── adapters/
│   │   │   └── google-sheets-source.ts # OAuth + Sheets API v4 구현
│   │   ├── spec-parser.ts              ✅ 구현됨 (M6, 순수 로직)
│   │   └── spec-parser.test.ts         ✅ 구현됨
│   ├── content/                        # M2 — entrypoints/content.ts가 조립
│   │   ├── index.ts
│   │   ├── ports/
│   │   │   ├── bridge-receiver.ts      # BridgeReceiver 인터페이스
│   │   │   └── event-forwarder.ts      # EventForwarder 인터페이스
│   │   └── adapters/
│   │       ├── window-post-message-receiver.ts
│   │       └── runtime-event-forwarder.ts
│   ├── background/                     # M3 — entrypoints/background.ts가 조립
│   │   ├── index.ts
│   │   ├── ports/
│   │   │   ├── event-store.ts
│   │   │   ├── screenshot-store.ts
│   │   │   ├── session-store.ts
│   │   │   ├── settings-store.ts
│   │   │   └── screenshot-capture.ts
│   │   ├── adapters/
│   │   │   ├── indexeddb-event-store.ts
│   │   │   ├── indexeddb-screenshot-store.ts
│   │   │   ├── chrome-session-store.ts
│   │   │   ├── chrome-settings-store.ts
│   │   │   └── chrome-tabs-screenshot-capture.ts
│   │   └── recording-session.ts        # 세션 로직 (순수)
│   ├── popup/                          # M4 — entrypoints/popup/main.tsx가 조립
│   │   ├── app.tsx                     # 루트 컴포넌트
│   │   ├── components/
│   │   │   ├── spec-loader.tsx
│   │   │   ├── event-checklist.tsx
│   │   │   ├── recording-controls.tsx
│   │   │   └── ...
│   │   ├── stores/                     # Zustand 슬라이스
│   │   │   ├── recording-store.ts
│   │   │   ├── specs-store.ts
│   │   │   └── settings-store.ts
│   │   ├── ports/
│   │   │   └── background-client.ts    # SW와의 통신 추상화
│   │   ├── adapters/
│   │   │   └── runtime-background-client.ts
│   │   ├── theme.css.ts                # vanilla-extract 전역 토큰
│   │   └── styles/                     # *.css.ts 스타일 모듈
│   ├── validator/                      # M7
│   │   ├── index.ts
│   │   ├── ports/
│   │   │   └── validation-rule.ts      # 규칙 플러그인 인터페이스
│   │   ├── rules/                      # 각 규칙 = 1 파일
│   │   │   ├── missing-param-rule.ts
│   │   │   ├── empty-param-rule.ts
│   │   │   ├── not-collected-rule.ts
│   │   │   └── suspect-duplicate-rule.ts
│   │   └── validator.ts                # 규칙 실행기 (순수)
│   └── report/                         # M8 — 별도 엔트리포인트로 노출 여부는 M8이 결정
│       ├── index.ts
│       ├── ports/
│       │   └── screenshot-reader.ts
│       ├── views/
│       │   ├── report-view.tsx         # 루트 뷰
│       │   ├── summary-dashboard.tsx
│       │   ├── results-table.tsx
│       │   ├── timeline-chart.tsx
│       │   └── screenshot-gallery.tsx
│       ├── render-to-html.tsx          # React → static HTML 문자열
│       ├── download-report.ts          # self-contained HTML 파일 생성
│       └── styles/*.css.ts
└── scripts/
    └── parse-smoke.ts                  ✅ 구현됨 (M6)
```

> **리포트 뷰어 엔트리포인트**: 새 탭에서 여는 방식이면 `entrypoints/report/index.html` + `main.tsx`를 추가. 다운로드 전용이면 SW에서 직접 `renderToString`으로 HTML 생성 후 downloads API로 저장 (엔트리포인트 불필요). M8 구현 시 결정.

별도 레포:

- `ct-catchtable-frontend` 모노레포 내 `@catchtable-b2c/event-logger` 패키지 — **M1** 담당

### 3.2. 타입 계약

다음 타입은 **공개 계약**이며 다른 모듈에서 import됨. 변경은 영향 받는 모듈 모두 협의 필요.

#### `src/types/spec.ts` ✅ 구현 완료

```typescript
export type EventType =
  | "view"
  | "click"
  | "impr"
  | "scroll"
  | "swipe"
  | "done"
  | "capture";
export type LogType = "screen" | "event" | "popup" | "bottomsheet";

export interface EventSpec {
  amplitudeEventName: string; // Primary matching key, e.g. "shopDetail_appDown_banner_click"
  humanEventName: string; // e.g. "click__banner"
  pageName: string;
  sectionName: string | undefined;
  actionName: string | undefined;
  eventType: EventType | string;
  logType: LogType | string | undefined;
  params: string[]; // Normalized keys, no "$" prefix
  referencedExtensions: string[]; // e.g. ["검색 관련 동작 공통 Extension"]
  rawExtension: string; // Source cell for debugging
  status: string;
  sourceRow: number; // 1-indexed, for report traceability
  sourceSheet: string | undefined;
}
```

#### `src/types/event.ts` (M3 담당)

```typescript
export interface CapturedEvent {
  id: string; // uuid, assigned by background
  provider: "amplitude"; // Phase 1: amplitude only
  eventName: string; // matches EventSpec.amplitudeEventName
  params: Record<string, unknown>;
  timestamp: number; // Date.now() ms
  pageUrl: string;
  pageTitle: string;
  tabId: number;
  screenshotId: string | undefined; // IndexedDB key
}

export interface RecordingSession {
  id: string;
  startedAt: number;
  endedAt: number | undefined;
  tabId: number;
  targetEventNames: string[]; // subset of EventSpec.amplitudeEventName selected in popup
  capturedCount: number;
}
```

#### `src/types/validation.ts` (M7 담당)

```typescript
export type Severity = "error" | "warning" | "info";

export type IssueType =
  | "missing_param"
  | "empty_param"
  | "not_collected"
  | "suspect_duplicate"
  | "unexpected_event" // captured but not in target list
  | "param_unreferenced"; // captured param not declared in spec (info only)

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
  unexpected: CapturedEvent[]; // captured events not in any spec
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

#### `src/types/messages.ts` (M2 담당)

```typescript
// webapp → content script (window.postMessage)
export interface BridgeMessage {
  source: "catchtable-event-validator";
  version: 1;
  payload: {
    provider: "amplitude";
    eventName: string;
    params: Record<string, unknown>;
    timestamp: number; // Date.now() in webapp
  };
}

// content script ↔ background (chrome.runtime.sendMessage)
export type ExtensionMessage =
  | { type: "CAPTURE_EVENT"; event: Omit<CapturedEvent, "id" | "screenshotId"> }
  | { type: "START_RECORDING"; targetEventNames: string[]; tabId: number }
  | { type: "STOP_RECORDING" }
  | { type: "GET_SESSION_STATE" }
  | { type: "GENERATE_REPORT" };
```

### 3.3. 메시지 프로토콜

#### 웹앱 → Content Script

- 채널: `window.postMessage(msg, location.origin)`
- **반드시 `source === 'catchtable-event-validator'` 체크**로 다른 라이브러리의 postMessage와 구분
- Content Script는 `event.origin === location.origin`도 검증 (cross-origin 스푸핑 방어)

#### Content Script → Background

- 채널: `chrome.runtime.sendMessage`
- `type` 필드로 유니온 디스크리미네이트

### 3.4. 스토리지 레이아웃

| 저장소                   | 키/Store                     | 용도                                   | 크기 가이드    |
| ------------------------ | ---------------------------- | -------------------------------------- | -------------- |
| `chrome.storage.local`   | `settings`                   | 시트 URL, 최근 선택 이벤트, OAuth 설정 | <50KB          |
| `chrome.storage.local`   | `specsCache`                 | 마지막으로 불러온 `EventSpec[]`        | <500KB         |
| `chrome.storage.session` | `recordingState`             | 현재 녹화 세션 상태 (SW 재시작 대비)   | <10KB          |
| IndexedDB `events`       | `CapturedEvent` 전체         | 이벤트 로그                            | 세션당 수백 건 |
| IndexedDB `screenshots`  | `{ id: string, blob: Blob }` | 썸네일(JPEG)                           | 장당 수십 KB   |

**세션 경계**: 새 녹화 시작 시 `events`/`screenshots` store를 clear. 이전 세션은 리포트 생성 후 파기(Phase 1). Phase 2에서 세션 히스토리 도입.

### 3.5. 네이밍 & 주석 규칙

**파일/폴더** — **kebab-case 필수**

- 예: `spec-parser.ts`, `service-worker.ts`, `background/screenshot-capture.ts`
- React 컴포넌트 파일도 kebab-case: `spec-loader.tsx` (export된 컴포넌트 이름은 `SpecLoader`)
- vanilla-extract 스타일 파일: `*.css.ts` (예: `theme.css.ts`, `recording-controls.css.ts`)
- 폴더도 동일: `src/sheets/`, `src/background/` (단, 의미상 한 단어면 소문자 단일 토큰)
- 금지: `specParser.ts`, `SpecParser.ts`, `SpecLoader.tsx`, `SpecParser/`

**코드 식별자**

- 타입/인터페이스: `PascalCase` (prefix `I` 금지)
- 함수/변수: `camelCase`
- 상수: `SCREAMING_SNAKE` (public export 상수만, 모듈 내부는 camelCase 허용)

**주석**

- **모든 주석은 한국어로 작성.** JSDoc, 인라인, TODO 전부 포함.
- 외부 공개 API는 JSDoc 필수 (입력/출력/부작용 설명)
- 코드로 자명한 내용 반복 금지 — **왜** 그렇게 했는지만
- 식별자 자체는 영어 유지 (한글 변수/함수명 금지)

### 3.6. PoC 제약 & SOLID 원칙

이 프로젝트는 **PoC 단계**로, 인터셉트 방식·스토리지·인증 방식 등 **기술 방향이 바뀔 가능성이 큼**. 따라서:

#### 철칙 1. 공개 인터페이스는 내부 구현을 드러내지 않는다

- 모듈의 public API 시그니처에 특정 라이브러리/런타임/엔진 타입이 **노출되면 안 됨**.
- 예) M5 Sheets 모듈은 `gapi.client.sheets.Spreadsheet`를 반환하지 않고 우리 도메인 타입(`SheetTab`, `EventSpec`)을 반환.
- 예) M3 Storage 모듈은 `IDBDatabase`/`chrome.storage.StorageArea`를 반환하지 않고 Promise + 도메인 타입만.
- 예) M2 Content Script 측은 `MessageEvent` 원본을 M3로 넘기지 않음. 정규화된 `BridgeMessage` 페이로드만.

#### 철칙 2. DIP — 추상에 의존, 구현체는 주입

각 모듈은 **포트(인터페이스)를 선언**하고, 구체 어댑터(IndexedDB/chrome.storage/fetch)는 **주입**받음. 테스트는 in-memory fake로 실행.

예시 — 스토리지 포트 (M3가 소유):

```typescript
// src/background/ports/event-store.ts
export interface EventStore {
  add(event: CapturedEvent): Promise<void>;
  listBySession(sessionId: string): Promise<CapturedEvent[]>;
  clear(): Promise<void>;
}
```

- 구현체 1: `src/background/adapters/indexeddb-event-store.ts` (프로덕션)
- 구현체 2: `src/background/adapters/in-memory-event-store.ts` (테스트)

예시 — 이벤트 소스 포트 (M2가 소유):

```typescript
// src/content/ports/bridge-receiver.ts
export interface BridgeReceiver {
  onMessage(handler: (msg: BridgeMessage) => void): () => void; // returns unsubscribe
}
```

- 구현체 1: `window-post-message-receiver.ts` (프로덕션)
- 구현체 2 (언젠가): `chrome-web-request-receiver.ts` (네트워크 감시로 전환 시)

예시 — 인증/시트 포트 (M5가 소유):

```typescript
// src/sheets/ports/sheets-source.ts
export interface SheetsSource {
  listTabs(spreadsheetId: string): Promise<SheetTab[]>;
  fetchAsCsv(spreadsheetId: string, sheetTitle: string): Promise<string>;
}
```

- 구현체 1: `google-sheets-source.ts` (OAuth + Sheets API v4)
- 구현체 2 (대체 가능성): `file-upload-source.ts` (사용자가 CSV 직접 업로드)

#### 철칙 3. SRP — 각 모듈은 "바뀌는 이유"가 하나

- M6 (spec-parser): **시트 → EventSpec 변환** 외의 책임 금지 (OAuth/네트워크/스토리지 X)
- M7 (validator): **스펙×수집 비교** 외의 책임 금지 (렌더링/스토리지 X)
- M8 (report): **HTML 렌더** 외의 책임 금지 (검증 로직 X)

#### 철칙 4. ISP — 인터페이스는 소비자 관점에서 최소

- 한 모듈이 포트의 메서드 10개 중 2개만 쓴다면, 포트를 쪼개라.
- 예: `EventStore`를 읽기 전용 소비자(M7, M8)는 `EventReader`만, 쓰기(M3)는 `EventWriter`만 의존.

#### 철칙 5. OCP — 규칙 확장은 코드 수정 없이

- M7의 검증 규칙은 **규칙 배열**로 주입. 새 규칙 추가 시 기존 코드 수정 없이 추가.

```typescript
// src/validator/ports/validation-rule.ts
export interface ValidationRule {
  readonly code: IssueType;
  evaluate(ctx: ValidationContext): ValidationIssue[];
}
```

#### 철칙 6. 경계 타입은 공통 타입 모듈에

- 모듈 간 공유되는 타입(`CapturedEvent`, `EventSpec`, `BridgeMessage`)은 `src/types/`에만 정의.
- 모듈 고유 타입(구현 디테일)은 해당 모듈 내에 숨김.

#### 철칙 7. 부작용 격리

- 순수 로직(파서, 검증, 매칭)은 I/O 없이 단위 테스트 가능해야 함.
- `chrome.*`, `fetch`, `indexedDB` 호출은 어댑터 계층에만.

#### 디렉토리 규약 (포트 & 어댑터)

각 모듈 내:

```
src/<module>/
├── index.ts            # 이 모듈의 공개 API만 re-export
├── ports/              # 이 모듈이 소유/요구하는 인터페이스
├── adapters/           # 포트의 구현체 (환경별)
├── <core-logic>.ts     # 순수 로직
└── <core-logic>.test.ts
```

#### 테스트 지침

- **순수 로직**: 어댑터 없이 직접 테스트
- **어댑터**: 각 어댑터 최소 1개 contract test
- **통합**: in-memory 어댑터로 모듈 조립 후 end-to-end

---

## 4. 기술 스택 & 결정

다음 스택은 **고정 제약**입니다. 대체 라이브러리 도입 전에는 반드시 사전 합의.

| 영역              | 선택                                                           | 결정 이유                                                                 |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 익스텐션          | Chrome Manifest V3                                             | 최신 표준                                                                 |
| 언어              | **TypeScript** (strict, noUncheckedIndexedAccess)              | 타입 안전                                                                 |
| 프레임워크/번들러 | **WXT** (`wxt`, Vite 기반)                                     | MV3 빌드, entrypoints 자동 수집, HMR, manifest 생성, 크로스 브라우저 옵션 |
| UI                | **React 18**                                                   | 복잡한 팝업/리포트 상호작용 상태 관리                                     |
| 상태 관리         | **Zustand**                                                    | 가벼움, slice 기반 SRP 친화적, 스토어 주입 용이                           |
| 스타일            | **vanilla-extract** (`@vanilla-extract/css` + vite 플러그인)   | 타입 안전한 CSS-in-TS, zero-runtime                                       |
| 테스트            | Vitest (+ `@testing-library/react` for UI)                     | Vite 일관성                                                               |
| CSV 파서          | `papaparse`                                                    | 멀티라인 셀 처리 견고                                                     |
| Sheets 인증       | `chrome.identity.getAuthToken` (OAuth2)                        | Service Account 보안 문제 회피                                            |
| 스토리지          | IndexedDB (이미지) + chrome.storage (메타)                     | 서버 불필요, 용량 충분                                                    |
| 이미지 리사이즈   | Squoosh (wasm) 또는 `createImageBitmap` + Canvas               | 썸네일 용량 최소화                                                        |
| 리포트            | React로 HTML 문자열 렌더 → self-contained HTML (base64 인라인) | 단일 파일 공유                                                            |
| 차트              | SVG (React) + vanilla-extract                                  | 외부 차트 라이브러리 의존 없음                                            |

### 4.1. 스택 적용 범위

| 모듈                |      React       | Zustand | vanilla-extract |
| ------------------- | :--------------: | :-----: | :-------------: |
| M2 content script   |        ❌        |   ❌    |       ❌        |
| M3 background SW    |        ❌        |   ❌    |       ❌        |
| M4 popup UI         |        ✅        |   ✅    |       ✅        |
| M8 report generator | ✅ (문자열 렌더) |   ❌    |       ✅        |

- **Content Script / SW는 React/Zustand 금지**: 런타임/SW 환경에서 불필요, bundle 크기 증가
- Zustand는 팝업 UI 경계 **내부에서만** 사용. 다른 모듈에 Zustand 스토어 타입/훅을 export 금지 (§3.6 철칙 1).

### 4.2. WXT 설정 가이드라인

- **엔트리포인트**: `entrypoints/` 하위 파일이 빌드 타겟 (background/content/popup 등)
  - `entrypoints/background.ts` — `defineBackground(() => { ... })`
  - `entrypoints/content.ts` — `defineContentScript({ matches, main: () => { ... } })`
  - `entrypoints/popup/index.html` + `entrypoints/popup/main.tsx` — React 마운트
- **엔트리포인트는 얇은 조립 계층만**: 포트 어댑터를 주입하고 `src/` 하위 모듈의 로직을 호출. 엔트리포인트 파일에 비즈니스 로직 작성 금지 (SRP).
- **manifest**: `wxt.config.ts`의 `manifest` 필드로 정적 값(key, oauth2, permissions, host_permissions) 기재. WXT가 엔트리포인트를 스캔해 background/content_scripts/action 블록을 자동 생성.
- **React**: `@wxt-dev/module-react` 모듈 사용
- **기존 `manifest.json` 마이그레이션**: `manifest.json`의 `key`, `oauth2`, `permissions`, `host_permissions` 값을 `wxt.config.ts`로 이전하고 기존 파일은 제거 (WXT가 `.output/chrome-mv3/manifest.json` 자동 생성).
- dev: `npm run dev` — WXT HMR + 자동 리로드. 익스텐션은 `.output/chrome-mv3/`에서 로드
- prod: `npm run build` → `.output/chrome-mv3/`, `npm run zip`으로 패키징
- **브라우저 타겟**: 현재는 Chrome(MV3)만. Firefox/Safari 타겟 추가 시 `wxt.config.ts`의 targets 옵션으로 확장 가능

---

## 5. 모듈별 요구사항

### M1. Webapp Bridge (event-logger patch)

**담당 레포**: `ct-catchtable-frontend` 모노레포 > `packages/@catchtable-b2c/event-logger/`

#### 책임

`event-logger`가 Amplitude로 이벤트를 보낼 때 **같은 페이로드**를 `window.postMessage`로 익스텐션에 중계.

#### 요구사항

1. 프로덕션 번들에서는 **기본 비활성**. 다음 중 하나일 때만 동작:
   - `window.__ENABLE_EVENT_VALIDATOR__ === true` (개발/스테이징에서 수동 활성)
   - URL 쿼리 `?eventValidator=1` (QA가 필요할 때 켬)
   - `localStorage.setItem('eventValidator.enabled', '1')` (persistent)
2. Amplitude 발송 직후 다음 포맷으로 `window.postMessage` 실행 (origin 제한):
   ```typescript
   window.postMessage(
     {
       source: "catchtable-event-validator",
       version: 1,
       payload: {
         provider: "amplitude",
         eventName, // 최종 Amplitude 이벤트명
         params: eventProperties,
         timestamp: Date.now(),
       },
     },
     location.origin,
   );
   ```
3. 실패해도 원본 이벤트 전송에 영향 없어야 함 (try/catch로 감싸기)
4. 프로덕션 번들에 포함되더라도 비활성 경로에서 **zero-cost** (tree-shakable 또는 early-return)
5. 유닛 테스트: 활성/비활성 분기, params 직렬화 오류 시 skip

#### 구현 유의점

- `eventName`은 **Amplitude가 실제로 받은 값** (`{pageName}_{sectionName}_{actionName}_{eventType}` 형태). 원본 `event-logger` 내부에서 최종 변환된 이름을 postMessage에 실어야 함.
- params 순서 보존(Record 순서) — 디버깅 편의
- 파라미터에 순환 참조나 DOM 노드가 섞여 있으면 JSON 직렬화 실패 가능 → structured clone 사용 또는 실패 시 skip + warn

#### 수용 기준

- [ ] `window.__ENABLE_EVENT_VALIDATOR__ = true` 설정 후 Amplitude 이벤트 발송 시 postMessage가 정확한 페이로드로 호출됨
- [ ] 비활성 상태에서 postMessage 호출 0회
- [ ] 원본 이벤트 발송 성공률에 영향 없음 (기존 테스트 통과)
- [ ] PR 포함 항목: 활성 방법 README 섹션, 릴리즈 노트

---

### M2. Chrome Extension — Content Script

**파일**:

- `entrypoints/content.ts` — `defineContentScript({ matches, main })` 조립 진입점
- `src/content/ports/*`, `src/content/adapters/*` — 로직

#### 포트 정의 (변경은 M3와 협의)

```typescript
// ports/bridge-receiver.ts
export interface BridgeReceiver {
  /** 메시지 수신 시작. 반환된 함수 호출로 구독 해제 */
  subscribe(handler: (msg: BridgeMessage) => void): () => void;
}

// ports/event-forwarder.ts
export interface EventForwarder {
  forward(event: Omit<CapturedEvent, "id" | "screenshotId">): Promise<void>;
}
```

#### 책임

웹앱 측 ValidatorBridge의 메시지를 수신하여 background로 정규화된 이벤트로 전달.
**내부에서 사용하는 `MessageEvent`/`chrome.runtime`은 절대 공개 API에 노출하지 말 것.**

#### 요구사항

1. `manifest.json`의 `content_scripts`에 `matches` 지정 (CatchTable 도메인 — 정확한 host 목록은 M4가 설정 UI로 관리, 초기값은 `https://*.catchtable.co.kr/*`).
2. `document_start`에서 등록.
3. `window.addEventListener('message', ...)` 리스너 설치:
   - `event.origin === location.origin` 검증
   - `event.data?.source === 'catchtable-event-validator'` 검증
   - `version === 1` 검증 (호환성)
4. 수신 메시지를 `chrome.runtime.sendMessage({ type: 'CAPTURE_EVENT', event: {...} })`로 포워딩. `tabId`, `pageUrl`, `pageTitle`는 이 시점에 채워서 보냄.
5. **녹화 상태와 무관하게 항상 포워딩** — 녹화 중 필터링은 background에서. (Content Script가 toggle 관리하면 SW 재시작 시 동기화 이슈)
6. 로그/에러는 `console.debug`로만 남김 (콘솔 오염 금지).

#### 수용 기준

- [ ] 잘못된 origin의 postMessage는 무시
- [ ] `source` 필드가 다른 메시지는 무시
- [ ] sendMessage 실패 시 재시도 없이 조용히 drop (background 꺼진 경우 대비)
- [ ] 단위 테스트: 유효/무효 메시지 구분

---

### M3. Chrome Extension — Background Service Worker

**파일**:

- `entrypoints/background.ts` — `defineBackground(() => { ... })` 조립 진입점
- `src/background/ports/*`, `src/background/adapters/*`, `src/background/recording-session.ts` — 로직

#### 포트 정의

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
export interface ScreenshotWriter {
  save(id: string, image: Blob): Promise<void>;
}
export interface ScreenshotReader {
  load(id: string): Promise<Blob | null>;
}

// ports/screenshot-capture.ts
export interface ScreenshotCapture {
  /** 캡처 실패 시 null 반환 (호출자가 이전 screenshotId 재사용 결정) */
  capture(tabId: number): Promise<Blob | null>;
}

// ports/session-store.ts — chrome.storage.session 추상화
export interface SessionStore {
  getRecording(): Promise<RecordingSession | null>;
  setRecording(session: RecordingSession | null): Promise<void>;
}

// ports/settings-store.ts — chrome.storage.local 추상화
export interface SettingsStore {
  get(): Promise<Settings>;
  update(partial: Partial<Settings>): Promise<void>;
  getSpecsCache(): Promise<EventSpec[] | null>;
  setSpecsCache(specs: EventSpec[]): Promise<void>;
}
```

#### 책임

- 메시지 라우팅
- 포트 구현체 조립 (`service-worker.ts`)
- 세션 로직 (`recording-session.ts`는 포트만 의존, 순수 테스트 가능)
- 스크린샷 캡처 디바운스 로직 (순수)

#### 요구사항

**3-1. 스토리지 래퍼 (`storage.ts`)**

```typescript
// 반드시 export:
export async function setSettings(partial: Partial<Settings>): Promise<void>;
export async function getSettings(): Promise<Settings>;
export async function setSpecsCache(specs: EventSpec[]): Promise<void>;
export async function getSpecsCache(): Promise<EventSpec[] | null>;

export async function getRecordingState(): Promise<RecordingSession | null>;
export async function setRecordingState(
  state: RecordingSession | null,
): Promise<void>;

export async function addEvent(event: CapturedEvent): Promise<void>;
export async function getEvents(sessionId: string): Promise<CapturedEvent[]>;
export async function clearSession(): Promise<void>;

export async function addScreenshot(id: string, blob: Blob): Promise<void>;
export async function getScreenshot(id: string): Promise<Blob | null>;
```

- `RecordingSession`은 `chrome.storage.session`에 (SW 재시작에도 녹화 유지)
- 이벤트는 IndexedDB `events` store, 스크린샷은 `screenshots` store
- `clearSession()`: 두 IDB store 전부 비우고 storage.session의 `recordingState`도 제거

**3-2. 스크린샷 (`screenshot.ts`)**

- `chrome.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 60 })` 사용
- 디바운스 500ms (마지막 이벤트로부터 500ms 내 캡처 시도 생략하고 이전 스크린샷 ID 재사용)
- 캡처된 이미지를 `createImageBitmap` + OffscreenCanvas로 **최대 width 480px**로 리사이즈, JPEG quality 0.6
- Blob으로 변환하여 IndexedDB에 저장, ID 반환
- **captureVisibleTab 초당 2회 제한** 고려: 에러 발생 시 조용히 skip하고 이전 screenshotId 재사용

**3-3. 메시지 라우팅 (`service-worker.ts`)**
`chrome.runtime.onMessage` 리스너:

| `type`              | 동작                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `CAPTURE_EVENT`     | 녹화 중이 아니면 drop. 녹화 중이면: uuid 부여 → 스크린샷 캡처 예약 → screenshotId 할당 → `addEvent()` + `capturedCount++` |
| `START_RECORDING`   | 기존 세션 있으면 `clearSession()` 후 새 `RecordingSession` 생성, `targetEventNames`, `tabId` 기록. 아이콘 배지 `REC`      |
| `STOP_RECORDING`    | `endedAt` 세팅, 배지 해제                                                                                                 |
| `GET_SESSION_STATE` | 현재 `RecordingSession` + `capturedCount`, `targetEventNames` 반환                                                        |
| `GENERATE_REPORT`   | M8 호출 (새 탭 열기). 본 모듈에서는 trigger만                                                                             |

- 아이콘 배지: 녹화 중 `REC` (빨강), 녹화 완료 `✓` (초록), 기본 없음
- SW 재시작 시 `chrome.storage.session.recordingState` 읽어 상태 복구

#### 수용 기준

- [ ] 녹화 시작 → 10건 이벤트 발송 → 종료 후 IndexedDB에 10건 존재
- [ ] 스크린샷 500ms 디바운스 동작 (초당 다발 이벤트에 스크린샷 ID 공유)
- [ ] SW가 30초 이상 idle 후 이벤트 수신 시에도 세션 유지
- [ ] `clearSession()` 후 IndexedDB 비어있음

---

### M4. Chrome Extension — Popup UI

**파일**:

- `entrypoints/popup/index.html`, `entrypoints/popup/main.tsx` — WXT 진입점
- `src/popup/*` — 로직 (app.tsx, components/, stores/, ports/, adapters/, styles)
- `wxt.config.ts` — manifest 선언 (key, oauth2, permissions 등)

**스택**: React 18 + Zustand + vanilla-extract + WXT

#### 책임

사용자가 시트 연결 → 이벤트 선택 → 녹화 시작/종료 → 리포트 생성까지 조작하는 UI.

#### 포트 정의 (M3와의 경계)

```typescript
// ports/background-client.ts
export interface BackgroundClient {
  loadSpecs(spreadsheetId: string, sheetTitle: string): Promise<EventSpec[]>;
  startRecording(targetEventNames: string[], tabId: number): Promise<void>;
  stopRecording(): Promise<void>;
  getSessionState(): Promise<RecordingSessionState>;
  subscribeSession(
    onChange: (state: RecordingSessionState) => void,
  ): () => void;
  generateReport(): Promise<void>;
}
```

어댑터 `runtime-background-client.ts`가 `chrome.runtime.sendMessage`/`onMessage`를 사용하여 구현.
**Zustand 스토어/React hook 타입을 이 포트에 노출 금지.**

#### Zustand 스토어 설계

스토어는 **기능별 슬라이스로 분리** (SRP). 스토어끼리 직접 참조 금지 — 필요하면 셀렉터 합성으로 조합.

```typescript
// stores/specs-store.ts
interface SpecsStore {
  specs: EventSpec[];
  loadState: "idle" | "loading" | "error";
  error: string | undefined;
  load: (spreadsheetId: string, sheetTitle: string) => Promise<void>;
  clear: () => void;
}

// stores/recording-store.ts
interface RecordingStore {
  session: RecordingSessionState | null;
  selectedEventNames: Set<string>;
  toggleSelection: (eventName: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

// stores/settings-store.ts
interface SettingsStore {
  spreadsheetId: string;
  sheetTitle: string;
  setSpreadsheet: (id: string, title: string) => void;
  hydrate: () => Promise<void>; // chrome.storage에서 복원
}
```

- 스토어는 `BackgroundClient`를 **의존성 주입** (스토어 팩토리 패턴)
- 테스트에서 in-memory fake client 주입
- 스토어 간 상태 동기화는 popup-entry에서 SW 이벤트 구독으로 처리

#### vanilla-extract 규약

- `theme.css.ts`에 색상/간격/폰트 토큰 정의, `createThemeContract` + `createTheme`
- 컴포넌트별 스타일은 같은 폴더에 `<component>.css.ts`로 co-locate
- 인라인 스타일(`style={}`) 금지 — 동적 값이 필요하면 `styleVariants` 또는 `assignInlineVars`

**4-1. 상태 머신**

```
idle → specs_loaded → recording → recording_done → (idle 또는 report_open)
                ↑                         │
                └─── load specs again ────┘
```

**4-2. UI 구성**

- 상단: 설정 섹션
  - 시트 URL (or ID) 입력
  - `[스펙 불러오기]` 버튼 (M5 호출)
  - OAuth 미인증 시 `[Google 로그인]` 버튼
  - 로드된 스펙 수 표시
- 중단: 검증 대상 선택
  - `EventSpec` 목록을 체크박스로 표시 (amplitudeEventName + humanEventName + pageName 간단히)
  - 검색/필터 박스
  - `[전체 선택]` `[전체 해제]`
- 하단: 녹화 제어
  - 녹화 중이 아니면: `[● 녹화 시작]` (선택 0건이면 disabled)
  - 녹화 중: 실시간 수집 건수 + 경과 시간 + `[■ 녹화 종료]`
  - 녹화 완료: `[리포트 생성 (새 탭)]` `[HTML 다운로드]` `[초기화]`

**4-3. 상호작용**

- 녹화 시작 시 현재 활성 탭의 `tabId`를 같이 보냄
- 녹화 중 팝업 닫아도 상태 유지 (M3가 관리)
- 팝업 열릴 때마다 `GET_SESSION_STATE` 호출해 UI 복구

**4-4. Manifest — `wxt.config.ts`로 선언**

WXT는 `wxt.config.ts`의 `manifest` 필드(정적 값)와 `entrypoints/` 스캔 결과(동적 값)를 병합하여 MV3 manifest 자동 생성. 기존 `manifest.json`의 값들을 이전:

```typescript
// wxt.config.ts
import { defineConfig } from "wxt";
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Event Validator",
    version: "0.1.0",
    permissions: ["activeTab", "tabs", "storage", "identity", "scripting"],
    host_permissions: ["https://*.catchtable.co.kr/*"],
    key: "<기존 manifest.json의 public key 이전>",
    oauth2: {
      client_id: "3134095607-...apps.googleusercontent.com",
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    },
  },
});
```

- `background`, `action.default_popup`, `content_scripts`는 WXT가 `entrypoints/` 스캔하여 자동 주입
- 기존 루트의 `manifest.json`은 WXT 도입 시 **삭제** (`.output/chrome-mv3/manifest.json`으로 대체)

#### 수용 기준

- [ ] 스펙 로드 → 녹화 시작 → 종료 → 리포트 생성 end-to-end
- [ ] 팝업 닫았다 다시 열어도 녹화 중 상태 유지
- [ ] 이벤트 선택 0건일 때 녹화 시작 버튼 비활성화
- [ ] 접근성: 키보드 네비게이션 지원

---

### M5. Google Sheets 연동

**파일**: `src/sheets/ports/sheets-source.ts`, `src/sheets/adapters/google-sheets-source.ts`

#### 포트 정의 (다른 모듈이 의존하는 공개 계약)

```typescript
// ports/sheets-source.ts
export interface SheetTab {
  title: string;
  gid: number;
}

export interface SheetsSource {
  /** 시트 탭 목록. 인증 만료 시 내부에서 재인증 처리 */
  listTabs(spreadsheetId: string): Promise<SheetTab[]>;
  /** CSV text. M6 parseSpecCsv에 그대로 투입 가능한 포맷 */
  fetchAsCsv(spreadsheetId: string, sheetTitle: string): Promise<string>;
  /** 명시적 인증 흐름이 필요한 UI용 */
  authenticate(): Promise<void>;
  signOut(): Promise<void>;
}
```

**구현 격리**: `google-sheets-source.ts`는 `chrome.identity`, `fetch`, Sheets API v4 엔드포인트를 **내부에만** 사용. 다른 모듈은 `SheetsSource` 타입만 import.

대체 어댑터 후보 (향후 기술 전환 대비):

- `file-upload-source.ts` — 사용자가 CSV 파일 직접 업로드
- `clipboard-source.ts` — 클립보드에서 TSV 붙여넣기

#### 책임

- Google OAuth 2.0 (chrome.identity 사용)
- Sheets API로 시트 본문 다운로드
- 시트 전체 또는 특정 탭의 값을 CSV string으로 변환 → M6의 `parseSpecCsv()`에 그대로 투입 가능한 포맷

#### 요구사항

1. **인증**
   - `chrome.identity.getAuthToken({ interactive: true })`로 access token 획득
   - 스코프: `https://www.googleapis.com/auth/spreadsheets.readonly`
   - 토큰 만료 시 재발급 흐름 (`removeCachedAuthToken` → 재호출)
2. **시트 URL/ID 파싱**
   - `https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit#gid={sheetGid}` 지원
   - `spreadsheetId`만 입력받는 것도 지원
3. **시트 조회**
   - `spreadsheets.get`으로 시트 탭 목록 획득
   - UI에서 사용자가 탭 선택 → 해당 탭의 A1:ZZ 범위를 `spreadsheets.values.get`으로 다운로드
   - 받은 `values: string[][]`를 CSV text로 직렬화 (papaparse `unparse`)
4. **캐시**
   - 다운로드 후 `chrome.storage.local`의 `specsCache`에 저장 (파싱 전/후 모두 저장해도 무방)
5. **에러 처리**
   - 401/403: 재인증 안내
   - 404: URL/ID 잘못됨 안내
   - Rate limit: 지수 백오프 1회 재시도

#### 공개 API

```typescript
export async function authenticate(interactive: boolean): Promise<string>; // token
export async function signOut(): Promise<void>;
export async function listSheetTabs(
  spreadsheetId: string,
): Promise<{ title: string; gid: number }[]>;
export async function fetchSheetAsCsv(
  spreadsheetId: string,
  sheetTitle: string,
): Promise<string>;
```

#### 수용 기준

- [ ] 최초 실행 시 Google 로그인 창이 뜨고, 이후 재발급은 silent
- [ ] 다운로드된 CSV가 `parseSpecCsv()`에 통과
- [ ] 토큰 만료 시 자동 재발급 (한 번)
- [ ] 유닛 테스트: URL 파싱, CSV 직렬화 형식

#### 유의점

- Chrome Web Store 배포 시 익스텐션 ID 고정 필요 → `manifest.json`의 `key` 필드에 public key 박아야 로컬/배포 ID 일치
- Google Cloud Console에서 **Chrome Extension 타입 OAuth 클라이언트** 발급 필요

---

### M6. Spec Parser ✅ 구현 완료

**파일**: `src/sheets/spec-parser.ts`, `src/types/spec.ts`

#### 공개 API

```typescript
export function parseSpecCsv(csv: string, options?: ParseOptions): ParseResult;
// ParseResult = { specs: EventSpec[]; warnings: ParseWarning[] }
```

#### 동작 요약 (변경 금지 — 다른 모듈 의존)

- 헤더를 **이름 기준**으로 매핑 (시트별 컬럼 순서/개수 다름 대응)
- `to-be` 우선, 비었으면 `as-is` fallback
- **status 필터 없음** (draft/broken 행도 포함 — 개발 중 검증용)
- Amplitude 이벤트명: `eventName` 컬럼 중 `__` 없고 trailing `_` 없는 값
- 파라미터: `$key` 추출, `:` 뒤 설명 제거, 중복 제거, dotted path 유지
- `공통 Extension` 참조는 `referencedExtensions`로 별도 수집
- 섹션 앵커/빈 행은 경고로 surface

#### 이미 발견된 시트 데이터 이슈 (시트 오너에게 피드백 필요)

- Amplitude 이벤트명 컬럼이 빈 행 (예: 메인 시트 row 60 `impr__realReviewPick`)
- `objectContainer`에 trailing space (예: 서치리스트 row 5 `noResult `)

---

### M7. Validator

**파일**: `src/validator/validator.ts`, `src/validator/ports/validation-rule.ts`, `src/validator/rules/*.ts`

#### 포트 정의 — 규칙 플러그인

```typescript
// ports/validation-rule.ts
export interface ValidationContext {
  spec: EventSpec;
  captured: CapturedEvent[];
  allCaptured: CapturedEvent[]; // 타 스펙 이벤트까지 포함한 전체 (교차 분석용)
  targetEventNames: ReadonlySet<string>;
}

export interface ValidationRule {
  readonly code: IssueType;
  evaluate(ctx: ValidationContext): ValidationIssue[];
}
```

규칙 추가는 **새 파일 1개** 추가로 완료 (OCP). 기존 코드 수정 없음.

#### 책임

녹화 종료 후 `EventSpec[]` × `CapturedEvent[]`를 비교하여 `ValidationReport` 생성.
**순수 함수로 유지** — `chrome.*`, I/O 호출 금지.

#### 요구사항

**7-1. 매칭**

- `CapturedEvent.eventName === EventSpec.amplitudeEventName` 완전 일치
- 같은 이벤트가 여러 번 발생하면 모두 `ValidationResult.captured`에 누적

**7-2. 규칙 (`rules.ts`)**

| 규칙                | 조건                                                    | status                   | severity  | issue type           |
| ------------------- | ------------------------------------------------------- | ------------------------ | --------- | -------------------- |
| R1. 미수집          | 선택된 스펙이지만 녹화 기간 중 0건                      | `not_collected`          | `info`    | `not_collected`      |
| R2. 파라미터 누락   | 스펙 `params`에 있지만 수집 이벤트 `params`에 key 없음  | `fail`                   | `warning` | `missing_param`      |
| R3. 빈 값           | 수집 이벤트에 key는 있지만 값이 `undefined`/`null`/`''` | `fail`                   | `warning` | `empty_param`        |
| R4. 과수집 의심     | 동일 eventName이 500ms 이내 2회 이상                    | `suspect_duplicate`      | `warning` | `suspect_duplicate`  |
| R5. 예외 이벤트     | 선택 안 된 eventName이 수집됨                           | (별도 `unexpected` 배열) | `info`    | `unexpected_event`   |
| R6. 미선언 파라미터 | 수집 param 중 스펙에 없는 key                           | -                        | `info`    | `param_unreferenced` |

- 시트에 enum/타입이 없으므로 **값 타입 검증 없음** (Phase 2)
- `referencedExtensions`는 현재 resolve 안 됨 → R2에서 해당 이벤트는 `params`만으로 판정. 공통 Extension 정의가 추가되면 확장.

**7-3. 상태 결정 우선순위**

1. 수집 0건 → `not_collected`
2. `suspect_duplicate` 존재 → `suspect_duplicate` (이슈와 함께 pass/fail 판정도 같이)
3. `error` severity 이슈 존재 → `fail`
4. 그 외 → `pass`

**7-4. 공개 API**

```typescript
export function validate(
  specs: EventSpec[],
  captured: CapturedEvent[],
  targetEventNames: string[],
  session: RecordingSession,
  rules: ValidationRule[], // 주입: 기본 규칙 세트는 validator/rules/index.ts에서 export
): ValidationReport;
```

#### 수용 기준

- [ ] 6가지 규칙 각각 유닛 테스트
- [ ] 실제 4개 CSV 스펙 + 가짜 CapturedEvent fixture로 end-to-end 테스트
- [ ] 1000건 규모 이벤트에서 500ms 이하 처리

---

### M8. Report Generator

**파일**:

- `src/report/*` — 로직
- (뷰어 모드 선택 시) `entrypoints/report/index.html` + `main.tsx` — WXT 진입점

**스택**: React 18 + vanilla-extract (Zustand 미사용 — 읽기 전용 뷰)

#### 포트 의존

- `ScreenshotReader` (M3 소유)를 주입받아 base64 인코딩

#### 책임

`ValidationReport`를 React로 렌더. 두 모드:

1. **뷰어 모드**: 새 탭에서 `report.html` 열고 `chrome.storage.local`에서 데이터 읽어 React 마운트
2. **다운로드 모드**: `renderToString`으로 정적 HTML 문자열 생성 → `<style>` 태그 인라인 + 스크린샷 base64 인라인 → 단일 `.html` 파일 다운로드

#### 구현 규약

- 렌더링 컴포넌트는 **순수** — props(`ValidationReport` + `screenshotDataUrls: Map<string, string>`)만으로 동작
- `chrome.tabs.create`/`chrome.downloads.download`는 얇은 어댑터(`download-report.ts`)에만
- vanilla-extract 스타일은 빌드 시 static CSS로 추출 → `renderToString` 결과에 인라인 주입
- 차트는 SVG React 컴포넌트 (`timeline-chart.tsx`)

#### 공개 API

```typescript
export async function openReportInNewTab(
  report: ValidationReport,
): Promise<void>;
export async function downloadReportAsHtml(
  report: ValidationReport,
  reader: ScreenshotReader,
): Promise<void>;
```

#### 요구사항

**8-1. 렌더 대상**

- 섹션 1: 헤더 (생성 시각, 녹화 시간 범위, 대상 이벤트 수, 총 수집 수)
- 섹션 2: 요약 대시보드 (pass/fail/not_collected/suspect_duplicate 카운트, 이슈 severity 카운트)
- 섹션 3: 검증 결과 테이블
  - 이벤트별 row, 상태 뱃지
  - 클릭 시 확장: issue 상세, 수집된 params 실제값, 스크린샷 썸네일
- 섹션 4: 타임라인 차트 (`timeline.ts`)
  - X축: 시간, Y축: 이벤트 발생
  - 500ms 이내 중복 구간 하이라이트
  - 클릭 시 해당 스크린샷 라이트박스
- 섹션 5: 스크린샷 갤러리 (시간순)
- 섹션 6: 예외 이벤트 리스트 (`unexpected`)

**8-2. 기술**

- 순수 HTML + 인라인 CSS + 인라인 JS (외부 의존 없음)
- 스크린샷은 **IndexedDB에서 읽어 base64 data URL로 인라인**
- 타임라인 차트는 SVG 수동 렌더 (리포트 ~15MB 허용)

**8-3. 모드**

- `mode=open`: 새 탭에서 `chrome.storage.local`의 report-data 읽어 렌더
- `mode=download`: data URL 자체완결 HTML 파일 생성 후 `chrome.downloads.download`

**8-4. 공개 API**

```typescript
export async function generateReport(report: ValidationReport): Promise<void>; // new tab
export async function downloadReport(report: ValidationReport): Promise<void>; // file
```

#### 수용 기준

- [ ] 50건 이벤트, 30장 스크린샷 리포트가 3초 내 렌더
- [ ] 다운로드한 HTML을 다른 PC에서 열어도 스크린샷 보임
- [ ] 타임라인 클릭 → 해당 이벤트 상세로 스크롤 + 스크린샷 라이트박스
- [ ] 접근성: 색각이상자를 위한 텍스트 라벨 병기

---

## 6. 이벤트 스펙 시트 구조 (M5, M6 참고)

### 6.1. 필수 컬럼 (헤더 행 2, 인덱스 1)

| 컬럼                                                | 용도                                                 |
| --------------------------------------------------- | ---------------------------------------------------- |
| `status`                                            | `applied` / `draft` / `broken` 등. **필터하지 않음** |
| `pageName(to-be)` + `pageName(as-is)`               | 페이지명 (to-be 우선)                                |
| `objectContainer(to-be)` + `objectContainer(as-is)` | sectionName 역할                                     |
| `objectType(to-be)` + `objectType(as-is)`           | actionName 역할                                      |
| `eventType(to-be)` + `eventType(as-is)`             | view/click/impr/scroll/swipe/done/capture            |
| `logType`                                           | event/screen/popup/bottomsheet                       |
| `eventName` (1번째)                                 | 사람이 읽는 이름 (`click__banner`)                   |
| `eventName` (마지막)                                | **Amplitude 실제 전송 이름** (매칭 키)               |
| `object (string)`                                   | 주 파라미터 (보통 1개)                               |
| `extension`                                         | 추가 파라미터 리스트, 쉼표/줄바꿈 구분               |

### 6.2. 파라미터 셀 규칙 (M6가 이미 구현)

- 토큰: `$key` (prefix 제거 후 저장)
- 설명 주석: `$key: description` (`:` 이후 제거)
- dotted path 보존: `$restaurantItem.shopRef`
- 공통 Extension 참조: `[검색 관련 동작 공통 Extension]` 또는 `지도 관련 동작 공통 Extension` → `referencedExtensions`로 분리
- 중복 `$key`는 dedup

### 6.3. 알려진 시트 이슈

- 일부 신규 행에 Amplitude 이벤트명 컬럼이 비어있음
- 공백/trailing-space가 섞인 값 있음
- marketingPromotion은 `sectionName`이 사용자 입력(동적) — 현재 스코프에서는 단순 매칭 실패로 surface

### 6.4. 시트 보강 요청 (DA와 별도 협의)

- `required` 컬럼 (Y/N)
- `paramType` 컬럼 (string/number/boolean/enum)
- 공통 Extension 정의 시트 분리

---

## 7. 개발 환경

- Node >= 20
- 패키지: `npm install`
- 스크립트:
  - `npm test` — Vitest
  - `npm run typecheck` — tsc --noEmit
  - `npm run smoke` — M6 파서를 4개 CSV에 대해 실행
  - `npm run dev` — `wxt` dev (HMR, 자동 리로드) — M4 담당 셋업
  - `npm run build` — `wxt build` → `.output/chrome-mv3/` — M4 담당 셋업
  - `npm run zip` — `wxt zip` → 배포용 ZIP — M4 담당 셋업

### 7.1. 필요 의존성 (M4 착수 시 추가)

```
dependencies: react, react-dom, zustand, @vanilla-extract/css
devDependencies: wxt, @wxt-dev/module-react,
                 @vanilla-extract/vite-plugin,
                 @types/react, @types/react-dom,
                 @testing-library/react, @testing-library/dom, jsdom
```

- WXT가 Vite를 내부적으로 사용하므로 `vite` 직접 의존 불필요
- `wxt.config.ts`에 `@wxt-dev/module-react` 모듈 등록 + `vite` 훅으로 `@vanilla-extract/vite-plugin` 추가

### 7.1. Shared 규칙

- 모든 PR은 `npm run typecheck && npm test` 통과
- 공통 타입 변경은 별도 PR로 분리
- 각 모듈은 자신만의 테스트 파일 유지 (`*.test.ts`)

### 7.2. 로컬 익스텐션 실행

1. `npm run dev` — WXT가 자동으로 Chrome을 띄우거나 `.output/chrome-mv3/`에 변경사항 반영
2. 수동 로드가 필요하면: `chrome://extensions` → 개발자 모드 → "압축 해제된 확장 프로그램 로드" → `.output/chrome-mv3/` 선택
3. OAuth 테스트는 `wxt.config.ts`의 `manifest.key`에 fixed public key 설정 필수 (ID 고정)

---

## 8. Phase별 범위

### Phase 1 — MVP (이 문서의 범위)

- Amplitude 인터셉트만
- 존재 검증 + 파라미터 누락/빈 값/중복만 체크
- 단일 세션, 단일 탭 녹화
- 로컬 HTML 리포트

### Phase 2 (후속)

- 파라미터 타입/enum 검증 (시트 스키마 확장 전제)
- 공통 Extension resolve
- 세션 히스토리 유지 + 비교

### Phase 3+ (후보)

- 여러 프로바이더 크로스 체크
- CI 통합 (Puppeteer 등)
- Slack 알림

---

## 9. Decision Log

이 프로젝트에서 논의 끝에 내려진 결정. 뒤집으려면 기록 남기기.

1. **Amplitude 1개만 인터셉트** — 팬아웃 버그는 범위 밖. 목적은 스펙 구현 여부 효율적 검수.
2. **웹앱에 postMessage bridge를 심는다** — MV3 MAIN world 주입 이슈, SDK 버전 의존성, ConsoleLogger debugger API 의존성 모두 회피. 웹앱에 수십 줄 PR 1회.
3. **OAuth via `chrome.identity`** — Service Account는 클라이언트에 private key 노출 위험, API Key는 시트 공개 필요. OAuth가 유일한 실용적 선택.
4. **status 필터 제거** — 개발 중 QA 검증도 대상. draft/broken 포함.
5. **eventName 매칭 키는 Amplitude 이벤트명** — `{page}_{section}_{action}_{type}` 포맷. 시트의 "마지막 eventName" 컬럼.
6. **Phase 1 검증은 존재 여부까지만** — 시트에 타입/enum 컬럼 없음. 값 검증은 Phase 2.
7. **스크린샷은 있으면 좋은 수준** — 500ms 디바운스 누락 허용, 썸네일 480px, JPEG 0.6 품질.
8. **스토리지 전략**:
   - 런타임 상태 → `chrome.storage.session` (SW 재시작 대비)
   - 설정/캐시 → `chrome.storage.local`
   - 이벤트/스크린샷 → IndexedDB

---

## 10. 에이전트 착수 체크리스트

각 에이전트가 작업 시작 전 확인:

- [ ] §3 공통 계약 정독 (특히 §3.5 명명/주석, §3.6 SOLID)
- [ ] §4 기술 스택 확인 — 번들러는 **WXT** (Vite 직접 사용 금지), React/Zustand/vanilla-extract는 **M4/M8에만**
- [ ] 엔트리포인트(`entrypoints/*`)에는 조립만, 비즈니스 로직은 `src/<module>/`
- [ ] 자신이 맡은 §5 모듈 섹션 정독
- [ ] 포트 먼저 정의 → 순수 로직 작성 → 어댑터 작성 순서
- [ ] 의존 모듈은 **포트 타입만 import** (어댑터/구현 import 금지)
- [ ] 모든 파일/폴더 kebab-case (React 컴포넌트 파일도 `component-name.tsx`)
- [ ] 모든 주석 한국어
- [ ] 단위 테스트: 순수 로직은 어댑터 없이, 어댑터는 각자 최소 1개
- [ ] `chrome.*`/`fetch`/`indexedDB` 직접 사용은 `adapters/` 하위에만
- [ ] Zustand 스토어/React hook 타입을 모듈 경계 밖으로 노출 금지
- [ ] 공개 API 시그니처에 라이브러리/런타임 타입 노출 금지
- [ ] `npm run typecheck && npm test` 통과
- [ ] 공통 계약(§3.2, §3.3) 변경 시 PR 설명에 영향 범위 명시

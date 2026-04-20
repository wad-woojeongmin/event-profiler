# 03 — 네이밍·SOLID·기술 스택

## 프로젝트 구조 (루트 평탄 배치)

`srcDir` 미지정. 모든 모듈 폴더를 루트에 둔다(`src/` 금지). 상세 WXT 레이아웃은 [04-wxt-rules](./04-wxt-rules.md) 참고.

```
event-profiler/
├── REQUIREMENTS.md        # 최상위 엔트리
├── CLAUDE.md              # wxt-docs 참조 지침
├── docs/                  # 분할된 요구사항 문서 (이 폴더)
├── wxt.config.ts          # manifest 선언 포함
├── tsconfig.json          # strict + noUncheckedIndexedAccess
├── vitest.config.ts       # WxtVitest 플러그인
├── entrypoints/           # WXT 빌드 타겟 — 얇은 조립만
│   ├── background.ts
│   ├── content.ts
│   └── popup/
├── types/                 # 모듈 간 공유 도메인 타입
├── sheets/                # M5 + M6
├── content/               # M2
├── background/            # M3
├── popup/                 # M4
├── messaging/             # @webext-core/messaging 공용 인스턴스
├── validator/             # M7
└── report/                # M8
```

- 경로 import는 루트 기준. WXT alias `@/*` → 프로젝트 루트. 예: `import { EventSpec } from '@/types/spec'`.
- auto-import 비활성 정책(모듈 경계 명시성 우선) — 공유 심볼은 반드시 명시 import.
- 모듈 내부 구조는 포트/어댑터 규약(아래 SOLID §디렉토리 규약) 참고.

## 네이밍 규칙

**파일/폴더 — kebab-case 필수**

- `spec-parser.ts`, `service-worker.ts`, `background/screenshot-capture.ts`
- React 컴포넌트 파일도 kebab-case: `spec-loader.tsx` (export된 컴포넌트 이름은 `SpecLoader`)
- vanilla-extract 스타일 파일: `*.css.ts` (예: `theme.css.ts`)
- 폴더: `sheets/`, `background/` (의미상 한 단어면 소문자 단일 토큰)
- **금지**: `specParser.ts`, `SpecParser.ts`, `SpecLoader.tsx`, `SpecParser/`

**코드 식별자**

- 타입/인터페이스: `PascalCase` (prefix `I` 금지)
- 함수/변수: `camelCase`
- 상수: `SCREAMING_SNAKE` (public export 상수만, 모듈 내부는 camelCase 허용)

## 주석 규칙

- **모든 주석은 한국어로 작성.** JSDoc, 인라인, TODO 전부 포함.
- 외부 공개 API는 JSDoc 필수 (입력/출력/부작용 설명).
- 코드로 자명한 내용 반복 금지 — **왜** 그렇게 했는지만.
- 식별자 자체는 영어 유지 (한글 변수/함수명 금지).

## SOLID 철칙 (PoC 제약)

이 프로젝트는 **PoC 단계**로 인터셉트 방식·스토리지·인증 방식 등 기술 방향이 바뀔 가능성이 큼. 다음 7개 철칙을 따른다.

1. **공개 인터페이스는 내부 구현을 드러내지 않는다.** 모듈 public API 시그니처에 라이브러리/런타임 타입 노출 금지. 예외: M2의 `ContentScriptContext`는 "컨텍스트 무효화 처리"가 포트의 책임이므로 허용.
2. **DIP — 추상에 의존, 구현체는 주입.** 각 모듈은 포트(인터페이스)를 선언하고, 구체 어댑터(IndexedDB/`wxt/storage`/`fetch`/`@webext-core/messaging`)는 주입받는다. 테스트는 `WxtVitest` + `fakeBrowser`로 실구현을 그대로 실행하거나, WXT 폴리필 범위 밖 포트(IDB·네트워크)는 in-memory fake 주입.
3. **SRP — 각 모듈은 "바뀌는 이유"가 하나.** 예: M6 spec-parser는 시트→EventSpec 변환만, M7 validator는 스펙×수집 비교만, M8 report는 HTML 렌더만.
4. **ISP — 인터페이스는 소비자 관점에서 최소.** 읽기 소비자(M7/M8)는 `EventReader`만, 쓰기(M3)는 `EventWriter`만 의존하도록 포트를 쪼갠다.
5. **OCP — 규칙 확장은 코드 수정 없이.** M7 검증 규칙은 `ValidationRule` 배열 주입. 새 규칙 추가는 파일 1개 추가로 끝.
6. **경계 타입은 공통 타입 모듈에.** `CapturedEvent`/`EventSpec`/`BridgeMessage`는 `types/`에만. 모듈 고유 타입은 해당 모듈 내에 숨긴다.
7. **부작용 격리.** 순수 로직(파서·검증·매칭)은 I/O 없이 단위 테스트 가능. `browser.*`(WXT)·`fetch`·`indexedDB`·`window.*` 호출은 어댑터 계층에만. 확장 API는 `import { browser } from 'wxt/browser'` 한 경로로.

### 디렉토리 규약 (포트 & 어댑터)

각 모듈 내부:

```
<module>/
├── index.ts            # 이 모듈의 공개 API만 re-export
├── ports/              # 이 모듈이 소유/요구하는 인터페이스
├── adapters/           # 포트의 구현체 (환경별)
├── <core-logic>.ts     # 순수 로직
└── <core-logic>.test.ts
```

### 포트 예시

```typescript
// background/ports/event-store.ts
export interface EventWriter { add(event: CapturedEvent): Promise<void>; clear(): Promise<void>; }
export interface EventReader { listBySession(sessionId: string): Promise<CapturedEvent[]>; }

// sheets/ports/sheets-source.ts
export interface SheetsSource {
  listTabs(spreadsheetId: string): Promise<SheetTab[]>;
  fetchAsCsv(spreadsheetId: string, sheetTitle: string): Promise<string>;
}

// validator/ports/validation-rule.ts
export interface ValidationRule {
  readonly code: IssueType;
  evaluate(ctx: ValidationContext): ValidationIssue[];
}
```

### 테스트 지침

- **Vitest + `WxtVitest` 플러그인** (`vitest.config.ts`에 이미 설정). `browser.*`를 `@webext-core/fake-browser`로 자동 폴리필. 자세한 내용은 `.claude/wxt-docs/guide/essentials/unit-testing.md`.
- 순수 로직은 어댑터 없이 직접 테스트.
- `browser.*`/`wxt/storage` 어댑터는 별도 fake를 만들지 말고 `fakeBrowser.reset()`으로 상태 초기화 후 실구현 테스트:
  ```ts
  import { fakeBrowser } from "wxt/testing/fake-browser";
  beforeEach(() => fakeBrowser.reset());
  ```
- IndexedDB/네트워크 등 WXT 폴리필 밖 영역은 포트 단위 in-memory fake 주입.
- 통합: 실제 어댑터 + `fakeBrowser`로 end-to-end.

## 기술 스택 (고정 제약)

| 영역              | 선택                                                         | 결정 이유                                                     |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| 익스텐션          | Chrome Manifest V3                                           | 최신 표준                                                     |
| 언어              | **TypeScript** (strict, noUncheckedIndexedAccess)            | 타입 안전                                                     |
| 프레임워크/번들러 | **WXT** (Vite 기반)                                          | MV3 빌드, entrypoints 자동 수집, HMR, manifest 생성           |
| UI                | **React 19**                                                 | 복잡한 팝업/리포트 상호작용 상태 관리                         |
| 상태 관리         | **Jotai**                                                    | 원자 단위 상태, 파생 아톰으로 SRP 친화적                      |
| 스타일            | **vanilla-extract**                                          | 타입 안전한 CSS-in-TS, zero-runtime                           |
| 테스트            | Vitest + `WxtVitest`                                         | Vite 일관성, browser 폴리필                                   |
| CSV 파서          | `papaparse`                                                  | 멀티라인 셀 처리 견고                                         |
| Sheets 인증       | `browser.identity.getAuthToken` (OAuth2, `wxt/browser` 경유) | Service Account 보안 문제 회피                                |
| 스토리지          | IndexedDB (이미지) + `wxt/storage` (메타)                    | `defineItem` 타입 안전, 서버 불필요                           |
| 메시징            | `@webext-core/messaging` (typed ProtocolMap)                 | WXT 공식 권장, vanilla runtime 메시징의 pain point 해소       |
| 이미지 리사이즈   | `createImageBitmap` + Canvas (또는 Squoosh wasm)             | 썸네일 용량 최소화                                            |
| 리포트            | React renderToString → self-contained HTML (base64 인라인)   | 단일 파일 공유                                                |
| 차트              | SVG (React) + vanilla-extract                                | 외부 차트 라이브러리 의존 없음                                |

### 스택 적용 범위

| 모듈                |      React       |  Jotai  | vanilla-extract |
| ------------------- | :--------------: | :-----: | :-------------: |
| M2 content script   |        ❌        |   ❌    |       ❌        |
| M3 background SW    |        ❌        |   ❌    |       ❌        |
| M4 popup UI         |        ✅        |   ✅    |       ✅        |
| M8 report generator | ✅ (문자열 렌더) |   ❌    |       ✅        |

- **Content Script / SW는 React/Jotai 금지**: 런타임/SW 환경에서 불필요, bundle 크기 증가.
- Jotai는 팝업 UI 경계 **내부에서만** 사용. 다른 모듈에 Jotai 아톰 타입/훅을 export 금지 (철칙 1).

## 개발 환경

- Node >= 20, 패키지 매니저는 **pnpm**.
- 스크립트:
  - `pnpm test` — Vitest (WxtVitest 경유, browser.* in-memory 폴리필)
  - `pnpm compile` — `tsc --noEmit`
  - `pnpm dev` — WXT HMR
  - `pnpm build` → `.output/chrome-mv3/`, `pnpm zip` → 배포 ZIP
  - `pnpm dev:firefox`/`build:firefox`/`zip:firefox` — Phase 1 best-effort
- `postinstall`이 `wxt prepare`를 자동 실행하여 `.wxt/tsconfig.json` + alias + 타입 생성.
- 모든 PR은 `pnpm compile && pnpm test` 통과. 공통 계약(02-contracts) 변경은 별도 PR로.
- 로컬 실행: `pnpm dev`가 Chrome 자동 로드. 수동 로드는 `chrome://extensions` → 개발자 모드 → "압축 해제된 확장 프로그램 로드" → `.output/chrome-mv3/`.
- OAuth 테스트는 `wxt.config.ts`의 `manifest.key`에 fixed public key 필수.

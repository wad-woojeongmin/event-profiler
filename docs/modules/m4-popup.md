# M4 — Chrome Extension Popup UI

**파일**:
- `entrypoints/popup/index.html`, `entrypoints/popup/main.tsx` — WXT 진입점 (얇은 React 마운트)
- `popup/*` — 로직 (app.tsx, components/, atoms/, ports/, adapters/, styles)
- `wxt.config.ts` — manifest 선언 (key, oauth2, permissions 등)

**스택**: React 19 + Jotai + vanilla-extract + WXT

**필독**: [02-contracts](../02-contracts.md), [04-wxt-rules](../04-wxt-rules.md), M3/M5 포트

## 책임

사용자가 시트 연결 → 이벤트 선택 → 녹화 시작/종료 → 리포트 생성까지 조작하는 UI.

## 포트 정의 (M3와의 경계)

```typescript
// ports/background-client.ts
export interface BackgroundClient {
  /** 고정 시트에서 스펙 로드. sheetTitle 선택은 Phase 2에서 고려. */
  loadSpecs(sheetTitle?: string): Promise<EventSpec[]>;
  startRecording(targetEventNames: string[], tabId: number): Promise<void>;
  stopRecording(): Promise<void>;
  getSessionState(): Promise<RecordingSessionState>;
  subscribeSession(onChange: (state: RecordingSessionState) => void): () => void;
  generateReport(): Promise<void>;
}
```

어댑터 `messaging-background-client.ts`가 `@webext-core/messaging`의 `sendMessage`/`onMessage`(공용 인스턴스 import)를 사용하여 구현.
**Jotai 아톰/React hook 타입을 이 포트에 노출 금지.**

## Jotai 아톰 설계

아톰은 **기능별 그룹으로 분리** (SRP). 그룹 간 직접 참조 금지 — 필요하면 파생 아톰(derived atom)으로 합성.

```typescript
// atoms/specs-atoms.ts
export const specsAtom = atom<EventSpec[]>([]);
export const specsLoadStateAtom = atom<"idle" | "loading" | "error">("idle");
export const specsErrorAtom = atom<string | undefined>(undefined);
export const loadSpecsAtom = atom(
  null,
  async (_get, set, args: { spreadsheetId: string; sheetTitle: string }) => {
    /* write-only 액션 아톰 */
  },
);

// atoms/recording-atoms.ts
export const recordingSessionAtom = atom<RecordingSessionState | null>(null);
export const selectedEventNamesAtom = atom<Set<string>>(new Set());
export const toggleSelectionAtom = atom(null, (get, set, eventName: string) => { /* ... */ });
export const startRecordingAtom = atom(null, async (_get, set) => { /* ... */ });
export const stopRecordingAtom = atom(null, async (_get, set) => { /* ... */ });

// atoms/settings-atoms.ts
export const spreadsheetIdAtom = atom<string>("");
export const sheetTitleAtom = atom<string>("");
export const hydrateSettingsAtom = atom(null, async (_get, set) => {
  /* BackgroundClient 통해 wxt/storage에서 복원 */
});
```

- `BackgroundClient`는 **Jotai `Provider`를 통한 의존성 주입** 또는 아톰 팩토리로 주입 (테스트 분리 용이)
- 테스트에서는 Provider로 in-memory fake client 주입
- 그룹 간 상태 동기화는 popup-entry에서 SW 이벤트 구독 → `useSetAtom`으로 반영

## vanilla-extract 규약

- `theme.css.ts`에 색상/간격/폰트 토큰 정의, `createThemeContract` + `createTheme`
- 컴포넌트별 스타일은 같은 폴더에 `<component>.css.ts`로 co-locate
- 인라인 스타일(`style={}`) 금지 — 동적 값이 필요하면 `styleVariants` 또는 `assignInlineVars`

## 상태 머신

```
idle → specs_loaded → recording → recording_done → (idle 또는 report_open)
                ↑                         │
                └─── load specs again ────┘
```

## UI 구성

- 상단: 설정 섹션
  - 고정 시트 링크 표시 (`sheets/constants.ts`의 `SPEC_SHEET_URL`)
  - `[스펙 불러오기]` 버튼 (M5 호출)
  - OAuth 미인증 시 `[Google 로그인]` 버튼
  - 로드된 스펙 수 표시
  - **URL 입력 필드 없음** — 프로젝트는 단일 시트만 사용
- 중단: 검증 대상 선택
  - `EventSpec` 목록을 체크박스로 표시 (amplitudeEventName + humanEventName + pageName 간단히)
  - 검색/필터 박스
  - `[전체 선택]` `[전체 해제]`
- 하단: 녹화 제어
  - 녹화 중이 아니면: `[● 녹화 시작]` (선택 0건이면 disabled)
  - 녹화 중: 실시간 수집 건수 + 경과 시간 + `[■ 녹화 종료]`
  - 녹화 완료: `[리포트 생성 (새 탭)]` `[HTML 다운로드]` `[초기화]`

## 상호작용

- 녹화 시작 시 현재 활성 탭의 `tabId`를 같이 보냄
- 녹화 중 팝업 닫아도 상태 유지 (M3가 관리)
- 팝업 열릴 때마다 `getSessionState` 호출해 UI 복구

## Manifest — `wxt.config.ts`로 선언

WXT는 `wxt.config.ts`의 `manifest` 필드(정적 값)와 `entrypoints/` 스캔 결과(동적 값)를 병합하여 MV3 manifest 자동 생성.

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
    key: "<public key>",
    oauth2: {
      client_id: "3134095607-...apps.googleusercontent.com",
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    },
  },
});
```

- `background`, `action.default_popup`, `content_scripts`는 WXT가 `entrypoints/` 스캔하여 자동 주입
- 루트에는 `manifest.json`을 두지 않음. 최종 manifest는 `.output/<target>/manifest.json`에 생성됨

## 수용 기준

- [ ] 스펙 로드 → 녹화 시작 → 종료 → 리포트 생성 end-to-end
- [ ] 팝업 닫았다 다시 열어도 녹화 중 상태 유지
- [ ] 이벤트 선택 0건일 때 녹화 시작 버튼 비활성화
- [ ] 접근성: 키보드 네비게이션 지원

# 04 — WXT 사용 규칙

이 문서는 **프로젝트 고유 WXT 결정**만 기록합니다. WXT 일반 사용법은 `.claude/wxt-docs/`를 먼저 읽으세요.

## 필독 WXT 문서

| 주제              | 경로                                                          |
| ----------------- | ------------------------------------------------------------- |
| 엔트리포인트      | `.claude/wxt-docs/guide/essentials/entrypoints.md`            |
| 프로젝트 구조     | `.claude/wxt-docs/guide/essentials/project-structure.md`      |
| Content Script    | `.claude/wxt-docs/guide/essentials/content-scripts.md`        |
| 확장 API (browser)| `.claude/wxt-docs/guide/essentials/extension-apis.md`         |
| Storage           | `.claude/wxt-docs/storage.md` + `guide/essentials/storage.md` |
| Messaging         | `.claude/wxt-docs/guide/essentials/messaging.md`              |
| Unit Testing      | `.claude/wxt-docs/guide/essentials/unit-testing.md`           |
| Manifest 설정     | `.claude/wxt-docs/guide/essentials/config/manifest.md`        |
| Frontend 프레임워크 | `.claude/wxt-docs/guide/essentials/frontend-frameworks.md`  |

## 프로젝트 결정 (WXT 관련)

### 엔트리포인트 레이아웃

- `srcDir` **미지정**. `entrypoints/`를 루트에 둔다. 모듈 코드는 루트 모듈 폴더(`sheets/`·`background/` 등).
- 엔트리포인트 = **얇은 조립 계층**. 포트 어댑터를 주입하고 모듈 로직을 호출만. 비즈니스 로직 작성 금지(SRP).
- 엔트리포인트 파일:
  - `entrypoints/background.ts` — `defineBackground(() => { ... })`
  - `entrypoints/content.ts` — `defineContentScript({ matches, main: (ctx) => { ... } })`
  - `entrypoints/popup/index.html` + `entrypoints/popup/main.tsx` — React 마운트

### ⚠️ 엔트리포인트 런타임 코드 제약 (Critical Gotcha)

WXT는 빌드 시 엔트리포인트 파일을 **NodeJS 환경에서도 import**하여 manifest 옵션을 추출한다. 따라서:

- `browser.*`/`window.*`/`document.*`/`chrome.*` 등 **런타임 API는 `main`/`defineBackground` 콜백 내부에만** 배치.
- 모듈 최상위(top-level)에서 호출하면 `✖ Browser.*.addListener not implemented` 류 빌드 에러.
- 사이드이펙트 없는 순수 심볼 import는 top-level OK.

자세한 설명: `.claude/wxt-docs/guide/essentials/entrypoints.md:210-225`, `extension-apis.md:101-158`.

### API 네임스페이스 통일

- 모든 확장 API는 `import { browser } from 'wxt/browser'`만 사용.
- 타입은 `import { type Browser } from 'wxt/browser'`.
- `chrome.*` 직접 참조 금지.

### 스토리지 사용 규칙

- `chrome.storage.*`/`browser.storage.*` 직접 사용 금지.
- **`wxt/storage.defineItem<T>('<area>:<key>')` 패턴**만 사용.
  - 예: `storage.defineItem<RecordingSession | null>('session:recordingState', { fallback: null })`
- 어댑터 내부에서만 `wxt/storage` import. 포트 외부에는 `wxt/storage` 타입/인스턴스 노출 금지.
- 프로젝트에서 쓰는 키 목록은 [02-contracts §스토리지 레이아웃](./02-contracts.md#스토리지-레이아웃) 참고.

### 메시징 사용 규칙

- `@webext-core/messaging` 사용. vanilla `browser.runtime.sendMessage`/`onMessage`는 어댑터 내부에서도 금지.
- 공용 인스턴스: `messaging/extension-messaging.ts`가 `defineExtensionMessaging<ExtensionProtocol>()`의 결과(`sendMessage`, `onMessage`)를 export. background/content/popup 모두 여기서 import.
- ProtocolMap은 [02-contracts §ExtensionProtocol](./02-contracts.md#typesmessagests-m2-담당) 참고.

### Content Script 컨텍스트

- `defineContentScript.main(ctx)`의 `ctx`는 확장 재설치/업데이트/비활성화 시 리스너 자동 정리용.
- `window.addEventListener`·`setTimeout`·`setInterval` 직접 호출 금지 → 모두 **`ctx.addEventListener` / `ctx.setTimeout`**으로 래핑.
- 비동기 작업 전 `ctx.isValid` 체크하여 무효화된 컨텍스트에서 `browser.runtime` 호출 방지.

### 테스트

- `vitest.config.ts`에 `WxtVitest()` 플러그인 이미 설정. 별도 설정 불필요.
- `fakeBrowser.reset()`을 `beforeEach`에서 호출하여 상태 격리. 자세한 패턴은 [03-conventions §테스트 지침](./03-conventions.md#테스트-지침).

### Manifest

- 루트에 `manifest.json`을 두지 않는다. `wxt.config.ts`의 `manifest` 필드가 유일한 정적 소스.
- WXT가 `entrypoints/`를 스캔하여 `background`/`action.default_popup`/`content_scripts`를 자동 주입.
- 최종 manifest는 `.output/<target>/manifest.json`에 생성됨.

```typescript
// wxt.config.ts
import { defineConfig } from "wxt";
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Event Validator",
    permissions: ["activeTab", "tabs", "storage", "identity", "scripting"],
    host_permissions: ["https://*.catchtable.co.kr/*"],
    key: "<public key>",
    oauth2: {
      client_id: "...apps.googleusercontent.com",
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    },
  },
});
```

### 브라우저 타겟 (Phase 1 정책)

- **Chrome(MV3)**만 공식 지원. 수용 기준은 Chrome 기준.
- Firefox 빌드 파이프라인은 `package.json`에 스캐폴드되어 있으나 best-effort. Firefox-specific 이슈는 Phase 2에서 검토.
- Safari는 Phase 3+.
- API를 `browser.*`로 쓰는 이유도 이 때문 — 타겟 확장 비용을 미리 0으로.

### Auto-imports

- WXT 기본은 `components/`·`composables/`·`hooks/`·`utils/`를 auto-import. (`.claude/wxt-docs/guide/essentials/config/auto-imports.md`)
- 본 프로젝트는 **auto-import 사용 안 함** — 모듈 경계 명시성을 위해 모든 import를 명시.

### 필요 의존성 (M4 착수 시 추가)

```
dependencies: react, react-dom, jotai, @vanilla-extract/css, @webext-core/messaging
devDependencies: wxt, @wxt-dev/module-react, @vanilla-extract/vite-plugin,
                 @types/react, @types/react-dom,
                 @testing-library/react, @testing-library/dom, jsdom
```

- WXT가 Vite를 내부 사용 → `vite` 직접 의존 불필요.
- `wxt/storage`, `wxt/browser`, `wxt/testing/*`는 WXT 내장.
- `wxt.config.ts`에 `@wxt-dev/module-react` 등록 + `vite` 훅으로 `@vanilla-extract/vite-plugin` 추가.

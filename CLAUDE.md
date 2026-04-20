# Event Profiler — Claude 작업 지침

본 프로젝트는 [WXT](https://wxt.dev) 기반 웹 확장 프로그램입니다. 요구사항은 `REQUIREMENTS.md`를 우선 참고하세요.

## WXT 참조 문서 사용 방법

WXT 공식 문서(VitePress 원본)를 `.claude/wxt-docs/`에 오프라인 사본으로 두었습니다. WXT API·설정·엔트리포인트·스토리지·메시징 등과 관련된 작업을 할 때는 **웹 검색이나 추측 대신 이 문서를 먼저 읽어** 정답을 확인하세요.

### 탐색 가이드

- 목차/홈: `.claude/wxt-docs/index.md`
- 시작/설치: `.claude/wxt-docs/guide/installation.md`, `guide/introduction.md`
- 핵심 개념(Essentials): `.claude/wxt-docs/guide/essentials/`
  - `entrypoints.md`, `project-structure.md`, `content-scripts.md`
  - `storage.md`, `messaging.md`, `extension-apis.md`
  - `i18n.md`, `scripting.md`, `remote-code.md`
  - `frontend-frameworks.md`, `target-different-browsers.md`
  - `unit-testing.md`, `e2e-testing.md`, `testing-updates.md`
  - `publishing.md`, `wxt-modules.md`, `assets.md`, `favicons.md`
  - 설정: `guide/essentials/config/` (manifest 등)
- 리소스(FAQ·마이그레이션): `.claude/wxt-docs/guide/resources/`
- API 레퍼런스: `.claude/wxt-docs/api/`, CLI: `.claude/wxt-docs/api/cli/`
- 최상위 주제별 문서: `storage.md`, `i18n.md`, `runner.md`, `unocss.md`, `auto-icons.md`, `is-background.md`, `analytics.md`, `examples.md`

### 사용 규칙

1. WXT 고유 기능(defineBackground, defineContentScript, storage, browser API 래퍼, wxt.config, manifest 키 등)을 다룰 때는 `Grep`/`Read`로 관련 md 파일을 먼저 확인한다.
2. 답이 불분명하면 `.claude/wxt-docs/` 범위로 `Grep`을 돌려 근거를 찾고, 인용할 때는 `file_path:line_number` 형식으로 출처를 표기한다.
3. 이 디렉터리는 **읽기 전용 참조 자료**다. WXT 문서 파일을 수정하지 말 것.
4. 프로젝트 고유 요구사항(시트 스키마, 메시지 프로토콜, 모듈 분담 등)은 여전히 `REQUIREMENTS.md`가 우선이며, WXT 문서와 충돌하면 `REQUIREMENTS.md`를 따른다.

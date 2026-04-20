# Event Profiler — 요구사항 (v3)

수집된 Amplitude 이벤트 로그를 구글 시트 스펙과 비교하여 **QA/PM이 확인 가능한 HTML 리포트**를 생성하는 Chrome 확장 (WXT 기반).

## 어디서부터 읽을까

요구사항은 `docs/` 하위로 분할되어 있습니다. **에이전트는 [`docs/00-index.md`](./docs/00-index.md)를 엔트리로 삼아** 자신의 담당 모듈로 라우팅하세요.

| 목적                                          | 가야 할 곳                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| 프로젝트 전체 맥락·아키텍처                   | [`docs/01-overview.md`](./docs/01-overview.md)                             |
| 모듈 간 계약(타입·메시지·스토리지 키)         | [`docs/02-contracts.md`](./docs/02-contracts.md)                           |
| 네이밍·SOLID·기술 스택·개발 환경              | [`docs/03-conventions.md`](./docs/03-conventions.md)                       |
| WXT 사용 규칙 (프로젝트 고유 결정 + 공식 문서 링크) | [`docs/04-wxt-rules.md`](./docs/04-wxt-rules.md)                      |
| 시트 스펙 (M5/M6 전용)                        | [`docs/05-sheet-spec.md`](./docs/05-sheet-spec.md)                         |
| 모듈별 요구사항 (M1~M8)                       | [`docs/modules/`](./docs/modules/)                                         |
| WXT 공식 문서                                 | [`.claude/wxt-docs/`](./.claude/wxt-docs/) (`CLAUDE.md` 지침 참고)         |

## 담당 모듈 라우팅

| 모듈                         | 문서                                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| M1 Webapp Bridge             | [`docs/modules/m1-bridge.md`](./docs/modules/m1-bridge.md)              |
| M2 Content Script            | [`docs/modules/m2-content.md`](./docs/modules/m2-content.md)            |
| M3 Background Service Worker | [`docs/modules/m3-background.md`](./docs/modules/m3-background.md)      |
| M4 Popup UI                  | [`docs/modules/m4-popup.md`](./docs/modules/m4-popup.md)                |
| M5 Google Sheets 연동        | [`docs/modules/m5-sheets.md`](./docs/modules/m5-sheets.md)              |
| M6 Spec Parser ✅            | [`docs/modules/m6-spec-parser.md`](./docs/modules/m6-spec-parser.md)    |
| M7 Validator                 | [`docs/modules/m7-validator.md`](./docs/modules/m7-validator.md)        |
| M8 Report Generator          | [`docs/modules/m8-report.md`](./docs/modules/m8-report.md)              |

## 핵심 원칙 (세부는 docs/03-conventions)

- **공개 계약**(타입·메시지 키·스토리지 키)은 임의 변경 금지. 변경 시 PR에 영향 범위 명시.
- 확장 API는 `import { browser } from 'wxt/browser'`만. `chrome.*` 직접 참조 금지.
- 스토리지는 `wxt/storage.defineItem`, 메시지는 `@webext-core/messaging`.
- Content Script는 `ctx.*`로 리스너 래핑.
- 모든 파일/폴더 kebab-case, 주석 한국어, `pnpm compile && pnpm test` 통과.

## PR 시

- 해당 모듈 문서의 **수용 기준** 체크리스트를 PR 설명에 복사해 체크.
- 공통 계약([`docs/02-contracts.md`](./docs/02-contracts.md)) 변경은 별도 PR.

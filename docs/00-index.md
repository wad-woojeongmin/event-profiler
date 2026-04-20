# docs/ — 문서 맵 & 에이전트 라우팅

> Event Validator 요구사항은 이 디렉터리 내 여러 파일로 분할되어 있습니다. 아래 라우팅을 보고 필요한 문서만 읽으세요.

## 문서 맵

| 파일                                       | 내용                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| [01-overview](./01-overview.md)            | 프로젝트 목적·배경·아키텍처·데이터 흐름·Phase 범위·Decision Log        |
| [02-contracts](./02-contracts.md)          | 공개 타입, 메시지 프로토콜(ExtensionProtocol), 스토리지 키 레이아웃    |
| [03-conventions](./03-conventions.md)      | 프로젝트 구조·네이밍·주석·SOLID 철칙·기술 스택·테스트 지침·개발 환경   |
| [04-wxt-rules](./04-wxt-rules.md)          | WXT 사용 규칙 (엔트리포인트·browser·storage·messaging) + wxt-docs 링크 |
| [05-sheet-spec](./05-sheet-spec.md)        | 이벤트 스펙 시트 컬럼/파라미터 규칙 (M5/M6 전용)                       |
| [modules/m1-bridge](./modules/m1-bridge.md) ~ [m8-report](./modules/m8-report.md) | 모듈별 요구사항·포트·수용 기준                                         |
| [modules/m9-auth](./modules/m9-auth.md) | (예정) OAuth 인증 모듈 분리 — Phase 2 착수 전 설계 메모                  |

## 에이전트 라우팅

### 모든 에이전트 필독

- [01-overview](./01-overview.md) — 왜 이 프로젝트를 하는지
- [02-contracts](./02-contracts.md) — 다른 모듈과 주고받는 타입/메시지/키
- [03-conventions](./03-conventions.md) — 작성 규칙
- [04-wxt-rules](./04-wxt-rules.md) — WXT 쓸 때 실수하지 말 것 (`chrome.*` 금지, 엔트리포인트 top-level 런타임 코드 금지 등)
- `/CLAUDE.md` + `.claude/wxt-docs/` — WXT 공식 문서 참조 방법

### 모듈별 추가 필독

| 담당 | 모듈 문서                                        | 추가 읽기                                                         |
| ---- | ------------------------------------------------ | ----------------------------------------------------------------- |
| M1   | [m1-bridge](./modules/m1-bridge.md)              | [01-overview Decision #2](./01-overview.md#decision-log)          |
| M2   | [m2-content](./modules/m2-content.md)            | `.claude/wxt-docs/guide/essentials/content-scripts.md`            |
| M3   | [m3-background](./modules/m3-background.md)      | `.claude/wxt-docs/storage.md`, [m7](./modules/m7-validator.md) 포트 경계 |
| M4   | [m4-popup](./modules/m4-popup.md)                | `.claude/wxt-docs/guide/essentials/frontend-frameworks.md`        |
| M5   | [m5-sheets](./modules/m5-sheets.md)              | [05-sheet-spec](./05-sheet-spec.md), [m6](./modules/m6-spec-parser.md) |
| M6   | [m6-spec-parser](./modules/m6-spec-parser.md)    | [05-sheet-spec](./05-sheet-spec.md)                               |
| M7   | [m7-validator](./modules/m7-validator.md)        | [02-contracts §validation](./02-contracts.md#typesvalidationts-m7-담당) |
| M8   | [m8-report](./modules/m8-report.md)              | M3 `ScreenshotReader` 포트                                        |
| M9   | [m9-auth](./modules/m9-auth.md) *(예정)*         | [m5-sheets](./modules/m5-sheets.md) §인증, [m4-popup](./modules/m4-popup.md) 인증 아톰 |

## 의존 그래프 (모듈 포트 의존)

```
M1 (webapp bridge) ──postMessage──► M2 (content)
                                    │
                                    └─@webext-core/messaging─► M3 (background)
                                                                │
                                                                ├─► IndexedDB + wxt/storage
                                                                └─► 스크린샷
M5 (sheets) ──EventSpec──► M6 (parser) ──EventSpec──► M7 (validator)
                                                      │
M3 CapturedEvent ─────────────────────────────────────┘
                                                      │
                                                      └─ValidationReport──► M8 (report)
M4 (popup) ──BackgroundClient──► M3, M5
```

## 작업 착수 체크리스트

- [ ] [03-conventions](./03-conventions.md) 정독 (특히 네이밍/SOLID)
- [ ] [04-wxt-rules](./04-wxt-rules.md) 정독 (엔트리포인트 런타임 제약·API 네임스페이스)
- [ ] 자신이 맡은 모듈 문서 정독
- [ ] 의존하는 모듈의 포트 정의만 읽고 구현 상세는 안 봄
- [ ] 포트 먼저 정의 → 순수 로직 작성 → 어댑터 작성 순서
- [ ] 확장 API는 `import { browser } from 'wxt/browser'` 한 경로만 사용
- [ ] 스토리지는 `wxt/storage.defineItem`, 메시지는 `messaging/extension-messaging.ts` 공용 인스턴스
- [ ] Content Script에서는 `ctx.*`로 리스너 래핑
- [ ] 모든 파일/폴더 kebab-case, 주석은 한국어
- [ ] `pnpm compile && pnpm test` 통과
- [ ] [02-contracts](./02-contracts.md) 변경은 별도 PR + 영향 범위 명시

## 문서 수정 원칙

- **공개 계약**(02-contracts의 타입/키/프로토콜)은 임의 변경 금지.
- WXT 일반 사용법이 추가로 필요하면 `.claude/wxt-docs/`를 먼저 확인 → 중복 금지.
- 새 Decision이 있으면 [01-overview §Decision Log](./01-overview.md#decision-log)에 추가.

# 01 — 프로젝트 개요 & 아키텍처

## 목적

수집된 이벤트 로그를 구글 시트에 정의된 스펙과 비교하여, **QA/PM 등 비개발자도 확인 가능한 리포트**를 생성하는 크롬 익스텐션.

## 배경

- CatchTable B2C 웹앱은 `@catchtable-b2c/event-logger`로 Amplitude/Airbridge/GA4/Hackle 4개 프로바이더에 이벤트를 팬아웃 발송.
- 이벤트 스펙은 구글 시트에 정의되어 있으나 실제 구현과의 일치 여부를 수동 검증 중.
- QA/PM이 녹화하듯 앱을 사용하면 자동으로 검증 리포트를 받을 수 있게 한다.

## 대상 사용자

- QA 엔지니어, 프로덕트 매니저, 이벤트 스펙 오너(DA).

## Scope 명확화

- Amplitude 하나만 인터셉트. 다른 프로바이더로의 팬아웃 일치 여부는 범위 밖
- 존재 검증만. 파라미터 타입/enum 검증은 시트에 타입 컬럼이 없어 Phase 2에서 추가.
- 녹화 기반. 연속 모니터링이 아닌, 사용자가 명시적으로 시작/종료하는 세션 기반 검증.

## 아키텍처 개요

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
│         ▼                                    ▼                │
│  ┌─────────────────┐         ┌──────────────────────────┐     │
│  │ Google Sheets   │         │ Validator (M7)           │     │
│  │ integration (M5)│────────►│  - match by eventName    │     │
│  │ (OAuth + API)   │ EventSpec│  - rule checks           │     │
│  └─────────────────┘         └──────────┬───────────────┘     │
│         ▲                               ▼                     │
│         │                    ┌────────────────────────┐       │
│         │                    │ Spec Parser (M6) DONE  │       │
│         │                    └────────────────────────┘       │
│         │                               ▼                     │
│         │                    ┌────────────────────────┐       │
│         │                    │ Report Generator (M8)  │──►new │
│         │                    │  - HTML rendering      │   tab │
│         │                    │  - self-contained      │   or  │
│         │                    └────────────────────────┘ .html │
└───────────────────────────────────────────────────────────────┘
```

### 주요 데이터 흐름

1. 사용자가 팝업에서 시트 URL 입력 → **M5** OAuth로 Sheets API 호출 → CSV text → **M6 Spec Parser** → `EventSpec[]`
2. 사용자가 녹화 시작 → **M2** Content Script가 `window.postMessage` 리스닝 활성화
3. 웹앱에서 이벤트 발송 → **M1 ValidatorBridge**가 postMessage로 emit → **M2** → **M3** Background가 IndexedDB에 저장 + `browser.tabs.captureVisibleTab` (디바운스 500ms) + 썸네일화
4. 사용자가 녹화 종료 → **M7 Validator**가 수집 이벤트 × 스펙 매칭 → `ValidationResult[]`
5. **M8 Report Generator**가 HTML 렌더 → 새 탭 or 파일 다운로드

## Phase 범위

## Phase 0 — Demo PoC

- 실제 동작을 시뮬레이션하는 데모 제작

### Phase 1 — MVP (현 문서의 범위)

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

## Decision Log

뒤집으려면 기록 남기기.

1. **Amplitude 1개만 인터셉트** — 팬아웃 버그는 범위 밖. 목적은 스펙 구현 여부 효율적 검수.
2. **웹앱에 postMessage bridge를 심는다** — MV3 MAIN world 주입 이슈, SDK 버전 의존성, ConsoleLogger debugger API 의존성 모두 회피. 웹앱에 수십 줄 PR 1회.
3. **OAuth via `browser.identity`** — Service Account는 클라이언트에 private key 노출 위험, API Key는 시트 공개 필요. OAuth가 유일한 실용적 선택.
4. **status 필터 제거** — 개발 중 QA 검증도 대상. draft/broken 포함.
5. **eventName 매칭 키는 Amplitude 이벤트명** — `{page}_{section}_{action}_{type}` 포맷. 시트의 "마지막 eventName" 컬럼.
6. **Phase 1 검증은 존재 여부까지만** — 시트에 타입/enum 컬럼 없음. 값 검증은 Phase 2.
7. **스크린샷은 있으면 좋은 수준** — 500ms 디바운스 누락 허용, 썸네일 480px, JPEG 0.6 품질.
8. **스토리지 전략** — 런타임 상태 → `wxt/storage` `session:*`, 설정/캐시 → `wxt/storage` `local:*`, 이벤트/스크린샷 → IndexedDB.
9. **`src/` 디렉터리 미사용** — WXT `srcDir` 미지정. 모든 모듈 폴더를 루트에 평탄 배치.
10. **메시징 라이브러리 `@webext-core/messaging`** — WXT 공식 문서 권장. ProtocolMap 스타일이 포트와 잘 맞음.
11. **확장 API는 `wxt/browser`의 `browser`** — `chrome.*` 직접 참조 금지. Firefox 격상 시 재작성 비용 제거.

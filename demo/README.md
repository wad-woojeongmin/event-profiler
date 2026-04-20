# Phase 0 — Demo PoC

실제 확장 동작을 **시뮬레이션하는 UI 목업**입니다. Event Profiler가 완성되었을 때 QA/PM이 보게 될 팝업·리포트를 미리 만져볼 수 있도록 만든 데모입니다.

## 실행

```bash
pnpm demo
```

기본 `http://localhost:5174`에 자동으로 브라우저가 열립니다.

## 범위

| 구성     | 상태                                                        |
| -------- | ----------------------------------------------------------- |
| Popup UI | ✅ 실제 400×640 브라우저 액션 사이즈로 재현                 |
| Report   | ✅ 새 탭 대신 같은 페이지 내 뷰 전환 (요약·타임라인·테이블) |
| OAuth    | 🟡 버튼 UI만 (실제 인증 X)                                  |
| Sheets API | 🟡 fixture CSV 대신 fixture `EventSpec[]` 직결            |
| Messaging/SW | ❌ 시뮬레이션 없음 — useState로 대체                    |
| IndexedDB·스크린샷 | ❌ fixture 타임라인만 표시                          |

## 커버하는 흐름

1. Google 계정으로 로그인 (즉시 통과)
2. 시트 URL 입력 → 스펙 불러오기 (0.8초 지연 시뮬레이션)
3. 체크박스로 검증 대상 선택, 검색 필터
4. 녹화 시작 → 수집 수 카운터가 650ms마다 +1
5. 녹화 종료 → 리포트 열기
6. 리포트: 요약 카드·타임라인 SVG·결과 테이블·예외 이벤트

## 파일 구조

```
demo/
├── index.html
├── vite.config.ts        # 독립 Vite 설정 (WXT와 분리)
├── main.tsx              # React 마운트
├── app.tsx               # 루트 (popup ↔ report 뷰 스위치)
├── pages/
│   ├── popup-page.tsx
│   └── report-page.tsx
├── components/
│   ├── auth-gate.tsx
│   ├── spec-loader.tsx
│   ├── event-checklist.tsx
│   ├── recording-controls.tsx
│   └── timeline-chart.tsx
├── fixtures/
│   ├── event-specs.ts
│   └── validation-report.ts
├── state/
│   └── use-demo-state.ts
└── styles/
    ├── global.css
    └── app.css
```

## 이 데모의 한계 / Phase 1에서 할 일

- 실제 `browser.identity`로 OAuth 구현 (M5)
- `@webext-core/messaging`으로 popup↔background 연결 (M3·M4)
- `wxt/storage.defineItem`으로 세션/설정 영속화 (M3)
- IndexedDB 스크린샷 저장 + `browser.tabs.captureVisibleTab` (M3)
- `ValidationReport`를 `renderToString`으로 self-contained HTML 파일 출력 (M8)

상세 요구사항은 프로젝트 루트 `REQUIREMENTS.md` → `docs/modules/` 참고.

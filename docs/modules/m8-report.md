# M8 — Report Generator

**파일**:
- `report/*` — 로직
- (뷰어 모드 선택 시) `entrypoints/report/index.html` + `main.tsx` — WXT 진입점

**스택**: React 19 + vanilla-extract (Jotai 미사용 — 읽기 전용 뷰)

**필독**: [02-contracts §ValidationReport](../02-contracts.md#typesvalidationts-m7-담당), M3 `ScreenshotReader` 포트

## 엔트리포인트 결정

- 새 탭에서 여는 방식이면 `entrypoints/report/index.html` + `main.tsx`를 추가.
- 다운로드 전용이면 SW에서 직접 `renderToString`으로 HTML 생성 후 downloads API로 저장 (엔트리포인트 불필요).
- M8 구현 시 결정.

## 포트 의존

- `ScreenshotReader` (M3 소유)를 주입받아 base64 인코딩

## 책임

`ValidationReport`를 React로 렌더. 두 모드:

1. **뷰어 모드**: 새 탭에서 `report.html` 열고 `wxt/storage` `local:reportData`에서 데이터 읽어 React 마운트
2. **다운로드 모드**: `renderToString`으로 정적 HTML 문자열 생성 → `<style>` 태그 인라인 + 스크린샷 base64 인라인 → 단일 `.html` 파일 다운로드

## 구현 규약

- 렌더링 컴포넌트는 **순수** — props(`ValidationReport` + `screenshotDataUrls: Map<string, string>`)만으로 동작
- `browser.tabs.create`/`browser.downloads.download`는 얇은 어댑터(`download-report.ts`)에만
- vanilla-extract 스타일은 빌드 시 static CSS로 추출 → `renderToString` 결과에 인라인 주입
- 차트는 SVG React 컴포넌트 (`timeline-chart.tsx`)

## 공개 API

```typescript
export async function openReportInNewTab(report: ValidationReport): Promise<void>;
export async function downloadReportAsHtml(
  report: ValidationReport,
  reader: ScreenshotReader,
): Promise<void>;
```

## 요구사항

### 렌더 대상

- 섹션 1: 헤더 (생성 시각, 녹화 시간 범위, 대상 이벤트 수, 총 수집 수)
- 섹션 2: 요약 대시보드 (pass/fail/not_collected/suspect_duplicate 카운트, 이슈 severity 카운트)
- 섹션 3: 검증 결과 테이블
  - 이벤트별 row, 상태 뱃지
  - 클릭 시 확장: issue 상세, 수집된 params 실제값, 스크린샷 썸네일
- 섹션 4: 타임라인 차트
  - X축: 시간, Y축: 이벤트 발생
  - 500ms 이내 중복 구간 하이라이트
  - 클릭 시 해당 스크린샷 라이트박스
- 섹션 5: 스크린샷 갤러리 (시간순)
- 섹션 6: 예외 이벤트 리스트 (`unexpected`)

### 기술

- 순수 HTML + 인라인 CSS + 인라인 JS (외부 의존 없음)
- 스크린샷은 **IndexedDB에서 읽어 base64 data URL로 인라인**
- 타임라인 차트는 SVG 수동 렌더 (리포트 ~15MB 허용)

### 모드

- `mode=open`: 새 탭에서 `wxt/storage` `local:reportData` 읽어 렌더
- `mode=download`: data URL 자체완결 HTML 파일 생성 후 `browser.downloads.download`

## 수용 기준

- [ ] 50건 이벤트, 30장 스크린샷 리포트가 3초 내 렌더
- [ ] 다운로드한 HTML을 다른 PC에서 열어도 스크린샷 보임
- [ ] 타임라인 클릭 → 해당 이벤트 상세로 스크롤 + 스크린샷 라이트박스
- [ ] 접근성: 색각이상자를 위한 텍스트 라벨 병기

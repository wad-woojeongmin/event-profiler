# M8 — Report Generator

**파일**:
- `report/*` — 로직 (포트·순수 어셈블·SW 어셈블러·wxt/storage 리더)
- (뷰어 모드 선택 시) `entrypoints/report/index.html` + `main.tsx` — WXT 진입점 (Phase 2)

**스택**: React 19 + vanilla-extract (Jotai 미사용 — 읽기 전용 뷰) — *Phase 1은 어셈블·저장만. 렌더 UI는 M4 뷰어가 담당.*

**필독**: [02-contracts §ValidationReport](../02-contracts.md#typesvalidationts-m7-담당), [02-contracts §공용 스토리지 키](../02-contracts.md#공용-스토리지-키), M3 `ScreenshotReader` 포트

## 실행 모드

- **Phase 1 (현재)**: 뷰어 전용. `generateReport` 핸들러는 `ValidationReport`를 어셈블하여 `local:reportData`에 write만 수행하고, 팝업(M4)이 이를 read해 렌더한다. `permissions: "downloads"` 미선언.
- **Phase 2**: 다운로드 HTML 생성 재검토. downloads API 권한 추가 및 `renderToString` 경로는 그때 구현.

## 포트/의존

- **M3** `ScreenshotReader` — IndexedDB에서 스크린샷 Blob 로드 (base64 인라인 준비)
- **M5** `local:specsCache` — **read-only 직접 read**. 공용 스토리지 키(02-contracts §공용 스토리지 키)이므로 스키마는 `types/storage.ts`의 `SpecsCachePayload`를 재사용. M8은 새 `defineItem` 인스턴스를 **read-only로만** 선언.
- **M7** `validate` + `defaultRules` — 스펙·수집 이벤트 비교 수행
- **M3** `RecordingSessionController.listCurrentEvents` — 현재 세션의 이벤트 목록 획득

## 책임

### Phase 1 (현재 스코프)

- **어셈블**: 순수 함수 `assemble(events, specs, screenshots, rules)` → `ReportData`
- **SW 어셈블러**: `local:specsCache` read → `controller.listCurrentEvents()` → `ScreenshotReader.load()` 병렬 수집 → `validate()` → `local:reportData` write
- **렌더**: M4 popup이 `local:reportData`를 구독하여 Jotai 아톰 기반 뷰어로 렌더 (M8은 write까지만)

### Phase 2

1. **뷰어 모드**: 새 탭에서 `report.html` 열고 `wxt/storage` `local:reportData`에서 데이터 읽어 React 마운트
2. **다운로드 모드**: `renderToString`으로 정적 HTML 문자열 생성 → `<style>` 태그 인라인 + 스크린샷 base64 인라인 → 단일 `.html` 파일 다운로드

## 구현 규약

### Phase 1

- `generateReport` 핸들러는 `entrypoints/background.ts` 내부에서 SW 어셈블러 호출
- 순수 어셈블(`report/assemble.ts`)은 I/O·`browser.*`·`wxt/storage` 접근 금지 — 주입된 값만으로 동작
- specsCache 리더는 `report/adapters/wxt-specs-cache-reader.ts`에서 `storage.defineItem<SpecsCachePayload>("local:specsCache", { fallback: null })`로 read-only 선언. 소유자(M3 SettingsStore)와 스키마 드리프트 방지를 위해 `types/storage.ts`의 `SpecsCachePayload`·`SPECS_CACHE_KEY`를 재사용.
- reportData writer는 `report/adapters/wxt-report-writer.ts`에서 `local:reportData`로 write-only 선언
- 런타임 API 호출은 `entrypoints/background.ts` main 콜백 안에서만

### Phase 2 (예정)

- 렌더링 컴포넌트는 **순수** — props(`ValidationReport` + `screenshotDataUrls: Map<string, string>`)만으로 동작
- `browser.tabs.create`/`browser.downloads.download`는 얇은 어댑터(`download-report.ts`)에만
- vanilla-extract 스타일은 빌드 시 static CSS로 추출 → `renderToString` 결과에 인라인 주입
- 차트는 SVG React 컴포넌트 (`timeline-chart.tsx`)

## 공개 API

### Phase 1

```typescript
// report/index.ts
export { createReportAssembler } from "./report-assembler.ts";
export type { ReportAssembler, ReportAssemblerDeps } from "./report-assembler.ts";
export { assemble } from "./assemble.ts";
export type { SpecsCacheReader } from "./ports/specs-cache-reader.ts";
export type { ReportWriter } from "./ports/report-writer.ts";
```

### Phase 2 (예정)

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

### Phase 1

- [x] `generateReport` 핸들러가 specs(`local:specsCache`) + 세션 이벤트 + 스크린샷 + `validate()`로 `ValidationReport`를 어셈블하여 `local:reportData`에 write
- [x] 순수 `assemble` 함수에 대한 단위 테스트 (I/O 없이 값 비교)
- [x] SW 핸들러 통합 테스트 (`fakeBrowser.reset()` + in-memory ScreenshotReader mock)
- [x] `local:specsCache`가 비어있으면 `ReportData` 없이 명확한 에러(또는 no-op)로 귀환

### Phase 2

- [ ] 50건 이벤트, 30장 스크린샷 리포트가 3초 내 렌더
- [ ] 다운로드한 HTML을 다른 PC에서 열어도 스크린샷 보임
- [ ] 타임라인 클릭 → 해당 이벤트 상세로 스크롤 + 스크린샷 라이트박스
- [ ] 접근성: 색각이상자를 위한 텍스트 라벨 병기

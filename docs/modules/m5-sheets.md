# M5 — Google Sheets 연동

**파일**: `sheets/ports/sheets-source.ts`, `sheets/adapters/google-sheets-source.ts`, `sheets/constants.ts`

**필독**: [02-contracts §타입 계약](../02-contracts.md#타입-계약), [05-sheet-spec](../05-sheet-spec.md), M6 참고

## 고정 시트 상수

```typescript
// sheets/constants.ts
export const SPEC_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1UO5ySnU48lLS0VF-a8O1WRlKnKGEWi_8NUms4w24Al8";
export const SPEC_SPREADSHEET_ID = "1UO5ySnU48lLS0VF-a8O1WRlKnKGEWi_8NUms4w24Al8";
```

이 프로젝트는 **단일 이벤트 스펙 시트**만 사용한다. URL을 UI에서 입력받지 않으며, fixture·문서·테스트도 이 상수를 참조한다. 새로운 placeholder URL 생성 금지.

## 포트 정의 (다른 모듈이 의존하는 공개 계약)

```typescript
// ports/sheets-source.ts
export interface SheetTab {
  title: string;
  gid: number;
}

export interface SheetsSource {
  /** 고정 시트의 탭 목록. 인증 만료 시 내부에서 재인증 처리. */
  listTabs(): Promise<SheetTab[]>;
  /** Sheets API `spreadsheets.values.get`의 `values`(string[][])를 그대로 반환.
   *  M6 `parseSpecRows`에 직결 — CSV 직렬화/역직렬화 왕복을 피한다. */
  fetchRows(sheetTitle: string): Promise<string[][]>;
  /** 명시적 인증 흐름이 필요한 UI용 */
  authenticate(): Promise<void>;
  signOut(): Promise<void>;
}
```

**구현 격리**: `google-sheets-source.ts`는 `browser.identity`(from `wxt/browser`), `fetch`, Sheets API v4 엔드포인트를 **내부에만** 사용하고 `SPEC_SPREADSHEET_ID` 상수를 참조. 다른 모듈은 `SheetsSource` 타입만 import.

대체 어댑터 후보 (향후 기술 전환 대비):

- `file-upload-source.ts` — 사용자가 CSV 파일 직접 업로드
- `clipboard-source.ts` — 클립보드에서 TSV 붙여넣기

## 책임

- Google OAuth 2.0 (`browser.identity` 사용, `wxt/browser` 경유)
- Sheets API로 시트 본문 다운로드
- 시트 전체 또는 특정 탭의 값을 CSV string으로 변환 → M6의 `parseSpecCsv()`에 그대로 투입 가능한 포맷

## 요구사항

1. **인증**
   - `browser.identity.getAuthToken`으로 access token 획득
   - 스코프: `https://www.googleapis.com/auth/spreadsheets.readonly`
   - 데이터 호출(`listTabs`/`fetchRows`)은 먼저 `interactive=false`(silent)로 시도하여 불필요한 OAuth 팝업을 피하고, silent 실패 시에만 `interactive=true`로 승급
   - 401/403 응답 시 `browser.identity.removeCachedAuthToken` → `interactive=true` 재발급 → 1회 재시도 (재시도 결과가 또 401/403이면 에러 전파, 무한 루프 방지)
2. **시트 조회**
   - `spreadsheets.get`으로 `SPEC_SPREADSHEET_ID`의 탭 목록 획득
   - UI에서 사용자가 탭 선택 → 해당 탭의 A1:ZZ 범위를 `spreadsheets.values.get`으로 다운로드
   - `values: string[][]`를 그대로 반환. CSV 직렬화하지 않음 (M6 `parseSpecRows`가 rows를 직접 받음)
3. **캐시**
   - 파싱된 `EventSpec[]`의 `local:specsCache`(02-contracts) 기록은 **소비자(M3/팝업) 책임**. M5는 파서에 의존하지 않도록 캐싱을 수행하지 않는다. (M5 내부 rows 캐시가 필요해지면 read API를 포함해 별도 PR에서 도입)
4. **에러 처리**
   - 401/403: 위 §인증 경로로 자동 복구
   - 404: 상수의 `SPEC_SPREADSHEET_ID`가 잘못되었거나 사용자의 시트 접근 권한 부족 — 시트 공유 설정 안내
   - 429 (rate limit): 고정 1초 백오프 후 1회 재시도

## 공개 API

```typescript
// sheets/index.ts — 기본 어댑터 인스턴스 기반 편의 함수
export async function authenticate(): Promise<void>;
export async function signOut(): Promise<void>;
export async function listSheetTabs(): Promise<SheetTab[]>;
export async function fetchSheetRows(sheetTitle: string): Promise<string[][]>;
```

`authenticate`는 UI "로그인" 버튼 등에서 호출되는 명시적(interactive) 플로우다. 토큰 값은 포트·어댑터 밖으로 노출하지 않는다(공개 API 무누출 원칙).

## 수용 기준

- [ ] 최초 실행 시 Google 로그인 창이 뜨고, 이후 재발급은 silent (데이터 호출은 `interactive=false` 선행)
- [ ] 다운로드된 rows가 `parseSpecRows()`에 통과
- [ ] 401/403 시 자동 재인증 한 번, 429 시 고정 백오프 한 번 — 각각 단일 분기 재시도
- [ ] 유닛 테스트: rows 페치 후 `parseSpecRows`와 조립하여 EventSpec 추출

## 유의점

- Chrome Web Store 배포 시 익스텐션 ID 고정 필요 → `wxt.config.ts`의 `manifest.key`에 public key를 명시하여 로컬/배포 ID 일치
- Google Cloud Console에서 **Chrome Extension 타입 OAuth 클라이언트** 발급 필요

// 단일 스펙 시트를 고정 사용한다. URL은 UI에서 입력받지 않으며
// fixture·문서·테스트도 모두 이 상수를 참조한다.

/** 이벤트 스펙 Google Sheet URL. */
export const SPEC_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1UO5ySnU48lLS0VF-a8O1WRlKnKGEWi_8NUms4w24Al8";

/** Sheets API 호출에 사용하는 spreadsheetId. */
export const SPEC_SPREADSHEET_ID =
  "1UO5ySnU48lLS0VF-a8O1WRlKnKGEWi_8NUms4w24Al8";

/**
 * 로그 정의가 담긴 탭의 제목 패턴.
 *
 * 시트에는 컨벤션·가이드·요약 탭이 섞여 있고, 실제 EventSpec을 추출 가능한 탭은
 * 도메인별로 분리되어 있다(예: "03. 메인_신규로그설계", "22.전환이 필요한 로그_신규로그설계").
 * 접두 번호(점 뒤 공백 선택), "신규"와 "로그설계" 사이 공백 변형
 * ("신규 로그설계")까지 허용하도록 느슨하게 매칭한다.
 */
export const LOG_DEFINITION_TAB_PATTERN = /^\d+\.\s*.*신규\s*로그\s*설계/;

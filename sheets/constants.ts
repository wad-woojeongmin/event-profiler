// 이 프로젝트는 단일 이벤트 스펙 시트만 사용한다. URL을 UI에서 입력받지
// 않으며, fixture·문서·테스트 예시도 모두 이 상수를 참조한다.

/** 이벤트 스펙 Google Sheet URL */
export const SPEC_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1UO5ySnU48lLS0VF-a8O1WRlKnKGEWi_8NUms4w24Al8";

/** 위 URL에서 추출한 spreadsheetId (Sheets API 호출에 사용) */
export const SPEC_SPREADSHEET_ID =
  "1UO5ySnU48lLS0VF-a8O1WRlKnKGEWi_8NUms4w24Al8";

// 시트 소스 포트. Google Sheets 외에 CSV 업로드·클립보드 등 다른
// 어댑터로도 교체할 수 있도록 추상화한 인터페이스다. 구체 구현(브라우저
// 확장 API, fetch, OAuth 토큰)은 이 포트 외부에 절대 노출되지 않는다.

/** 고정 스펙 시트의 탭 메타데이터. gid는 Sheets API의 `sheetId`. */
export interface SheetTab {
  /** 사람이 보는 탭 이름 (예: "main", "search") */
  title: string;
  /** Sheets API가 돌려주는 내부 sheetId(gid) */
  gid: number;
}

/**
 * 스펙 시트의 탭 목록/본문을 읽어오는 포트.
 *
 * - URL/spreadsheetId는 어댑터 내부에서 `SPEC_SPREADSHEET_ID` 상수를 통해
 *   고정되므로 호출자는 시트 식별자를 몰라도 된다.
 * - 인증 만료(401/403)는 어댑터가 내부에서 한 번 재발급하여 재시도한다.
 */
export interface SheetsSource {
  /** 고정 시트의 탭 목록을 돌려준다. */
  listTabs(): Promise<SheetTab[]>;
  /**
   * 지정한 탭의 A1:ZZ 범위 값(`string[][]`)을 그대로 돌려준다.
   *
   * M6 `parseSpecRows`에 직접 투입할 수 있도록 CSV 직렬화/역직렬화 왕복을
   * 피한다. 네트워크·캐시·재인증은 모두 어댑터 책임이다.
   */
  fetchRows(sheetTitle: string): Promise<string[][]>;
  /** UI에서 "로그인" 버튼 등으로 명시적 인증을 트리거할 때 호출한다. */
  authenticate(): Promise<void>;
  /** 캐시된 모든 Google 토큰을 제거한다. */
  signOut(): Promise<void>;
}

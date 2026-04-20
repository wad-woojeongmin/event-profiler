// 시트 소스 포트. CSV 업로드·클립보드 등 대체 어댑터로 교체 가능하도록
// 추상화한다. 확장 API·fetch·OAuth 토큰 등 구체 구현은 이 포트 밖으로
// 노출하지 않는다.

/** 스펙 시트 탭 메타데이터. `gid`는 Sheets API의 `sheetId`. */
export interface SheetTab {
  /** 탭 표시 이름 (예: "main", "search"). */
  title: string;
  /** Sheets API의 내부 sheetId. */
  gid: number;
}

/**
 * 스펙 시트의 탭 목록/본문을 읽어오는 포트.
 *
 * - spreadsheetId는 어댑터가 `SPEC_SPREADSHEET_ID`로 고정하므로 호출자는 몰라도 된다.
 * - 인증 만료(401/403)·429 레이트 리밋은 어댑터가 1회 재시도로 흡수한다.
 */
export interface SheetsSource {
  /** 탭 목록을 반환한다. */
  listTabs(): Promise<SheetTab[]>;
  /**
   * 지정 탭의 A1:ZZ 값을 `string[][]` 그대로 반환한다.
   * `parseSpecRows`에 직접 투입 가능하며 CSV 직렬화 왕복을 피한다.
   * 네트워크·재인증은 어댑터 책임이다.
   */
  fetchRows(sheetTitle: string): Promise<string[][]>;
  /** 명시적 인증 트리거 (항상 interactive). */
  authenticate(): Promise<void>;
  /** 캐시된 모든 Google 토큰을 제거한다. */
  signOut(): Promise<void>;
}

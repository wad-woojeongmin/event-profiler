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
 * - 401/403은 재인증, 429는 백오프로 각각 1회 재시도한다 (어댑터 책임).
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
  /**
   * 캐시된 유효 토큰이 있는지 silent로 확인한다. UI가 팝업 재오픈 시
   * 로그인 상태를 복구할 때 사용한다. `interactive=false` 조회이므로
   * 사용자 상호작용(OAuth 창) 없이 끝나지만, 토큰 유효성 확인을 위해
   * Google 서버에 요청이 나갈 수 있다.
   */
  hasCachedToken(): Promise<boolean>;
}

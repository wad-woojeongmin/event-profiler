// content script가 자신의 tabId를 알아내기 위한 포트.
//
// content script에는 `browser.tabs.getCurrent()`가 없어 background에 역질의해야
// 하며, 어댑터는 이를 메시징으로 구현. 결과는 탭 생명주기 동안 고정이므로
// 캐싱은 어댑터 내부 책임이다.

export interface TabIdResolver {
  /**
   * 현재 content script가 속한 탭의 id.
   *
   * @returns 탭에서 호출된 경우 탭 id. devtools 등 탭이 없는 컨텍스트나
   *   background 조회 실패 시 -1.
   */
  get(): Promise<number>;
}

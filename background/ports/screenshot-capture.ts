// 현재 탭 썸네일 캡처 포트.
//
// `browser.tabs.captureVisibleTab`·`createImageBitmap`·`OffscreenCanvas` 등
// 런타임 의존은 어댑터에 숨기고, 도메인은 "탭 id를 주면 JPEG Blob을
// 얻거나 null" 이라는 최소 계약만 본다.

export interface ScreenshotCapture {
  /**
   * 지정 탭의 화면을 JPEG Blob으로 반환.
   *
   * - 실패(탭 비활성·권한 부족·레이트 리밋) 시 null. 호출자가 이전 screenshotId
   *   재사용을 결정한다.
   * - 리사이즈·품질 조정은 어댑터 책임.
   */
  capture(tabId: number): Promise<Blob | null>;
}

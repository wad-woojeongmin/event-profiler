// 현재 탭 썸네일 캡처 포트.
//
// `captureVisibleTab`·`OffscreenCanvas` 등 런타임 의존은 어댑터에 숨긴다.

export interface ScreenshotCapture {
  /**
   * 지정 탭의 뷰포트를 JPEG Blob으로 캡처.
   *
   * 실패를 예외가 아닌 `null`로 반환하는 것이 계약이다 — 초당 2회 레이트 리밋·
   * 권한 거부·탭 소실 모두 호출자(스케줄러)가 "이전 id 재사용" 결정을 내릴 수
   * 있어야 하기 때문. 리사이즈·품질 조정은 어댑터 내부 책임.
   * @returns 성공 Blob, 실패 null.
   */
  capture(tabId: number): Promise<Blob | null>;
}

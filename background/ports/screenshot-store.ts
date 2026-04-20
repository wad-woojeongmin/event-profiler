// 스크린샷 Blob 저장소 포트.
//
// 이벤트 스토어와 같은 생애주기를 공유하지만 M8 리포트는 읽기만 하므로
// Writer/Reader를 분리한다(ISP).

export interface ScreenshotWriter {
  /** `id` 키로 Blob 저장. 동일 id 재호출은 덮어쓰기(멱등). */
  save(id: string, image: Blob): Promise<void>;
  /** store 전체 삭제. 세션 경계에서 `clearSession()`이 호출. */
  clear(): Promise<void>;
}

export interface ScreenshotReader {
  /**
   * 스크린샷을 로드한다. M8이 base64 인라인 HTML로 임베드할 때 사용.
   * @returns id에 해당하는 Blob, 없으면 null.
   */
  load(id: string): Promise<Blob | null>;
}

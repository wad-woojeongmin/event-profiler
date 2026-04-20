// 스크린샷 Blob 저장소 포트.
//
// 이벤트 스토어와 같은 생애주기를 공유하지만, 타 모듈(M8 report)이 읽기
// 전용으로 접근하므로 Writer/Reader를 분리한다.

export interface ScreenshotWriter {
  /** id 키로 Blob을 저장. 이미 있으면 overwrite. */
  save(id: string, image: Blob): Promise<void>;
  /** 세션 경계에서 호출. 전체 store를 비운다. */
  clear(): Promise<void>;
}

export interface ScreenshotReader {
  /** 없으면 null. 리포트 생성 시 base64 인라인용으로 사용. */
  load(id: string): Promise<Blob | null>;
}

// Blob → base64 data URL 변환 유틸.
//
// MV3 Service Worker는 `FileReader`가 미지원. `Blob.arrayBuffer()` +
// `btoa(String.fromCharCode(...))` 루프로 변환한다. 큰 스크린샷(수백 KB)도
// 스택 오버플로 없이 안전하도록 청크 단위로 인코딩.

/**
 * `Blob`을 `data:<mime>;base64,<...>` 문자열로 변환한다.
 *
 * - SW 환경에서 FileReader 미지원 이슈를 우회하기 위해 ArrayBuffer 경유.
 * - mime이 비어있으면 `image/jpeg`로 폴백(스크린샷 기본 포맷).
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    // `String.fromCharCode`는 spread 인자가 많을 때 스택을 터뜨릴 수 있어 청크 분할.
    binary += String.fromCharCode(...slice);
  }
  const mime = blob.type || "image/jpeg";
  return `data:${mime};base64,${btoa(binary)}`;
}

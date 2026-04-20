// blob-to-data-url 단위 테스트.
//
// SW 환경(FileReader 미지원) 회피 경로를 보장하기 위해 바이트 비교 가능한
// 고정 입력으로 확인한다.

import { describe, expect, it } from "vitest";

import { blobToDataUrl } from "./blob-to-data-url.ts";

describe("blobToDataUrl", () => {
  it("JPEG mime + 바이트를 base64로 인코딩한다", async () => {
    const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], {
      type: "image/jpeg",
    });
    const url = await blobToDataUrl(blob);
    expect(url).toBe(`data:image/jpeg;base64,${btoa("\xff\xd8\xff")}`);
  });

  it("mime이 비어있으면 image/jpeg로 폴백", async () => {
    const blob = new Blob([new Uint8Array([0x41])], { type: "" });
    const url = await blobToDataUrl(blob);
    expect(url.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  it("32KB 이상 청크 분할 경로도 안전", async () => {
    const bytes = new Uint8Array(0x8000 + 10).fill(0x42);
    const blob = new Blob([bytes], { type: "image/jpeg" });
    const url = await blobToDataUrl(blob);
    expect(url.startsWith("data:image/jpeg;base64,")).toBe(true);
    // base64 길이는 ceil(n/3)*4. 스모크 체크로만 사용.
    expect(url.length).toBeGreaterThan(bytes.length);
  });
});

// `browser.tabs.captureVisibleTab` 기반 ScreenshotCapture 어댑터.
//
// `captureVisibleTab`은 Chrome에서 초당 2회 레이트 리밋이 있다. 디바운스는
// 스케줄러에서 이미 적용하지만, 리밋/권한 에러가 발생해도 캡처는 조용히
// 실패하고 null을 돌려 호출자가 이전 screenshotId를 재사용하도록 한다.

import { browser } from "wxt/browser";

import type { ScreenshotCapture } from "../ports/screenshot-capture.ts";

/** 썸네일 최대 가로 폭(px). */
export const MAX_THUMBNAIL_WIDTH = 480;
/** JPEG 품질(0~1). */
export const THUMBNAIL_QUALITY = 0.6;

export function createTabScreenshotCapture(): ScreenshotCapture {
  return {
    async capture(tabId) {
      try {
        const tab = await browser.tabs.get(tabId);
        if (typeof tab.windowId !== "number") return null;
        const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, {
          format: "jpeg",
          quality: 60,
        });
        if (!dataUrl) return null;
        const source = dataUrlToBlob(dataUrl);
        return await resizeJpeg(source);
      } catch {
        // 레이트 리밋·권한·탭 소실 모두 동일하게 처리 — 호출자가 이전 id 재사용.
        return null;
      }
    },
  };
}

/** `data:image/jpeg;base64,...` → Blob. SW/MV3에서도 동기 동작. */
function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("invalid data URL");
  const header = dataUrl.slice(5, comma); // "image/jpeg;base64"
  const mime = header.split(";")[0] || "image/jpeg";
  const base64 = dataUrl.slice(comma + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** OffscreenCanvas + createImageBitmap으로 가로 MAX_THUMBNAIL_WIDTH 이내 JPEG 변환. */
async function resizeJpeg(source: Blob): Promise<Blob | null> {
  const bitmap = await createImageBitmap(source);
  try {
    const scale = Math.min(1, MAX_THUMBNAIL_WIDTH / bitmap.width);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    return await canvas.convertToBlob({
      type: "image/jpeg",
      quality: THUMBNAIL_QUALITY,
    });
  } finally {
    bitmap.close();
  }
}

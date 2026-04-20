// `browser.tabs.captureVisibleTab` 기반 ScreenshotCapture 어댑터.
//
// 레이트 리밋(초당 ~2회)·권한 오류·탭 소실은 모두 `null` 반환으로 수렴. 호출자
// (스크린샷 스케줄러)가 이전 id 재사용을 결정한다. 디바운스는 스케줄러 책임.

import { browser } from "wxt/browser";

import type { ScreenshotCapture } from "../ports/screenshot-capture.ts";

/** 썸네일 최대 가로 폭(px). 세로는 비율 유지. */
export const MAX_THUMBNAIL_WIDTH = 480;
/** JPEG 품질(0~1). 리포트 임베드 용량과 가독성의 절충값. */
export const THUMBNAIL_QUALITY = 0.6;

export function createTabScreenshotCapture(): ScreenshotCapture {
  return {
    async capture(tabId) {
      try {
        const tab = await browser.tabs.get(tabId);
        // `windowId` 없음 = 팝아웃·탭 그룹 이동 등으로 소실. 캡처 불가.
        if (typeof tab.windowId !== "number") return null;
        // `captureVisibleTab`은 지정 윈도우의 "현재 활성 탭"을 찍는다. 대상 탭이
        // 백그라운드면 엉뚱한 페이지가 저장되므로 호출 자체를 스킵한다.
        if (!tab.active) return null;
        const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, {
          format: "jpeg",
          quality: 60,
        });
        if (!dataUrl) return null;
        const source = dataUrlToBlob(dataUrl);
        return await resizeJpeg(source);
      } catch {
        // 레이트 리밋·권한·탭 소실을 구분하지 않는다(호출자 처리가 동일).
        return null;
      }
    },
  };
}

/** `data:image/jpeg;base64,...` 문자열을 Blob으로 변환(SW에서 `fetch(dataUrl)` 대신 수동 디코드). */
function dataUrlToBlob(dataUrl: string): Blob {
  if (!dataUrl.startsWith("data:")) throw new Error("invalid data URL");
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

/**
 * `createImageBitmap` + OffscreenCanvas로 가로 `MAX_THUMBNAIL_WIDTH` 이내로 축소.
 * @returns 변환 성공 시 JPEG Blob, canvas 컨텍스트를 못 얻으면 null.
 */
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

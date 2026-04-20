// TabScreenshotCapture 어댑터 테스트.
//
// fakeBrowser는 `tabs.create`/`tabs.get`까지는 폴리필하지만 `captureVisibleTab`은
// 지원 안 한다. 따라서 "captureVisibleTab에 도달하기 전에 null로 끝나는 분기"
// (탭 소실·백그라운드 탭)만 어댑터로 검증한다. 실제 캡처 경로는 수동 QA에 맡김.

import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing";

import { createTabScreenshotCapture } from "./tab-screenshot-capture.ts";

describe("createTabScreenshotCapture", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("대상 탭이 비활성이면 null을 반환(엉뚱한 탭 캡처 방지)", async () => {
    // 두 개의 탭을 만들어 한 쪽이 반드시 비활성이 되게 한다(fakeBrowser는
    // 마지막으로 `active: true`로 만들어진 탭을 활성으로 유지).
    const first = await fakeBrowser.tabs.create({
      url: "https://example.com/first",
      active: true,
    });
    await fakeBrowser.tabs.create({
      url: "https://example.com/second",
      active: true,
    });
    const refreshed = await fakeBrowser.tabs.get(first.id!);
    expect(refreshed.active).toBe(false);

    const capture = createTabScreenshotCapture();
    const result = await capture.capture(first.id!);
    expect(result).toBeNull();
  });

  it("존재하지 않는 tabId는 예외를 삼키고 null", async () => {
    const capture = createTabScreenshotCapture();
    const result = await capture.capture(99_999);
    expect(result).toBeNull();
  });
});

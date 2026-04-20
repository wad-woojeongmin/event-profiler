// 스크린샷 캡처 디바운스 스케줄러.
//
// `captureVisibleTab`은 Chrome에서 초당 2회 정도의 레이트 리밋이 있어, 짧은
// 간격의 이벤트가 연속해서 발생하면 캡처 자체를 건너뛰고 직전 스크린샷 id를
// 재사용해야 한다. 이 유틸은 그 결정 로직을 순수 함수 형태로 분리하여
// IndexedDB·browser API 없이도 단위 테스트가 가능하게 한다.

import type { ScreenshotCapture } from "./ports/screenshot-capture.ts";
import type { ScreenshotWriter } from "./ports/screenshot-store.ts";

/** 디바운스 창(ms). 요구사항 §스크린샷 참고. */
export const SCREENSHOT_DEBOUNCE_MS = 500;

export interface ScreenshotSchedulerDeps {
  capture: ScreenshotCapture;
  writer: ScreenshotWriter;
  /** 저장 키 생성기. 기본은 `crypto.randomUUID`. */
  uuid?: () => string;
  /** 디바운스 창을 테스트에서 조정하고 싶을 때 override. */
  debounceMs?: number;
}

export interface ScreenshotScheduler {
  /**
   * 현재 이벤트에 할당할 screenshotId를 반환한다.
   *
   * - 마지막 캡처로부터 debounceMs 이내면 실제 캡처를 생략하고 이전 id 반환.
   *   (최초 호출이거나 이전 id가 없으면 debounce를 무시하고 새로 시도)
   * - 캡처가 실패(null)하면 이전 id 그대로 재사용. 최초부터 실패한 경우
   *   `undefined`를 반환하여 이벤트 자체는 저장되지만 스크린샷 없이 남는다.
   */
  scheduleFor(tabId: number, now: number): Promise<string | undefined>;
  /** 세션 경계에서 상태 초기화. */
  reset(): void;
}

export function createScreenshotScheduler(
  deps: ScreenshotSchedulerDeps,
): ScreenshotScheduler {
  const debounceMs = deps.debounceMs ?? SCREENSHOT_DEBOUNCE_MS;
  const uuid = deps.uuid ?? (() => crypto.randomUUID());

  let lastCaptureAt = Number.NEGATIVE_INFINITY;
  let lastId: string | undefined;

  return {
    async scheduleFor(tabId, now) {
      if (lastId !== undefined && now - lastCaptureAt < debounceMs) {
        return lastId;
      }
      const blob = await deps.capture.capture(tabId);
      if (!blob) return lastId;
      const id = uuid();
      await deps.writer.save(id, blob);
      lastCaptureAt = now;
      lastId = id;
      return id;
    },
    reset() {
      lastCaptureAt = Number.NEGATIVE_INFINITY;
      lastId = undefined;
    },
  };
}

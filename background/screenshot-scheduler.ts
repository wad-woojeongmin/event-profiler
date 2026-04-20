// 스크린샷 캡처 디바운스 스케줄러(순수 로직).
//
// `captureVisibleTab`은 Chrome에서 초당 ~2회 레이트 리밋을 가지므로 연속 이벤트는
// 캡처를 건너뛰고 직전 screenshotId를 재사용해야 한다. 결정 로직을 포트 뒤로
// 분리해 browser API 없이 단위 테스트가 가능하다.

import type { ScreenshotCapture } from "./ports/screenshot-capture.ts";
import type { ScreenshotWriter } from "./ports/screenshot-store.ts";

/** 디바운스 창(ms). 요구사항 §스크린샷 참고. */
export const SCREENSHOT_DEBOUNCE_MS = 500;

export interface ScreenshotSchedulerDeps {
  capture: ScreenshotCapture;
  writer: ScreenshotWriter;
  /** 저장 키 생성기. 기본 `crypto.randomUUID`. */
  uuid?: () => string;
  /** 디바운스 창 override. 테스트 전용. */
  debounceMs?: number;
}

export interface ScreenshotScheduler {
  /**
   * 이벤트에 부여할 `screenshotId`를 계산한다.
   *
   * 동작 규칙:
   * - 이전 id가 있고 `now - lastCaptureAt < debounceMs`면 캡처를 건너뛰고
   *   이전 id 반환(저장 1회, 참조 N회).
   * - 캡처가 `null`을 돌려주면 이전 id 그대로 재사용. 최초 시도부터 실패하면
   *   `undefined`를 반환 — 이벤트는 저장되지만 스크린샷 링크는 없다.
   * - 성공 시 `uuid()`로 새 id를 발급하고 Writer에 저장한 뒤 반환.
   */
  scheduleFor(tabId: number, now: number): Promise<string | undefined>;
  /** 내부 상태(`lastCaptureAt`, `lastId`) 초기화. 세션 경계에서 호출. */
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

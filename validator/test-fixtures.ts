import type { CapturedEvent, RecordingSession } from "../types/event.ts";
import type { EventSpec } from "../types/spec.ts";

/**
 * 테스트용 빌더. 각 테스트가 관심 있는 필드만 override하여 사용한다.
 * 프로덕션 코드에서는 import하지 말 것.
 */

export function makeSpec(overrides: Partial<EventSpec> = {}): EventSpec {
  return {
    amplitudeEventName: "shop_banner_click",
    humanEventName: "click__banner",
    pageName: "shopDetail",
    sectionName: undefined,
    actionName: undefined,
    eventType: "click",
    logType: "event",
    params: [],
    referencedExtensions: [],
    rawExtension: "",
    status: "to-do",
    sourceRow: 1,
    sourceSheet: undefined,
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<CapturedEvent> = {}): CapturedEvent {
  return {
    id: "evt-1",
    provider: "amplitude",
    eventName: "shop_banner_click",
    params: {},
    timestamp: 1_700_000_000_000,
    pageUrl: "https://example.com",
    pageTitle: "",
    tabId: 1,
    screenshotId: undefined,
    ...overrides,
  };
}

export function makeSession(
  overrides: Partial<RecordingSession> = {},
): RecordingSession {
  return {
    id: "session-1",
    startedAt: 1_700_000_000_000,
    endedAt: 1_700_000_010_000,
    tabId: 1,
    targetEventNames: [],
    capturedCount: 0,
    ...overrides,
  };
}

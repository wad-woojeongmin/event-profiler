// M3 공개 API.
//
// 다른 모듈(popup·report)이 이 파일을 통해서만 접근. IndexedDB·wxt/storage·
// browser API 등 내부 구현은 노출되지 않는다.

export type {
  EventReader,
  EventWriter,
} from "./ports/event-store.ts";
export type {
  ScreenshotReader,
  ScreenshotWriter,
} from "./ports/screenshot-store.ts";
export type { ScreenshotCapture } from "./ports/screenshot-capture.ts";
export type { SessionStore } from "./ports/session-store.ts";
export {
  DEFAULT_SETTINGS,
  type Settings,
  type SettingsStore,
} from "./ports/settings-store.ts";
export {
  createRecordingSession,
  type RecordingSessionController,
  type RecordingSessionDeps,
} from "./recording-session.ts";
export {
  createScreenshotScheduler,
  SCREENSHOT_DEBOUNCE_MS,
  type ScreenshotScheduler,
  type ScreenshotSchedulerDeps,
} from "./screenshot-scheduler.ts";
export { createIdbEventStore } from "./adapters/idb-event-store.ts";
export { createIdbScreenshotStore } from "./adapters/idb-screenshot-store.ts";
export { createTabScreenshotCapture } from "./adapters/tab-screenshot-capture.ts";
export { createWxtSessionStore } from "./adapters/wxt-session-store.ts";
export { createWxtSettingsStore } from "./adapters/wxt-settings-store.ts";

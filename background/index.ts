// M3 공개 API — 포트 타입과 순수 팩토리만 노출.
//
// 어댑터 팩토리(`createIdb*`, `createWxt*`, `createTab*`)는 엔트리포인트 조립에서만
// 쓰이므로 여기서 re-export하지 않는다. 타 모듈(M4 popup, M8 report)은 메시지로
// 상호작용하며, 만약 타입이 필요하면 포트만 import 한다(DIP).

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

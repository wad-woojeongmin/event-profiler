// Background Service Worker 조립 진입점.
//
// `defineBackground`의 콜백 안에서만 런타임 API를 호출한다(top-level에서
// browser.*를 건드리면 WXT 빌드 단계에서 NodeJS 평가 중 터진다).
// 비즈니스 로직은 `background/` 모듈에 있고 여기서는 포트 조립 + 메시지
// 라우팅 + 배지 표시만 담당한다(SRP).

import { browser } from "wxt/browser";

import { createIdbEventStore } from "@/background/adapters/idb-event-store.ts";
import { createIdbScreenshotStore } from "@/background/adapters/idb-screenshot-store.ts";
import { createTabScreenshotCapture } from "@/background/adapters/tab-screenshot-capture.ts";
import { createWxtSessionStore } from "@/background/adapters/wxt-session-store.ts";
import { createWxtSettingsStore } from "@/background/adapters/wxt-settings-store.ts";
import {
  createRecordingSession,
  createScreenshotScheduler,
  type RecordingSessionController,
} from "@/background/index.ts";
import { onMessage } from "@/messaging/extension-messaging.ts";

/** 배지 색: 녹화 중은 빨강, 완료는 초록. */
const BADGE_REC_TEXT = "REC";
const BADGE_DONE_TEXT = "✓";
const BADGE_REC_COLOR = "#c0392b";
const BADGE_DONE_COLOR = "#27ae60";

export default defineBackground(() => {
  const sessionStore = createWxtSessionStore();
  const settingsStore = createWxtSettingsStore();
  const eventStore = createIdbEventStore();
  const screenshotStore = createIdbScreenshotStore();
  const screenshotCapture = createTabScreenshotCapture();
  const scheduler = createScreenshotScheduler({
    capture: screenshotCapture,
    writer: screenshotStore,
  });

  const controller: RecordingSessionController = createRecordingSession({
    sessionStore,
    eventWriter: eventStore,
    eventReader: eventStore,
    screenshotWriter: screenshotStore,
    scheduler,
  });

  /** 현재 세션 상태에 맞춰 action 배지를 갱신. */
  const refreshBadge = async (): Promise<void> => {
    const state = await controller.getState();
    const session = state.session;
    if (!session) {
      await setBadge("");
      return;
    }
    if (session.endedAt === undefined) {
      await setBadge(BADGE_REC_TEXT, BADGE_REC_COLOR);
    } else {
      await setBadge(BADGE_DONE_TEXT, BADGE_DONE_COLOR);
    }
  };

  // SW 재시작 시 session 영역이 살아있으면 배지 복구.
  void refreshBadge();

  onMessage("captureEvent", async ({ data }) => {
    await controller.captureEvent(data);
  });

  // content script는 자신의 tabId를 직접 알 수 없어(`browser.tabs.getCurrent()`
  // 미지원) sender.tab.id를 역질의한다. devtools 등 탭이 없는 컨텍스트에서
  // 호출되면 -1 — 호출측이 이를 "unknown"으로 해석한다.
  onMessage("getMyTabId", ({ sender }) => {
    return sender.tab?.id ?? -1;
  });

  onMessage("startRecording", async ({ data }) => {
    await controller.startRecording({
      targetEventNames: data.targetEventNames,
      tabId: data.tabId,
    });
    // 마지막 선택을 설정에 저장해 팝업 재열림 시 복원.
    await settingsStore.update({
      lastSelectedEventNames: data.targetEventNames,
    });
    await refreshBadge();
  });

  onMessage("stopRecording", async () => {
    await controller.stopRecording();
    await refreshBadge();
  });

  onMessage("getSessionState", async () => {
    return controller.getState();
  });

  onMessage("generateReport", async () => {
    // TODO(m8): 리포트 HTML 렌더 + 새 탭 오픈. 이벤트 목록은
    // `controller.listCurrentEvents()`로 확보 가능하고, 스크린샷은
    // `screenshotStore.load(id)`로 base64 인라인할 수 있다.
  });
});

async function setBadge(text: string, color?: string): Promise<void> {
  await browser.action.setBadgeText({ text });
  if (color && text) {
    await browser.action.setBadgeBackgroundColor({ color });
  }
}

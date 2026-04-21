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
import {
  createReportAssembler,
  createWxtReportWriter,
  createWxtSpecsCacheReader,
} from "@/report/index.ts";

/** 배지 색: 녹화 중은 빨강, 완료는 초록. */
const BADGE_REC_TEXT = "REC";
const BADGE_DONE_TEXT = "✓";
const BADGE_REC_COLOR = "#c0392b";
const BADGE_DONE_COLOR = "#27ae60";

export default defineBackground(() => {
  // action 아이콘 클릭 시 side panel이 열리도록 한다. Chrome 전용 API라
  // 존재 여부를 런타임에 확인한 뒤 호출한다.
  const sidePanel = (browser as unknown as { sidePanel?: { setPanelBehavior: (opts: { openPanelOnActionClick: boolean }) => Promise<void> } }).sidePanel;
  if (sidePanel) {
    void sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch(() => {});
  }

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

  // M8 리포트 어셈블러. specsCache read + 세션 이벤트 + 스크린샷 base64 변환 +
  // validate() 결과를 `local:reportData`에 write한다. 팝업(M4)이 이를 구독해 렌더.
  const reportAssembler = createReportAssembler({
    specsCacheReader: createWxtSpecsCacheReader(),
    screenshotReader: screenshotStore,
    reportWriter: createWxtReportWriter(),
    sessionSource: {
      getState: () => controller.getState(),
      listCurrentEvents: () => controller.listCurrentEvents(),
    },
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
  // TODO(M4/M8): `UNKNOWN_TAB_ID`가 `types/messages.ts`로 승격되면 아래 `-1`을
  // 해당 상수로 치환해 content 어댑터와 드리프트되지 않도록 한다.
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
    // Phase 2 뷰어 모드: 어셈블이 `local:reportData`에 write한 직후 뷰어 탭을 연다.
    // 세션/스펙 미충족 시 어셈블러가 `null`을 반환하며, 이 경우 탭을 열지 않는다
    // (m8-report.md:110 "명확한 에러(또는 no-op)").
    const data = await reportAssembler.run();
    if (!data) return;
    await browser.tabs.create({ url: browser.runtime.getURL("/report.html") });
  });
});

async function setBadge(text: string, color?: string): Promise<void> {
  await browser.action.setBadgeText({ text });
  if (color && text) {
    await browser.action.setBadgeBackgroundColor({ color });
  }
}

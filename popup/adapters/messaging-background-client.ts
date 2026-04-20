// BackgroundClient 포트의 실구현 어댑터.
//
// 세션 제어(M3)는 `@webext-core/messaging` 공용 인스턴스로, 스펙 로드(M5)는
// `sheets/` 공개 API로 각각 라우팅한다. 팝업 외 다른 모듈이 직접 이 어댑터를
// import하지 않도록 어댑터는 popup 모듈 경계 안에서만 사용한다.
//
// 제약:
// - `browser.*`/`sendMessage`는 이 파일에서만 사용. UI·아톰은 포트 타입만 본다.
// - subscribeSession은 배경 SW의 push 채널이 없으므로 polling으로 근사한다.
//   팝업은 짧게 열렸다 닫히는 UI라 500ms 간격이면 체감 지연이 UI 프레임 수준이다.

import { browser } from "wxt/browser";

import { sendMessage } from "@/messaging/extension-messaging.ts";
import {
  authenticate as sheetsAuthenticate,
  fetchSheetRows,
  listSheetTabs,
  parseSpecRows,
  signOut as sheetsSignOut,
} from "@/sheets/index.ts";
import type { RecordingSessionState } from "@/types/messages.ts";

import type { BackgroundClient } from "../ports/background-client.ts";

/** 세션 상태 폴링 간격. 녹화 중 경과 초 단위 UI를 고려해 500ms 주기. */
export const SESSION_POLL_INTERVAL_MS = 500;

/**
 * 타이머 핸들은 Node/브라우저 환경 차이로 타입이 다르다(`Timeout` vs `number`).
 * `ReturnType<typeof setInterval>`로 좁히면 vitest가 DOM + Node lib를 동시에
 * 로드하는 환경에서 유니온이 발생해 `clearInterval` 시 캐스트가 필요해진다.
 * 테스트에서 임의 값을 반환할 수 있게 opaque 타입으로 노출한 뒤 내부에서만 캐스트한다.
 */
export type PollTimerHandle = unknown;

export interface MessagingBackgroundClientDeps {
  /** 테스트에서 타이머 즉시 진행을 위해 주입. 기본 = 전역 setInterval/clearInterval. */
  setIntervalFn?: (fn: () => void, ms: number) => PollTimerHandle;
  clearIntervalFn?: (handle: PollTimerHandle) => void;
  /** 폴링 간격 오버라이드(ms). */
  pollIntervalMs?: number;
}

/**
 * 팝업이 주입받을 실구현 어댑터.
 *
 * - `loadSpecs`: sheets 모듈의 `fetchSheetRows` + `parseSpecRows` 조합.
 *   파서 경고(`warnings`)는 Phase 1 UI에 별도 채널이 없어 drop하지만,
 *   `ParseResult`는 그대로 보존되므로 Phase 2에서 경고 뱃지를 쉽게 추가할 수 있다.
 * - `subscribeSession`: `getSessionState`를 지정 간격으로 폴링. 팝업이 닫히면
 *   반환된 unsubscribe가 타이머를 해제해 백그라운드 누수를 막는다.
 */
export function createMessagingBackgroundClient(
  deps: MessagingBackgroundClientDeps = {},
): BackgroundClient {
  const setIntervalFn =
    deps.setIntervalFn ?? ((fn, ms) => setInterval(fn, ms));
  const clearIntervalFn =
    deps.clearIntervalFn ??
    ((handle) => clearInterval(handle as Parameters<typeof clearInterval>[0]));
  const pollMs = deps.pollIntervalMs ?? SESSION_POLL_INTERVAL_MS;

  return {
    async loadSpecs(sheetTitle) {
      const title = sheetTitle ?? (await pickFirstSheetTitle());
      const rows = await fetchSheetRows(title);
      const result = parseSpecRows(rows, { sheetName: title });
      return result.specs;
    },

    async startRecording(targetEventNames, tabId) {
      await sendMessage("startRecording", {
        targetEventNames: [...targetEventNames],
        tabId,
      });
    },

    async stopRecording() {
      await sendMessage("stopRecording", undefined);
    },

    async getSessionState(): Promise<RecordingSessionState> {
      return sendMessage("getSessionState", undefined);
    },

    subscribeSession(onChange) {
      let disposed = false;
      const tick = async (): Promise<void> => {
        if (disposed) return;
        try {
          const state = await sendMessage("getSessionState", undefined);
          if (!disposed) onChange(state);
        } catch {
          // 폴링 중 일회성 실패는 무시. 다음 tick에서 복구된다.
        }
      };
      // 최초 1회 즉시 호출 후 주기 실행 — 폴링 시작 타이밍이 간격만큼 지연되지 않게.
      void tick();
      const handle = setIntervalFn(() => {
        void tick();
      }, pollMs);
      return () => {
        disposed = true;
        clearIntervalFn(handle);
      };
    },

    async generateReport() {
      await sendMessage("generateReport", undefined);
    },

    async getActiveTabId() {
      const [active] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!active || typeof active.id !== "number") {
        throw new Error("활성 탭을 찾을 수 없습니다.");
      }
      return active.id;
    },

    async authenticate() {
      await sheetsAuthenticate();
    },

    async signOut() {
      await sheetsSignOut();
    },
  };
}

/**
 * 단일 시트 Phase 1 기본값 — 첫 번째 탭을 사용한다. Phase 2에서 사용자 선택 UI가
 * 붙으면 `sheetTitleAtom` 등으로 이 분기가 더 이상 필요 없어진다.
 */
async function pickFirstSheetTitle(): Promise<string> {
  const tabs = await listSheetTabs();
  const first = tabs[0];
  if (!first) {
    throw new Error("스펙 시트에 탭이 없습니다.");
  }
  return first.title;
}

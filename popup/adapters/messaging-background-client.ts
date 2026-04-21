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
import { storage } from "wxt/utils/storage";

import { sendMessage } from "@/messaging/extension-messaging.ts";
import {
  authenticate as sheetsAuthenticate,
  fetchSheetRows,
  hasCachedToken as sheetsHasCachedToken,
  listSheetTabs,
  LOG_DEFINITION_TAB_PATTERN,
  parseSpecRows,
  signOut as sheetsSignOut,
  type SheetTab,
} from "@/sheets/index.ts";
import type { RecordingSessionState } from "@/types/messages.ts";
import type { EventSpec } from "@/types/spec.ts";
import {
  SPECS_CACHE_FALLBACK,
  SPECS_CACHE_KEY,
  type SpecsCachePayload,
} from "@/types/storage.ts";

import type { BackgroundClient } from "../ports/background-client.ts";

// `local:specsCache`는 M3 SettingsStore가 소유하지만 `wxt/storage`는 컨텍스트
// 공유이므로 팝업에서도 동일 키·fallback을 재사용해 직접 read/write한다
// (M8 `wxt-specs-cache-reader`와 같은 패턴). 두 가지 목적을 동시에 충족한다:
//   1) 팝업 재오픈 시 캐시에서 specs를 복원해 "스펙 불러오기" 반복을 생략 (M4).
//   2) M8 리포트 어셈블러(SW)가 같은 키를 read-only로 읽으므로 "리포트 생성"
//      경로가 no-op 없이 non-null을 반환.
// 소유자 규약은 docs/02-contracts.md §공용 스토리지 키 / m5-sheets.md:64
// ("local:specsCache 기록은 소비자(M3/팝업) 책임")에 근거.
const specsCacheItem = storage.defineItem<SpecsCachePayload>(SPECS_CACHE_KEY, {
  fallback: SPECS_CACHE_FALLBACK,
});

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
 *   `sheetTitle`이 주어지면 해당 탭만 로드, 생략 시 `LOG_DEFINITION_TAB_PATTERN`
 *   매칭 탭 전체를 병렬 로드하여 specs를 합친다(시트는 도메인별 탭에 분산되어 있다).
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
      if (sheetTitle !== undefined) return loadSpecsFromTab(sheetTitle);
      return loadSpecsFromAllDefinitionTabs();
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

    async getValidationSnapshot() {
      return sendMessage("getValidationSnapshot", undefined);
    },

    async getActiveTab() {
      const [active] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!active || typeof active.id !== "number") {
        throw new Error("활성 탭을 찾을 수 없습니다.");
      }
      return { id: active.id, url: active.url };
    },

    async authenticate() {
      await sheetsAuthenticate();
    },

    async signOut() {
      await sheetsSignOut();
    },

    async hasCachedToken() {
      return sheetsHasCachedToken();
    },

    async getCachedSpecs() {
      return specsCacheItem.getValue();
    },

    async setCachedSpecs(specs) {
      await specsCacheItem.setValue(specs);
    },
  };
}

/** 단일 탭 로드 — 명시적으로 `sheetTitle`이 주어진 경우(향후 탭 선택 UI 경로). */
async function loadSpecsFromTab(sheetTitle: string): Promise<EventSpec[]> {
  const rows = await fetchSheetRows(sheetTitle);
  return parseSpecRows(rows, { sheetName: sheetTitle }).specs;
}

/**
 * 로그 정의 탭 전체 집계 — Phase 1 기본값.
 *
 * 시트에는 컨벤션·가이드·요약 탭이 앞쪽에 섞여있어 `tabs[0]`만 읽으면 스펙을
 * 0건만 얻는 버그가 있었다. `LOG_DEFINITION_TAB_PATTERN`으로 실제 도메인별
 * 로그 정의 탭만 골라 **병렬로** 내려받은 뒤 specs를 합친다. listTabs가
 * 이미 OAuth 토큰을 확보한 뒤이므로 이후 fetchRows들은 silent 토큰으로 진행된다.
 *
 * 성능·편의 개선 경로(Phase 2): 탭 선택 드롭다운, 병렬도 조절, 서버측 필터링.
 */
async function loadSpecsFromAllDefinitionTabs(): Promise<EventSpec[]> {
  const tabs = await listSheetTabs();
  const targets = tabs.filter((t) => LOG_DEFINITION_TAB_PATTERN.test(t.title));
  if (targets.length === 0) {
    throw new Error(
      "스펙 시트에서 로그 정의 탭을 찾지 못했습니다. " +
        "(탭 제목이 'NN. 도메인_신규로그설계' 패턴과 일치하는지 확인해주세요.)",
    );
  }
  const rowsPerTab = await Promise.all(
    targets.map((t) => fetchSheetRows(t.title)),
  );
  return mergeSpecs(targets, rowsPerTab);
}

function mergeSpecs(
  targets: SheetTab[],
  rowsPerTab: string[][][],
): EventSpec[] {
  const all: EventSpec[] = [];
  for (let i = 0; i < targets.length; i++) {
    const tab = targets[i]!;
    const rows = rowsPerTab[i]!;
    const { specs } = parseSpecRows(rows, { sheetName: tab.title });
    all.push(...specs);
  }
  return all;
}

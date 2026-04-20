// 모듈 간 공유되는 메시지/브리지 타입. 공개 계약이므로 변경 시 docs/02-contracts.md와
// 관련 모듈 문서를 함께 업데이트하고, 영향 범위를 PR 설명에 명시한다.

import type { CapturedEvent, RecordingSession } from "./event.ts";

/**
 * 웹앱(M1) → Content Script(M2)가 window.postMessage로 전달하는 페이로드.
 *
 * - `source` 필드로 다른 라이브러리의 postMessage와 구분
 * - `version`은 호환성 검사용 — 깨는 변경 시 증가
 */
export interface BridgeMessage {
  source: "catchtable-event-profiler";
  version: 1;
  payload: {
    provider: "amplitude";
    eventName: string;
    params: Record<string, unknown>;
    /** 웹앱 런타임의 Date.now() */
    timestamp: number;
  };
}

/**
 * Content Script(M2) ↔ Background(M3) ↔ Popup(M4)가 `@webext-core/messaging`을
 * 통해 주고받는 RPC 프로토콜.
 *
 * 공용 인스턴스는 `messaging/extension-messaging.ts`에서 `sendMessage`/`onMessage`로
 * export되며, 모든 모듈은 이 인스턴스만 사용한다. vanilla `browser.runtime.sendMessage`
 * 직접 호출 금지.
 */
export interface ExtensionProtocol {
  /** M2 → M3. 수집된 단일 이벤트 전달. fire-and-forget. */
  captureEvent(event: Omit<CapturedEvent, "id" | "screenshotId">): void;

  /**
   * M2 → M3. 호출한 content script가 속한 탭의 id를 조회.
   *
   * content script는 자신의 tabId를 네이티브로 알 수 없으므로
   * (`browser.tabs.getCurrent()` 미지원), background가 `sender.tab.id`를
   * 되돌려준다. 결과는 content script가 캐시해 이후 `captureEvent`의 `tabId`
   * 필드를 채운다. 탭이 아닌 곳(devtools 등)에서 호출되면 -1.
   */
  getMyTabId(): number;

  /** M4 → M3. 녹화 시작. 이전 세션이 있으면 먼저 clear. */
  startRecording(input: { targetEventNames: string[]; tabId: number }): void;

  /** M4 → M3. 녹화 종료. */
  stopRecording(): void;

  /** M4 → M3. 현재 세션 스냅샷 반환 (팝업이 열릴 때마다 UI 복구용). */
  getSessionState(): RecordingSessionState;

  /** M4 → M3. 리포트 생성 트리거 (M8 호출). */
  generateReport(): void;
}

/** Popup이 현재 세션 UI를 재구성하기 위해 필요한 상태 스냅샷. */
export interface RecordingSessionState {
  session: RecordingSession | null;
  capturedCount: number;
  targetEventNames: string[];
}

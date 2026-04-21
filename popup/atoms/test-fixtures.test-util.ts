// 팝업 아톰 테스트용 fake BackgroundClient.
//
// 실구현은 메시지/네트워크 경계를 가지므로 포트 단위 in-memory fake로 대체한다
// (03-conventions §테스트). fake는 상태를 in-memory로 유지하고 구독 콜백은
// `emit`로 수동 발화하여 비동기 테스트를 결정적으로 만든다.

import type { EventSpec } from "@/types/spec.ts";
import type { RecordingSessionState } from "@/types/messages.ts";

import type { BackgroundClient } from "../ports/background-client.ts";

export interface FakeBackgroundClient extends BackgroundClient {
  /** 구독자에게 임의 상태를 주입한다. 테스트가 "SW 상태 변화"를 모방할 때 사용. */
  emit(state: RecordingSessionState): void;
  /** 백엔드가 반환할 스펙 목록을 테스트에서 세팅. */
  setSpecs(specs: EventSpec[]): void;
  /** `loadSpecs`가 throw할 에러를 세팅. 해제하려면 undefined 전달. */
  setLoadSpecsError(err: Error | undefined): void;
  /** `authenticate`가 throw할 에러를 세팅. 해제하려면 undefined 전달. */
  setAuthenticateError(err: Error | undefined): void;
  /** `hasCachedToken`이 반환할 값을 세팅. 기본값 false. */
  setHasCachedToken(value: boolean): void;
  /** `getCachedSpecs`가 반환할 캐시를 세팅. 기본값 null. */
  setCachedSpecsValue(value: EventSpec[] | null): void;
  /** 테스트가 커밋한 현재 세션 상태를 세팅한다(`startRecording` 후 pull 모의용). */
  setSessionState(state: RecordingSessionState): void;
  /** `getActiveTab` 반환값 세팅. 기본 `{id: 1, url: "https://www.catchtable.co.kr/"}`. */
  setActiveTab(tab: { id: number; url: string | undefined }): void;
  /** startRecording/stopRecording/authenticate 호출 로그. */
  readonly calls: {
    startRecording: Array<{ targetEventNames: string[]; tabId: number }>;
    stopRecording: number;
    generateReport: number;
    authenticate: number;
    signOut: number;
  };
}

export function createFakeBackgroundClient(): FakeBackgroundClient {
  const listeners = new Set<(state: RecordingSessionState) => void>();
  let specs: EventSpec[] = [];
  let loadError: Error | undefined;
  let authenticateError: Error | undefined;
  let hasCachedToken = false;
  let cachedSpecs: EventSpec[] | null = null;
  let sessionState: RecordingSessionState = {
    session: null,
    capturedCount: 0,
    targetEventNames: [],
  };
  // 기본값은 지원 호스트 — 기존 테스트(호스트 매치 이전 작성분)가 그대로 통과하도록.
  let activeTab: { id: number; url: string | undefined } = {
    id: 1,
    url: "https://www.catchtable.co.kr/",
  };
  const calls = {
    startRecording: [] as Array<{ targetEventNames: string[]; tabId: number }>,
    stopRecording: 0,
    generateReport: 0,
    authenticate: 0,
    signOut: 0,
  };

  return {
    calls,
    setSpecs(next) {
      specs = next;
    },
    setLoadSpecsError(err) {
      loadError = err;
    },
    setAuthenticateError(err) {
      authenticateError = err;
    },
    setHasCachedToken(value) {
      hasCachedToken = value;
    },
    setCachedSpecsValue(value) {
      cachedSpecs = value;
    },
    setSessionState(state) {
      sessionState = state;
    },
    setActiveTab(tab) {
      activeTab = tab;
    },
    emit(state) {
      sessionState = state;
      listeners.forEach((fn) => fn(state));
    },
    async loadSpecs() {
      if (loadError) throw loadError;
      return specs;
    },
    async startRecording(targetEventNames, tabId) {
      calls.startRecording.push({ targetEventNames: [...targetEventNames], tabId });
    },
    async stopRecording() {
      calls.stopRecording += 1;
    },
    async getSessionState() {
      return sessionState;
    },
    subscribeSession(onChange) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    async generateReport() {
      calls.generateReport += 1;
    },
    async getActiveTab() {
      return activeTab;
    },
    async authenticate() {
      calls.authenticate += 1;
      if (authenticateError) throw authenticateError;
    },
    async signOut() {
      calls.signOut += 1;
    },
    async hasCachedToken() {
      return hasCachedToken;
    },
    async getCachedSpecs() {
      return cachedSpecs;
    },
    async setCachedSpecs(next) {
      cachedSpecs = [...next];
    },
  };
}

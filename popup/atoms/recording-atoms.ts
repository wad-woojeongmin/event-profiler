// 녹화 세션과 사용자 선택 상태 아톰 그룹.
//
// 세션 상태의 "원천"은 배경 SW이므로 팝업 아톰은 `subscribeSession` 콜백으로
// 동기화된다. 시작/종료 액션은 API를 호출한 뒤 즉시 `getSessionState`로 최신
// 상태를 pull하여 optimistic UI와 실제 SW 상태의 괴리를 최소화한다.

import { atom } from "jotai";

import { isSupportedUrl } from "@/content";
import type { RecordingSessionState } from "@/types/messages.ts";

import { backgroundClientAtom, requireBackgroundClient } from "./client-atom.ts";

export const EMPTY_SESSION_STATE: RecordingSessionState = {
  session: null,
  capturedCount: 0,
  targetEventNames: [],
};

export const recordingSessionAtom = atom<RecordingSessionState>(
  EMPTY_SESSION_STATE,
);

/**
 * UI 상태 머신. 세션 필드에서 파생하며 컴포넌트가 분기 로직을 가지지 않도록 한다.
 * - `idle`:             세션 없음
 * - `recording`:        진행 중
 * - `recording_done`:   종료됨(`endedAt` 세팅됨) → 리포트 버튼 노출
 */
export type RecordingPhase = "idle" | "recording" | "recording_done";

export const recordingPhaseAtom = atom<RecordingPhase>((get) => {
  const state = get(recordingSessionAtom);
  if (!state.session) return "idle";
  return state.session.endedAt === undefined ? "recording" : "recording_done";
});

/** 사용자가 체크한 대상 이벤트명 집합. Set 사본으로 set하여 React 참조 변경 보장. */
export const selectedEventNamesAtom = atom<Set<string>>(new Set<string>());

export const toggleSelectionAtom = atom(
  null,
  (get, set, eventName: string) => {
    const current = get(selectedEventNamesAtom);
    const next = new Set(current);
    if (next.has(eventName)) next.delete(eventName);
    else next.add(eventName);
    set(selectedEventNamesAtom, next);
  },
);

export const setSelectionAtom = atom(
  null,
  (_get, set, eventNames: Iterable<string>) => {
    set(selectedEventNamesAtom, new Set(eventNames));
  },
);

export const clearSelectionAtom = atom(null, (_get, set) => {
  set(selectedEventNamesAtom, new Set());
});

/**
 * 녹화 시작 액션. 선택 0건이거나 활성 탭이 지원 도메인이 아니면 no-op으로
 * UI 가드(버튼 disabled, 배너)를 보조한다. 가드는 UI와 액션 양쪽에 두어 UI
 * 상태가 아직 hydrate되지 않은 프레임에서 버튼이 눌려도 무의미한 세션이
 * 생기지 않게 한다. 시작 호출 직후 `getSessionState`로 실제 세션을 재조회해
 * SW가 할당한 `session.id`·`startedAt`을 반영한다.
 *
 * 주의: URL 매칭은 "시작 시점"에만 검사한다. 녹화 중 사용자가 탭을 비지원
 * URL로 이동시키더라도 세션을 자동 중단하지 않으며, 중단 판단은 사용자에게
 * 맡긴다. Content Script는 해당 탭에만 주입되므로 비지원 URL에서는 이벤트가
 * 애초에 캡처되지 않아 결과가 오염되지 않는다.
 */
export const startRecordingAtom = atom(null, async (get, set) => {
  const client = requireBackgroundClient(get(backgroundClientAtom));
  const selected = [...get(selectedEventNamesAtom)];
  if (selected.length === 0) return;
  const tab = await client.getActiveTab();
  if (!isSupportedUrl(tab.url)) return;
  await client.startRecording(selected, tab.id);
  set(recordingSessionAtom, await client.getSessionState());
});

export const stopRecordingAtom = atom(null, async (get, set) => {
  const client = requireBackgroundClient(get(backgroundClientAtom));
  await client.stopRecording();
  set(recordingSessionAtom, await client.getSessionState());
});

export const generateReportAtom = atom(null, async (get) => {
  const client = requireBackgroundClient(get(backgroundClientAtom));
  await client.generateReport();
});

/**
 * 배경 SW push가 없는 환경에서 구독 진입 및 최초 hydrate를 겸한다.
 * 반환값은 해제 함수로, 팝업 unmount 시 호출한다.
 */
export const hydrateSessionAtom = atom(null, async (get, set) => {
  const client = requireBackgroundClient(get(backgroundClientAtom));
  const snapshot = await client.getSessionState();
  set(recordingSessionAtom, snapshot);
  return client.subscribeSession((state) => {
    set(recordingSessionAtom, state);
  });
});

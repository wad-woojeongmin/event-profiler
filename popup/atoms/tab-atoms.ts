// 활성 탭 정보 아톰 그룹 — "지원 페이지" 배너와 녹화 시작 가드의 원천.
//
// 팝업이 열린 시점의 활성 탭을 한 번 pull해 캐시한다. 팝업이 떠 있는 동안
// 사용자가 다른 탭으로 전환/URL 변경을 하는 시나리오는 드물고, 감지하려면
// `browser.tabs.onUpdated` 구독을 background에 추가해야 하는데 M3는 동결
// 상태다(m4-popup.md Phase 2 과제). 지금은 "팝업 오픈 시점 탭"만 신뢰한다.

import { atom } from "jotai";

import { isSupportedUrl } from "@/content";

import { backgroundClientAtom, requireBackgroundClient } from "./client-atom.ts";

export interface ActiveTabInfo {
  id: number;
  url: string | undefined;
}

export const activeTabAtom = atom<ActiveTabInfo | null>(null);

/**
 * 활성 탭의 호스트 매치 여부.
 * - `null`: 아직 hydrate 전 — UI는 중립 상태(배너 숨김, 버튼 기본 동작)를 유지
 * - `true`/`false`: hydrate 완료. false면 배너 노출 + 시작 버튼 disabled
 *
 * "`null`이면 false처럼"이 아니라 별도 상태로 구분하는 이유: hydrate 실패
 * 전에 경고 배너가 잠깐 번쩍이는 것을 피하기 위함.
 */
export const isSupportedTabAtom = atom<boolean | null>((get) => {
  const tab = get(activeTabAtom);
  if (tab === null) return null;
  return isSupportedUrl(tab.url);
});

export const hydrateActiveTabAtom = atom(null, async (get, set) => {
  const client = requireBackgroundClient(get(backgroundClientAtom));
  set(activeTabAtom, await client.getActiveTab());
});

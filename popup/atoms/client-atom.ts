// BackgroundClient 주입 지점.
//
// 엔트리포인트(`entrypoints/popup/main.tsx`)에서 실구현 어댑터를,
// 테스트에서 in-memory fake를 각각 Jotai store에 set한다. 액션 아톰은
// `get(backgroundClientAtom)`으로 꺼내 DIP를 지킨다.
//
// 아톰 값이 null인 상태에서 액션이 실행되면 즉시 명확한 에러로 실패시켜
// "Provider 없이 mount" 같은 설정 버그를 조기에 드러낸다.

import { atom } from "jotai";

import type { BackgroundClient } from "../ports/background-client.ts";

export const backgroundClientAtom = atom<BackgroundClient | null>(null);

/**
 * 액션 아톰 내부에서 주입된 클라이언트를 안전하게 읽는다.
 * @throws 클라이언트 미주입 시 명시적 실패 — Provider 설정 누락을 빠르게 노출.
 */
export function requireBackgroundClient(
  client: BackgroundClient | null,
): BackgroundClient {
  if (!client) {
    throw new Error(
      "BackgroundClient가 주입되지 않았습니다. Popup Provider를 확인하세요.",
    );
  }
  return client;
}

// 공용 messaging 인스턴스로 background에 `getMyTabId`를 요청하는 어댑터.
//
// 탭 id는 탭 수명 동안 불변이므로 최초 1회만 네트워킹하고 이후는 캐시 반환.
// in-flight 요청이 여러 건 동시에 들어와도 단일 Promise를 공유해 roundtrip
// 중복을 막는다.
//
// 캐시 정책(의도적 비대칭):
// - background가 `-1`을 **resolve**하면(devtools 등 탭이 아닌 컨텍스트) 영구
//   캐시. 재시도해도 결과가 같아 roundtrip 낭비만 유발.
// - Promise가 **reject**되면(SW idle·포트 닫힘) 캐시를 비워 다음 호출이
//   재시도할 수 있게 한다 — 일시 오류를 영속 상태로 굳히지 않기 위함.

import { sendMessage } from "@/messaging/extension-messaging.ts";

import type { TabIdResolver } from "../ports/tab-id-resolver.ts";

/** background 도달 실패 또는 탭이 아닌 컨텍스트를 나타내는 sentinel. */
// TODO(M4/M8): 외부 소비자가 생기면 `types/messages.ts`로 승격하고 background
// 핸들러(`entrypoints/background.ts`)의 `?? -1`도 동일 상수로 치환해 드리프트
// 방지.
export const UNKNOWN_TAB_ID = -1;

export function createMessagingTabIdResolver(): TabIdResolver {
  let cached: Promise<number> | null = null;
  return {
    get() {
      if (cached === null) {
        cached = sendMessage("getMyTabId", undefined).catch((error) => {
          console.debug("[event-validator] getMyTabId failed", error);
          // 실패 시 캐시를 비워 다음 호출이 재시도할 수 있게 한다.
          cached = null;
          return UNKNOWN_TAB_ID;
        });
      }
      return cached;
    },
  };
}

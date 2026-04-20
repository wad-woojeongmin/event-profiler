// 공용 messaging 인스턴스로 background에 `getMyTabId`를 요청하는 어댑터.
//
// 탭 id는 탭 수명 동안 불변이므로 최초 1회만 네트워킹하고 이후는 캐시 반환.
// in-flight 요청이 여러 건 동시에 들어와도 단일 Promise를 공유해 roundtrip
// 중복을 막는다.

import { sendMessage } from "@/messaging/extension-messaging.ts";

import type { TabIdResolver } from "../ports/tab-id-resolver.ts";

/** background에 도달 불가하거나 탭이 아닌 곳에서 호출됐음을 나타내는 sentinel. */
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

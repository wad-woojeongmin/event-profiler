// `wxt/storage` 기반 SpecsCacheReader 어댑터.
//
// 공용 스토리지 키 `local:specsCache`를 **read-only**로 감싼다. 쓰기 경로는
// M5/M3 SettingsStore의 소유이며, M8은 이 리더에 대해 쓰기 메서드를 노출하지
// 않는다(docs/02-contracts.md §공용 스토리지 키).

import { storage } from "wxt/utils/storage";

import {
  SPECS_CACHE_FALLBACK,
  SPECS_CACHE_KEY,
  type SpecsCachePayload,
} from "@/types/storage.ts";

import type { SpecsCacheReader } from "../ports/specs-cache-reader.ts";

// 키·타입·fallback 모두 공용 심볼을 재사용해 소유자 어댑터와 완전히 일치시킨다.
const specsCacheItem = storage.defineItem<SpecsCachePayload>(SPECS_CACHE_KEY, {
  fallback: SPECS_CACHE_FALLBACK,
});

export function createWxtSpecsCacheReader(): SpecsCacheReader {
  return {
    async read() {
      return specsCacheItem.getValue();
    },
  };
}

// `wxt/storage` 기반 SettingsStore·SpecsCache 어댑터(`local:` 영역).

import { storage } from "wxt/utils/storage";

import type { EventSpec } from "@/types/spec.ts";

import {
  DEFAULT_SETTINGS,
  type Settings,
  type SettingsStore,
} from "../ports/settings-store.ts";

const settingsItem = storage.defineItem<Settings>("local:settings", {
  fallback: DEFAULT_SETTINGS,
});

// 스펙 캐시는 "비어있음"을 명시적 상태(null)로 다루므로 기본값도 null.
const specsCacheItem = storage.defineItem<EventSpec[] | null>(
  "local:specsCache",
  { fallback: null },
);

export function createWxtSettingsStore(): SettingsStore {
  return {
    async get() {
      return settingsItem.getValue();
    },
    async update(partial) {
      // read-modify-write: 동시 호출이 적고 설정 쓰기는 저빈도라 락은 불필요.
      const current = await settingsItem.getValue();
      await settingsItem.setValue({ ...current, ...partial });
    },
    async getSpecsCache() {
      return specsCacheItem.getValue();
    },
    async setSpecsCache(specs) {
      await specsCacheItem.setValue(specs);
    },
  };
}

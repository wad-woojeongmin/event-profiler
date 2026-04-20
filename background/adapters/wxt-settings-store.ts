// `wxt/storage` 기반 SettingsStore·SpecsCache 어댑터.

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

// 스펙 캐시는 명시적으로 저장/폐기하므로 fallback 없이 null을 허용한다.
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

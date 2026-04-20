// WxtSettingsStore 어댑터 통합 테스트.
//
// `local:` 영역도 WxtVitest가 fakeBrowser로 폴리필. `update`의 부분 머지와
// specsCache의 null 기본값을 실구현으로 검증한다.

import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing";

import type { EventSpec } from "@/types/spec.ts";

import { DEFAULT_SETTINGS } from "../ports/settings-store.ts";
import { createWxtSettingsStore } from "./wxt-settings-store.ts";

const SAMPLE_SPEC: EventSpec = {
  amplitudeEventName: "a",
  humanEventName: "b",
  pageName: "page",
  sectionName: undefined,
  actionName: undefined,
  eventType: "click",
  logType: undefined,
  params: ["k"],
  referencedExtensions: [],
  rawExtension: "",
  status: "",
  sourceRow: 1,
  sourceSheet: undefined,
};

describe("createWxtSettingsStore", () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it("저장 이력이 없으면 DEFAULT_SETTINGS를 반환", async () => {
    const store = createWxtSettingsStore();
    expect(await store.get()).toEqual(DEFAULT_SETTINGS);
  });

  it("update는 부분 필드만 patch한다", async () => {
    const store = createWxtSettingsStore();
    await store.update({ lastSelectedEventNames: ["e1", "e2"] });
    await store.update({ lastSelectedSheetTitle: "main" });
    expect(await store.get()).toEqual({
      lastSelectedEventNames: ["e1", "e2"],
      lastSelectedSheetTitle: "main",
    });
  });

  it("specsCache는 최초 null → set 후 배열 반환", async () => {
    const store = createWxtSettingsStore();
    expect(await store.getSpecsCache()).toBeNull();
    await store.setSpecsCache([SAMPLE_SPEC]);
    expect(await store.getSpecsCache()).toEqual([SAMPLE_SPEC]);
  });
});

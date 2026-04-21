// 칼럼별 필터 파생 로직 테스트.

import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import type { EventSpec } from "@/types/spec.ts";

import {
  selectedFilteredSpecsAtom,
  selectedQueryAtom,
  unselectedFilteredSpecsAtom,
  unselectedQueryAtom,
} from "./filter-atoms.ts";
import { selectedEventNamesAtom } from "./recording-atoms.ts";
import { specsAtom } from "./specs-atoms.ts";

function makeSpec(overrides: Partial<EventSpec> = {}): EventSpec {
  return {
    amplitudeEventName: "amp_event",
    humanEventName: "click__x",
    pageName: "PageX",
    sectionName: undefined,
    actionName: undefined,
    eventType: "click",
    logType: undefined,
    params: [],
    referencedExtensions: [],
    rawExtension: "",
    status: "to-be",
    sourceRow: 1,
    sourceSheet: "main",
    ...overrides,
  };
}

let store: ReturnType<typeof createStore>;

beforeEach(() => {
  store = createStore();
});

describe("unselectedFilteredSpecsAtom", () => {
  it("선택되지 않은 스펙만 반환한다", () => {
    const a = makeSpec({ amplitudeEventName: "a" });
    const b = makeSpec({ amplitudeEventName: "b" });
    const c = makeSpec({ amplitudeEventName: "c" });
    store.set(specsAtom, [a, b, c]);
    store.set(selectedEventNamesAtom, new Set(["b"]));
    expect(store.get(unselectedFilteredSpecsAtom)).toEqual([a, c]);
  });

  it("쿼리를 미선택 집합 안에만 적용한다", () => {
    const a = makeSpec({ amplitudeEventName: "home_banner" });
    const b = makeSpec({ amplitudeEventName: "detail_banner" });
    const c = makeSpec({ amplitudeEventName: "footer" });
    store.set(specsAtom, [a, b, c]);
    store.set(selectedEventNamesAtom, new Set(["home_banner"]));
    store.set(unselectedQueryAtom, "banner");
    expect(store.get(unselectedFilteredSpecsAtom)).toEqual([b]);
  });
});

describe("selectedFilteredSpecsAtom", () => {
  it("선택된 스펙만 반환한다", () => {
    const a = makeSpec({ amplitudeEventName: "alpha" });
    const b = makeSpec({ amplitudeEventName: "beta" });
    store.set(specsAtom, [a, b]);
    store.set(selectedEventNamesAtom, new Set(["beta"]));
    expect(store.get(selectedFilteredSpecsAtom)).toEqual([b]);
  });

  it("미선택 쿼리와 독립적으로 동작한다", () => {
    const a = makeSpec({ amplitudeEventName: "home" });
    const b = makeSpec({ amplitudeEventName: "detail" });
    store.set(specsAtom, [a, b]);
    store.set(selectedEventNamesAtom, new Set(["home", "detail"]));
    store.set(unselectedQueryAtom, "home");
    store.set(selectedQueryAtom, "detail");
    expect(store.get(selectedFilteredSpecsAtom)).toEqual([b]);
  });
});

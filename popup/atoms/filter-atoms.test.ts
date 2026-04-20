// filteredSpecsAtom 파생 로직 테스트.

import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import type { EventSpec } from "@/types/spec.ts";

import { filteredSpecsAtom, filterQueryAtom } from "./filter-atoms.ts";
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

describe("filteredSpecsAtom", () => {
  it("빈 쿼리는 전체를 그대로 반환한다", () => {
    const specs = [makeSpec(), makeSpec({ amplitudeEventName: "other" })];
    store.set(specsAtom, specs);
    expect(store.get(filteredSpecsAtom)).toEqual(specs);
  });

  it("amplitudeEventName·humanEventName·pageName 중 어느 필드든 부분 일치하면 통과", () => {
    const a = makeSpec({ amplitudeEventName: "home_banner_click" });
    const b = makeSpec({ humanEventName: "click__banner" });
    const c = makeSpec({ pageName: "BannerPage" });
    const d = makeSpec({ amplitudeEventName: "unrelated" });
    store.set(specsAtom, [a, b, c, d]);

    store.set(filterQueryAtom, "banner");
    expect(store.get(filteredSpecsAtom)).toEqual([a, b, c]);
  });

  it("대소문자를 구분하지 않는다", () => {
    const a = makeSpec({ amplitudeEventName: "Shop_Detail" });
    store.set(specsAtom, [a]);
    store.set(filterQueryAtom, "detail");
    expect(store.get(filteredSpecsAtom)).toEqual([a]);
  });
});

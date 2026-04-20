// tab-atoms의 hydrate 경로와 isSupportedTabAtom 3상 상태 검증.

import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import { backgroundClientAtom } from "./client-atom.ts";
import {
  activeTabAtom,
  hydrateActiveTabAtom,
  isSupportedTabAtom,
} from "./tab-atoms.ts";
import {
  createFakeBackgroundClient,
  type FakeBackgroundClient,
} from "./test-fixtures.test-util.ts";

let store: ReturnType<typeof createStore>;
let client: FakeBackgroundClient;

beforeEach(() => {
  store = createStore();
  client = createFakeBackgroundClient();
  store.set(backgroundClientAtom, client);
});

describe("isSupportedTabAtom", () => {
  it("hydrate 전에는 null", () => {
    expect(store.get(isSupportedTabAtom)).toBeNull();
  });

  it("catchtable 호스트 hydrate 후 true", async () => {
    client.setActiveTab({ id: 1, url: "https://www.catchtable.co.kr/orders" });
    await store.set(hydrateActiveTabAtom);
    expect(store.get(isSupportedTabAtom)).toBe(true);
  });

  it("타 호스트 hydrate 후 false", async () => {
    client.setActiveTab({ id: 1, url: "https://example.com/" });
    await store.set(hydrateActiveTabAtom);
    expect(store.get(isSupportedTabAtom)).toBe(false);
  });

  it("url이 undefined면 false(보수적 판정)", async () => {
    client.setActiveTab({ id: 1, url: undefined });
    await store.set(hydrateActiveTabAtom);
    expect(store.get(isSupportedTabAtom)).toBe(false);
  });
});

describe("hydrateActiveTabAtom", () => {
  it("클라이언트 응답을 activeTabAtom에 그대로 반영한다", async () => {
    client.setActiveTab({ id: 42, url: "https://www.catchtable.co.kr/x" });
    await store.set(hydrateActiveTabAtom);
    expect(store.get(activeTabAtom)).toEqual({
      id: 42,
      url: "https://www.catchtable.co.kr/x",
    });
  });
});

// 스펙 로드 아톰의 상태 전이 테스트.

import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import type { EventSpec } from "@/types/spec.ts";

import { backgroundClientAtom } from "./client-atom.ts";
import {
  authStatusAtom,
  authenticateAtom,
  hydrateAuthStatusAtom,
  hydrateSpecsFromCacheAtom,
  loadSpecsAtom,
  specsAtom,
  specsErrorAtom,
  specsLoadStateAtom,
} from "./specs-atoms.ts";
import {
  createFakeBackgroundClient,
  type FakeBackgroundClient,
} from "./test-fixtures.test-util.ts";

const sampleSpec: EventSpec = {
  amplitudeEventName: "sample_event",
  humanEventName: "click__sample",
  pageName: "SampleScreen",
  sectionName: undefined,
  actionName: undefined,
  eventType: "click",
  logType: undefined,
  params: [],
  referencedExtensions: [],
  rawExtension: "",
  status: "to-be",
  sourceRow: 3,
  sourceSheet: "main",
};

let store: ReturnType<typeof createStore>;
let client: FakeBackgroundClient;

beforeEach(() => {
  store = createStore();
  client = createFakeBackgroundClient();
  store.set(backgroundClientAtom, client);
});

describe("loadSpecsAtom", () => {
  it("성공 시 loaded 상태로 전이하고 스펙을 저장한다", async () => {
    client.setSpecs([sampleSpec]);
    await store.set(loadSpecsAtom);
    expect(store.get(specsLoadStateAtom)).toBe("loaded");
    expect(store.get(specsAtom)).toEqual([sampleSpec]);
    expect(store.get(specsErrorAtom)).toBeUndefined();
  });

  it("실패 시 error 상태에 메시지를 기록하고 throw하지 않는다", async () => {
    client.setLoadSpecsError(new Error("네트워크 실패"));
    await expect(store.set(loadSpecsAtom)).resolves.toBeUndefined();
    expect(store.get(specsLoadStateAtom)).toBe("error");
    expect(store.get(specsErrorAtom)).toBe("네트워크 실패");
  });

  it("재시도 시 error 메시지를 초기화한다", async () => {
    client.setLoadSpecsError(new Error("일시 실패"));
    await store.set(loadSpecsAtom);
    expect(store.get(specsErrorAtom)).toBe("일시 실패");

    client.setLoadSpecsError(undefined);
    client.setSpecs([sampleSpec]);
    await store.set(loadSpecsAtom);
    expect(store.get(specsErrorAtom)).toBeUndefined();
    expect(store.get(specsLoadStateAtom)).toBe("loaded");
  });
});

describe("authenticateAtom", () => {
  it("클라이언트의 authenticate를 호출한다", async () => {
    await store.set(authenticateAtom);
    expect(client.calls.authenticate).toBe(1);
  });

  it("성공 시 authStatus를 authenticated로 전이한다", async () => {
    expect(store.get(authStatusAtom)).toBe("idle");
    await store.set(authenticateAtom);
    expect(store.get(authStatusAtom)).toBe("authenticated");
    expect(store.get(specsErrorAtom)).toBeUndefined();
  });

  it("실패 시 authStatus를 failed로 전이하고 에러 메시지를 기록한다", async () => {
    client.setAuthenticateError(new Error("사용자 취소"));
    await expect(store.set(authenticateAtom)).resolves.toBeUndefined();
    expect(store.get(authStatusAtom)).toBe("failed");
    expect(store.get(specsErrorAtom)).toBe("사용자 취소");
  });
});

describe("hydrateAuthStatusAtom", () => {
  it("캐시 토큰이 있으면 authenticated로 전이한다", async () => {
    client.setHasCachedToken(true);
    await store.set(hydrateAuthStatusAtom);
    expect(store.get(authStatusAtom)).toBe("authenticated");
  });

  it("캐시 토큰이 없으면 idle을 유지한다", async () => {
    client.setHasCachedToken(false);
    await store.set(hydrateAuthStatusAtom);
    expect(store.get(authStatusAtom)).toBe("idle");
  });
});

describe("스펙 캐시 복원", () => {
  it("loadSpecs 성공 시 캐시에 스냅샷을 기록한다", async () => {
    client.setSpecs([sampleSpec]);
    await store.set(loadSpecsAtom);
    expect(await client.getCachedSpecs()).toEqual([sampleSpec]);
  });

  it("hydrateSpecsFromCache는 캐시가 있으면 specsAtom을 채우고 loaded로 전이한다", async () => {
    client.setCachedSpecsValue([sampleSpec]);
    await store.set(hydrateSpecsFromCacheAtom);
    expect(store.get(specsAtom)).toEqual([sampleSpec]);
    expect(store.get(specsLoadStateAtom)).toBe("loaded");
  });

  it("캐시가 비어있으면 상태를 그대로 둔다", async () => {
    client.setCachedSpecsValue(null);
    await store.set(hydrateSpecsFromCacheAtom);
    expect(store.get(specsAtom)).toEqual([]);
    expect(store.get(specsLoadStateAtom)).toBe("idle");
  });
});

describe("loadSpecsAtom → authStatus 파생", () => {
  it("스펙 로드가 성공하면 authenticated로 간주한다", async () => {
    client.setSpecs([sampleSpec]);
    await store.set(loadSpecsAtom);
    expect(store.get(authStatusAtom)).toBe("authenticated");
  });

  it("스펙 로드가 실패하면 authStatus는 변경되지 않는다", async () => {
    client.setLoadSpecsError(new Error("네트워크"));
    await store.set(loadSpecsAtom);
    expect(store.get(authStatusAtom)).toBe("idle");
  });
});

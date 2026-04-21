// liveReportAtom hydrate·파생 검증.

import { createStore } from "jotai";
import { beforeEach, describe, expect, it } from "vitest";

import type { RecordingSession } from "@/types/event.ts";
import type { EventSpec } from "@/types/spec.ts";
import type { ValidationReport } from "@/types/validation.ts";

import { backgroundClientAtom } from "./client-atom.ts";
import {
  hydrateLiveReportAtom,
  liveReportAtom,
  liveResultsByNameAtom,
  liveStatsAtom,
} from "./live-report-atoms.ts";
import { recordingSessionAtom } from "./recording-atoms.ts";
import { createFakeBackgroundClient } from "./test-fixtures.test-util.ts";

function makeSpec(name: string): EventSpec {
  return {
    amplitudeEventName: name,
    humanEventName: name,
    pageName: "page",
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
  };
}

function makeSession(overrides: Partial<RecordingSession> = {}): RecordingSession {
  return {
    id: "s1",
    startedAt: 1,
    endedAt: undefined,
    tabId: 1,
    targetEventNames: [],
    capturedCount: 0,
    ...overrides,
  };
}

function makeReport(): ValidationReport {
  const specA = makeSpec("a");
  const specB = makeSpec("b");
  return {
    sessionId: "s1",
    generatedAt: 1,
    session: makeSession(),
    results: [
      { spec: specA, captured: [], issues: [], status: "pass" },
      { spec: specB, captured: [], issues: [], status: "fail" },
    ],
    unexpected: [],
    stats: {
      totalCaptured: 0,
      totalSpecs: 2,
      pass: 1,
      fail: 1,
      notCollected: 0,
      suspectDuplicate: 0,
    },
  };
}

let store: ReturnType<typeof createStore>;

beforeEach(() => {
  store = createStore();
});

describe("hydrateLiveReportAtom", () => {
  it("idle phase에서는 스냅샷을 요청하지 않고 null을 유지한다", async () => {
    const client = createFakeBackgroundClient();
    client.setValidationSnapshot(makeReport());
    store.set(backgroundClientAtom, client);
    await store.set(hydrateLiveReportAtom);
    expect(store.get(liveReportAtom)).toBeNull();
  });

  it("recording phase에서는 스냅샷을 가져와 저장한다", async () => {
    const client = createFakeBackgroundClient();
    const report = makeReport();
    client.setValidationSnapshot(report);
    store.set(backgroundClientAtom, client);
    store.set(recordingSessionAtom, {
      session: makeSession(),
      capturedCount: 0,
      targetEventNames: [],
    });
    await store.set(hydrateLiveReportAtom);
    expect(store.get(liveReportAtom)).toBe(report);
  });
});

describe("liveStatsAtom", () => {
  it("스냅샷이 없으면 0을 돌려준다", () => {
    expect(store.get(liveStatsAtom)).toEqual({
      pass: 0,
      fail: 0,
      notCollected: 0,
      suspectDuplicate: 0,
    });
  });

  it("스냅샷의 stats를 그대로 노출한다", () => {
    store.set(liveReportAtom, makeReport());
    expect(store.get(liveStatsAtom)).toEqual({
      pass: 1,
      fail: 1,
      notCollected: 0,
      suspectDuplicate: 0,
    });
  });
});

describe("liveResultsByNameAtom", () => {
  it("amplitudeEventName을 키로 매핑한다", () => {
    store.set(liveReportAtom, makeReport());
    const map = store.get(liveResultsByNameAtom);
    expect(map.get("a")?.status).toBe("pass");
    expect(map.get("b")?.status).toBe("fail");
  });
});

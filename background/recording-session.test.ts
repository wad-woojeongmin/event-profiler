// 녹화 세션 상태 머신 단위 테스트.
//
// 포트는 in-memory fake만 주입 — I/O 없음. `SCREENSHOT_DEBOUNCE_MS`는 실제값
// (500ms)을 유지하고 clock을 수동 주입해 디바운스 경계를 관찰한다.

import { beforeEach, describe, expect, it } from "vitest";

import type { CapturedEvent, RecordingSession } from "@/types/event.ts";

import type {
  EventReader,
  EventWriter,
} from "./ports/event-store.ts";
import type { ScreenshotCapture } from "./ports/screenshot-capture.ts";
import type {
  ScreenshotReader,
  ScreenshotWriter,
} from "./ports/screenshot-store.ts";
import type { SessionStore } from "./ports/session-store.ts";
import { createRecordingSession } from "./recording-session.ts";
import {
  createScreenshotScheduler,
  type ScreenshotScheduler,
} from "./screenshot-scheduler.ts";

interface TestContext {
  events: CapturedEvent[];
  screenshots: Map<string, Blob>;
  session: { value: RecordingSession | null };
  eventStore: EventWriter & EventReader;
  screenshotStore: ScreenshotWriter & ScreenshotReader;
  sessionStore: SessionStore;
  captures: Array<{ tabId: number; result: Blob | null }>;
  scheduler: ScreenshotScheduler;
  clock: { now: number };
  uuids: { next: () => string };
  capture: ScreenshotCapture;
}

function makeContext(options?: {
  captureResults?: Array<Blob | null>;
}): TestContext {
  const events: CapturedEvent[] = [];
  const screenshots = new Map<string, Blob>();
  const session = { value: null as RecordingSession | null };

  const eventStore: EventWriter & EventReader = {
    async add(event) {
      const i = events.findIndex((e) => e.id === event.id);
      if (i >= 0) events[i] = event;
      else events.push(event);
    },
    async clear() {
      events.length = 0;
    },
    async listBySession() {
      return events.slice();
    },
  };

  const screenshotStore: ScreenshotWriter & ScreenshotReader = {
    async save(id, blob) {
      screenshots.set(id, blob);
    },
    async load(id) {
      return screenshots.get(id) ?? null;
    },
    async clear() {
      screenshots.clear();
    },
  };

  const sessionStore: SessionStore = {
    async getRecording() {
      return session.value;
    },
    async setRecording(s) {
      session.value = s;
    },
  };

  const results = options?.captureResults ?? [];
  const captures: Array<{ tabId: number; result: Blob | null }> = [];
  let captureIdx = 0;
  const capture: ScreenshotCapture = {
    async capture(tabId) {
      // `results[i]`가 의도적으로 `null`(실패 시나리오)일 수 있어 `??`로
      // 폴백하면 실패 신호가 흡수된다. 명시적 길이 비교로 구분한다.
      const hasExplicit = captureIdx < results.length;
      const next = hasExplicit
        ? (results[captureIdx] as Blob | null)
        : new Blob(["img"]);
      captureIdx += 1;
      captures.push({ tabId, result: next });
      return next;
    },
  };

  let uuidIdx = 0;
  const uuids = {
    next: () => {
      uuidIdx += 1;
      return `uuid-${uuidIdx}`;
    },
  };

  const clock = { now: 1_000 };

  const scheduler = createScreenshotScheduler({
    capture,
    writer: screenshotStore,
    uuid: uuids.next,
  });

  return {
    events,
    screenshots,
    session,
    eventStore,
    screenshotStore,
    sessionStore,
    captures,
    scheduler,
    clock,
    uuids,
    capture,
  };
}

function makeEventPayload(
  overrides?: Partial<Omit<CapturedEvent, "id" | "screenshotId">>,
): Omit<CapturedEvent, "id" | "screenshotId"> {
  return {
    provider: "amplitude",
    eventName: "shopDetail_view",
    params: { a: 1 },
    timestamp: 1_000,
    pageUrl: "https://example.com",
    pageTitle: "Example",
    tabId: 42,
    ...overrides,
  };
}

describe("recording-session", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = makeContext();
  });

  it("녹화 시작 시 targetEventNames·tabId가 기록되고 기존 데이터는 비워진다", async () => {
    // 이전 세션의 잔여 데이터를 흉내내고, startRecording이 이를 실제로 비우는지 확인.
    ctx.events.push({
      id: "old",
      provider: "amplitude",
      eventName: "old",
      params: {},
      timestamp: 1,
      pageUrl: "",
      pageTitle: "",
      tabId: 1,
      screenshotId: undefined,
    });
    ctx.screenshots.set("old-shot", new Blob(["x"]));

    const controller = createRecordingSession({
      sessionStore: ctx.sessionStore,
      eventWriter: ctx.eventStore,
      eventReader: ctx.eventStore,
      screenshotWriter: ctx.screenshotStore,
      scheduler: ctx.scheduler,
      now: () => ctx.clock.now,
      uuid: ctx.uuids.next,
    });

    await controller.startRecording({
      targetEventNames: ["a", "b"],
      tabId: 99,
    });

    expect(ctx.events).toHaveLength(0);
    expect(ctx.screenshots.size).toBe(0);
    expect(ctx.session.value).not.toBeNull();
    expect(ctx.session.value?.targetEventNames).toEqual(["a", "b"]);
    expect(ctx.session.value?.tabId).toBe(99);
    expect(ctx.session.value?.startedAt).toBe(1_000);
    expect(ctx.session.value?.capturedCount).toBe(0);
  });

  it("녹화 중이 아니면 captureEvent는 drop", async () => {
    const controller = createRecordingSession({
      sessionStore: ctx.sessionStore,
      eventWriter: ctx.eventStore,
      eventReader: ctx.eventStore,
      screenshotWriter: ctx.screenshotStore,
      scheduler: ctx.scheduler,
      now: () => ctx.clock.now,
      uuid: ctx.uuids.next,
    });

    await controller.captureEvent(makeEventPayload());

    expect(ctx.events).toHaveLength(0);
    expect(ctx.captures).toHaveLength(0);
  });

  it("녹화 종료 후 수신한 이벤트도 drop", async () => {
    const controller = createRecordingSession({
      sessionStore: ctx.sessionStore,
      eventWriter: ctx.eventStore,
      eventReader: ctx.eventStore,
      screenshotWriter: ctx.screenshotStore,
      scheduler: ctx.scheduler,
      now: () => ctx.clock.now,
      uuid: ctx.uuids.next,
    });

    await controller.startRecording({ targetEventNames: ["a"], tabId: 1 });
    await controller.stopRecording();
    await controller.captureEvent(makeEventPayload());

    expect(ctx.events).toHaveLength(0);
  });

  it("10건 captureEvent → 10건 저장 + capturedCount 10", async () => {
    const controller = createRecordingSession({
      sessionStore: ctx.sessionStore,
      eventWriter: ctx.eventStore,
      eventReader: ctx.eventStore,
      screenshotWriter: ctx.screenshotStore,
      scheduler: ctx.scheduler,
      now: () => ctx.clock.now,
      uuid: ctx.uuids.next,
    });

    await controller.startRecording({ targetEventNames: ["a"], tabId: 1 });

    // 각 호출 간격 600ms > 500ms 디바운스 창 → 매번 새 스크린샷.
    for (let i = 0; i < 10; i += 1) {
      ctx.clock.now += 600;
      await controller.captureEvent(makeEventPayload({ eventName: "a" }));
    }

    expect(ctx.events).toHaveLength(10);
    expect(ctx.session.value?.capturedCount).toBe(10);
    const ids = ctx.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(10);
  });

  it("500ms 디바운스: 연속 이벤트는 같은 screenshotId를 공유", async () => {
    const controller = createRecordingSession({
      sessionStore: ctx.sessionStore,
      eventWriter: ctx.eventStore,
      eventReader: ctx.eventStore,
      screenshotWriter: ctx.screenshotStore,
      scheduler: ctx.scheduler,
      now: () => ctx.clock.now,
      uuid: ctx.uuids.next,
    });

    await controller.startRecording({ targetEventNames: ["a"], tabId: 1 });

    ctx.clock.now = 10_000;
    await controller.captureEvent(makeEventPayload());
    ctx.clock.now = 10_100; // +100ms
    await controller.captureEvent(makeEventPayload());
    ctx.clock.now = 10_400; // +300ms (여전히 debounce 창 내부)
    await controller.captureEvent(makeEventPayload());
    ctx.clock.now = 10_901; // >500ms 경과 → 새 캡처
    await controller.captureEvent(makeEventPayload());

    expect(ctx.captures).toHaveLength(2);
    const shotIds = ctx.events.map((e) => e.screenshotId);
    expect(shotIds[0]).toBeDefined();
    expect(shotIds[0]).toBe(shotIds[1]);
    expect(shotIds[0]).toBe(shotIds[2]);
    expect(shotIds[3]).not.toBe(shotIds[0]);
  });

  it("스크린샷 캡처가 실패하면 이전 id 재사용, 최초 실패 시 undefined", async () => {
    ctx = makeContext({
      captureResults: [null, new Blob(["img"]), null],
    });

    const controller = createRecordingSession({
      sessionStore: ctx.sessionStore,
      eventWriter: ctx.eventStore,
      eventReader: ctx.eventStore,
      screenshotWriter: ctx.screenshotStore,
      scheduler: ctx.scheduler,
      now: () => ctx.clock.now,
      uuid: ctx.uuids.next,
    });

    await controller.startRecording({ targetEventNames: ["a"], tabId: 1 });

    ctx.clock.now = 20_000;
    await controller.captureEvent(makeEventPayload()); // 1st: capture null → undefined
    ctx.clock.now = 21_000;
    await controller.captureEvent(makeEventPayload()); // 2nd: capture ok → new id
    ctx.clock.now = 22_000;
    await controller.captureEvent(makeEventPayload()); // 3rd: capture null → reuse 2nd id

    const shots = ctx.events.map((e) => e.screenshotId);
    expect(shots[0]).toBeUndefined();
    expect(shots[1]).toBeDefined();
    expect(shots[2]).toBe(shots[1]);
  });

  it("stopRecording은 endedAt을 세팅하고 중복 호출은 무시", async () => {
    const controller = createRecordingSession({
      sessionStore: ctx.sessionStore,
      eventWriter: ctx.eventStore,
      eventReader: ctx.eventStore,
      screenshotWriter: ctx.screenshotStore,
      scheduler: ctx.scheduler,
      now: () => ctx.clock.now,
      uuid: ctx.uuids.next,
    });

    await controller.startRecording({ targetEventNames: ["a"], tabId: 1 });
    ctx.clock.now = 2_000;
    await controller.stopRecording();
    const firstEndedAt = ctx.session.value?.endedAt;
    ctx.clock.now = 5_000;
    await controller.stopRecording();

    expect(firstEndedAt).toBe(2_000);
    expect(ctx.session.value?.endedAt).toBe(2_000);
  });

  it("getState: 세션 없음/있음 두 경우를 올바르게 투영", async () => {
    const controller = createRecordingSession({
      sessionStore: ctx.sessionStore,
      eventWriter: ctx.eventStore,
      eventReader: ctx.eventStore,
      screenshotWriter: ctx.screenshotStore,
      scheduler: ctx.scheduler,
      now: () => ctx.clock.now,
      uuid: ctx.uuids.next,
    });

    const empty = await controller.getState();
    expect(empty).toEqual({
      session: null,
      capturedCount: 0,
      targetEventNames: [],
    });

    await controller.startRecording({
      targetEventNames: ["x", "y"],
      tabId: 7,
    });
    ctx.clock.now += 600;
    await controller.captureEvent(makeEventPayload({ eventName: "x" }));

    const state = await controller.getState();
    expect(state.session).not.toBeNull();
    expect(state.capturedCount).toBe(1);
    expect(state.targetEventNames).toEqual(["x", "y"]);
  });

  it("clearSession: 이벤트·스크린샷·세션 모두 비움", async () => {
    const controller = createRecordingSession({
      sessionStore: ctx.sessionStore,
      eventWriter: ctx.eventStore,
      eventReader: ctx.eventStore,
      screenshotWriter: ctx.screenshotStore,
      scheduler: ctx.scheduler,
      now: () => ctx.clock.now,
      uuid: ctx.uuids.next,
    });

    await controller.startRecording({ targetEventNames: ["a"], tabId: 1 });
    ctx.clock.now += 600;
    await controller.captureEvent(makeEventPayload());
    ctx.clock.now += 600;
    await controller.captureEvent(makeEventPayload());

    await controller.clearSession();

    expect(ctx.events).toHaveLength(0);
    expect(ctx.screenshots.size).toBe(0);
    expect(ctx.session.value).toBeNull();
  });
});

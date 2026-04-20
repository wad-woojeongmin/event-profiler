// 녹화 세션 상태 머신.
//
// 이 파일은 포트(저장소·스크린샷)에만 의존하는 "순수 로직"이다. `browser.*`,
// `wxt/storage`, IndexedDB를 직접 참조하지 않는다. 테스트는 in-memory fake
// 포트를 주입하여 I/O 없이 수행한다.

import type { CapturedEvent, RecordingSession } from "@/types/event.ts";
import type { RecordingSessionState } from "@/types/messages.ts";

import type { EventReader, EventWriter } from "./ports/event-store.ts";
import type { ScreenshotWriter } from "./ports/screenshot-store.ts";
import type { SessionStore } from "./ports/session-store.ts";
import type { ScreenshotScheduler } from "./screenshot-scheduler.ts";

export interface RecordingSessionDeps {
  sessionStore: SessionStore;
  eventWriter: EventWriter;
  eventReader: EventReader;
  screenshotWriter: ScreenshotWriter;
  scheduler: ScreenshotScheduler;
  /** 기본값은 `Date.now`. 테스트에서 고정 clock 주입. */
  now?: () => number;
  /** 기본값은 `crypto.randomUUID`. */
  uuid?: () => string;
}

export interface RecordingSessionController {
  /** 이전 세션이 있으면 clear 후 새 세션을 만든다. */
  startRecording(input: {
    targetEventNames: string[];
    tabId: number;
  }): Promise<void>;
  /** 이미 종료된 세션에 다시 호출하면 no-op. */
  stopRecording(): Promise<void>;
  /** 녹화 중이 아니면 drop. 녹화 중이면 uuid+screenshotId 부여 후 저장. */
  captureEvent(event: Omit<CapturedEvent, "id" | "screenshotId">): Promise<void>;
  /** Popup UI 복원용 스냅샷. */
  getState(): Promise<RecordingSessionState>;
  /** 이벤트/스크린샷/세션 메타를 모두 비운다. */
  clearSession(): Promise<void>;
  /** 현재 세션의 이벤트 목록(세션 없으면 빈 배열). */
  listCurrentEvents(): Promise<CapturedEvent[]>;
}

export function createRecordingSession(
  deps: RecordingSessionDeps,
): RecordingSessionController {
  const nowFn = deps.now ?? (() => Date.now());
  const uuidFn = deps.uuid ?? (() => crypto.randomUUID());

  // 이벤트 수신이 비동기로 몰릴 때 `capturedCount` 업데이트가 겹쳐
  // 집계가 누락되지 않도록 직렬화한다.
  let pending: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const next = pending.then(task, task);
    pending = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };

  const clearSession = (): Promise<void> =>
    enqueue(async () => {
      await deps.eventWriter.clear();
      await deps.screenshotWriter.clear();
      await deps.sessionStore.setRecording(null);
      deps.scheduler.reset();
    });

  return {
    async startRecording(input) {
      await clearSession();
      const session: RecordingSession = {
        id: uuidFn(),
        startedAt: nowFn(),
        endedAt: undefined,
        tabId: input.tabId,
        targetEventNames: [...input.targetEventNames],
        capturedCount: 0,
      };
      await deps.sessionStore.setRecording(session);
    },

    async stopRecording() {
      return enqueue(async () => {
        const current = await deps.sessionStore.getRecording();
        if (!current || current.endedAt !== undefined) return;
        await deps.sessionStore.setRecording({
          ...current,
          endedAt: nowFn(),
        });
        deps.scheduler.reset();
      });
    },

    async captureEvent(event) {
      return enqueue(async () => {
        const current = await deps.sessionStore.getRecording();
        if (!current || current.endedAt !== undefined) return;

        const timestamp = nowFn();
        const screenshotId = await deps.scheduler.scheduleFor(
          event.tabId,
          timestamp,
        );
        const full: CapturedEvent = {
          ...event,
          id: uuidFn(),
          screenshotId,
        };
        await deps.eventWriter.add(full);
        await deps.sessionStore.setRecording({
          ...current,
          capturedCount: current.capturedCount + 1,
        });
      });
    },

    async getState() {
      const current = await deps.sessionStore.getRecording();
      if (!current) {
        return { session: null, capturedCount: 0, targetEventNames: [] };
      }
      return {
        session: current,
        capturedCount: current.capturedCount,
        targetEventNames: current.targetEventNames,
      };
    },

    clearSession,

    async listCurrentEvents() {
      const current = await deps.sessionStore.getRecording();
      if (!current) return [];
      return deps.eventReader.listBySession(current.id);
    },
  };
}

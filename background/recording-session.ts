// 녹화 세션 상태 머신(순수 로직).
//
// 포트에만 의존하므로 `browser.*`·`wxt/storage`·IndexedDB 없이 in-memory fake로
// 테스트한다. 런타임 의존을 추가하려면 어댑터/엔트리포인트로 옮겨야 한다.

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
  /** 테스트용 clock 주입. 기본 `Date.now`. */
  now?: () => number;
  /** 테스트용 고정 id 생성기. 기본 `crypto.randomUUID`. */
  uuid?: () => string;
}

export interface RecordingSessionController {
  /** 기존 세션·이벤트·스크린샷을 모두 지우고 새 세션을 연다. */
  startRecording(input: {
    targetEventNames: string[];
    tabId: number;
  }): Promise<void>;
  /** `endedAt`을 세팅해 녹화 종료. 세션이 없거나 이미 종료됐으면 no-op. */
  stopRecording(): Promise<void>;
  /**
   * 이벤트 1건을 수집한다.
   *
   * 녹화 중이 아니거나 이미 종료됐으면 조용히 drop(M2 컨텐츠 스크립트가 잔존
   * 리스너를 다 끄지 못한 경우에도 안전). 수집 시 id·screenshotId를 부여해 저장하고
   * `capturedCount`를 1 증가.
   */
  captureEvent(event: Omit<CapturedEvent, "id" | "screenshotId">): Promise<void>;
  /** 팝업 UI 복원용 스냅샷. 세션이 없으면 빈 스냅샷. */
  getState(): Promise<RecordingSessionState>;
  /** 세션·이벤트·스크린샷·스케줄러 상태 전부 초기화. */
  clearSession(): Promise<void>;
  /** @returns 현재 세션의 이벤트 목록(timestamp 오름차순). 세션 없으면 빈 배열. */
  listCurrentEvents(): Promise<CapturedEvent[]>;
}

export function createRecordingSession(
  deps: RecordingSessionDeps,
): RecordingSessionController {
  const nowFn = deps.now ?? (() => Date.now());
  const uuidFn = deps.uuid ?? (() => crypto.randomUUID());

  // captureEvent가 동시에 몰리면 `read-modify-write(capturedCount)` 레이스로
  // 집계가 누락된다. FIFO promise-chain으로 직렬화해 순차 실행을 보장한다.
  let pending: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const next = pending.then(task, task);
    pending = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };

  // clearSession의 "본문"만 담아둔 내부 helper. 호출자가 이미 큐 안이면
  // 이걸 쓰고, 외부에서 호출할 때만 아래 `clearSession`으로 큐에 넣는다.
  // (큐에 들어간 태스크 안에서 다시 큐에 넣으면 자신을 기다리는 데드락이 된다.)
  const clearSessionUnsafe = async (): Promise<void> => {
    await deps.eventWriter.clear();
    await deps.screenshotWriter.clear();
    await deps.sessionStore.setRecording(null);
    deps.scheduler.reset();
  };

  const clearSession = (): Promise<void> => enqueue(clearSessionUnsafe);

  return {
    async startRecording(input) {
      // 전체를 단일 태스크로 묶어 `clear → new session 세팅` 사이로 captureEvent가
      // 끼어들어 `session=null`을 보고 drop되는 경계 레이스를 막는다.
      return enqueue(async () => {
        await clearSessionUnsafe();
        const session: RecordingSession = {
          id: uuidFn(),
          startedAt: nowFn(),
          endedAt: undefined,
          tabId: input.tabId,
          targetEventNames: [...input.targetEventNames],
          capturedCount: 0,
        };
        await deps.sessionStore.setRecording(session);
      });
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

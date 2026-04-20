// ReportAssembler 통합 테스트.
//
// 순수 어셈블은 assemble.test.ts가 커버하므로 여기서는 포트 조립·사전 조건·
// 스크린샷 base64 변환 경로를 본다. 스토리지 영역은 호출자(entrypoint)의 책임이라
// 이 테스트는 in-memory fake 포트만 주입한다.

import { describe, expect, it } from "vitest";

import type { ScreenshotReader } from "@/background/index.ts";
import type { RecordingSessionState } from "@/types/messages.ts";
import type { ReportData, SpecsCachePayload } from "@/types/storage.ts";
import {
  makeEvent,
  makeSession,
  makeSpec,
} from "@/validator/test-fixtures.test-util.ts";

import { createReportAssembler } from "./report-assembler.ts";
import type { ReportWriter } from "./ports/report-writer.ts";
import type { SpecsCacheReader } from "./ports/specs-cache-reader.ts";

function makeWriter(): ReportWriter & { last: ReportData | null } {
  const state: { last: ReportData | null } = { last: null };
  return {
    async write(report) {
      state.last = report;
    },
    get last() {
      return state.last;
    },
  };
}

function makeSpecsReader(payload: SpecsCachePayload): SpecsCacheReader {
  return { async read() { return payload; } };
}

function makeScreenshotReader(
  map: Record<string, Blob>,
): ScreenshotReader {
  return {
    async load(id) {
      return map[id] ?? null;
    },
  };
}

describe("createReportAssembler", () => {
  it("세션이 없으면 null 반환 + reportData write하지 않음", async () => {
    const writer = makeWriter();
    const assembler = createReportAssembler({
      specsCacheReader: makeSpecsReader([makeSpec()]),
      screenshotReader: makeScreenshotReader({}),
      reportWriter: writer,
      sessionSource: {
        async getState(): Promise<RecordingSessionState> {
          return { session: null, capturedCount: 0, targetEventNames: [] };
        },
        async listCurrentEvents() { return []; },
      },
    });
    expect(await assembler.run()).toBeNull();
    expect(writer.last).toBeNull();
  });

  it("specsCache가 null/빈배열이면 null 반환", async () => {
    const writer = makeWriter();
    const session = makeSession({ targetEventNames: ["evt"] });
    const assembler = createReportAssembler({
      specsCacheReader: makeSpecsReader(null),
      screenshotReader: makeScreenshotReader({}),
      reportWriter: writer,
      sessionSource: {
        async getState() {
          return {
            session,
            capturedCount: 0,
            targetEventNames: session.targetEventNames,
          };
        },
        async listCurrentEvents() { return []; },
      },
    });
    expect(await assembler.run()).toBeNull();
    expect(writer.last).toBeNull();
  });

  it("스크린샷을 base64 data URL로 변환해 write한다", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });
    const session = makeSession({ targetEventNames: ["evt"] });
    const event = makeEvent({
      id: "e1",
      eventName: "evt",
      screenshotId: "s1",
    });
    const writer = makeWriter();

    const assembler = createReportAssembler({
      specsCacheReader: makeSpecsReader([
        makeSpec({ amplitudeEventName: "evt" }),
      ]),
      screenshotReader: makeScreenshotReader({ s1: blob }),
      reportWriter: writer,
      sessionSource: {
        async getState() {
          return {
            session,
            capturedCount: 1,
            targetEventNames: session.targetEventNames,
          };
        },
        async listCurrentEvents() { return [event]; },
      },
    });

    const data = await assembler.run();
    expect(data).not.toBeNull();
    expect(data?.report.results[0]?.status).toBe("pass");
    expect(data?.screenshotDataUrls["s1"]).toMatch(/^data:image\/jpeg;base64,/);
    expect(writer.last).toBe(data);
  });

  it("스크린샷 load 실패는 해당 id만 드롭하고 어셈블은 완료된다", async () => {
    const session = makeSession({ targetEventNames: ["evt"] });
    const good = new Blob([new Uint8Array([9])], { type: "image/jpeg" });
    const events = [
      makeEvent({ id: "e1", eventName: "evt", screenshotId: "ok" }),
      makeEvent({ id: "e2", eventName: "evt", screenshotId: "miss" }),
    ];
    const writer = makeWriter();
    const assembler = createReportAssembler({
      specsCacheReader: makeSpecsReader([
        makeSpec({ amplitudeEventName: "evt" }),
      ]),
      screenshotReader: makeScreenshotReader({ ok: good }),
      reportWriter: writer,
      sessionSource: {
        async getState() {
          return {
            session,
            capturedCount: 2,
            targetEventNames: session.targetEventNames,
          };
        },
        async listCurrentEvents() { return events; },
      },
    });

    const data = await assembler.run();
    expect(data?.screenshotDataUrls).toHaveProperty("ok");
    expect(data?.screenshotDataUrls).not.toHaveProperty("miss");
  });
});

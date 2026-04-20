import { describe, expect, it } from "vitest";
import { defaultRules } from "./rules/index.ts";
import {
  makeEvent,
  makeSession,
  makeSpec,
} from "./test-fixtures.test-util.ts";
import { validate } from "./validator.ts";

describe("validate — 통합", () => {
  it("기본 규칙 세트로 정상 케이스는 pass 처리", () => {
    const specs = [makeSpec({ amplitudeEventName: "a", params: ["k"] })];
    const events = [makeEvent({ eventName: "a", params: { k: "v" } })];
    const report = validate(
      specs,
      events,
      ["a"],
      makeSession(),
      defaultRules,
    );
    expect(report.results).toHaveLength(1);
    expect(report.results[0]?.status).toBe("pass");
    expect(report.results[0]?.issues).toEqual([]);
    expect(report.unexpected).toEqual([]);
  });

  it("상태 우선순위: not_collected > suspect_duplicate > fail > pass", () => {
    const base = 1_700_000_000_000;
    const specs = [
      makeSpec({ amplitudeEventName: "missing" }),
      makeSpec({ amplitudeEventName: "dup" }),
      makeSpec({ amplitudeEventName: "broken", params: ["k"] }),
      makeSpec({ amplitudeEventName: "ok", params: ["k"] }),
    ];
    const events = [
      makeEvent({ id: "d1", eventName: "dup", timestamp: base }),
      makeEvent({ id: "d2", eventName: "dup", timestamp: base + 100 }),
      makeEvent({ id: "b1", eventName: "broken", params: {} }),
      makeEvent({ id: "o1", eventName: "ok", params: { k: "v" } }),
    ];
    const report = validate(
      specs,
      events,
      ["missing", "dup", "broken", "ok"],
      makeSession(),
      defaultRules,
    );
    const byName = new Map(
      report.results.map((r) => [r.spec.amplitudeEventName, r]),
    );
    expect(byName.get("missing")?.status).toBe("not_collected");
    expect(byName.get("dup")?.status).toBe("suspect_duplicate");
    expect(byName.get("broken")?.status).toBe("fail");
    expect(byName.get("ok")?.status).toBe("pass");
  });

  it("같은 이벤트가 여러 번 발생하면 captured에 모두 누적", () => {
    const specs = [makeSpec({ amplitudeEventName: "a" })];
    const events = [
      makeEvent({ id: "1", eventName: "a", timestamp: 1_000 }),
      makeEvent({ id: "2", eventName: "a", timestamp: 2_000 }),
      makeEvent({ id: "3", eventName: "a", timestamp: 3_000 }),
    ];
    const report = validate(
      specs,
      events,
      ["a"],
      makeSession(),
      defaultRules,
    );
    expect(report.results[0]?.captured).toHaveLength(3);
  });

  it("R5 — targetEventNames에 없는 수집 이벤트는 unexpected에 모인다", () => {
    const specs = [makeSpec({ amplitudeEventName: "selected" })];
    const events = [
      makeEvent({ id: "s", eventName: "selected" }),
      makeEvent({ id: "x1", eventName: "other_1" }),
      makeEvent({ id: "x2", eventName: "other_2" }),
    ];
    const report = validate(
      specs,
      events,
      ["selected"],
      makeSession(),
      defaultRules,
    );
    expect(report.unexpected.map((e) => e.id)).toEqual(["x1", "x2"]);
  });

  it("stats 집계 정확성", () => {
    const base = 1_700_000_000_000;
    const specs = [
      makeSpec({ amplitudeEventName: "miss" }),
      makeSpec({ amplitudeEventName: "dup" }),
      makeSpec({ amplitudeEventName: "bad", params: ["k"] }),
      makeSpec({ amplitudeEventName: "good", params: ["k"] }),
    ];
    const events = [
      makeEvent({ id: "d1", eventName: "dup", timestamp: base }),
      makeEvent({ id: "d2", eventName: "dup", timestamp: base + 50 }),
      makeEvent({ id: "b1", eventName: "bad", params: {} }),
      makeEvent({ id: "g1", eventName: "good", params: { k: "v" } }),
    ];
    const report = validate(
      specs,
      events,
      ["miss", "dup", "bad", "good"],
      makeSession(),
      defaultRules,
    );
    expect(report.stats).toEqual({
      totalCaptured: 4,
      totalSpecs: 4,
      pass: 1,
      fail: 1,
      notCollected: 1,
      suspectDuplicate: 1,
    });
  });

  it("session.id가 report.sessionId에 반영되고 session 본체는 그대로 포함", () => {
    const session = makeSession({ id: "sess-42" });
    const report = validate([], [], [], session, defaultRules);
    expect(report.sessionId).toBe("sess-42");
    expect(report.session).toBe(session);
  });

  it("규칙 주입으로 OCP — 커스텀 규칙 1개만 주입 가능", () => {
    const specs = [makeSpec({ amplitudeEventName: "a" })];
    const events = [makeEvent({ eventName: "a" })];
    const report = validate(
      specs,
      events,
      ["a"],
      makeSession(),
      [
        {
          code: "param_unreferenced",
          evaluate: () => [
            {
              type: "param_unreferenced",
              severity: "info",
              message: "injected",
            },
          ],
        },
      ],
    );
    expect(report.results[0]?.issues).toHaveLength(1);
    expect(report.results[0]?.issues[0]?.message).toBe("injected");
  });

  it("1000건 이벤트 × 100개 스펙 규모 검증은 500ms 이하", () => {
    const specCount = 100;
    const eventCount = 1000;
    const specs = Array.from({ length: specCount }, (_, i) =>
      makeSpec({ amplitudeEventName: `ev_${i}`, params: ["k"] }),
    );
    const targetNames = specs.map((s) => s.amplitudeEventName);
    const events = Array.from({ length: eventCount }, (_, i) =>
      makeEvent({
        id: `e-${i}`,
        eventName: `ev_${i % specCount}`,
        params: { k: `v${i}` },
        timestamp: 1_700_000_000_000 + i * 10,
      }),
    );

    const start = performance.now();
    const report = validate(
      specs,
      events,
      targetNames,
      makeSession(),
      defaultRules,
    );
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(report.results).toHaveLength(specCount);
    expect(report.stats.totalCaptured).toBe(eventCount);
  });
});

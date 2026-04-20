import { describe, expect, it } from "vitest";
import { makeEvent, makeSpec } from "../test-fixtures.ts";
import type { ValidationContext } from "../ports/validation-rule.ts";
import { emptyParamRule } from "./empty-param.ts";
import { missingParamRule } from "./missing-param.ts";
import { notCollectedRule } from "./not-collected.ts";
import { paramUnreferencedRule } from "./param-unreferenced.ts";
import {
  suspectDuplicateRule,
  SUSPECT_DUPLICATE_THRESHOLD_MS,
} from "./suspect-duplicate.ts";

function ctxWith(
  captured: ReturnType<typeof makeEvent>[],
  spec = makeSpec(),
  allCaptured = captured,
  targetEventNames: Iterable<string> = [spec.amplitudeEventName],
): ValidationContext {
  return {
    spec,
    captured,
    allCaptured,
    targetEventNames: new Set(targetEventNames),
  };
}

describe("R1 notCollectedRule", () => {
  it("수집 0건이면 not_collected 이슈 1개를 낸다", () => {
    const issues = notCollectedRule.evaluate(ctxWith([]));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe("not_collected");
    expect(issues[0]?.severity).toBe("info");
  });

  it("1건이라도 수집되면 빈 배열을 반환한다", () => {
    const issues = notCollectedRule.evaluate(ctxWith([makeEvent()]));
    expect(issues).toEqual([]);
  });
});

describe("R2 missingParamRule", () => {
  it("스펙 params에 있지만 이벤트에 key 없음 → warning 이슈", () => {
    const spec = makeSpec({ params: ["shopRef", "category"] });
    const event = makeEvent({ params: { shopRef: "r1" } });
    const issues = missingParamRule.evaluate(ctxWith([event], spec));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe("missing_param");
    expect(issues[0]?.severity).toBe("warning");
    expect(issues[0]?.param).toBe("category");
  });

  it("모든 key가 있으면 이슈 없음", () => {
    const spec = makeSpec({ params: ["shopRef"] });
    const event = makeEvent({ params: { shopRef: "r1" } });
    expect(missingParamRule.evaluate(ctxWith([event], spec))).toEqual([]);
  });

  it("여러 이벤트 중 한 건이라도 key가 없으면 이슈 발생, 동일 param은 dedupe", () => {
    const spec = makeSpec({ params: ["shopRef"] });
    const events = [
      makeEvent({ id: "a", params: { shopRef: "r1" } }),
      makeEvent({ id: "b", params: {} }),
      makeEvent({ id: "c", params: {} }),
    ];
    const issues = missingParamRule.evaluate(ctxWith(events, spec));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.param).toBe("shopRef");
  });

  it("스펙 params가 비어있거나 captured 0건이면 이슈 없음", () => {
    expect(
      missingParamRule.evaluate(ctxWith([makeEvent()], makeSpec({ params: [] }))),
    ).toEqual([]);
    expect(
      missingParamRule.evaluate(ctxWith([], makeSpec({ params: ["x"] }))),
    ).toEqual([]);
  });
});

describe("R3 emptyParamRule", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["빈 문자열", ""],
  ])("%s 값이면 empty_param 이슈", (_label, value) => {
    const spec = makeSpec({ params: ["shopRef"] });
    const event = makeEvent({ params: { shopRef: value } });
    const issues = emptyParamRule.evaluate(ctxWith([event], spec));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe("empty_param");
    expect(issues[0]?.severity).toBe("warning");
    expect(issues[0]?.param).toBe("shopRef");
  });

  it("0/false 등 falsy 값은 유효한 값으로 취급", () => {
    const spec = makeSpec({ params: ["count", "flag"] });
    const event = makeEvent({ params: { count: 0, flag: false } });
    expect(emptyParamRule.evaluate(ctxWith([event], spec))).toEqual([]);
  });

  it("key 자체가 없는 경우는 R2 소관이므로 R3는 이슈 없음", () => {
    const spec = makeSpec({ params: ["shopRef"] });
    const event = makeEvent({ params: {} });
    expect(emptyParamRule.evaluate(ctxWith([event], spec))).toEqual([]);
  });
});

describe("R4 suspectDuplicateRule", () => {
  it("500ms 이내 연속 발생 → suspect_duplicate 이슈", () => {
    const base = 1_700_000_000_000;
    const events = [
      makeEvent({ id: "a", timestamp: base }),
      makeEvent({ id: "b", timestamp: base + 100 }),
    ];
    const issues = suspectDuplicateRule.evaluate(ctxWith(events));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe("suspect_duplicate");
    expect(issues[0]?.severity).toBe("warning");
  });

  it("임계값(500ms) 이상이면 이슈 없음", () => {
    const base = 1_700_000_000_000;
    const events = [
      makeEvent({ id: "a", timestamp: base }),
      makeEvent({
        id: "b",
        timestamp: base + SUSPECT_DUPLICATE_THRESHOLD_MS,
      }),
    ];
    expect(suspectDuplicateRule.evaluate(ctxWith(events))).toEqual([]);
  });

  it("정렬 순서와 무관하게 쌍 검출", () => {
    const base = 1_700_000_000_000;
    const events = [
      makeEvent({ id: "late", timestamp: base + 100 }),
      makeEvent({ id: "early", timestamp: base }),
    ];
    expect(suspectDuplicateRule.evaluate(ctxWith(events))).toHaveLength(1);
  });

  it("3연속 발생 시 2개의 인접 쌍 이슈 생성", () => {
    const base = 1_700_000_000_000;
    const events = [
      makeEvent({ id: "a", timestamp: base }),
      makeEvent({ id: "b", timestamp: base + 100 }),
      makeEvent({ id: "c", timestamp: base + 200 }),
    ];
    expect(suspectDuplicateRule.evaluate(ctxWith(events))).toHaveLength(2);
  });

  it("수집 2건 미만이면 이슈 없음", () => {
    expect(suspectDuplicateRule.evaluate(ctxWith([]))).toEqual([]);
    expect(suspectDuplicateRule.evaluate(ctxWith([makeEvent()]))).toEqual([]);
  });
});

describe("R6 paramUnreferencedRule", () => {
  it("수집된 key가 스펙에 없으면 info 이슈", () => {
    const spec = makeSpec({ params: ["shopRef"] });
    const event = makeEvent({ params: { shopRef: "r1", referrer: "x" } });
    const issues = paramUnreferencedRule.evaluate(ctxWith([event], spec));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe("param_unreferenced");
    expect(issues[0]?.severity).toBe("info");
    expect(issues[0]?.param).toBe("referrer");
  });

  it("여러 이벤트에 같은 미선언 key가 반복되어도 한 번만 보고", () => {
    const spec = makeSpec({ params: [] });
    const events = [
      makeEvent({ id: "a", params: { foo: 1 } }),
      makeEvent({ id: "b", params: { foo: 2 } }),
    ];
    expect(
      paramUnreferencedRule.evaluate(ctxWith(events, spec)),
    ).toHaveLength(1);
  });

  it("수집 0건이면 이슈 없음", () => {
    expect(
      paramUnreferencedRule.evaluate(ctxWith([], makeSpec({ params: [] }))),
    ).toEqual([]);
  });
});

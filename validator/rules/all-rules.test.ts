import { describe, expect, it } from "vitest";
import type { CapturedEvent } from "../../types/event.ts";
import type { EventSpec } from "../../types/spec.ts";
import type { ValidationReport } from "../../types/validation.ts";
import type { ValidationContext } from "../ports/validation-rule.ts";
import {
  makeEvent,
  makeSession,
  makeSpec,
} from "../test-fixtures.test-util.ts";
import { validate } from "../validator.ts";
import {
  defaultRules,
  emptyParamRule,
  missingParamRule,
  notCollectedRule,
  paramUnreferencedRule,
  suspectDuplicateRule,
  SUSPECT_DUPLICATE_THRESHOLD_MS,
} from "./index.ts";

/**
 * 이 파일은 Validator의 요구사항 명세서다.
 *
 * 아래 describe 블록만 읽고도 다음을 알 수 있어야 한다.
 * - 어떤 문제를 사용자에게 알려주는가 (issue type × severity × status)
 * - severity를 왜 그렇게 정했는가 (info는 상태를 바꾸지 않고, warning은 바꾼다)
 * - 같은 입력에서 여러 규칙이 겹칠 때 어느 쪽이 이슈를 내는가 (R2·R3 역할 분담)
 * - 정상 동작은 어떤 입력과 출력으로 정의되는가
 *
 * 규칙 구현 세부(조기 반환, 경계값 등)는 파일 하단의 "규칙 단위" 블록에만 둔다.
 */

function runValidate(opts: {
  specs: EventSpec[];
  events: CapturedEvent[];
  targetEventNames?: string[];
}): ValidationReport {
  const names =
    opts.targetEventNames ?? opts.specs.map((s) => s.amplitudeEventName);
  return validate(
    opts.specs,
    opts.events,
    names,
    makeSession(),
    defaultRules,
  );
}

function ctxWith(
  captured: CapturedEvent[],
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

describe("Validator 시나리오 — validate() 공개 API", () => {
  describe("정상 경로", () => {
    it("스펙과 수집이 정확히 맞으면 이슈 없이 pass, unexpected도 비어 있다", () => {
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: ["k"] })],
        events: [makeEvent({ eventName: "x", params: { k: "v" } })],
      });
      expect(report.results[0]?.status).toBe("pass");
      expect(report.results[0]?.issues).toEqual([]);
      expect(report.unexpected).toEqual([]);
    });
  });

  describe("R1 미수집 — 선택된 스펙이 한 건도 수집되지 않음", () => {
    it("이슈는 severity=info지만 스펙 상태는 not_collected로 따로 분류된다", () => {
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "page_a_view" })],
        events: [],
      });
      const r = report.results[0];
      expect(r?.status).toBe("not_collected");
      expect(r?.issues).toHaveLength(1);
      expect(r?.issues[0]).toMatchObject({
        type: "not_collected",
        severity: "info",
      });
    });
  });

  describe("R2 파라미터 누락 — 스펙에 선언된 키가 수집 이벤트에 없음", () => {
    it("severity=warning 이슈가 나오고 상태는 fail, 이슈에는 빠진 param 이름이 실려 있다", () => {
      const spec = makeSpec({
        amplitudeEventName: "x",
        params: ["shopRef", "category"],
      });
      const event = makeEvent({
        eventName: "x",
        params: { shopRef: "r1" },
      });
      const report = runValidate({ specs: [spec], events: [event] });
      const r = report.results[0];
      expect(r?.status).toBe("fail");
      expect(r?.issues).toHaveLength(1);
      expect(r?.issues[0]).toMatchObject({
        type: "missing_param",
        severity: "warning",
        param: "category",
      });
    });
  });

  describe("R3 빈 값 — 키는 있지만 값이 undefined/null/빈 문자열", () => {
    it.each([
      ["undefined", undefined],
      ["null", null],
      ["빈 문자열", ""],
    ])("%s 값이면 empty_param 경고가 나오고 상태는 fail", (_label, value) => {
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: ["shopRef"] })],
        events: [makeEvent({ eventName: "x", params: { shopRef: value } })],
      });
      const r = report.results[0];
      expect(r?.status).toBe("fail");
      expect(r?.issues).toHaveLength(1);
      expect(r?.issues[0]).toMatchObject({
        type: "empty_param",
        severity: "warning",
        param: "shopRef",
      });
    });

    it("0과 false는 수량 0이나 플래그 off 같은 정상 업무값이라 유효한 값으로 인정한다", () => {
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: ["count", "flag"] })],
        events: [
          makeEvent({ eventName: "x", params: { count: 0, flag: false } }),
        ],
      });
      expect(report.results[0]?.status).toBe("pass");
      expect(report.results[0]?.issues).toEqual([]);
    });
  });

  describe("R2와 R3 역할 분담 — 같은 입력에서 한 쪽만 이슈를 낸다", () => {
    it("키 자체가 없으면 R2(missing_param)만 이슈를 낸다", () => {
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: ["shopRef"] })],
        events: [makeEvent({ eventName: "x", params: {} })],
      });
      const types = report.results[0]?.issues.map((i) => i.type);
      expect(types).toEqual(["missing_param"]);
    });

    it("키는 있고 값만 빈 문자열이면 R3(empty_param)만 이슈를 낸다", () => {
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: ["shopRef"] })],
        events: [makeEvent({ eventName: "x", params: { shopRef: "" } })],
      });
      const types = report.results[0]?.issues.map((i) => i.type);
      expect(types).toEqual(["empty_param"]);
    });
  });

  describe("R4 과수집 의심 — 같은 이벤트가 500ms 이내에 이어서 발생", () => {
    it("severity=warning 이슈가 나오고 상태는 suspect_duplicate로 따로 분류된다", () => {
      const base = 1_700_000_000_000;
      const events = [
        makeEvent({ id: "a", eventName: "x", timestamp: base }),
        makeEvent({ id: "b", eventName: "x", timestamp: base + 100 }),
      ];
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x" })],
        events,
      });
      const r = report.results[0];
      expect(r?.status).toBe("suspect_duplicate");
      const dups = r?.issues.filter((i) => i.type === "suspect_duplicate");
      expect(dups).toHaveLength(1);
      expect(dups?.[0]?.severity).toBe("warning");
    });

    it("세 번 연속으로 발생하면 이어지는 두 구간 각각을 비교해 이슈 2건이 나온다", () => {
      const base = 1_700_000_000_000;
      const events = [
        makeEvent({ id: "a", eventName: "x", timestamp: base }),
        makeEvent({ id: "b", eventName: "x", timestamp: base + 100 }),
        makeEvent({ id: "c", eventName: "x", timestamp: base + 200 }),
      ];
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x" })],
        events,
      });
      const dups = report.results[0]?.issues.filter(
        (i) => i.type === "suspect_duplicate",
      );
      expect(dups).toHaveLength(2);
    });
  });

  describe("R4와 R2가 함께 발생하는 경우 — 상태는 상위 우선순위에 맞춘다", () => {
    it("중복과 누락이 같이 생기면 이슈는 둘 다 남고, 상태와 stats는 suspect_duplicate 쪽으로만 집계된다", () => {
      const base = 1_700_000_000_000;
      const spec = makeSpec({ amplitudeEventName: "x", params: ["need"] });
      const events = [
        makeEvent({
          id: "a",
          eventName: "x",
          timestamp: base,
          params: {},
        }),
        makeEvent({
          id: "b",
          eventName: "x",
          timestamp: base + 100,
          params: {},
        }),
      ];
      const report = runValidate({ specs: [spec], events });
      const r = report.results[0];
      expect(r?.status).toBe("suspect_duplicate");
      expect(new Set(r?.issues.map((i) => i.type))).toEqual(
        new Set(["missing_param", "suspect_duplicate"]),
      );
      expect(report.stats).toMatchObject({
        pass: 0,
        fail: 0,
        notCollected: 0,
        suspectDuplicate: 1,
      });
    });
  });

  describe("R5 예외 이벤트 — 선택되지 않은 이름이 수집된 경우", () => {
    it("선택된 스펙의 results에는 섞이지 않고 report.unexpected로만 들어간다", () => {
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "selected" })],
        events: [
          makeEvent({ id: "s", eventName: "selected" }),
          makeEvent({ id: "x1", eventName: "other_1" }),
          makeEvent({ id: "x2", eventName: "other_2" }),
        ],
        targetEventNames: ["selected"],
      });
      expect(report.unexpected.map((e) => e.id)).toEqual(["x1", "x2"]);
      expect(report.results[0]?.captured.map((e) => e.id)).toEqual(["s"]);
    });

    it("canonical 이름을 만들 수 없는 이벤트는 원본 eventName으로 대체되어 unexpected에 남는다", () => {
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "shopDetail_view" })],
        events: [
          makeEvent({ eventName: "[Amplitude] Page Viewed", params: {} }),
        ],
      });
      expect(report.results[0]?.status).toBe("not_collected");
      expect(report.unexpected).toHaveLength(1);
      expect(report.unexpected[0]?.eventName).toBe("[Amplitude] Page Viewed");
    });
  });

  describe("R6 미선언 파라미터 — 수집된 키가 스펙에 없음", () => {
    it("severity=info로만 알리고 상태는 바꾸지 않는다 (이유: 시트에 타입/enum이 없어 Phase 2 전까지는 참고 수준)", () => {
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: ["shopRef"] })],
        events: [
          makeEvent({
            eventName: "x",
            params: { shopRef: "r1", referrer: "y" },
          }),
        ],
      });
      const r = report.results[0];
      expect(r?.status).toBe("pass");
      expect(r?.issues).toHaveLength(1);
      expect(r?.issues[0]).toMatchObject({
        type: "param_unreferenced",
        severity: "info",
        param: "referrer",
      });
    });
  });

  describe("Severity 정책 근거", () => {
    it("severity=warning 이슈만 상태를 fail로 바꾸고, info 이슈는 pass 상태를 그대로 둔다", () => {
      // info만 있는 경우: param_unreferenced만 나오고 상태는 pass
      const infoOnly = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: [] })],
        events: [makeEvent({ eventName: "x", params: { extra: "v" } })],
      });
      expect(infoOnly.results[0]?.status).toBe("pass");
      expect(infoOnly.results[0]?.issues[0]?.severity).toBe("info");

      // warning이 하나라도 있으면 상태는 fail
      const withWarning = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: ["need"] })],
        events: [makeEvent({ eventName: "x", params: {} })],
      });
      expect(withWarning.results[0]?.status).toBe("fail");
      expect(withWarning.results[0]?.issues[0]?.severity).toBe("warning");
    });
  });

  describe("중복 보고 억제 정책", () => {
    it("R2·R3·R6은 같은 param이 여러 이벤트에 반복돼도 스펙당 이슈 1건만 낸다", () => {
      // R2: 두 이벤트 모두 need가 없음 → missing_param 1건
      const r2 = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: ["need"] })],
        events: [
          makeEvent({ id: "a", eventName: "x", params: {} }),
          makeEvent({ id: "b", eventName: "x", params: {} }),
        ],
      });
      expect(
        r2.results[0]?.issues.filter((i) => i.type === "missing_param"),
      ).toHaveLength(1);

      // R3: 두 이벤트 모두 need가 빈 문자열 → empty_param 1건
      const r3 = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: ["need"] })],
        events: [
          makeEvent({ id: "a", eventName: "x", params: { need: "" } }),
          makeEvent({ id: "b", eventName: "x", params: { need: "" } }),
        ],
      });
      expect(
        r3.results[0]?.issues.filter((i) => i.type === "empty_param"),
      ).toHaveLength(1);

      // R6: 두 이벤트 모두 extra가 있음 → param_unreferenced 1건
      const r6 = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x", params: [] })],
        events: [
          makeEvent({ id: "a", eventName: "x", params: { extra: 1 } }),
          makeEvent({ id: "b", eventName: "x", params: { extra: 2 } }),
        ],
      });
      expect(
        r6.results[0]?.issues.filter((i) => i.type === "param_unreferenced"),
      ).toHaveLength(1);
    });

    it("R4는 이 정책의 예외 — 가까이 발생한 두 건마다 별도 이슈를 낸다", () => {
      const base = 1_700_000_000_000;
      const events = [
        makeEvent({ id: "a", eventName: "x", timestamp: base }),
        makeEvent({ id: "b", eventName: "x", timestamp: base + 100 }),
        makeEvent({ id: "c", eventName: "x", timestamp: base + 200 }),
        makeEvent({ id: "d", eventName: "x", timestamp: base + 300 }),
      ];
      const report = runValidate({
        specs: [makeSpec({ amplitudeEventName: "x" })],
        events,
      });
      expect(
        report.results[0]?.issues.filter(
          (i) => i.type === "suspect_duplicate",
        ),
      ).toHaveLength(3);
    });
  });

  describe("Taxonomy 키 암묵적 선언 정책", () => {
    it("시트 컬럼 레벨 키(pageName/sectionName/actionName/eventType/logType, 동의어 objectContainer/objectType)는 spec.params에 없어도 R6로 잡히지 않는다", () => {
      // 이 키들은 시트 컬럼으로 선언되어 EventSpec.params에 담기지 않지만
      // 모든 이벤트에 기본으로 실려온다. R6에서 거짓 양성이 되지 않도록 암묵 선언으로 취급.
      const spec = makeSpec({
        amplitudeEventName: "shopDetail_view",
        params: [],
      });
      const event = makeEvent({
        eventName: "view__shopDetail",
        params: {
          pageName: "shopDetail",
          sectionName: "",
          actionName: "",
          eventType: "view",
          logType: "screen",
          objectContainer: "",
          objectType: "",
        },
      });
      const report = runValidate({ specs: [spec], events: [event] });
      const r = report.results[0];
      expect(r?.status).toBe("pass");
      const unreferenced = r?.issues.filter(
        (i) => i.type === "param_unreferenced",
      );
      expect(unreferenced).toEqual([]);
    });

    it("웹앱이 기본으로 싣는 베이스 프로퍼티(앱 환경·유입경로·UTM·object·eventTimeStamp)도 R6로 잡히지 않는다", () => {
      // 이 키들은 시트의 object/extension 셀로 개별 선언되지 않아 EventSpec.params에 담기지 않지만
      // 웹앱이 모든 이벤트에 기본으로 실어 보내므로 R6 거짓 양성이 된다.
      const spec = makeSpec({ amplitudeEventName: "x", params: [] });
      const event = makeEvent({
        eventName: "x",
        params: {
          isNativeApp: true,
          deviceType: "WEB",
          buildVersion: "1.0.0",
          nativeAppVersion: "1.0.0",
          deviceId: "d-1",
          entryHost: "example.com",
          isExternalEntry: false,
          referrerUrl: "https://r.example/",
          referrerDomain: "r.example",
          source: "s",
          medium: "m",
          campaign: "c",
          content: "ct",
          term: "t",
          object: "o",
          eventTimeStamp: 1_700_000_000_000,
        },
      });
      const report = runValidate({ specs: [spec], events: [event] });
      const r = report.results[0];
      expect(r?.status).toBe("pass");
      const unreferenced = r?.issues.filter(
        (i) => i.type === "param_unreferenced",
      );
      expect(unreferenced).toEqual([]);
    });

    it("암묵 선언 목록 밖의 키는 여전히 R6로 잡힌다", () => {
      const spec = makeSpec({
        amplitudeEventName: "shopDetail_view",
        params: [],
      });
      const event = makeEvent({
        eventName: "view__shopDetail",
        params: {
          pageName: "shopDetail",
          eventType: "view",
          unknownKey: "v",
        },
      });
      const report = runValidate({ specs: [spec], events: [event] });
      const r = report.results[0];
      const unreferenced = r?.issues
        .filter((i) => i.type === "param_unreferenced")
        .map((i) => i.param);
      expect(unreferenced).toEqual(["unknownKey"]);
    });
  });

  describe("상태 우선순위 — not_collected > suspect_duplicate > fail > pass", () => {
    it("네 가지 상태가 한 보고서 안에서 각각 맞는 스펙으로 분류된다", () => {
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
      const report = runValidate({ specs, events });
      const byName = new Map(
        report.results.map((r) => [r.spec.amplitudeEventName, r]),
      );
      expect(byName.get("missing")?.status).toBe("not_collected");
      expect(byName.get("dup")?.status).toBe("suspect_duplicate");
      expect(byName.get("broken")?.status).toBe("fail");
      expect(byName.get("ok")?.status).toBe("pass");
    });
  });

  describe("집계 규칙 — 한 스펙은 네 카테고리 중 하나에만 들어간다", () => {
    it("pass + fail + notCollected + suspectDuplicate 합은 totalSpecs와 같다", () => {
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
      const report = runValidate({ specs, events });
      expect(report.stats).toEqual({
        totalCaptured: 4,
        totalSpecs: 4,
        pass: 1,
        fail: 1,
        notCollected: 1,
        suspectDuplicate: 1,
      });
      const s = report.stats;
      expect(s.pass + s.fail + s.notCollected + s.suspectDuplicate).toBe(
        s.totalSpecs,
      );
    });
  });
});

describe("규칙 단위 경계·엣지 (공개 API만으로는 의도가 흐려지는 경우)", () => {
  describe("R4 suspectDuplicateRule — 임계값과 입력 크기", () => {
    it("정확히 임계값(500ms) 간격이면 이슈 없음", () => {
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

    it("시간 역순으로 들어와도 두 건씩 비교해서 검출한다", () => {
      const base = 1_700_000_000_000;
      const events = [
        makeEvent({ id: "late", timestamp: base + 100 }),
        makeEvent({ id: "early", timestamp: base }),
      ];
      expect(suspectDuplicateRule.evaluate(ctxWith(events))).toHaveLength(1);
    });

    it("수집이 2건 미만이면 이슈 없음", () => {
      expect(suspectDuplicateRule.evaluate(ctxWith([]))).toEqual([]);
      expect(
        suspectDuplicateRule.evaluate(ctxWith([makeEvent()])),
      ).toEqual([]);
    });
  });

  describe("R1 notCollectedRule — 단독 동작", () => {
    it("captured 0건이면 이슈 1건, 1건 이상이면 빈 배열", () => {
      expect(notCollectedRule.evaluate(ctxWith([]))).toHaveLength(1);
      expect(notCollectedRule.evaluate(ctxWith([makeEvent()]))).toEqual([]);
    });
  });

  describe("조기 반환 (R2·R3·R6)", () => {
    it("R2: captured 0건이거나 spec.params가 빈 배열이면 이슈 없음", () => {
      expect(
        missingParamRule.evaluate(ctxWith([], makeSpec({ params: ["x"] }))),
      ).toEqual([]);
      expect(
        missingParamRule.evaluate(
          ctxWith([makeEvent()], makeSpec({ params: [] })),
        ),
      ).toEqual([]);
    });

    it("R3: captured 0건이거나 spec.params가 빈 배열이면 이슈 없음", () => {
      expect(
        emptyParamRule.evaluate(ctxWith([], makeSpec({ params: ["x"] }))),
      ).toEqual([]);
      expect(
        emptyParamRule.evaluate(
          ctxWith([makeEvent()], makeSpec({ params: [] })),
        ),
      ).toEqual([]);
    });

    it("R6: captured 0건이면 이슈 없음", () => {
      expect(
        paramUnreferencedRule.evaluate(
          ctxWith([], makeSpec({ params: [] })),
        ),
      ).toEqual([]);
    });
  });
});

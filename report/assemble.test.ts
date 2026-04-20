// 순수 `assemble` 단위 테스트.
//
// I/O 없이 입력값 변환만 검증. `validate()`의 상세 로직은 validator 모듈이
// 이미 커버하므로 여기서는 "입력을 validator에 올바르게 전달하고 스크린샷
// 맵이 결과에 그대로 실리는지"만 본다.

import { describe, expect, it } from "vitest";

import {
  makeEvent,
  makeSession,
  makeSpec,
} from "@/validator/test-fixtures.test-util.ts";
import { defaultRules } from "@/validator/index.ts";

import { assemble } from "./assemble.ts";

describe("assemble", () => {
  it("validate 결과를 report에 담고 screenshotDataUrls를 그대로 보존한다", () => {
    const spec = makeSpec({ amplitudeEventName: "evt", params: [] });
    const event = makeEvent({ eventName: "evt", screenshotId: "s1" });
    const session = makeSession({ targetEventNames: ["evt"] });

    const data = assemble({
      specs: [spec],
      captured: [event],
      targetEventNames: ["evt"],
      session,
      rules: defaultRules,
      screenshotDataUrls: { s1: "data:image/jpeg;base64,AAA" },
    });

    expect(data.report.sessionId).toBe(session.id);
    expect(data.report.results).toHaveLength(1);
    expect(data.report.results[0]?.status).toBe("pass");
    expect(data.screenshotDataUrls).toEqual({
      s1: "data:image/jpeg;base64,AAA",
    });
  });

  it("target에 없는 이벤트는 unexpected로 분류된다", () => {
    const spec = makeSpec({ amplitudeEventName: "wanted" });
    const unexpected = makeEvent({
      id: "evt-unexpected",
      eventName: "rogue",
    });
    const data = assemble({
      specs: [spec],
      captured: [unexpected],
      targetEventNames: ["wanted"],
      session: makeSession({ targetEventNames: ["wanted"] }),
      rules: defaultRules,
      screenshotDataUrls: {},
    });

    expect(data.report.unexpected.map((e) => e.eventName)).toEqual(["rogue"]);
    expect(data.report.results[0]?.status).toBe("not_collected");
  });

  it("빈 스크린샷 맵이면 screenshotDataUrls도 빈 객체", () => {
    const data = assemble({
      specs: [],
      captured: [],
      targetEventNames: [],
      session: makeSession(),
      rules: defaultRules,
      screenshotDataUrls: {},
    });
    expect(data.screenshotDataUrls).toEqual({});
    expect(data.report.stats.totalSpecs).toBe(0);
  });
});

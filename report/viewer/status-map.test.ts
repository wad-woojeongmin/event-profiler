import { describe, expect, it } from "vitest";

import { makeEvent, makeSpec } from "@/validator/test-fixtures.test-util.ts";

import { buildStatusByEventName } from "./status-map.ts";

describe("buildStatusByEventName", () => {
  it("captured의 raw eventName으로 lookup 가능해야 한다", () => {
    // 같은 실수 재발 방지: spec.amplitudeEventName(canonical)과 CapturedEvent.eventName(raw)이
    // 다를 때, 타임라인이 raw로 조회하므로 맵도 raw 기준이어야 한다.
    const map = buildStatusByEventName([
      {
        spec: makeSpec({ amplitudeEventName: "shopDetail_view" }),
        captured: [
          makeEvent({ id: "a", eventName: "view__shopDetail" }),
          makeEvent({ id: "b", eventName: "view__shopDetail" }),
        ],
        issues: [],
        status: "fail",
      },
    ]);
    expect(map.get("view__shopDetail")).toBe("fail");
    expect(map.has("shopDetail_view")).toBe(false);
  });

  it("captured가 없는 결과는 맵에 들어가지 않는다", () => {
    const map = buildStatusByEventName([
      {
        spec: makeSpec({ amplitudeEventName: "no_capture" }),
        captured: [],
        issues: [],
        status: "not_collected",
      },
    ]);
    expect(map.size).toBe(0);
  });

  it("여러 결과의 raw 이름을 모두 채운다", () => {
    const map = buildStatusByEventName([
      {
        spec: makeSpec({ amplitudeEventName: "x_view" }),
        captured: [makeEvent({ id: "1", eventName: "view__x" })],
        issues: [],
        status: "pass",
      },
      {
        spec: makeSpec({ amplitudeEventName: "y_click" }),
        captured: [makeEvent({ id: "2", eventName: "click__y" })],
        issues: [],
        status: "suspect_duplicate",
      },
    ]);
    expect(map.get("view__x")).toBe("pass");
    expect(map.get("click__y")).toBe("suspect_duplicate");
  });
});

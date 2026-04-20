// parseBridgeMessage의 수용 기준 검증:
// - origin 불일치 / source 불일치 / version 불일치 / payload 형태 오류 → null
// - 올바른 메시지만 정규화된 BridgeMessage로 반환

import { describe, expect, it } from "vitest";

import { BRIDGE_SOURCE, BRIDGE_VERSION, parseBridgeMessage } from "./bridge-message.ts";

const ORIGIN = "https://example.catchtable.co.kr";

function validPayload() {
  return {
    source: BRIDGE_SOURCE,
    version: BRIDGE_VERSION,
    payload: {
      provider: "amplitude",
      eventName: "click__banner",
      params: { section: "home", index: 0 },
      timestamp: 1_700_000_000_000,
    },
  };
}

describe("parseBridgeMessage", () => {
  it("유효 메시지는 정규화된 BridgeMessage를 반환", () => {
    const result = parseBridgeMessage(ORIGIN, ORIGIN, validPayload());
    expect(result).toEqual({
      source: BRIDGE_SOURCE,
      version: BRIDGE_VERSION,
      payload: {
        provider: "amplitude",
        eventName: "click__banner",
        params: { section: "home", index: 0 },
        timestamp: 1_700_000_000_000,
      },
    });
  });

  it("cross-origin 스푸핑은 null", () => {
    expect(
      parseBridgeMessage("https://evil.example.com", ORIGIN, validPayload()),
    ).toBeNull();
  });

  it("source 필드가 다른 메시지는 무시", () => {
    const other = { ...validPayload(), source: "other-library" };
    expect(parseBridgeMessage(ORIGIN, ORIGIN, other)).toBeNull();
  });

  it("version이 다르면 무시 (호환성 깨짐 방어)", () => {
    const bumped = { ...validPayload(), version: 2 };
    expect(parseBridgeMessage(ORIGIN, ORIGIN, bumped)).toBeNull();
  });

  it("payload가 없거나 형태가 틀리면 null", () => {
    expect(parseBridgeMessage(ORIGIN, ORIGIN, null)).toBeNull();
    expect(parseBridgeMessage(ORIGIN, ORIGIN, "string")).toBeNull();
    expect(
      parseBridgeMessage(ORIGIN, ORIGIN, { ...validPayload(), payload: null }),
    ).toBeNull();
  });

  it("필수 payload 필드가 빠지면 null", () => {
    const base = validPayload();
    const missingName = {
      ...base,
      payload: { ...base.payload, eventName: 42 },
    };
    const missingTs = {
      ...base,
      payload: { ...base.payload, timestamp: "now" },
    };
    const missingParams = {
      ...base,
      payload: { ...base.payload, params: null },
    };
    const wrongProvider = {
      ...base,
      payload: { ...base.payload, provider: "mixpanel" },
    };
    expect(parseBridgeMessage(ORIGIN, ORIGIN, missingName)).toBeNull();
    expect(parseBridgeMessage(ORIGIN, ORIGIN, missingTs)).toBeNull();
    expect(parseBridgeMessage(ORIGIN, ORIGIN, missingParams)).toBeNull();
    expect(parseBridgeMessage(ORIGIN, ORIGIN, wrongProvider)).toBeNull();
  });

  it("params는 복사되어 원본 mutation에 영향받지 않음", () => {
    const src = validPayload();
    const result = parseBridgeMessage(ORIGIN, ORIGIN, src)!;
    (src.payload.params as Record<string, unknown>)["section"] = "mutated";
    expect(result.payload.params["section"]).toBe("home");
  });
});

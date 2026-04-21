import { describe, expect, it } from "vitest";

import { formatDuration, statusLabel } from "./format.ts";

describe("formatDuration", () => {
  it("0ms는 0분 0초", () => {
    expect(formatDuration(0)).toBe("0분 0초");
  });

  it("1분 미만은 0분으로 표기", () => {
    expect(formatDuration(15_000)).toBe("0분 15초");
  });

  it("1분 이상은 분/초로 분리", () => {
    expect(formatDuration(90_000)).toBe("1분 30초");
  });

  it("음수는 0으로 방어", () => {
    // clock skew로 endedAt < startedAt인 경우를 방어.
    expect(formatDuration(-1_000)).toBe("0분 0초");
  });
});

describe("statusLabel", () => {
  it("모든 상태값에 대응하는 한국어 라벨", () => {
    expect(statusLabel("pass")).toBe("✓ Pass");
    expect(statusLabel("fail")).toBe("✗ Fail");
    expect(statusLabel("not_collected")).toBe("○ 미수집");
    expect(statusLabel("suspect_duplicate")).toBe("⚠ 중복 의심");
  });
});

import { describe, expect, it } from "vitest";

import type { ReportData } from "@/types/storage.ts";
import { makeEvent, makeSession, makeSpec } from "@/validator/test-fixtures.test-util.ts";

import { formatReportAsText } from "./report-text.ts";

function makeReportData(overrides: Partial<ReportData["report"]> = {}): ReportData {
  const session = makeSession({
    startedAt: Date.UTC(2026, 3, 21, 7, 30, 0),
    endedAt: Date.UTC(2026, 3, 21, 7, 34, 52),
  });
  return {
    report: {
      sessionId: session.id,
      generatedAt: Date.UTC(2026, 3, 21, 7, 35, 0),
      session,
      results: [],
      unexpected: [],
      stats: {
        totalCaptured: 0,
        totalSpecs: 0,
        pass: 0,
        fail: 0,
        notCollected: 0,
        suspectDuplicate: 0,
      },
      ...overrides,
    },
    screenshotDataUrls: {},
  };
}

describe("formatReportAsText", () => {
  it("헤더와 요약 줄을 낸다", () => {
    const data = makeReportData({
      stats: {
        totalCaptured: 10,
        totalSpecs: 5,
        pass: 4,
        fail: 0,
        notCollected: 1,
        suspectDuplicate: 0,
      },
    });
    const text = formatReportAsText(data);
    expect(text).toContain("# Event Profiler 리포트");
    expect(text).toContain("녹화: 4:52");
    expect(text).toContain("대상 스펙 5개 · 총 수집 10건");
    expect(text).toContain("Pass 4 (80%)");
    expect(text).toContain("미수집 1 (20%)");
  });

  it("결과를 fail → warn → missing → pass 순으로 정렬한다", () => {
    const passResult = {
      spec: makeSpec({ amplitudeEventName: "a_pass", pageName: "a" }),
      captured: [],
      issues: [],
      status: "pass" as const,
    };
    const failResult = {
      spec: makeSpec({ amplitudeEventName: "z_fail", pageName: "z" }),
      captured: [],
      issues: [
        {
          type: "missing_param" as const,
          severity: "error" as const,
          message: "누락",
        },
      ],
      status: "fail" as const,
    };
    const missingResult = {
      spec: makeSpec({ amplitudeEventName: "m_missing", pageName: "m" }),
      captured: [],
      issues: [],
      status: "not_collected" as const,
    };
    const data = makeReportData({
      results: [passResult, missingResult, failResult],
    });
    const text = formatReportAsText(data);
    const failIdx = text.indexOf("z_fail");
    const missingIdx = text.indexOf("m_missing");
    const passIdx = text.indexOf("a_pass");
    expect(failIdx).toBeLessThan(missingIdx);
    expect(missingIdx).toBeLessThan(passIdx);
  });

  it("이슈와 수집 로그를 함께 렌더한다", () => {
    const data = makeReportData({
      results: [
        {
          spec: makeSpec({
            amplitudeEventName: "shop_click",
            pageName: "shop",
            params: ["shopId", "source"],
          }),
          captured: [
            makeEvent({
              id: "e1",
              eventName: "click__shop",
              timestamp: Date.UTC(2026, 3, 21, 7, 30, 30),
              params: { shopId: 48291, source: "gnb" },
            }),
          ],
          issues: [
            {
              type: "missing_param",
              severity: "error",
              param: "source",
              message: "필수 파라미터 누락",
            },
          ],
          status: "fail",
        },
      ],
    });
    const text = formatReportAsText(data);
    expect(text).toContain("### [FAIL] shop_click");
    expect(text).toContain('- [error] "source": 필수 파라미터 누락');
    expect(text).toContain("스펙 params: shopId, source");
    expect(text).toContain("수집 로그:");
    expect(text).toContain('shopId=48291 source="gnb"');
  });

  it("unexpected는 출력하지 않는다", () => {
    const data = makeReportData({
      unexpected: [
        makeEvent({ id: "u1", eventName: "unexpected_evt" }),
      ],
    });
    const text = formatReportAsText(data);
    expect(text).not.toContain("unexpected_evt");
  });
});

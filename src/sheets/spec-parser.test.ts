import { describe, expect, it } from "vitest";
import { parseParams, parseSpecCsv } from "./spec-parser.ts";

function csv(lines: string[]): string {
  return lines.join("\n");
}

const HEADER_LINE_1 =
  ",,,,,,,,,,pageName(as-is),pageName(to-be),sectionName(as-is),sectionName(to-be),actionName(as-is),actionName(to-be),eventType(as-is),eventType(to-be),,,,,,,,,,,,";
const HEADER_LINE_2 =
  "신규로그상태,status,신규로그배포일,version,registeredBy,reviewedBy,appliedAt,로깅구현,로깅확인,event 발생경로,pageName(as-is),pageName(to-be),objectContainer(as-is),objectContainer(to-be),objectType(as-is),objectType(to-be),eventType(as-is),eventType(to-be),logType,eventName,비고,object (string),extension,eventName,eventName,,event 설명,비고";

describe("parseSpecCsv", () => {
  it("parses a basic click event", () => {
    const input = csv([
      HEADER_LINE_1,
      HEADER_LINE_2,
      '검수완료,applied,,0,A,B,2025-09-02,C,D,매장상세,shopDetail,shopDetail,appDown,appDown,app,app,click,click,bottomsheet,click__app,,,"$shopRef, $shopName, $serviceType",shopDetail_appDown_app_click_,shopDetail_appDown_app_click,,,',
    ]);

    const { specs, warnings } = parseSpecCsv(input);
    expect(warnings).toEqual([]);
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({
      amplitudeEventName: "shopDetail_appDown_app_click",
      humanEventName: "click__app",
      pageName: "shopDetail",
      sectionName: "appDown",
      actionName: "app",
      eventType: "click",
      logType: "bottomsheet",
      params: ["shopRef", "shopName", "serviceType"],
    });
  });

  it("prefers to-be over as-is values", () => {
    const input = csv([
      HEADER_LINE_1,
      HEADER_LINE_2,
      "검수완료,applied,,0,A,B,,C,D,E,legacyPage,newPage,oldSec,newSec,oldAct,newAct,impr,click,event,click__foo,,,,,newPage_newSec_newAct_click,,,",
    ]);
    const { specs } = parseSpecCsv(input);
    expect(specs[0]?.pageName).toBe("newPage");
    expect(specs[0]?.sectionName).toBe("newSec");
    expect(specs[0]?.actionName).toBe("newAct");
    expect(specs[0]?.eventType).toBe("click");
  });

  it("falls back to as-is when to-be is empty", () => {
    const input = csv([
      HEADER_LINE_1,
      HEADER_LINE_2,
      "검수완료,applied,,0,A,B,,C,D,E,legacyPage,,oldSec,,oldAct,,click,,event,click__foo,,,,legacyPage_oldSec_oldAct_click_,legacyPage_oldSec_oldAct_click,,,",
    ]);
    const { specs } = parseSpecCsv(input);
    expect(specs[0]?.pageName).toBe("legacyPage");
    expect(specs[0]?.sectionName).toBe("oldSec");
    expect(specs[0]?.actionName).toBe("oldAct");
    expect(specs[0]?.eventType).toBe("click");
  });

  it("skips section anchor rows", () => {
    const input = csv([
      HEADER_LINE_1,
      HEADER_LINE_2,
      ",shopDetail_appInstall,,,,,,,,,,,,,,,,,,,,,,,,,",
      "검수완료,applied,,0,A,B,,C,D,E,shopDetail,shopDetail,x,x,y,y,click,click,event,click__y,,,,shopDetail_x_y_click_,shopDetail_x_y_click,,,",
    ]);
    const { specs, warnings } = parseSpecCsv(input);
    expect(specs).toHaveLength(1);
    expect(warnings.some((w) => w.code === "skipped_anchor_row")).toBe(true);
  });

  it("keeps rows regardless of status value", () => {
    const input = csv([
      HEADER_LINE_1,
      HEADER_LINE_2,
      "작업중,draft,,0,A,B,,C,D,E,shopDetail,shopDetail,x,x,y,y,click,click,event,click__y,,,,shopDetail_x_y_click_,shopDetail_x_y_click,,,",
    ]);
    const { specs } = parseSpecCsv(input);
    expect(specs).toHaveLength(1);
    expect(specs[0]?.status).toBe("draft");
  });

  it("warns when Amplitude event name column is empty", () => {
    const input = csv([
      HEADER_LINE_1,
      HEADER_LINE_2,
      "검수완료,applied,,0,A,B,,C,D,E,main,main,r,r,review,r,impr,impr,event,impr__r,,,,,,,,",
    ]);
    const { specs, warnings } = parseSpecCsv(input);
    expect(specs).toHaveLength(0);
    expect(warnings.some((w) => w.code === "missing_event_name")).toBe(true);
  });
});

describe("parseParams", () => {
  const r = 0;
  const w: never[] = [];

  it("normalizes simple $key tokens and dedupes", () => {
    const warnings: never[] = [];
    const result = parseParams(
      "$shopRef",
      "$shopName, $AB, $AB",
      r,
      warnings as never,
    );
    expect(result.params).toEqual(["shopRef", "shopName", "AB"]);
    expect(result.referencedExtensions).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("drops inline descriptions after colon", () => {
    const result = parseParams("", "$extraInfo: aiSummary, $AB", r, w as never);
    expect(result.params).toEqual(["extraInfo", "AB"]);
  });

  it("captures shared extension references", () => {
    const result = parseParams(
      "",
      "$keyword, [검색 관련 동작 공통 Extension], 지도 관련 동작 공통 Extension",
      r,
      w as never,
    );
    expect(result.params).toEqual(["keyword"]);
    expect(result.referencedExtensions).toEqual([
      "검색 관련 동작 공통 Extension",
      "지도 관련 동작 공통 Extension",
    ]);
  });

  it("preserves dotted paths", () => {
    const result = parseParams("$restaurantItem.shopRef", "", r, w as never);
    expect(result.params).toEqual(["restaurantItem.shopRef"]);
  });

  it("handles newlines inside cells", () => {
    const result = parseParams("", "$a,\n$b\n$c", r, w as never);
    expect(result.params).toEqual(["a", "b", "c"]);
  });

  it("warns on unparseable tokens", () => {
    const warnings: { code: string; detail?: string }[] = [];
    const result = parseParams("", "not a param, $valid", r, warnings as never);
    expect(result.params).toEqual(["valid"]);
    expect(warnings.some((w) => w.code === "param_unparseable_token")).toBe(
      true,
    );
  });
});

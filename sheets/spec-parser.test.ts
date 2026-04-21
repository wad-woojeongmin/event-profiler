import { describe, expect, it } from "vitest";
import { parseParams, parseSpecCsv, parseSpecRows } from "./spec-parser.ts";

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

describe("parseSpecRows", () => {
  // Sheets API `values.get` 응답 형태를 직접 주입하는 경로. parseSpecCsv는
  // 이 함수의 얇은 래퍼이므로 동일 결과를 보장해야 한다.
  it("parses string[][] rows identically to parseSpecCsv", () => {
    const header1 = HEADER_LINE_1.split(",");
    const header2 = HEADER_LINE_2.split(",");
    const dataRow = [
      "검수완료", "applied", "", "0", "A", "B", "2025-09-02", "C", "D",
      "매장상세", "shopDetail", "shopDetail", "appDown", "appDown", "app", "app",
      "click", "click", "bottomsheet", "click__app", "", "",
      "$shopRef, $shopName, $serviceType", "shopDetail_appDown_app_click_",
      "shopDetail_appDown_app_click", "", "", "",
    ];

    const { specs, warnings } = parseSpecRows([header1, header2, dataRow]);
    expect(warnings).toEqual([]);
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({
      amplitudeEventName: "shopDetail_appDown_app_click",
      humanEventName: "click__app",
      pageName: "shopDetail",
      params: ["shopRef", "shopName", "serviceType"],
    });
  });

  // 시트 편집자들이 실제로 남기는 이형 헤더를 관용 처리한다. 헤더 기반 단일
  // 휴리스틱이 Tab 03·07·14·21·22처럼 제각각인 탭을 흡수할 수 있어야 한다.
  it("bare-pair 컨벤션: 접미사 없는 컬럼이 두 번 나오면 1번째=as-is, 2번째=to-be", () => {
    // 헤더: pageName(as-is)/(to-be) 없이 `pageName` 두 번만 등장 (Tab 07 패턴).
    const header = [
      "status",
      "pageName", "pageName",
      "objectContainer", "objectContainer",
      "objectType", "objectType",
      "eventType", "eventType",
      "logType",
      "eventName(Amplitude)",
      "eventName(GA)",
    ];
    const dataRow = [
      "applied",
      "legacyPage", "newPage",
      "legacySec", "newSec",
      "legacyAct", "newAct",
      "impr", "click",
      "event",
      "click__newAct",
      "newPage_newSec_newAct_click",
    ];
    const { specs, warnings } = parseSpecRows([[], header, dataRow]);
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({
      pageName: "newPage",
      sectionName: "newSec",
      actionName: "newAct",
      eventType: "click",
      amplitudeEventName: "newPage_newSec_newAct_click",
      humanEventName: "click__newAct",
    });
    expect(warnings.filter((w) => w.code === "ambiguous_header_resolution"))
      .toHaveLength(0);
  });

  // Tab 14 케이스: `log_type` 언더스코어 표기.
  it("언더스코어·공백이 섞인 헤더를 동치로 처리한다 (`log_type` ↔ `logType`)", () => {
    const header = [
      "pageName(as-is)", "pageName(to-be)",
      "log_type",
      "eventName",
      "eventName(GA)",
    ];
    const dataRow = [
      "oldPage", "newPage",
      "event",
      "click__thing",
      "newPage_thing_click",
    ];
    const { specs } = parseSpecRows([[], header, dataRow]);
    expect(specs).toHaveLength(1);
    expect(specs[0]?.logType).toBe("event");
  });

  // Tab 22 케이스: eventName(GA) 레이블이 맨 앞(col 0)에서 canonical을 담고,
  // eventName(Amplitude) 레이블이 human을 담는 반전 배치.
  it("eventName 컬럼 레이블이 swap되어도 값 패턴으로 canonical을 식별한다", () => {
    const header = [
      "eventName(GA)", "event 발생경로",
      "pageName", "pageName",
      "objectContainer", "objectContainer",
      "objectType", "objectType",
      "eventType", "eventType",
      "logType",
      "eventName(Amplitude)",
    ];
    const dataRow = [
      "bookmarkDone_bookmark_click", "저장 바텀시트 > 북마크",
      "", "",
      "bookmarkDone", "bookmarkDone",
      "bookmark", "bookmark",
      "click", "click",
      "event",
      "click__bookmark",
    ];
    const { specs } = parseSpecRows([[], header, dataRow]);
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({
      amplitudeEventName: "bookmarkDone_bookmark_click",
      humanEventName: "click__bookmark",
      sectionName: "bookmarkDone",
      actionName: "bookmark",
      eventType: "click",
    });
  });

  // Tab 21 케이스: 헤더가 truncate되어 canonical eventName 컬럼이 헤더에
  // 선언조차 되어 있지 않다. 헤더 범위 밖 셀을 fallback으로 탐색해 복구한다.
  it("헤더가 data rows보다 짧게 truncate되어도 canonical eventName을 복구한다", () => {
    const header = [
      "status",
      "pageName(as-is)", "pageName",
      "objectContainer(as-is)", "objectContainer",
      "objectType(as-is)", "objectType",
      "eventType(as-is)", "eventType",
      "logType",
      "eventName(Amplitude)",
    ];
    // 데이터 행에 헤더에 없는 뒤쪽 컬럼이 추가로 있음 (트렁케이트된 실제 시트).
    const dataRow = [
      "applied",
      "shopDetail", "shopDetail",
      "bookmarkDone", "bookmarkDone",
      "memo", "memo",
      "click", "click",
      "bottomsheet",
      "click__memo",
      "", "", "", "", "",
      "$shopRef, $memoEmpty",
      "shopDetail_bookmarkDone_memo_click_",
      "shopDetail_bookmarkDone_memo_click",
    ];
    const { specs } = parseSpecRows([[], header, dataRow]);
    expect(specs).toHaveLength(1);
    expect(specs[0]?.amplitudeEventName).toBe(
      "shopDetail_bookmarkDone_memo_click",
    );
  });

  // 제어문자 `\x08`이 포함된 `\bappliedAt` 같은 헤더는 정규화 단계에서
  // 제거되어 base 필드 매칭을 방해하지 않아야 한다.
  it("제어문자(\\x08)가 섞인 헤더를 무시한다", () => {
    const header = [
      "\bappliedAt",
      "pageName(as-is)", "pageName(to-be)",
      "logType",
      "eventName(Amplitude)",
      "eventName(GA)",
    ];
    const dataRow = [
      "2025-01-01",
      "legacy", "target",
      "event",
      "click__thing",
      "target_thing_click",
    ];
    const { specs } = parseSpecRows([[], header, dataRow]);
    expect(specs).toHaveLength(1);
    expect(specs[0]?.pageName).toBe("target");
  });

  // logType 컬럼이 전혀 없으면 경고로 기록한다 — base 필드 경계를 잃어 Tab 24
  // 같은 "2중 스키마" 탭에서 뒤쪽 블록이 잘못 매칭될 위험이 있어 사용자가
  // 인지할 수 있도록 한다.
  it("logType 컬럼이 없으면 `no_logtype_boundary` 경고를 낸다", () => {
    const header = [
      "pageName(to-be)",
      "eventType(to-be)",
      "eventName(GA)",
    ];
    const dataRow = ["p", "click", "p_thing_click"];
    const { warnings } = parseSpecRows([[], header, dataRow]);
    expect(warnings.some((w) => w.code === "no_logtype_boundary")).toBe(true);
  });
});

import type { CapturedEvent, RecordingSession } from "@/types/event.ts";
import type { EventSpec } from "@/types/spec.ts";
import type {
  ValidationIssue,
  ValidationReport,
  ValidationResult,
} from "@/types/validation.ts";
import { fakeEventSpecs } from "./event-specs.ts";

// 녹화 시작 시점. 데모에서는 약 3분 전에 시작된 것으로 가정.
const SESSION_START = Date.now() - 3 * 60 * 1000;

// 시간 진행을 초 단위 오프셋으로 표현하여 가짜 captured event 타임라인 구성.
function capturedAt(offsetSec: number): number {
  return SESSION_START + offsetSec * 1000;
}

const fakeSession: RecordingSession = {
  id: "demo-session-1",
  startedAt: SESSION_START,
  endedAt: SESSION_START + 180_000,
  tabId: 1,
  targetEventNames: fakeEventSpecs.map((s) => s.amplitudeEventName),
  capturedCount: 9,
};

// 의도적으로 다양한 결과를 섞어 데모가 풍부해 보이도록 구성.
// - banner click: pass
// - reserve click: missing_param (partySize 없음)
// - cuisine click: suspect_duplicate (500ms 내 중복)
// - reviewItem view: pass
// - carousel swipe: empty_param (direction = '')
// - confirm click: not_collected (수집 0건)
// - logout click: not_collected
// - viewMode toggle: pass
// - 추가로 target에 없는 home_footer_link_click이 들어옴 → unexpected
const fakeCaptured: CapturedEvent[] = [
  {
    id: "c-1",
    provider: "amplitude",
    eventName: "shopList_appDown_banner_click",
    params: { shopListId: "sl-42", bannerId: "b-3", position: 0 },
    timestamp: capturedAt(2),
    pageUrl: "https://www.catchtable.co.kr/shopList",
    pageTitle: "샵리스트",
    tabId: 1,
    screenshotId: "shot-1",
  },
  {
    id: "c-2",
    provider: "amplitude",
    eventName: "shopDetail_hero_reserve_click",
    params: { shopId: "shop-77", reserveType: "now" }, // partySize 누락
    timestamp: capturedAt(12),
    pageUrl: "https://www.catchtable.co.kr/shop/shop-77",
    pageTitle: "샵 상세",
    tabId: 1,
    screenshotId: "shot-2",
  },
  {
    id: "c-3",
    provider: "amplitude",
    eventName: "searchList_filter_cuisine_click",
    params: { cuisineType: "korean", selectedCount: 1 },
    timestamp: capturedAt(30),
    pageUrl: "https://www.catchtable.co.kr/search",
    pageTitle: "검색",
    tabId: 1,
    screenshotId: "shot-3",
  },
  {
    id: "c-4",
    provider: "amplitude",
    eventName: "searchList_filter_cuisine_click",
    params: { cuisineType: "korean", selectedCount: 1 },
    timestamp: capturedAt(30.3), // 300ms 뒤 중복
    pageUrl: "https://www.catchtable.co.kr/search",
    pageTitle: "검색",
    tabId: 1,
    screenshotId: "shot-3",
  },
  {
    id: "c-5",
    provider: "amplitude",
    eventName: "shopDetail_reviewList_item_view",
    params: { shopId: "shop-77", reviewId: "r-19", rating: 4.5 },
    timestamp: capturedAt(55),
    pageUrl: "https://www.catchtable.co.kr/shop/shop-77",
    pageTitle: "샵 상세 / 리뷰",
    tabId: 1,
    screenshotId: "shot-4",
  },
  {
    id: "c-6",
    provider: "amplitude",
    eventName: "home_mainBanner_carousel_swipe",
    params: { bannerIndex: 2, direction: "" }, // 빈 값
    timestamp: capturedAt(78),
    pageUrl: "https://www.catchtable.co.kr",
    pageTitle: "홈",
    tabId: 1,
    screenshotId: "shot-5",
  },
  {
    id: "c-7",
    provider: "amplitude",
    eventName: "shopList_viewMode_toggle_click",
    params: { currentMode: "list", nextMode: "map" },
    timestamp: capturedAt(110),
    pageUrl: "https://www.catchtable.co.kr/shopList",
    pageTitle: "샵리스트",
    tabId: 1,
    screenshotId: "shot-6",
  },
  {
    id: "c-8",
    provider: "amplitude",
    eventName: "home_footer_link_click", // unexpected (target에 없음)
    params: { linkId: "help" },
    timestamp: capturedAt(140),
    pageUrl: "https://www.catchtable.co.kr",
    pageTitle: "홈",
    tabId: 1,
    screenshotId: "shot-7",
  },
  {
    id: "c-9",
    provider: "amplitude",
    eventName: "shopList_appDown_banner_click",
    params: { shopListId: "sl-42", bannerId: "b-3", position: 0 },
    timestamp: capturedAt(165),
    pageUrl: "https://www.catchtable.co.kr/shopList",
    pageTitle: "샵리스트",
    tabId: 1,
    screenshotId: "shot-1",
  },
];

function byName(name: string) {
  const spec = fakeEventSpecs.find((s) => s.amplitudeEventName === name);
  if (!spec) throw new Error(`fixture 누락: ${name}`);
  return spec;
}

function capturedFor(name: string) {
  return fakeCaptured.filter((c) => c.eventName === name);
}

function result(
  spec: EventSpec,
  captured: CapturedEvent[],
  issues: ValidationIssue[],
  status: ValidationResult["status"],
): ValidationResult {
  return { spec, captured, issues, status };
}

const results: ValidationResult[] = [
  result(
    byName("shopList_appDown_banner_click"),
    capturedFor("shopList_appDown_banner_click"),
    [],
    "pass",
  ),
  result(
    byName("shopDetail_hero_reserve_click"),
    capturedFor("shopDetail_hero_reserve_click"),
    [
      {
        type: "missing_param",
        severity: "warning",
        param: "partySize",
        message: "스펙에 선언된 파라미터 `partySize`가 수집 이벤트에 없습니다.",
      },
    ],
    "fail",
  ),
  result(
    byName("searchList_filter_cuisine_click"),
    capturedFor("searchList_filter_cuisine_click"),
    [
      {
        type: "suspect_duplicate",
        severity: "warning",
        message: "500ms 내에 2회 이상 발생 (과수집 의심).",
      },
    ],
    "suspect_duplicate",
  ),
  result(
    byName("shopDetail_reviewList_item_view"),
    capturedFor("shopDetail_reviewList_item_view"),
    [],
    "pass",
  ),
  result(
    byName("home_mainBanner_carousel_swipe"),
    capturedFor("home_mainBanner_carousel_swipe"),
    [
      {
        type: "empty_param",
        severity: "warning",
        param: "direction",
        message: "`direction` 값이 비어 있습니다.",
      },
    ],
    "fail",
  ),
  result(
    byName("checkout_orderSummary_confirm_click"),
    [],
    [
      {
        type: "not_collected",
        severity: "info",
        message: "녹화 기간 중 수집되지 않았습니다.",
      },
    ],
    "not_collected",
  ),
  result(
    byName("myPage_settings_logout_click"),
    [],
    [
      {
        type: "not_collected",
        severity: "info",
        message: "녹화 기간 중 수집되지 않았습니다.",
      },
    ],
    "not_collected",
  ),
  result(
    byName("shopList_viewMode_toggle_click"),
    capturedFor("shopList_viewMode_toggle_click"),
    [],
    "pass",
  ),
];

const unexpected: CapturedEvent[] = fakeCaptured.filter(
  (c) => !fakeEventSpecs.some((s) => s.amplitudeEventName === c.eventName),
);

export const fakeValidationReport: ValidationReport = {
  sessionId: fakeSession.id,
  generatedAt: fakeSession.endedAt ?? Date.now(),
  session: fakeSession,
  results,
  unexpected,
  stats: {
    totalCaptured: fakeCaptured.length,
    totalSpecs: fakeEventSpecs.length,
    pass: results.filter((r) => r.status === "pass").length,
    fail: results.filter((r) => r.status === "fail").length,
    notCollected: results.filter((r) => r.status === "not_collected").length,
    suspectDuplicate: results.filter((r) => r.status === "suspect_duplicate").length,
  },
};

export { fakeSession, fakeCaptured };

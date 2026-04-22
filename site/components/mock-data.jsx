// Mock data for the Event Profiler screens

const MOCK_SELECTED = [
  { name: 'done__update', page: 'app', full: 'app_currentLocation_update_done', status: 'missing', count: 0, issues: 1 },
  { name: 'view__shopCompare', page: 'shopCompare', full: 'shopCompare_view', status: 'pass', count: 4, issues: 0 },
  { name: 'click__share', page: 'shopCompare', full: 'shopCompare_share_click', status: 'pass', count: 1, issues: 0 },
  { name: 'impr__shop', page: 'shopCompare', full: 'shopCompare_shop_impr', status: 'pass', count: 8, issues: 0 },
  { name: 'click__delete', page: 'shopCompare', full: 'shopCompare_shop_delete_click', status: 'warn', count: 1, issues: 2, note: '파라미터 "shopRef"가 수집되었으나 스펙에 선언되지 않았습니다' },
];

const MOCK_UNSELECTED = [
  { name: 'impr__',        page: 'main', full: 'main_splash_impr' },
  { name: 'click__confirm',page: 'main', full: 'main_permissionPopup_confirm_click' },
  { name: 'click__granted',page: 'main', full: 'main_locationPopup_granted_click' },
  { name: 'click__denied', page: 'main', full: 'main_locationPopup_denied_click' },
  { name: 'view__main',    page: 'main', full: 'main_view' },
  { name: 'click__searchInput', page: 'main', full: 'main_topGNB_searchInput_click' },
  { name: 'view__home',    page: 'home', full: 'home_view' },
  { name: 'impr__banner',  page: 'home', full: 'home_banner_impr' },
];

const MOCK_EXCEPTIONS = [
  { name: 'searchList_list_shop_click', page: 'searchList · list', time: '04:32:03' },
  { name: '[Amplitude] Page Viewed', page: '—', time: '04:32:03' },
  { name: 'shopDetail_view', page: 'shopDetail', time: '04:32:03' },
  { name: 'shopDetail_top_shopPic_impr', page: 'shopDetail · top', time: '04:32:04' },
  { name: 'shopDetail_pickTogether_impr', page: 'shopDetail · pickTogether', time: '04:32:04' },
  { name: 'shopDetail_top_award_impr', page: 'shopDetail · top', time: '04:32:04' },
  { name: 'shopDetail_top_tvList_impr', page: 'shopDetail · top', time: '04:32:04' },
  { name: 'shopDetail_top_callBtn_impr', page: 'shopDetail · top', time: '04:32:04' },
  { name: 'shopDetail_top_review_impr', page: 'shopDetail · top', time: '04:32:04' },
  { name: 'shopDetail_top_bizSummary_impr', page: 'shopDetail · top', time: '04:32:05' },
  { name: 'shopDetail_top_locationBtn_impr', page: 'shopDetail · top', time: '04:32:05' },
  { name: 'shopDetail_top_priceInfo_impr', page: 'shopDetail · top', time: '04:32:05' },
  { name: 'shopDetail_facility_impr', page: 'shopDetail · facility', time: '04:32:05' },
];

// Live stream for recording screen (newest first)
const MOCK_STREAM = [
  { t: '04:34:41', name: 'shopCompare_shop_impr',        status: 'pass', params: { shopId: '48291', position: 3 } },
  { t: '04:34:39', name: 'shopCompare_shop_delete_click',status: 'warn', params: { shopId: '48291', shopRef: 'list' } },
  { t: '04:34:37', name: 'shopCompare_shop_impr',        status: 'pass', params: { shopId: '31077', position: 2 } },
  { t: '04:34:35', name: 'shopDetail_view',              status: 'exception', params: { shopId: '48291' } },
  { t: '04:34:33', name: 'shopCompare_share_click',      status: 'pass', params: { shopId: '48291' } },
  { t: '04:34:31', name: 'shopCompare_view',             status: 'pass', params: { source: 'gnb' } },
  { t: '04:34:29', name: 'main_topGNB_searchInput_click',status: 'exception', params: {} },
  { t: '04:34:27', name: 'shopCompare_shop_impr',        status: 'pass', params: { shopId: '22041', position: 1 } },
  { t: '04:34:25', name: 'shopCompare_view',             status: 'pass', params: { source: 'home' } },
];

// Timeline events — one entry per event occurrence (instantaneous).
const MOCK_TIMELINE = [
  { lane: 'view__shopCompare', t: 2,   status: 'pass' },
  { lane: 'view__shopCompare', t: 14,  status: 'pass' },
  { lane: 'view__shopCompare', t: 165, status: 'pass' },
  { lane: 'view__shopCompare', t: 268, status: 'pass' },

  { lane: 'click__share', t: 22, status: 'pass' },

  { lane: 'impr__shop', t: 3,   status: 'pass' },
  { lane: 'impr__shop', t: 4,   status: 'pass' },
  { lane: 'impr__shop', t: 8,   status: 'pass' },
  { lane: 'impr__shop', t: 15,  status: 'pass' },
  { lane: 'impr__shop', t: 170, status: 'pass' },
  { lane: 'impr__shop', t: 172, status: 'pass' },
  { lane: 'impr__shop', t: 268, status: 'pass' },
  { lane: 'impr__shop', t: 270, status: 'pass' },

  { lane: 'click__delete', t: 258, status: 'warn' },
];

const LANES = ['view__shopCompare', 'click__share', 'impr__shop', 'click__delete', 'done__update'];

window.MOCK = { MOCK_SELECTED, MOCK_UNSELECTED, MOCK_EXCEPTIONS, MOCK_STREAM, MOCK_TIMELINE, LANES };

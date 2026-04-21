// 녹화 중 대시보드 스타일.
//
// 상태 배지 색은 리포트 뷰어(`report/viewer/results-table.css.ts`)와 시각적 톤을
// 맞췄다. 색 값이 바뀌면 양쪽을 함께 수정할 것.

import { style, styleVariants } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

// wrapper 자체는 스크롤하지 않는다 — 안쪽 specList/unexpectedBody가 각각
// overflow를 갖고 필요한 만큼만 잡아먹는다. wrapper가 overflow:auto면 긴 목록이
// 전체 대시보드를 밀어 footer가 뷰포트 밖으로 사라지는 원래 이슈가 돌아온다.
export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  padding: vars.space.lg,
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
});

// 대시보드 안의 고정 높이 섹션(헤더·메타·카드·검색·예외 테이블 등)이 공통으로
// 참조. flex 컨텍스트에서 축소되지 않도록 flexShrink:0을 준다. 늘어나는 유일한
// 섹션은 specList.
const staticSection = style({
  flexShrink: 0,
});

export const sectionTitle = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontWeight: vars.font.weight.medium,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

export const sectionHeader = style([
  staticSection,
  {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.sm,
  },
]);

export const metaGrid = style([
  staticSection,
  {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: vars.space.sm,
    fontSize: vars.font.size.sm,
  },
]);

export const metaCell = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const metaLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
});

export const metaValue = style({
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
});

export const statsGrid = style([
  staticSection,
  {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: vars.space.sm,
    "@media": {
      "(min-width: 480px)": {
        gridTemplateColumns: "repeat(4, 1fr)",
      },
    },
  },
]);

const statCardBase = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  padding: vars.space.sm,
  border: "1px solid",
  borderRadius: vars.radius.md,
  background: vars.color.bg,
});

export const statCardVariants = styleVariants({
  notCollected: [
    statCardBase,
    { borderColor: vars.color.border, background: vars.color.surface },
  ],
  fail: [statCardBase, { borderColor: "#fecaca", background: "#fef2f2" }],
  suspectDuplicate: [
    statCardBase,
    { borderColor: "#fed7aa", background: "#fff7ed" },
  ],
  pass: [statCardBase, { borderColor: "#a7f3d0", background: "#ecfdf5" }],
});

export const statCardLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
});

export const statCardValue = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
});

// 선택한 이벤트 정의 상태 리스트 — 대시보드에서 유일하게 flex로 늘어나는 섹션.
// 남는 세로 공간을 채우되, 최대로 늘어났을 때만 내부 스크롤이 생긴다. 스펙이
// 적어서 자연 높이가 더 작으면 그만큼만 차지하고 아래 예외 이벤트 섹션이 붙는다.
export const specList = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
});

export const specRow = style({
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: vars.space.sm,
  padding: vars.space.sm,
  borderBottom: `1px solid ${vars.color.border}`,
  background: vars.color.bg,
  selectors: {
    "&:last-child": { borderBottom: "none" },
  },
});

const statusBadgeBase = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "60px",
  padding: `2px ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  border: "1px solid",
  whiteSpace: "nowrap",
});

export const statusBadgeVariants = styleVariants({
  pass: [
    statusBadgeBase,
    { background: "#ecfdf5", borderColor: "#a7f3d0", color: "#047857" },
  ],
  fail: [
    statusBadgeBase,
    { background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" },
  ],
  not_collected: [
    statusBadgeBase,
    {
      background: vars.color.surface,
      borderColor: vars.color.border,
      color: vars.color.textMuted,
    },
  ],
  suspect_duplicate: [
    statusBadgeBase,
    { background: "#fff7ed", borderColor: "#fed7aa", color: "#c2410c" },
  ],
});

export const specMain = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  minWidth: 0,
});

export const specTitle = style({
  fontWeight: vars.font.weight.medium,
  color: vars.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontSize: vars.font.size.sm,
});

export const specSubtitle = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontFamily: vars.font.mono,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const specMessage = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  marginTop: "2px",
});

export const specMessageFail = style({
  color: "#b91c1c",
});

export const specMessageWarn = style({
  color: "#c2410c",
});

export const specCount = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  whiteSpace: "nowrap",
});

export const unexpectedTable = style([
  staticSection,
  {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    overflow: "hidden",
  },
]);

// 행이 많아져도 헤더는 고정, 본문만 스크롤. gap을 0으로 두고 borderBottom만으로
// 구분해 position:sticky 행이 자연스럽게 맞물린다.
export const unexpectedBody = style({
  display: "flex",
  flexDirection: "column",
  maxHeight: "220px",
  overflowY: "auto",
});

export const unexpectedHeader = style({
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr auto",
  gap: vars.space.sm,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  background: vars.color.surface,
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  borderBottom: `1px solid ${vars.color.border}`,
});

export const unexpectedRow = style({
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr auto",
  gap: vars.space.sm,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontSize: vars.font.size.xs,
  borderBottom: `1px solid ${vars.color.border}`,
  background: vars.color.bg,
  selectors: {
    "&:last-child": { borderBottom: "none" },
  },
});

export const unexpectedCell = style({
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  minWidth: 0,
});

export const unexpectedCellMono = style([
  unexpectedCell,
  { fontFamily: vars.font.mono },
]);

export const emptyState = style({
  padding: vars.space.lg,
  fontSize: vars.font.size.sm,
  color: vars.color.textMuted,
  textAlign: "center",
});

export const searchInput = style([
  staticSection,
  {
    width: "100%",
    padding: `${vars.space.xs} ${vars.space.sm}`,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.sm,
    fontSize: vars.font.size.sm,
    background: vars.color.bg,
    color: vars.color.text,
    selectors: {
      "&:focus": {
        outline: "none",
        borderColor: vars.color.primary,
      },
    },
  },
]);

import { style } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

// 2칼럼 선택 영역. SidebarFrame 스타일처럼 에지까지 꽉 차며 내부 분리는 중앙
// borderRight로 처리한다. 외부 패딩이 없다.
export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  padding: 0,
  flex: 1,
  minHeight: 0,
  background: vars.color.bg,
});

export const columns = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  minHeight: 0,
  flex: 1,
});

export const column = style({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: 0,
  selectors: {
    "&:first-child": {
      borderRight: `1px solid ${vars.color.border}`,
    },
  },
});

// 각 칼럼 헤더: 연회색 배경에 대문자 제목 + 카운트 + 우측 액션 버튼.
export const columnHeader = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 10px",
  background: vars.color.surfaceAlt,
  borderBottom: `1px solid ${vars.color.divider}`,
  flexShrink: 0,
});

export const columnTitle = style({
  fontSize: "10.5px",
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

export const columnCount = style({
  fontSize: "10.5px",
  color: vars.color.textMuted,
  fontVariantNumeric: "tabular-nums",
});

export const columnSpacer = style({
  flex: 1,
});

export const columnAction = style({
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  fontSize: "10.5px",
  padding: "2px 4px",
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  selectors: {
    "&:hover:not(:disabled)": {
      background: vars.color.bg,
      color: vars.color.text,
    },
    "&:disabled": { opacity: 0.4, cursor: "not-allowed" },
  },
});

export const columnActionPrimary = style([
  columnAction,
  {
    color: vars.color.primary,
    fontWeight: vars.font.weight.bold,
  },
]);

// 검색 입력: 헤더/리스트 사이의 별도 밴드. 좌우 8px 여백으로 디자인과 맞춘다.
export const searchPad = style({
  padding: "6px 8px",
  borderBottom: `1px solid ${vars.color.divider}`,
  background: vars.color.bg,
  flexShrink: 0,
});

export const searchInput = style({
  width: "100%",
  padding: `0 ${vars.space.sm}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  fontSize: "10.5px",
  background: vars.color.bg,
  color: vars.color.text,
  height: "24px",
  selectors: {
    "&:focus": {
      outline: "none",
      borderColor: vars.color.primary,
    },
    "&:disabled": { background: vars.color.surface, cursor: "not-allowed" },
  },
});

export const list = style({
  overflowY: "auto",
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  background: vars.color.bg,
});

export const item = style({
  display: "flex",
  alignItems: "flex-start",
  gap: vars.space.sm,
  padding: "7px 10px",
  cursor: "pointer",
  borderBottom: `1px solid ${vars.color.divider}`,
  selectors: {
    "&:hover": { background: vars.color.hover },
  },
});

const checkboxBase = style({
  width: "13px",
  height: "13px",
  borderRadius: "3px",
  flexShrink: 0,
  marginTop: "1px",
  display: "grid",
  placeItems: "center",
  color: "#fff",
});

export const checkboxEmpty = style([
  checkboxBase,
  {
    border: `1.5px solid ${vars.color.borderStrong}`,
    background: "transparent",
  },
]);

export const checkboxChecked = style([
  checkboxBase,
  {
    border: `1.5px solid ${vars.color.primary}`,
    background: vars.color.primary,
  },
]);

export const itemMain = style({
  display: "flex",
  flexDirection: "column",
  gap: "1px",
  minWidth: 0,
  flex: 1,
});

export const itemTitle = style({
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontSize: "11px",
  fontFamily: vars.font.mono,
  letterSpacing: "-0.1px",
});

export const itemSubtitle = style({
  fontSize: "10px",
  color: vars.color.textSubtle,
  fontFamily: vars.font.mono,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const emptyState = style({
  padding: vars.space.lg,
  fontSize: vars.font.size.xs,
  color: vars.color.textSubtle,
  textAlign: "center",
});

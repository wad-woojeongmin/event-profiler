import { style } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  padding: 0,
  flex: 1,
  minHeight: 0,
});

// 좌/우 칼럼 사이에 세로 구분선 하나가 흐르도록 gap 대신 border로 분리한다.
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

export const columnHeader = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: `${vars.space.xs} ${vars.space.sm}`,
  background: vars.color.surface,
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

// 검색 박스: 두 칼럼 경계를 따라가되 칼럼 내부에서 자체 padding을 가진다.
export const searchInput = style({
  width: "calc(100% - 16px)",
  margin: `6px 8px`,
  padding: `2px ${vars.space.sm}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
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

// 칼럼 본문 — 늘어나는 영역은 리스트가 전부 차지한다.
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
  padding: `7px ${vars.space.sm}`,
  cursor: "pointer",
  borderBottom: `1px solid ${vars.color.divider}`,
  selectors: {
    "&:hover": { background: vars.color.surface },
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

export const removeButton = style({
  border: "none",
  background: "transparent",
  color: vars.color.textSubtle,
  fontSize: vars.font.size.md,
  cursor: "pointer",
  padding: "0 4px",
  borderRadius: vars.radius.sm,
  lineHeight: 1,
  selectors: {
    "&:hover": {
      background: vars.color.surface,
      color: vars.color.failText,
    },
  },
});

export const emptyState = style({
  padding: vars.space.lg,
  fontSize: vars.font.size.xs,
  color: vars.color.textSubtle,
  textAlign: "center",
});

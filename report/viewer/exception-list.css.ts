// 예외 이벤트 리스트. 헤더(토글)을 접으면 카드만, 펼치면 리스트 영역이 보인다.

import { style } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const wrap = style({
  background: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.card,
  overflow: "hidden",
});

export const toggle = style({
  width: "100%",
  padding: "12px 16px",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  textAlign: "left",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  color: vars.color.text,
  selectors: {
    "&:hover": { background: vars.color.hover },
    "&:focus-visible": {
      outline: `2px solid ${vars.color.primary}`,
      outlineOffset: "-2px",
    },
  },
});

export const chevron = style({
  width: "12px",
  height: "12px",
  transition: "transform 120ms ease",
  color: vars.color.textSubtle,
  flexShrink: 0,
});

export const chevronOpen = style({
  transform: "rotate(0deg)",
});

export const chevronClosed = style({
  transform: "rotate(-90deg)",
});

export const title = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
});

export const count = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
});

export const spacer = style({ flex: 1 });

export const hint = style({
  fontSize: "10.5px",
  color: vars.color.textSubtle,
});

export const body = style({
  borderTop: `1px solid ${vars.color.divider}`,
  maxHeight: "360px",
  overflow: "auto",
});

export const item = style({
  padding: "6px 16px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  borderBottom: `1px solid ${vars.color.divider}`,
  fontFamily: vars.font.mono,
  fontSize: "11.5px",
  selectors: {
    "&:last-child": { borderBottom: "none" },
  },
});

export const itemTime = style({
  color: vars.color.textSubtle,
  fontVariantNumeric: "tabular-nums",
  flexShrink: 0,
});

export const itemName = style({
  flex: 1,
  color: vars.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const itemPage = style({
  color: vars.color.textMuted,
  fontSize: "10.5px",
});

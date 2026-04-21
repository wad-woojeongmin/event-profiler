import { style } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const wrap = style({
  // 디자인 원본: padding 20 28, bg surface, borderBottom 1px border.
  padding: "20px 28px",
  background: vars.color.surface,
  borderBottom: `1px solid ${vars.color.border}`,
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

export const logo = style({
  width: "32px",
  height: "32px",
  borderRadius: vars.radius.md,
  background: vars.color.text,
  color: "#ffffff",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
});

export const titleBlock = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const title = style({
  margin: 0,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  letterSpacing: "-0.3px",
});

export const subtitle = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.textMuted,
  fontFamily: vars.font.mono,
  fontVariantNumeric: "tabular-nums",
});

export const spacer = style({ flex: 1 });

export const metaRow = style({
  display: "flex",
  gap: "16px",
  alignItems: "center",
});

export const metaCol = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

export const metaLabel = style({
  fontSize: "10.5px",
  fontWeight: vars.font.weight.medium,
  color: vars.color.textMuted,
  letterSpacing: "0.3px",
  textTransform: "uppercase",
});

export const metaValue = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.3px",
});

export const metaValueMono = style({
  fontFamily: vars.font.mono,
});

export const divider = style({
  width: "1px",
  height: "32px",
  background: vars.color.border,
});

const btnBase = style({
  height: "26px",
  padding: "0 8px",
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  borderRadius: vars.radius.md,
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
  border: "1px solid transparent",
  fontFamily: "inherit",
});

export const btnDefault = style([
  btnBase,
  {
    background: vars.color.surface,
    color: vars.color.text,
    borderColor: vars.color.border,
    selectors: {
      "&:hover": { background: vars.color.hover },
    },
  },
]);

export const btnPrimary = style([
  btnBase,
  {
    background: vars.color.primary,
    color: vars.color.primaryText,
    selectors: {
      "&:hover": { background: vars.color.primaryHover },
    },
  },
]);

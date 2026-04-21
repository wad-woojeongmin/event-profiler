import { style } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

export const wrapper = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  background: vars.color.bg,
  borderBottom: `1px solid ${vars.color.border}`,
  flexShrink: 0,
});

export const left = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  minWidth: 0,
  flex: 1,
});

export const title = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const meta = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontVariantNumeric: "tabular-nums",
});

export const metaStrong = style({
  color: vars.color.text,
  fontWeight: vars.font.weight.bold,
  fontVariantNumeric: "tabular-nums",
});

export const refreshButton = style({
  border: `1px solid ${vars.color.border}`,
  background: vars.color.bg,
  color: vars.color.textMuted,
  width: "28px",
  height: "28px",
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  fontSize: "14px",
  display: "inline-grid",
  placeItems: "center",
  flexShrink: 0,
  selectors: {
    "&:hover:not(:disabled)": {
      background: vars.color.surface,
      color: vars.color.text,
    },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  },
});

export const right = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "2px",
  flexShrink: 0,
});

export const selectedCount = style({
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.3px",
  lineHeight: 1,
});

export const selectedLabel = style({
  fontSize: "10px",
  color: vars.color.textSubtle,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

import { style } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const wrap = style({
  width: "100%",
  overflowX: "auto",
});

export const svg = style({
  width: "100%",
  height: "auto",
  display: "block",
});

export const empty = style({
  padding: vars.space.lg,
  textAlign: "center",
  color: vars.color.textMuted,
  fontSize: vars.font.size.sm,
  border: `1px dashed ${vars.color.border}`,
  borderRadius: vars.radius.md,
});

export const laneLine = style({
  stroke: vars.color.border,
  strokeDasharray: "2 3",
});

export const tickLine = style({
  stroke: vars.color.border,
});

export const tickLabel = style({
  fontSize: "10px",
  fill: vars.color.textMuted,
});

export const laneLabel = style({
  fontSize: "11px",
  fill: vars.color.text,
  fontFamily: vars.font.mono,
});

export const dotNormal = style({
  fill: vars.color.primary,
  fillOpacity: 0.8,
  stroke: vars.color.primary,
  strokeWidth: 1,
});

export const dotDuplicate = style({
  fill: vars.color.warning,
  fillOpacity: 0.9,
  stroke: vars.color.warning,
  strokeWidth: 1,
});

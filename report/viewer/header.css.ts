import { style } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const wrap = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  padding: vars.space.lg,
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
});

export const title = style({
  margin: 0,
  fontSize: "22px",
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
});

export const metaGrid = style({
  margin: 0,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: vars.space.md,
});

export const metaItem = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const metaLabel = style({
  margin: 0,
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

export const metaValue = style({
  margin: 0,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.medium,
  color: vars.color.text,
});

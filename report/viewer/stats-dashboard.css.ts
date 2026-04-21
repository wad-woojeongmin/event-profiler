import { style, styleVariants } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: vars.space.md,
});

const baseCard = style({
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
  border: `1px solid ${vars.color.border}`,
  background: vars.color.bg,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
});

export const card = styleVariants({
  pass: [baseCard, { borderColor: vars.color.success }],
  fail: [baseCard, { borderColor: vars.color.danger }],
  dupe: [baseCard, { borderColor: vars.color.warning }],
  miss: [baseCard, { borderColor: vars.color.border }],
});

export const label = style({
  fontSize: vars.font.size.sm,
  color: vars.color.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

export const value = style({
  fontSize: "28px",
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
});

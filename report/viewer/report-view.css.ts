import { style } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const page = style({
  flex: 1,
  padding: `${vars.space.xl} ${vars.space.lg}`,
  background: vars.color.surface,
});

export const container = style({
  maxWidth: "1120px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xl,
});

export const section = style({
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.lg,
  padding: vars.space.lg,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
});

export const sectionTitle = style({
  margin: 0,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
});

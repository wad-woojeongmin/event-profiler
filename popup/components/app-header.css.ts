import { style } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

export const header = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  background: vars.color.surfaceAlt,
  borderBottom: `1px solid ${vars.color.border}`,
  flexShrink: 0,
});

export const logo = style({
  width: "18px",
  height: "18px",
  borderRadius: vars.radius.sm,
  background: vars.color.text,
  color: "#fff",
  display: "grid",
  placeItems: "center",
});

export const title = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  letterSpacing: "-0.1px",
  color: vars.color.text,
});

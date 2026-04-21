import { style } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const note = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.textMuted,
});

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const item = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.sm,
  alignItems: "baseline",
  padding: `${vars.space.sm} ${vars.space.md}`,
  background: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  fontSize: vars.font.size.sm,
});

export const name = style({
  fontFamily: vars.font.mono,
  color: vars.color.text,
});

export const time = style({
  color: vars.color.textMuted,
  fontFamily: vars.font.mono,
  fontSize: vars.font.size.xs,
});

export const url = style({
  color: vars.color.textMuted,
  wordBreak: "break-all",
});

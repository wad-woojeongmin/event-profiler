import { style } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

export const banner = style({
  margin: `0 ${vars.space.lg}`,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface,
  color: vars.color.danger,
  fontSize: vars.font.size.sm,
  lineHeight: 1.4,
  border: `1px solid ${vars.color.danger}`,
});

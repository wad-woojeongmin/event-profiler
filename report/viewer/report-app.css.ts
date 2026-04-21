import { style } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const placeholder = style({
  padding: vars.space.xl,
  textAlign: "center",
  color: vars.color.textMuted,
  fontSize: vars.font.size.md,
});

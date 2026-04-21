import { style, styleVariants } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  padding: vars.space.lg,
  background: vars.color.surface,
});

export const stats = style({
  display: "flex",
  gap: vars.space.md,
  fontSize: vars.font.size.sm,
  color: vars.color.text,
});

export const statLabel = style({
  color: vars.color.textMuted,
  marginRight: vars.space.xs,
});

const baseButton = style({
  border: "1px solid transparent",
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  fontWeight: vars.font.weight.bold,
  cursor: "pointer",
  width: "100%",
  selectors: {
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  },
});

export const buttonVariants = styleVariants({
  start: [
    baseButton,
    {
      background: vars.color.primary,
      color: vars.color.primaryText,
      selectors: { "&:hover:not(:disabled)": { filter: "brightness(0.95)" } },
    },
  ],
  stop: [
    baseButton,
    {
      background: vars.color.danger,
      color: vars.color.primaryText,
    },
  ],
  secondary: [
    baseButton,
    {
      background: vars.color.bg,
      borderColor: vars.color.border,
      color: vars.color.text,
      selectors: { "&:hover:not(:disabled)": { borderColor: vars.color.primary } },
    },
  ],
});

export const buttonRow = style({
  display: "flex",
  gap: vars.space.sm,
  alignItems: "stretch",
});

export const stopCheckbox = style({
  display: "inline-flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  background: vars.color.bg,
  color: vars.color.text,
  cursor: "pointer",
  fontSize: vars.font.size.sm,
  flex: "0 0 auto",
});

export const guardMessage = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.textMuted,
  lineHeight: 1.4,
});

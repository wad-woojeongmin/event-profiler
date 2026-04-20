import { style } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  padding: vars.space.lg,
  borderBottom: `1px solid ${vars.color.border}`,
  background: vars.color.surface,
});

export const row = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
});

export const label = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontWeight: vars.font.weight.medium,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

export const link = style({
  fontSize: vars.font.size.sm,
  color: vars.color.primary,
  textDecoration: "none",
  wordBreak: "break-all",
  selectors: {
    "&:hover": { textDecoration: "underline" },
  },
});

export const button = style({
  border: `1px solid ${vars.color.border}`,
  background: vars.color.bg,
  color: vars.color.text,
  padding: `${vars.space.xs} ${vars.space.md}`,
  borderRadius: vars.radius.sm,
  cursor: "pointer",
  fontWeight: vars.font.weight.medium,
  selectors: {
    "&:hover:not(:disabled)": { borderColor: vars.color.primary },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  },
});

export const primaryButton = style([
  button,
  {
    background: vars.color.primary,
    borderColor: vars.color.primary,
    color: vars.color.primaryText,
    selectors: {
      "&:hover:not(:disabled)": {
        filter: "brightness(0.95)",
      },
    },
  },
]);

export const successButton = style([
  button,
  {
    borderColor: vars.color.success,
    color: vars.color.success,
    fontWeight: vars.font.weight.bold,
  },
]);

export const errorText = style({
  fontSize: vars.font.size.xs,
  color: vars.color.danger,
  wordBreak: "break-word",
});

export const meta = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
});

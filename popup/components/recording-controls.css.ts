import { style, styleVariants } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  padding: vars.space.md,
  background: vars.color.surface,
  borderTop: `1px solid ${vars.color.border}`,
  flexShrink: 0,
});

const baseButton = style({
  border: "1px solid transparent",
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.md,
  height: "40px",
  cursor: "pointer",
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
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
      selectors: {
        "&:hover:not(:disabled)": { background: vars.color.primaryHover },
      },
    },
  ],
  stop: [
    baseButton,
    {
      background: vars.color.failSolid,
      color: vars.color.primaryText,
      selectors: {
        "&:hover:not(:disabled)": { filter: "brightness(0.92)" },
      },
    },
  ],
  secondary: [
    baseButton,
    {
      background: vars.color.bg,
      borderColor: vars.color.border,
      color: vars.color.text,
      selectors: {
        "&:hover:not(:disabled)": { borderColor: vars.color.primary },
      },
    },
  ],
});

export const buttonRow = style({
  display: "flex",
  gap: vars.space.sm,
  alignItems: "stretch",
});

// 첫 번째(secondary) 버튼은 flex:1, 두 번째(stop) 버튼은 flex:2로 우세하게.
// styleVariants의 width:100%이 flex 컨테이너 안에서는 기본 stretch에 무해하다.
export const stopIcon = style({
  width: "10px",
  height: "10px",
  borderRadius: "1px",
  background: "#fff",
  flexShrink: 0,
});

export const recIcon = style({
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#fff",
  flexShrink: 0,
});

export const guardMessage = style({
  margin: 0,
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  lineHeight: 1.4,
  textAlign: "center",
});

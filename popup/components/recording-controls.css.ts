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

// wrapper가 flex column이라 단독 버튼은 stretch로 폭을 채운다(width:100% 불필요).
// buttonRow 안에서는 variants의 flex 비율이 폭을 결정한다.
const baseButton = style({
  border: "1px solid transparent",
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.md,
  height: "40px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  selectors: {
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  },
});

// buttonRow 안에서 "다시 선택"(secondary):"녹화 종료"(stop) = 1:2 폭 비율.
// 단독 사용 시에는 wrapper가 stretch시키므로 flex:1이 있어도 전체 폭을 차지한다.
export const buttonVariants = styleVariants({
  start: [
    baseButton,
    {
      // idle: 단독 버튼. recording_done: buttonRow 안에서 secondary(flex:1)와 1:2.
      flex: 2,
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
      flex: 2,
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
      flex: 1,
      background: vars.color.surface,
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

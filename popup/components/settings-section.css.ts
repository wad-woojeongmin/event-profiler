import { style } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

// Connect 화면은 세로로 길게 늘어지기보다 중앙 카드+하단 CTA 구성이 가독성이
// 좋아서 flex column + spacer로 CTA를 하단으로 밀어낸다.
export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  padding: vars.space.xl,
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  background: vars.color.bg,
});

export const intro = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const heading = style({
  margin: 0,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  letterSpacing: "-0.3px",
  color: vars.color.text,
});

export const description = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: vars.color.textMuted,
  lineHeight: 1.55,
});

export const sheetCard = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  padding: `${vars.space.md} ${vars.space.md}`,
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.sm,
});

export const sheetLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontWeight: vars.font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

export const sheetLink = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textSubtle,
  textDecoration: "none",
  fontFamily: vars.font.mono,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  selectors: {
    "&:hover": { color: vars.color.primary, textDecoration: "underline" },
  },
});

export const sheetLoaded = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  marginTop: vars.space.xs,
  paddingTop: vars.space.xs,
  borderTop: `1px dashed ${vars.color.border}`,
  fontSize: vars.font.size.xs,
  color: vars.color.passText,
});

export const checkMark = style({
  display: "inline-grid",
  placeItems: "center",
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  background: vars.color.passSoft,
  color: vars.color.passText,
  fontSize: "10px",
  fontWeight: vars.font.weight.bold,
});

export const loadedCount = style({
  fontVariantNumeric: "tabular-nums",
  fontWeight: vars.font.weight.bold,
});

export const spacer = style({
  flex: 1,
  minHeight: 0,
});

export const primaryButton = style({
  border: "none",
  background: vars.color.primary,
  color: vars.color.primaryText,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.md,
  height: "40px",
  cursor: "pointer",
  selectors: {
    "&:hover:not(:disabled)": { background: vars.color.primaryHover },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  },
});

export const footnote = style({
  margin: 0,
  textAlign: "center",
  fontSize: vars.font.size.xs,
  color: vars.color.textSubtle,
  lineHeight: 1.5,
});

export const errorText = style({
  fontSize: vars.font.size.xs,
  color: vars.color.failText,
  wordBreak: "break-word",
});

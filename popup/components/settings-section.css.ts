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
  gap: "2px",
  padding: `${vars.space.md} ${vars.space.md}`,
  background: vars.color.surface,
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
  marginBottom: "2px",
});

export const sheetTitle = style({
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  selectors: {
    "&:hover:not(:disabled)": { background: vars.color.primaryHover },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  },
});

export const googleIcon = style({
  display: "inline-grid",
  placeItems: "center",
  width: "14px",
  height: "14px",
  background: "#fff",
  borderRadius: "2px",
  padding: "1px",
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

// 푸터: 디자인은 "스펙 로드 대기" 비활성 버튼을 항상 노출한다. 스펙이 로드되면
// PhaseLayout이 다음 화면으로 전환하므로 이 버튼은 실제로 활성 상태로 보여질
// 일이 없다. 시각적 일관성을 위해 자리를 고정해 둔다.
export const footer = style({
  flexShrink: 0,
  padding: vars.space.md,
  borderTop: `1px solid ${vars.color.border}`,
  background: vars.color.surface,
});

export const footerButton = style({
  width: "100%",
  height: "40px",
  border: "none",
  background: vars.color.surface,
  color: vars.color.textMuted,
  borderRadius: vars.radius.md,
  fontWeight: vars.font.weight.medium,
  fontSize: vars.font.size.md,
  cursor: "not-allowed",
  opacity: 0.8,
});

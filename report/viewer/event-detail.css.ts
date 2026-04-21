// 검증 결과 우측 상세 패널. 디자인 원본 `EventDetail` 그대로.

import { style, styleVariants } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const wrap = style({
  background: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.card,
  overflow: "hidden",
});

export const headerBar = style({
  padding: "12px 16px",
  borderBottom: `1px solid ${vars.color.divider}`,
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const headerName = style({
  fontFamily: vars.font.mono,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
});

export const headerFull = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textSubtle,
  fontFamily: vars.font.mono,
});

export const headerSpacer = style({ flex: 1 });

export const notice = style({
  padding: "10px 16px",
  background: vars.color.warnSoft,
  borderBottom: `1px solid ${vars.color.divider}`,
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
});

export const noticeIcon = style({
  color: vars.color.warnText,
  marginTop: "2px",
  flexShrink: 0,
});

export const noticeBody = style({
  fontSize: vars.font.size.sm,
  color: vars.color.warnText,
  lineHeight: 1.5,
});

export const noticeTitle = style({
  fontWeight: vars.font.weight.bold,
  marginBottom: "2px",
});

export const noticeLine = style({
  display: "block",
});

export const code = style({
  fontFamily: vars.font.mono,
  background: "rgba(0,0,0,0.06)",
  padding: "1px 4px",
  borderRadius: vars.radius.xs,
});

export const twoCols = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
});

export const col = style({
  padding: "12px 16px",
});

export const colLeft = style({
  borderRight: `1px solid ${vars.color.divider}`,
});

export const colTitle = style({
  fontSize: "10.5px",
  fontWeight: vars.font.weight.bold,
  color: vars.color.textMuted,
  letterSpacing: "0.3px",
  textTransform: "uppercase",
  marginBottom: "8px",
});

export const colBody = style({
  fontFamily: vars.font.mono,
  fontSize: "11.5px",
});

export const line = style({
  display: "flex",
  gap: "8px",
  padding: "3px 0",
  alignItems: "baseline",
  color: vars.color.text,
});

const lineHighlight = styleVariants({
  missing: { color: vars.color.failText },
  extra: { color: vars.color.warnText },
  normal: {},
});

export const lineVariant = lineHighlight;

export const lineKey = style({
  minWidth: "70px",
  color: vars.color.textMuted,
});

export const lineValue = style({
  flex: 1,
  wordBreak: "break-all",
});

export const flag = style({
  fontSize: vars.font.size.xxs,
  fontWeight: vars.font.weight.bold,
  letterSpacing: "0.3px",
});

export const flagMissing = style({
  color: vars.color.failText,
});

export const flagExtra = style({
  color: vars.color.warnText,
});

export const logSection = style({
  borderTop: `1px solid ${vars.color.divider}`,
  padding: "10px 16px",
  background: vars.color.surfaceAlt,
});

export const logLabel = style({
  fontSize: "10.5px",
  fontWeight: vars.font.weight.bold,
  color: vars.color.textMuted,
  letterSpacing: "0.3px",
  textTransform: "uppercase",
  marginBottom: "8px",
});

export const logRow = style({
  padding: "6px 8px",
  background: vars.color.surface,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border}`,
  marginBottom: "4px",
  fontFamily: vars.font.mono,
  fontSize: vars.font.size.xs,
  display: "flex",
  alignItems: "center",
  gap: "10px",
});

export const logTime = style({
  color: vars.color.textSubtle,
  flexShrink: 0,
});

export const logParams = style({
  flex: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: vars.color.text,
});

export const logEmpty = style({
  padding: "6px 8px",
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontFamily: vars.font.mono,
});

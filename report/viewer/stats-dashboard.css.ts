// 상단 요약 카드 4장. 디자인 원본 `BigStats` / `BigStat` 레이아웃 그대로.

import { style, styleVariants } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "12px",
});

export const card = style({
  background: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.card,
  padding: "16px",
  position: "relative",
  overflow: "hidden",
});

export const labelRow = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginBottom: "6px",
});

export const dot = style({
  width: "6px",
  height: "6px",
  borderRadius: "999px",
});

export const dotKind = styleVariants({
  pass: [dot, { background: vars.color.passSolid }],
  fail: [dot, { background: vars.color.failSolid }],
  warn: [dot, { background: vars.color.warnSolid }],
  missing: [dot, { background: vars.color.missingSolid }],
});

const labelBase = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  letterSpacing: "0.3px",
  textTransform: "uppercase",
});

export const label = styleVariants({
  pass: [labelBase, { color: vars.color.passText }],
  fail: [labelBase, { color: vars.color.failText }],
  warn: [labelBase, { color: vars.color.warnText }],
  missing: [labelBase, { color: vars.color.missingText }],
});

// 디자인은 fontSize 34. 큰 숫자 전용이라 토큰에 추가하지 않고 이 한 곳에만 상수로 둠.
const valueBase = style({
  fontSize: "34px",
  fontWeight: vars.font.weight.bold,
  letterSpacing: "-1.2px",
  fontVariantNumeric: "tabular-nums",
});

export const value = styleVariants({
  on: [valueBase, { color: vars.color.text }],
  off: [valueBase, { color: vars.color.textMuted }],
});

export const progress = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginTop: "8px",
});

export const progressTrack = style({
  flex: 1,
  height: "3px",
  background: vars.color.surfaceAlt,
  borderRadius: "999px",
  overflow: "hidden",
});

const fillBase = style({
  height: "100%",
});

export const progressFill = styleVariants({
  pass: [fillBase, { background: vars.color.passSolid }],
  fail: [fillBase, { background: vars.color.failSolid }],
  warn: [fillBase, { background: vars.color.warnSolid }],
  missing: [fillBase, { background: vars.color.missingSolid }],
});

export const progressPct = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontVariantNumeric: "tabular-nums",
});

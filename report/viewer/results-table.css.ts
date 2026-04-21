// 검증 결과 테이블. 디자인 원본 `ValidationTable`의 셀 여백·폰트를 그대로 옮김.

import { globalStyle, style, styleVariants } from "@vanilla-extract/css";

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

export const headerTitle = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
});

export const headerCount = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
});

export const table = style({
  width: "100%",
  borderCollapse: "collapse",
  fontSize: vars.font.size.sm,
});

globalStyle(`${table} thead tr`, {
  background: vars.color.surfaceAlt,
});

globalStyle(`${table} th`, {
  padding: "9px 16px",
  textAlign: "left",
  fontSize: "10.5px",
  fontWeight: vars.font.weight.bold,
  color: vars.color.textMuted,
  letterSpacing: "0.3px",
  textTransform: "uppercase",
  borderBottom: `1px solid ${vars.color.divider}`,
});

globalStyle(`${table} td`, {
  padding: "10px 16px",
  borderTop: `1px solid ${vars.color.divider}`,
  verticalAlign: "middle",
});

// 첫 바디 행은 헤더와 경계가 이미 있어 중복 라인 방지.
globalStyle(`${table} tbody tr:first-child td`, {
  borderTop: "none",
});

export const thStatus = style({ width: "80px" });
export const thPage = style({ width: "100px" });
export const thRight = style({
  width: "70px",
  textAlign: "right",
});
export const thChevron = style({ width: "30px" });

export const row = style({
  cursor: "pointer",
  selectors: {
    "&:hover": { background: vars.color.hover },
    "&:focus-visible": {
      outline: `2px solid ${vars.color.primary}`,
      outlineOffset: "-2px",
    },
  },
});

export const rowSelected = style({
  background: vars.color.primarySoft,
  selectors: {
    "&:hover": { background: vars.color.primarySoft },
  },
});

export const eventCell = style({
  display: "flex",
  flexDirection: "column",
  gap: "1px",
});

export const eventName = style({
  fontFamily: vars.font.mono,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  letterSpacing: "-0.1px",
});

// `__` 구분자를 옅게 표기. 다크 테마 확장 대비해 인라인 oklch 대신 토큰을 쓴다.
export const eventNameSeparator = style({
  color: vars.color.textSubtle,
});

export const eventFull = style({
  fontSize: "10.5px",
  color: vars.color.textSubtle,
  fontFamily: vars.font.mono,
});

export const pageCell = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontFamily: vars.font.mono,
});

export const numberCell = style({
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
});

export const issueHit = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.failText,
  fontVariantNumeric: "tabular-nums",
});

export const issueEmpty = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textSubtle,
});

export const chevronCell = style({
  width: "30px",
  color: vars.color.textSubtle,
  padding: "10px 10px",
  textAlign: "right",
});

const pillBase = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  height: "16px",
  padding: "0 6px 0 5px",
  borderRadius: "999px",
  fontSize: "10.5px",
  fontWeight: vars.font.weight.bold,
  letterSpacing: "0.1px",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
});

export const pill = styleVariants({
  pass: [
    pillBase,
    { background: vars.color.passSoft, color: vars.color.passText },
  ],
  fail: [
    pillBase,
    { background: vars.color.failSoft, color: vars.color.failText },
  ],
  warn: [
    pillBase,
    { background: vars.color.warnSoft, color: vars.color.warnText },
  ],
  missing: [
    pillBase,
    { background: vars.color.missingSoft, color: vars.color.missingText },
  ],
});

export const pillDot = style({
  width: "5px",
  height: "5px",
  borderRadius: "999px",
  flexShrink: 0,
});

export const pillDotKind = styleVariants({
  pass: [pillDot, { background: vars.color.passSolid }],
  fail: [pillDot, { background: vars.color.failSolid }],
  warn: [pillDot, { background: vars.color.warnSolid }],
  missing: [pillDot, { background: vars.color.missingSolid }],
});

export const empty = style({
  padding: "24px 16px",
  textAlign: "center",
  color: vars.color.textMuted,
  fontSize: vars.font.size.sm,
});

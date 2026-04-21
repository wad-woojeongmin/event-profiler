import { globalStyle, style, styleVariants } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const tableWrap = style({
  overflowX: "auto",
});

export const table = style({
  width: "100%",
  borderCollapse: "collapse",
  fontSize: vars.font.size.sm,
});

// 자식(th/td) 공통 스타일은 vanilla-extract의 단일 클래스 제약 때문에 globalStyle로 분리.
globalStyle(`${table} th, ${table} td`, {
  padding: `${vars.space.sm} ${vars.space.md}`,
  textAlign: "left",
  verticalAlign: "top",
  borderBottom: `1px solid ${vars.color.border}`,
});

globalStyle(`${table} th`, {
  background: vars.color.surface,
  color: vars.color.textMuted,
  fontSize: vars.font.size.xs,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  fontWeight: vars.font.weight.medium,
});

export const thStatus = style({ width: "110px" });
export const thCount = style({ width: "80px" });

export const row = style({});

export const rowInteractive = style({
  cursor: "pointer",
  selectors: {
    "&:hover": { background: vars.color.surface },
  },
});

export const eventName = style({
  fontFamily: vars.font.mono,
  fontSize: vars.font.size.sm,
  color: vars.color.text,
  wordBreak: "break-all",
});

export const eventMeta = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  marginTop: vars.space.xs,
});

export const capturedCount = style({
  color: vars.color.text,
  fontVariantNumeric: "tabular-nums",
});

export const capturedUnit = style({
  color: vars.color.textMuted,
  marginLeft: vars.space.xs,
  fontSize: vars.font.size.xs,
});

export const issueEmpty = style({
  color: vars.color.textMuted,
});

export const issueSummary = style({
  color: vars.color.danger,
  fontWeight: vars.font.weight.medium,
});

const baseBadge = style({
  display: "inline-block",
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  border: "1px solid transparent",
});

export const badge = styleVariants({
  pass: [
    baseBadge,
    { background: "#ecfdf5", color: vars.color.success, borderColor: "#a7f3d0" },
  ],
  fail: [
    baseBadge,
    { background: "#fef2f2", color: vars.color.danger, borderColor: "#fecaca" },
  ],
  not_collected: [
    baseBadge,
    { background: vars.color.surface, color: vars.color.textMuted, borderColor: vars.color.border },
  ],
  suspect_duplicate: [
    baseBadge,
    { background: "#fff7ed", color: vars.color.warning, borderColor: "#fed7aa" },
  ],
});

export const detailRow = style({
  background: vars.color.surface,
});

export const details = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  padding: vars.space.md,
});

export const detailsBlock = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
});

export const detailsLabel = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: vars.color.textMuted,
});

export const issueList = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const issueItem = style({
  display: "flex",
  alignItems: "baseline",
  gap: vars.space.sm,
  fontSize: vars.font.size.sm,
  color: vars.color.text,
});

const severityBase = style({
  fontSize: "10px",
  fontWeight: vars.font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  padding: `${vars.space.xs} ${vars.space.xs}`,
  borderRadius: vars.radius.sm,
});

export const severity = styleVariants({
  error: [severityBase, { background: "#fef2f2", color: vars.color.danger }],
  warning: [severityBase, { background: "#fff7ed", color: vars.color.warning }],
  info: [severityBase, { background: "#eff6ff", color: vars.color.primary }],
});

export const paramKey = style({
  fontFamily: vars.font.mono,
  fontSize: vars.font.size.xs,
  background: vars.color.bg,
  padding: `1px ${vars.space.xs}`,
  borderRadius: vars.radius.sm,
  border: `1px solid ${vars.color.border}`,
});

export const capturedList = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
});

export const capturedItem = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  padding: vars.space.md,
  background: vars.color.bg,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
});

export const capturedMeta = style({
  display: "flex",
  flexWrap: "wrap",
  gap: vars.space.sm,
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
});

export const capturedTime = style({
  fontFamily: vars.font.mono,
  color: vars.color.text,
});

export const capturedUrl = style({
  wordBreak: "break-all",
});

export const params = style({
  margin: 0,
  padding: vars.space.sm,
  background: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.mono,
  fontSize: vars.font.size.xs,
  lineHeight: 1.45,
  color: vars.color.text,
  overflowX: "auto",
});

export const thumbLink = style({
  display: "inline-block",
  maxWidth: "320px",
  borderRadius: vars.radius.sm,
  overflow: "hidden",
  border: `1px solid ${vars.color.border}`,
});

export const thumb = style({
  display: "block",
  width: "100%",
  height: "auto",
});

export const empty = style({
  padding: vars.space.lg,
  textAlign: "center",
  color: vars.color.textMuted,
  fontSize: vars.font.size.sm,
});

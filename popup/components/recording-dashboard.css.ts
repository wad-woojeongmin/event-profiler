// 녹화 중 대시보드 스타일.
//
// 상태 배지 색은 리포트 뷰어(`report/viewer/results-table.css.ts`)와 시각적 톤을
// 맞췄다. 색 값이 바뀌면 양쪽을 함께 수정할 것.
//
// REC 헤더 펄스 애니메이션은 녹화 진행 중임을 시각적으로 전달한다. 녹화 종료
// 상태에서는 펄스를 멈추고 색도 회색으로 가라앉힌다.
//
// 실시간 스트림은 첫 행에만 slide-in + blue-soft 배경을 얇게 걸어 새 이벤트가
// 도착했음을 드러낸다. 매 폴링마다 fresh 플래그가 바뀌므로 CSS transition이
// 자연스럽게 감쇠된다.

import { keyframes, style, styleVariants } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

const pulse = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.35 },
});

const slideIn = keyframes({
  from: { opacity: 0, transform: "translateY(6px)" },
  to: { opacity: 1, transform: "none" },
});

export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  padding: vars.space.md,
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
});

const staticSection = style({
  flexShrink: 0,
});

export const recHeader = style([
  staticSection,
  {
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    padding: `${vars.space.sm} ${vars.space.md}`,
    background: vars.color.bg,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
  },
]);

const liveDotBase = style({
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  flexShrink: 0,
});

export const liveDotRecording = style([
  liveDotBase,
  {
    background: vars.color.failSolid,
    animation: `${pulse} 1.2s ease-in-out infinite`,
  },
]);

export const liveDotStopped = style([
  liveDotBase,
  { background: vars.color.textSubtle },
]);

export const recLabel = style({
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.failText,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
});

export const recLabelStopped = style([
  recLabel,
  { color: vars.color.textMuted },
]);

export const elapsed = style({
  fontFamily: vars.font.mono,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.3px",
  color: vars.color.text,
});

export const recStartMeta = style({
  marginLeft: "auto",
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
});

export const recStartClock = style({
  fontFamily: vars.font.mono,
  color: vars.color.text,
});

export const counterStrip = style([
  staticSection,
  {
    display: "grid",
    gridTemplateColumns: "1.2fr repeat(4, 1fr)",
    background: vars.color.bg,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    overflow: "hidden",
  },
]);

const counterCellBase = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  padding: `${vars.space.sm} ${vars.space.sm}`,
  borderRight: `1px solid ${vars.color.divider}`,
  selectors: {
    "&:last-child": { borderRight: "none" },
  },
});

export const counterCell = style([counterCellBase]);

export const counterCellTotal = style([
  counterCellBase,
  { background: vars.color.surface },
]);

export const counterLabel = style({
  fontSize: "10px",
  fontWeight: vars.font.weight.bold,
  color: vars.color.textMuted,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
});

const counterValueBase = style({
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.5px",
  lineHeight: 1.1,
});

export const counterValue = style([
  counterValueBase,
  { color: vars.color.text },
]);

export const counterValueZero = style([
  counterValueBase,
  { color: vars.color.textMuted },
]);

export const counterValueVariants = styleVariants({
  pass: [counterValueBase, { color: vars.color.passText }],
  fail: [counterValueBase, { color: vars.color.failText }],
  warn: [counterValueBase, { color: vars.color.warnText }],
  missing: [counterValueBase, { color: vars.color.missingText }],
});

export const sectionTitle = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontWeight: vars.font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

export const sectionCount = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textSubtle,
  fontVariantNumeric: "tabular-nums",
});

export const sectionSpacer = style({
  flex: 1,
});

export const sectionHeader = style([
  staticSection,
  {
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
  },
]);

export const liveBadge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontWeight: vars.font.weight.medium,
});

export const liveBadgeDot = style({
  width: "5px",
  height: "5px",
  borderRadius: "50%",
  background: vars.color.failSolid,
  animation: `${pulse} 1.2s ease-in-out infinite`,
});

// 선택한 이벤트 정의 상태 리스트 — 대시보드에서 유일하게 flex로 늘어나는 섹션.
// specList와 streamList가 각각 flex 영역을 나눠 가진다. 스펙이 적고 스트림이
// 많으면 스트림이 더 많은 공간을 차지한다.
export const specList = style({
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  flex: "1 1 0",
  minHeight: 0,
  overflowY: "auto",
  background: vars.color.bg,
});

export const specRow = style({
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "flex-start",
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderBottom: `1px solid ${vars.color.divider}`,
  selectors: {
    "&:last-child": { borderBottom: "none" },
  },
});

const statusPillBase = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  height: "18px",
  padding: "0 7px 0 6px",
  borderRadius: "999px",
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  letterSpacing: "0.01em",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  marginTop: "1px",
});

export const statusPillVariants = styleVariants({
  pass: [
    statusPillBase,
    { background: vars.color.passSoft, color: vars.color.passText },
  ],
  fail: [
    statusPillBase,
    { background: vars.color.failSoft, color: vars.color.failText },
  ],
  suspect_duplicate: [
    statusPillBase,
    { background: vars.color.warnSoft, color: vars.color.warnText },
  ],
  not_collected: [
    statusPillBase,
    { background: vars.color.missingSoft, color: vars.color.missingText },
  ],
});

const statusPillDotBase = style({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  flexShrink: 0,
});

export const statusPillDotVariants = styleVariants({
  pass: [statusPillDotBase, { background: vars.color.passSolid }],
  fail: [statusPillDotBase, { background: vars.color.failSolid }],
  suspect_duplicate: [
    statusPillDotBase,
    { background: vars.color.warnSolid },
  ],
  not_collected: [statusPillDotBase, { background: vars.color.missingSolid }],
});

export const specMain = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  minWidth: 0,
});

export const specTitle = style({
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontSize: vars.font.size.sm,
  fontFamily: vars.font.mono,
  letterSpacing: "-0.1px",
});

export const specSubtitle = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textSubtle,
  fontFamily: vars.font.mono,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const specMessage = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  marginTop: "2px",
});

export const specMessageFail = style({
  color: vars.color.failText,
});

export const specMessageWarn = style({
  color: vars.color.warnText,
});

export const specCountWrap = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "2px",
  flexShrink: 0,
});

export const specCountValue = style({
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1,
});

export const specCountUnit = style({
  fontSize: "10px",
  color: vars.color.textSubtle,
});

// 실시간 스트림
export const streamList = style({
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  flex: "1 1 0",
  minHeight: 0,
  overflowY: "auto",
  background: vars.color.bg,
});

const streamRowBase = style({
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  alignItems: "flex-start",
  gap: vars.space.sm,
  padding: `${vars.space.xs} ${vars.space.md}`,
  borderBottom: `1px solid ${vars.color.divider}`,
  transition: "background 0.6s",
  selectors: {
    "&:last-child": { borderBottom: "none" },
  },
});

export const streamRow = style([streamRowBase, { background: "transparent" }]);

export const streamRowFresh = style([
  streamRowBase,
  {
    background: vars.color.primarySoft,
    animation: `${slideIn} 0.25s ease-out`,
  },
]);

const streamDotBase = style({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  flexShrink: 0,
  marginTop: "7px",
});

export const streamDotPass = style([
  streamDotBase,
  { background: vars.color.passSolid },
]);
export const streamDotWarn = style([
  streamDotBase,
  { background: vars.color.warnSolid },
]);
export const streamDotFail = style([
  streamDotBase,
  { background: vars.color.failSolid },
]);
export const streamDotException = style([
  streamDotBase,
  { background: vars.color.textSubtle },
]);

export const streamMain = style({
  display: "flex",
  flexDirection: "column",
  gap: "1px",
  minWidth: 0,
});

export const streamHead = style({
  display: "flex",
  alignItems: "baseline",
  gap: vars.space.sm,
});

export const streamTime = style({
  fontFamily: vars.font.mono,
  fontSize: "10.5px",
  color: vars.color.textSubtle,
  letterSpacing: "-0.2px",
  fontVariantNumeric: "tabular-nums",
});

export const streamExceptionLabel = style({
  fontSize: "10px",
  color: vars.color.textSubtle,
  fontStyle: "italic",
});

export const streamName = style({
  fontFamily: vars.font.mono,
  fontSize: "11.5px",
  fontWeight: vars.font.weight.medium,
  color: vars.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const streamNameException = style([
  streamName,
  { color: vars.color.textMuted },
]);

export const streamParams = style({
  fontFamily: vars.font.mono,
  fontSize: "10.5px",
  color: vars.color.textSubtle,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const emptyState = style([
  staticSection,
  {
    padding: vars.space.lg,
    fontSize: vars.font.size.sm,
    color: vars.color.textMuted,
    textAlign: "center",
    background: vars.color.bg,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
  },
]);

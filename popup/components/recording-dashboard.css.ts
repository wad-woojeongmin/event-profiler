// 녹화 중 대시보드 스타일 — flat-section 구조.
//
// wrapper에는 padding·gap이 없고, 각 섹션은 에지까지 꽉 차며 borderBottom으로
// 이웃 섹션과 분리된다. 섹션 헤더는 연회색 바(surfaceAlt) 위의 대문자 캡션이다.
//
// 색 토큰은 리포트 뷰어(`report/viewer/results-table.css.ts`)와 시각적 톤을
// 맞췄다. 색 값이 바뀌면 양쪽을 함께 수정할 것.

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

// wrapper에는 패딩을 두지 않는다 — 디자인이 사이드바 에지까지 섹션을 붙여 둔다.
// 안쪽 specSection/streamSection이 각각 자체 스크롤을 가져 footer가 가려지지
// 않도록 한다.
export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  background: vars.color.bg,
});

export const recHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: "10px 12px",
  background: vars.color.surface,
  borderBottom: `1px solid ${vars.color.border}`,
  flexShrink: 0,
});

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

// 5-컬럼 그리드가 사이드바 에지에서 에지까지. 셀 사이엔 얇은 divider.
export const counterStrip = style({
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  background: vars.color.surface,
  borderBottom: `1px solid ${vars.color.border}`,
  flexShrink: 0,
});

const counterCellBase = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  padding: "10px 10px",
  borderRight: `1px solid ${vars.color.divider}`,
  selectors: {
    "&:last-child": { borderRight: "none" },
  },
});

export const counterCell = style([counterCellBase]);

export const counterCellTotal = style([
  counterCellBase,
  { background: vars.color.surfaceAlt },
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

// 총 수집 셀만 20px로 살짝 키워 "핵심 지표"라는 위계를 준다(나머지 셀은 18px).
export const counterValue = style([
  counterValueBase,
  { color: vars.color.text, fontSize: "20px" },
]);

export const counterValueZero = style([
  counterValueBase,
  { color: vars.color.textMuted },
]);

export const counterValueVariants = styleVariants({
  pass: [counterValueBase, { color: vars.color.passText }],
  fail: [counterValueBase, { color: vars.color.failText }],
  warn: [counterValueBase, { color: vars.color.warnText }],
  // 미수집(=not_collected)이 0보다 크면 경고로 간주해 warn 톤으로 드러낸다.
  // "미수집" 색을 회색으로 두면 0과 구분이 되지 않아 사용자가 중요도를 놓친다.
  missing: [counterValueBase, { color: vars.color.warnText }],
});

// 섹션 헤더: 연회색 바에 대문자 제목 + 카운트.
export const sectionHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: "10px 14px",
  background: vars.color.surfaceAlt,
  borderBottom: `1px solid ${vars.color.divider}`,
  flexShrink: 0,
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

// 선택 이벤트 상태 섹션: 내부 리스트가 자체 max-height로 스크롤을 가져 녹화
// 중 스펙이 많아도 스트림 섹션을 밀어내지 않는다. 섹션 자체는 콘텐츠 높이에
// 맞춰 자연스럽게 늘어난다(1개만 있을 때 빈 공백 없이 붙는다).
export const specSection = style({
  display: "flex",
  flexDirection: "column",
  borderBottom: `1px solid ${vars.color.border}`,
  background: vars.color.bg,
  flexShrink: 0,
});

export const specList = style({
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  maxHeight: "220px",
});

export const specRow = style({
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
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

// 실시간 스트림 섹션: 남은 공간 전부 차지. 리스트 내부에서 스크롤.
export const streamSection = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  background: vars.color.bg,
  overflow: "hidden",
});

export const streamList = style({
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  flex: 1,
  minHeight: 0,
});

const streamRowBase = style({
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  alignItems: "flex-start",
  gap: "10px",
  padding: `6px ${vars.space.md}`,
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

// 섹션 내부에 텍스트만 들어가는 empty/placeholder 영역.
export const placeholder = style({
  padding: vars.space.lg,
  fontSize: vars.font.size.sm,
  color: vars.color.textMuted,
  textAlign: "center",
  background: vars.color.bg,
});

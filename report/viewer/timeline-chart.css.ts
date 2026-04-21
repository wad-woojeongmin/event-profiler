// 타임라인 카드. 왼쪽 고정(160) · 오른쪽 가로 스크롤(innerWidth = totalSec * pxPerSec).
// 필름스트립·눈금·레인이 하나의 폭 컨테이너 안에서 같은 x축을 공유한다.

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
  gap: "10px",
});

export const headerTitle = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
});

export const headerMeta = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
});

export const headerSpacer = style({ flex: 1 });

export const legend = style({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontSize: "10.5px",
  color: vars.color.textMuted,
});

export const legendItem = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
});

export const legendDot = style({
  width: "7px",
  height: "7px",
  borderRadius: "999px",
});

export const legendDotKind = styleVariants({
  pass: [legendDot, { background: vars.color.passSolid }],
  warn: [legendDot, { background: vars.color.warnSolid }],
  fail: [legendDot, { background: vars.color.failSolid }],
});

export const body = style({
  display: "flex",
});

const LABELS_WIDTH = 160;

export const labels = style({
  width: `${LABELS_WIDTH}px`,
  borderRight: `1px solid ${vars.color.divider}`,
  background: vars.color.surfaceAlt,
  flexShrink: 0,
});

export const filmstripLabel = style({
  height: "84px",
  display: "flex",
  alignItems: "center",
  padding: "0 12px",
  borderBottom: `1px solid ${vars.color.divider}`,
  fontSize: vars.font.size.xxs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.textMuted,
  letterSpacing: "0.3px",
  textTransform: "uppercase",
});

export const rulerLabel = style({
  height: "22px",
  borderBottom: `1px solid ${vars.color.divider}`,
});

export const laneLabel = style({
  height: "32px",
  display: "flex",
  alignItems: "center",
  padding: "0 12px",
  fontFamily: vars.font.mono,
  fontSize: "10.5px",
  fontWeight: vars.font.weight.medium,
  color: vars.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const laneLabelDivider = style({
  borderBottom: `1px solid ${vars.color.divider}`,
});

export const scrollArea = style({
  flex: 1,
  overflowX: "auto",
  overflowY: "hidden",
});

export const timelineInner = style({
  position: "relative",
});

export const tickLayer = style({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
});

export const tickLine = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  width: "1px",
  background: vars.color.divider,
});

export const filmstrip = style({
  height: "84px",
  position: "relative",
  borderBottom: `1px solid ${vars.color.divider}`,
  background: vars.color.surfaceAlt,
});

export const thumb = style({
  position: "absolute",
  top: "8px",
  width: "68px",
  transform: "translateX(-50%)",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.xs,
  overflow: "hidden",
  background: vars.color.surface,
});

export const thumbImage = style({
  height: "42px",
  backgroundColor: vars.color.surfaceAlt,
  position: "relative",
  backgroundImage: `repeating-linear-gradient(135deg, ${vars.color.border} 0 1px, transparent 1px 6px)`,
});

export const thumbImageReal = style({
  height: "42px",
  position: "relative",
  backgroundColor: vars.color.surfaceAlt,
  overflow: "hidden",
});

export const thumbImg = style({
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

export const thumbStatusDot = style({
  position: "absolute",
  top: "3px",
  left: "3px",
  width: "5px",
  height: "5px",
  borderRadius: "999px",
  boxShadow: "0 0 0 1.5px rgba(255,255,255,0.8)",
});

export const thumbStatusDotKind = styleVariants({
  pass: [thumbStatusDot, { background: vars.color.passSolid }],
  warn: [thumbStatusDot, { background: vars.color.warnSolid }],
  fail: [thumbStatusDot, { background: vars.color.failSolid }],
});

export const thumbCaption = style({
  padding: "2px 4px",
  fontSize: "9px",
  fontFamily: vars.font.mono,
  color: vars.color.textSubtle,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  textAlign: "center",
  lineHeight: 1.3,
});

export const ruler = style({
  height: "22px",
  position: "relative",
  borderBottom: `1px solid ${vars.color.divider}`,
});

export const rulerTick = style({
  position: "absolute",
  top: "4px",
  transform: "translateX(-50%)",
  fontSize: "9.5px",
  color: vars.color.textSubtle,
  fontFamily: vars.font.mono,
  fontVariantNumeric: "tabular-nums",
});

export const lanes = style({
  position: "relative",
});

export const laneRow = style({
  position: "absolute",
  left: 0,
  right: 0,
  height: "32px",
});

export const laneRowDivider = style({
  borderBottom: `1px solid ${vars.color.divider}`,
});

export const marker = style({
  position: "absolute",
  width: "3px",
  height: "20px",
  borderRadius: "1px",
  cursor: "pointer",
  // 클릭 타겟이 3px로 너무 얇아 마우스로 잡기 힘들다. 투명 ::before로 양옆 5px씩 확장.
  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      top: "-4px",
      bottom: "-4px",
      left: "-5px",
      right: "-5px",
    },
  },
});

export const markerKind = styleVariants({
  pass: [marker, { background: vars.color.passSolid }],
  warn: [marker, { background: vars.color.warnSolid }],
  fail: [marker, { background: vars.color.failSolid }],
});

// 훅오버 시 타임라인 위로 띄우는 스크린샷 미리보기. createPortal로 body 직하에
// 렌더해서 scrollArea의 overflow에 막히지 않게 한다.
export const previewRoot = style({
  position: "fixed",
  width: "480px",
  maxWidth: "80vw",
  pointerEvents: "none",
  zIndex: 9999,
  background: vars.color.surface,
  border: `1px solid ${vars.color.borderStrong}`,
  borderRadius: vars.radius.card,
  overflow: "hidden",
  boxShadow: vars.shadow.md,
});

export const previewImg = style({
  display: "block",
  width: "100%",
  height: "auto",
});

export const previewCaption = style({
  padding: "6px 10px",
  borderTop: `1px solid ${vars.color.divider}`,
  background: vars.color.surfaceAlt,
  display: "flex",
  flexDirection: "column",
  gap: "1px",
});

export const previewNameGtag = style({
  fontFamily: vars.font.mono,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const previewNameRaw = style({
  fontFamily: vars.font.mono,
  fontSize: "10.5px",
  color: vars.color.textMuted,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const hoverable = style({
  cursor: "pointer",
});

export const empty = style({
  padding: "24px 16px",
  textAlign: "center",
  color: vars.color.textMuted,
  fontSize: vars.font.size.sm,
});

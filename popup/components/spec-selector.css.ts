import { style } from "@vanilla-extract/css";

import { vars } from "../styles/theme.css.ts";

export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
  padding: vars.space.lg,
  borderBottom: `1px solid ${vars.color.border}`,
  flex: 1,
  minHeight: 0,
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: vars.space.sm,
});

export const title = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontWeight: vars.font.weight.medium,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
});

export const toolbar = style({
  display: "flex",
  gap: vars.space.xs,
});

export const miniButton = style({
  border: `1px solid ${vars.color.border}`,
  background: vars.color.bg,
  color: vars.color.text,
  padding: `2px ${vars.space.sm}`,
  borderRadius: vars.radius.sm,
  fontSize: vars.font.size.xs,
  cursor: "pointer",
  selectors: {
    "&:hover": { borderColor: vars.color.primary },
    "&:disabled": { cursor: "not-allowed", opacity: 0.5 },
  },
});

export const columns = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: vars.space.md,
  minHeight: 0,
  flex: 1,
});

export const column = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  minWidth: 0,
  minHeight: 0,
});

export const columnHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
});

export const columnTitle = style({
  fontWeight: vars.font.weight.bold,
  color: vars.color.text,
  fontSize: vars.font.size.sm,
});

export const columnCount = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
});

export const searchInput = style({
  width: "100%",
  padding: `${vars.space.xs} ${vars.space.sm}`,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  fontSize: vars.font.size.sm,
  background: vars.color.bg,
  color: vars.color.text,
  selectors: {
    "&:focus": {
      outline: "none",
      borderColor: vars.color.primary,
    },
  },
});

export const list = style({
  overflowY: "auto",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.md,
  maxHeight: "320px",
  minHeight: "120px",
  display: "flex",
  flexDirection: "column",
  background: vars.color.bg,
});

export const item = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: vars.space.sm,
  cursor: "pointer",
  fontSize: vars.font.size.sm,
  borderBottom: `1px solid ${vars.color.border}`,
  selectors: {
    "&:last-child": { borderBottom: "none" },
    "&:hover": { background: vars.color.surface },
  },
});

export const itemMain = style({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  minWidth: 0,
  flex: 1,
});

export const itemTitle = style({
  fontWeight: vars.font.weight.medium,
  color: vars.color.text,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const itemSubtitle = style({
  fontSize: vars.font.size.xs,
  color: vars.color.textMuted,
  fontFamily: vars.font.mono,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const removeButton = style({
  border: "none",
  background: "transparent",
  color: vars.color.textMuted,
  fontSize: vars.font.size.md,
  cursor: "pointer",
  padding: "2px 6px",
  borderRadius: vars.radius.sm,
  selectors: {
    "&:hover": {
      background: vars.color.surface,
      color: vars.color.danger,
    },
  },
});

export const emptyState = style({
  padding: vars.space.lg,
  fontSize: vars.font.size.sm,
  color: vars.color.textMuted,
  textAlign: "center",
});

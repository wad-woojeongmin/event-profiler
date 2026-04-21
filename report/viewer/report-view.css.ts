// 리포트 뷰어의 최외곽 레이아웃. 디자인 원본은 1200px 폭 정적 캔버스지만 브라우저
// 새 탭에서 보기 때문에 바깥은 풀폭으로 두고 `container`만 1200px로 제한한다.

import { style } from "@vanilla-extract/css";

import { vars } from "../../popup/styles/theme.css.ts";

export const page = style({
  flex: 1,
  background: vars.color.bg,
});

export const container = style({
  maxWidth: "1200px",
  margin: "0 auto",
  background: vars.color.bg,
  display: "flex",
  flexDirection: "column",
});

export const body = style({
  // 디자인 원본: padding 20 28, gap 16.
  padding: "20px 28px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
});

export const twoColumn = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  alignItems: "flex-start",
});

// 팝업 전역 리셋 + 기본 타이포그래피.
//
// 팝업은 고정 폭이므로 글로벌 스타일만으로 레이아웃이 충분히 안정적이다.

import { globalStyle } from "@vanilla-extract/css";

import { vars } from "./theme.css.ts";

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("html, body", {
  margin: 0,
  padding: 0,
  background: vars.color.bg,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.size.md,
  lineHeight: 1.4,
});

globalStyle("#root", {
  width: "360px",
  minHeight: "480px",
  display: "flex",
  flexDirection: "column",
});

globalStyle("button", {
  fontFamily: "inherit",
  fontSize: "inherit",
});

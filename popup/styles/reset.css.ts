// 사이드 패널 전역 리셋 + 기본 타이포그래피.
//
// 사이드 패널은 브라우저가 제공하는 가변 폭을 따르므로 `html/body/#root`는
// 100%로 늘려 어떤 폭에서도 꽉 차게 한다.

import { globalStyle } from "@vanilla-extract/css";

import { vars } from "./theme.css.ts";

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("html, body", {
  margin: 0,
  padding: 0,
  width: "100%",
  minHeight: "100vh",
  background: vars.color.bg,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.size.md,
  lineHeight: 1.4,
});

globalStyle("#root", {
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
});

globalStyle("button", {
  fontFamily: "inherit",
  fontSize: "inherit",
});

globalStyle("ul, ol", {
  margin: 0,
  padding: 0,
  listStyle: "none",
});

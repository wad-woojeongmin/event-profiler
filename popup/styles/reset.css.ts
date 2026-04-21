// 사이드 패널 전역 리셋 + 기본 타이포그래피.
//
// 사이드 패널은 브라우저가 제공하는 가변 폭을 따르므로 `html/body/#root`는
// 100%로 늘려 어떤 폭에서도 꽉 차게 한다.
//
// 높이는 `100vh`로 고정하고 바깥 스크롤을 잠근다. 내부 긴 목록은 해당 섹션이
// `overflow: auto`로 자체 스크롤을 가지므로 footer(녹화 종료/리포트 보기 등)는
// 항상 뷰포트 하단에 붙는다. `minHeight`로 두면 본문이 길어질 때 #root가 늘어나
// footer가 스크롤 뒤로 밀리는 이슈가 생긴다.

import { globalStyle } from "@vanilla-extract/css";

import { vars } from "./theme.css.ts";

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("html, body", {
  margin: 0,
  padding: 0,
  width: "100%",
  height: "100vh",
  overflow: "hidden",
  background: vars.color.bg,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.size.md,
  lineHeight: 1.4,
});

globalStyle("#root", {
  width: "100%",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
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

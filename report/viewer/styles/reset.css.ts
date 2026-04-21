// 뷰어 전용 전역 리셋.
//
// 팝업의 리셋(`popup/styles/reset.css.ts`)은 `#root { width: 360px }`로 고정
// 폭이라 뷰어에서 재사용할 수 없다. 뷰어는 전체 화면을 쓰되, 내용은 읽기 편하도록
// 컨테이너에서 max-width로 제한한다.

import { globalStyle } from "@vanilla-extract/css";

import { vars } from "../../../popup/styles/theme.css.ts";

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("html, body", {
  margin: 0,
  padding: 0,
  background: vars.color.surface,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.font.size.md,
  lineHeight: 1.5,
});

globalStyle("#root", {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
});

globalStyle("button", {
  fontFamily: "inherit",
  fontSize: "inherit",
});

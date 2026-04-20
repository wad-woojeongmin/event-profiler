// 팝업 전역 디자인 토큰.
//
// vanilla-extract의 `createTheme`은 토큰 값 + 클래스명을 함께 반환한다. UI는
// `vars.*`만 참조하고 구체 값은 이 파일 한 곳에서 바뀐다(다크 테마 추가 시에도
// `createTheme(rootTheme, ...)` 분기만 늘어남).

import { createGlobalTheme } from "@vanilla-extract/css";

export const vars = createGlobalTheme(":root", {
  color: {
    bg: "#ffffff",
    surface: "#f7f8fa",
    border: "#e4e7eb",
    text: "#1f2933",
    textMuted: "#6b7280",
    primary: "#2563eb",
    primaryText: "#ffffff",
    danger: "#c0392b",
    success: "#27ae60",
    warning: "#d97706",
  },
  space: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },
  font: {
    body: "Inter, system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    size: {
      xs: "11px",
      sm: "12px",
      md: "13px",
      lg: "15px",
    },
    weight: {
      regular: "400",
      medium: "500",
      bold: "600",
    },
  },
  radius: {
    sm: "4px",
    md: "6px",
    lg: "10px",
  },
});


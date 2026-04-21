// 팝업 전역 디자인 토큰.
//
// vanilla-extract의 `createTheme`은 토큰 값 + 클래스명을 함께 반환한다. UI는
// `vars.*`만 참조하고 구체 값은 이 파일 한 곳에서 바뀐다(다크 테마 추가 시에도
// `createTheme(rootTheme, ...)` 분기만 늘어남).
//
// 상태 색상(pass/fail/warn/notCollected)은 hue 간격을 넓혀 색약 사용자도 구분
// 가능하도록 했다(pass=green 150°, warn=amber 80°, fail=red 25°).

import { createGlobalTheme } from "@vanilla-extract/css";

export const vars = createGlobalTheme(":root", {
  color: {
    bg: "#ffffff",
    surface: "#f6f7f9",
    surfaceAlt: "#eff1f4",
    hover: "#ecedf0",
    border: "#e4e7eb",
    borderStrong: "#d2d6dc",
    divider: "#eceef1",
    text: "#1f2933",
    textMuted: "#6b7280",
    textSubtle: "#9ba3af",
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primarySoft: "#eff4ff",
    primaryText: "#ffffff",
    danger: "#c0392b",
    success: "#27ae60",
    warning: "#d97706",
    // 상태 색상. 배경은 soft, 텍스트/강조는 text, 점/액센트는 solid를 쓴다.
    passSolid: "#16a34a",
    passSoft: "#ecfdf5",
    passText: "#047857",
    failSolid: "#dc2626",
    failSoft: "#fef2f2",
    failText: "#b91c1c",
    warnSolid: "#f59e0b",
    warnSoft: "#fff7ed",
    warnText: "#c2410c",
    missingSolid: "#9ca3af",
    missingSoft: "#f1f3f5",
    missingText: "#6b7280",
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
      xxs: "10px",
      xs: "11px",
      sm: "12px",
      md: "13px",
      lg: "15px",
      xl: "18px",
      xxl: "22px",
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
  shadow: {
    sm: "0 1px 2px rgba(15,20,30,0.04), 0 1px 1px rgba(15,20,30,0.03)",
    md: "0 4px 12px rgba(15,20,30,0.06), 0 1px 2px rgba(15,20,30,0.04)",
  },
});

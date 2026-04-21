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
    // 디자인의 neutral 팔레트는 cool-hue oklch 99%→91% 사이를 얕게 미끄러진다.
    // 헤더(surfaceAlt)는 리스트 바탕(bg)과의 차이가 거의 안 보일 정도로 옅어야
    // 구분선(border/divider)으로 구조가 드러나는 원래 의도가 산다.
    bg: "oklch(99% 0.003 240)",
    surface: "oklch(100% 0 0)",
    surfaceAlt: "oklch(97.5% 0.004 240)",
    hover: "oklch(96% 0.005 240)",
    border: "oklch(91% 0.006 240)",
    borderStrong: "oklch(85% 0.008 240)",
    divider: "oklch(94% 0.005 240)",
    // text 3종 / primary 2종은 디자인 원본(tokens.jsx)과 같은 oklch로 정렬한다.
    // hex로 남겨두면 색상 툴이 뽑은 warmth/채도가 Display-P3에서 조금씩 어긋난다.
    text: "oklch(22% 0.01 240)",
    textMuted: "oklch(50% 0.012 240)",
    textSubtle: "oklch(65% 0.01 240)",
    primary: "oklch(56% 0.16 255)",
    primaryHover: "oklch(50% 0.16 255)",
    primarySoft: "oklch(96% 0.03 255)",
    primaryText: "#ffffff",
    // primary보다 가라앉은 톤. 섹션 헤더의 보조 액션 링크("전체 추가" 등)에
    // 쓴다. primary를 그대로 쓰면 풋터 CTA와 위계가 섞이고 헤더 안에서 튄다.
    primaryLinkText: "oklch(42% 0.14 255)",
    danger: "#c0392b",
    success: "#27ae60",
    warning: "#d97706",
    // 상태 색상. 배경은 soft, 텍스트/강조는 text, 점/액센트는 solid를 쓴다.
    // Chrome 111+에서 렌더링하는 확장 프로그램이므로 oklch()를 직접 사용해
    // 디자인 툴이 뽑은 색을 그대로 재현한다(hex 변환 시 발생하는 warmth/채도
    // 손실을 피하려는 의도).
    passSolid: "oklch(62% 0.16 150)",
    passSoft: "oklch(95% 0.05 150)",
    passText: "oklch(38% 0.14 150)",
    failSolid: "oklch(55% 0.22 25)",
    failSoft: "oklch(95% 0.05 25)",
    failText: "oklch(42% 0.19 25)",
    warnSolid: "oklch(76% 0.17 80)",
    warnSoft: "oklch(96% 0.07 80)",
    warnText: "oklch(50% 0.14 70)",
    missingSolid: "oklch(60% 0.01 240)",
    missingSoft: "oklch(95% 0.005 240)",
    missingText: "oklch(50% 0.012 240)",
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
    // xs(3) / card(8)는 리포트 필름스트립 thumb와 카드 컨테이너를 원본 토큰 그대로
    // 맞추려고 신설했다. 기존 sm/md/lg는 팝업 UI가 소비 중이라 건드리지 않는다.
    xs: "3px",
    sm: "4px",
    md: "6px",
    card: "8px",
    lg: "10px",
  },
  shadow: {
    sm: "0 1px 2px rgba(15,20,30,0.04), 0 1px 1px rgba(15,20,30,0.03)",
    md: "0 4px 12px rgba(15,20,30,0.06), 0 1px 2px rgba(15,20,30,0.04)",
  },
});

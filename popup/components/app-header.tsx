// 사이드 패널 최상단 헤더 — 로고 + 제품명.
//
// 크롬 사이드 패널은 브라우저가 상단 프레임을 그려주므로 여기서는 제품 아이덴티
// 티만 가볍게 표시한다. 모든 phase에서 공통으로 렌더된다.

import * as styles from "./app-header.css.ts";

export function AppHeader() {
  return (
    <header className={styles.header}>
      <span className={styles.logo} aria-hidden="true">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
          <circle cx="3" cy="3" r="1.4" />
          <circle cx="8" cy="3" r="1.4" opacity=".5" />
          <circle cx="3" cy="8" r="1.4" opacity=".5" />
          <circle cx="8" cy="8" r="1.4" />
        </svg>
      </span>
      <span className={styles.title}>Event Profiler</span>
    </header>
  );
}

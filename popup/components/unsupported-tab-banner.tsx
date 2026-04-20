// 활성 탭이 catchtable 도메인이 아닐 때 표시되는 경고 배너.
//
// 호스트 매치가 안 되면 content script가 주입되지 않아 postMessage 브리지가
// 끊기고, 녹화 세션을 시작해도 이벤트가 0건으로 종료된다. 사용자가 그 상태를
// "아무것도 캡처되지 않는 버그"로 오해하지 않게 사전 고지한다.

import { useAtomValue } from "jotai";

import { isSupportedTabAtom } from "../atoms/tab-atoms.ts";

import * as styles from "./unsupported-tab-banner.css.ts";

export function UnsupportedTabBanner() {
  const supported = useAtomValue(isSupportedTabAtom);
  // null(hydrate 전) 또는 true(지원)면 렌더하지 않는다 — 배너 깜빡임 방지.
  if (supported !== false) return null;
  return (
    <div className={styles.banner} role="alert">
      이 페이지는 지원되지 않습니다. catchtable.co.kr 에서 열어주세요.
    </div>
  );
}

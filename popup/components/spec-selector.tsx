// 이벤트 선택 루트 — 두 칼럼(선택됨/스펙 풀) 레이아웃.
//
// idle phase에서만 렌더된다. 녹화 중/종료 phase에서는 `RecordingDashboard`가
// 대신 렌더되므로 체크박스 disabled 분기가 필요 없다. 스펙 로드 상태와 선택
// 카운트는 `SpecsContextHeader`가 담당하고, "해제"/"전체 추가" 같은 칼럼별
// 액션은 각 칼럼 헤더가 직접 소유한다.

import * as styles from "./spec-selector.css.ts";
import { SelectedColumn } from "./selected-column.tsx";
import { UnselectedColumn } from "./unselected-column.tsx";

export function SpecSelector() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.columns}>
        <SelectedColumn />
        <UnselectedColumn />
      </div>
    </section>
  );
}

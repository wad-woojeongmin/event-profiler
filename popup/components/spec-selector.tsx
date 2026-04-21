// 이벤트 선택 루트 — 두 칼럼(미선택/선택) 레이아웃.
//
// idle phase에서만 렌더된다. 녹화 중/종료 phase에서는 `RecordingDashboard`가
// 대신 렌더되므로 체크박스 disabled 분기가 필요 없다.

import { useAtomValue, useSetAtom } from "jotai";

import { unselectedFilteredSpecsAtom } from "../atoms/filter-atoms.ts";
import {
  selectedEventNamesAtom,
  setSelectionAtom,
} from "../atoms/recording-atoms.ts";

import { SelectedColumn } from "./selected-column.tsx";
import * as styles from "./spec-selector.css.ts";
import { UnselectedColumn } from "./unselected-column.tsx";

export function SpecSelector() {
  const selected = useAtomValue(selectedEventNamesAtom);
  const visibleUnselected = useAtomValue(unselectedFilteredSpecsAtom);
  const setSelection = useSetAtom(setSelectionAtom);

  const selectAllVisible = (): void => {
    const next = new Set(selected);
    for (const spec of visibleUnselected) {
      next.add(spec.amplitudeEventName);
    }
    setSelection(next);
  };
  const clearAll = (): void => setSelection([]);

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>검증 대상 선택</span>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.miniButton}
            onClick={selectAllVisible}
            disabled={visibleUnselected.length === 0}
          >
            표시 전체 선택
          </button>
          <button
            type="button"
            className={styles.miniButton}
            onClick={clearAll}
            disabled={selected.size === 0}
          >
            전체 해제
          </button>
        </div>
      </div>

      <div className={styles.columns}>
        <UnselectedColumn />
        <SelectedColumn />
      </div>
    </section>
  );
}

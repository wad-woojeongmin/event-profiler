// 미선택 칼럼.
//
// 좌측: 아직 선택되지 않은 스펙을 노출. 행 클릭 또는 Space/Enter 키로
// `toggleSelection`을 호출해 우측 선택 칼럼으로 이동시킨다. 칼럼 헤더의
// "전체 추가"는 현재 필터 조건에 걸린 스펙만 일괄 선택한다.

import { useAtomValue, useSetAtom } from "jotai";

import {
  unselectedFilteredSpecsAtom,
  unselectedQueryAtom,
} from "../atoms/filter-atoms.ts";
import {
  selectedEventNamesAtom,
  setSelectionAtom,
  toggleSelectionAtom,
} from "../atoms/recording-atoms.ts";
import { specsAtom } from "../atoms/specs-atoms.ts";

import * as styles from "./spec-selector.css.ts";

export function UnselectedColumn() {
  const filtered = useAtomValue(unselectedFilteredSpecsAtom);
  const allSpecs = useAtomValue(specsAtom);
  const selected = useAtomValue(selectedEventNamesAtom);
  const query = useAtomValue(unselectedQueryAtom);
  const setQuery = useSetAtom(unselectedQueryAtom);
  const toggle = useSetAtom(toggleSelectionAtom);
  const setSelection = useSetAtom(setSelectionAtom);

  const addAllVisible = (): void => {
    const next = new Set(selected);
    for (const spec of filtered) {
      next.add(spec.amplitudeEventName);
    }
    setSelection(next);
  };

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>미선택</span>
        <span className={styles.columnCount}>
          {filtered.length.toLocaleString()}
        </span>
        <div className={styles.columnSpacer} />
        <button
          type="button"
          className={styles.columnActionPrimary}
          onClick={addAllVisible}
          disabled={filtered.length === 0}
        >
          전체 추가
        </button>
      </div>
      <div className={styles.searchPad}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="이벤트명 · 페이지"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={allSpecs.length === 0}
        />
      </div>
      {filtered.length === 0 ? (
        <div className={styles.list}>
          <div className={styles.emptyState}>
            {allSpecs.length === 0
              ? "상단에서 스펙을 불러와 주세요."
              : "조건에 맞는 이벤트가 없습니다."}
          </div>
        </div>
      ) : (
        <ul className={styles.list} role="list">
          {filtered.map((spec) => (
            <li
              key={spec.amplitudeEventName + ":" + spec.sourceRow}
              className={styles.item}
              role="checkbox"
              aria-checked={false}
              tabIndex={0}
              onClick={() => toggle(spec.amplitudeEventName)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  toggle(spec.amplitudeEventName);
                }
              }}
            >
              <span className={styles.checkboxEmpty} aria-hidden="true" />
              <div className={styles.itemMain}>
                <span className={styles.itemTitle}>
                  {spec.humanEventName || spec.amplitudeEventName}
                </span>
                <span className={styles.itemSubtitle}>
                  {spec.pageName} · {spec.amplitudeEventName}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

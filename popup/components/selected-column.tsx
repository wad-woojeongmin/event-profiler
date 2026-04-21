// 선택 칼럼.
//
// 우측: 사용자가 고른 스펙만 표시. 행 클릭(또는 × 버튼)은 `toggleSelection`으로
// 선택 해제 → 좌측 미선택 칼럼으로 돌려보낸다.

import { useAtomValue, useSetAtom } from "jotai";

import {
  selectedFilteredSpecsAtom,
  selectedQueryAtom,
} from "../atoms/filter-atoms.ts";
import {
  selectedEventNamesAtom,
  toggleSelectionAtom,
} from "../atoms/recording-atoms.ts";

import * as styles from "./spec-selector.css.ts";

export function SelectedColumn() {
  const filtered = useAtomValue(selectedFilteredSpecsAtom);
  const selected = useAtomValue(selectedEventNamesAtom);
  const query = useAtomValue(selectedQueryAtom);
  const setQuery = useSetAtom(selectedQueryAtom);
  const toggle = useSetAtom(toggleSelectionAtom);

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>선택된 이벤트 정의</span>
        <span className={styles.columnCount}>{selected.size}개</span>
      </div>
      <input
        className={styles.searchInput}
        type="search"
        placeholder="이벤트명 · 페이지명"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={selected.size === 0}
      />
      {filtered.length === 0 ? (
        <div className={styles.list}>
          <div className={styles.emptyState}>
            {selected.size === 0
              ? "좌측에서 이벤트를 선택하세요."
              : "조건에 맞는 이벤트가 없습니다."}
          </div>
        </div>
      ) : (
        <ul className={styles.list}>
          {filtered.map((spec) => (
            <li
              key={spec.amplitudeEventName + ":" + spec.sourceRow}
              className={styles.item}
              onClick={() => toggle(spec.amplitudeEventName)}
            >
              <div className={styles.itemMain}>
                <span className={styles.itemTitle}>
                  {spec.humanEventName || spec.amplitudeEventName}
                </span>
                <span className={styles.itemSubtitle}>
                  {spec.pageName} · {spec.amplitudeEventName}
                </span>
              </div>
              <button
                type="button"
                className={styles.removeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(spec.amplitudeEventName);
                }}
                aria-label={`${spec.amplitudeEventName} 선택 해제`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

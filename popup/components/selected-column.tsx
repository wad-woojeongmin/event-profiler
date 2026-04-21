// 선택 칼럼.
//
// 좌측: 사용자가 고른 스펙만 표시. 행 클릭(또는 × 버튼)은 `toggleSelection`으로
// 선택 해제 → 우측 스펙 풀로 돌려보낸다. 칼럼 헤더에 "해제" 액션을 두어 전체
// 선택을 한 번에 비울 수 있다.

import { useAtomValue, useSetAtom } from "jotai";

import {
  selectedFilteredSpecsAtom,
  selectedQueryAtom,
} from "../atoms/filter-atoms.ts";
import {
  selectedEventNamesAtom,
  setSelectionAtom,
  toggleSelectionAtom,
} from "../atoms/recording-atoms.ts";

import * as styles from "./spec-selector.css.ts";

export function SelectedColumn() {
  const filtered = useAtomValue(selectedFilteredSpecsAtom);
  const selected = useAtomValue(selectedEventNamesAtom);
  const query = useAtomValue(selectedQueryAtom);
  const setQuery = useSetAtom(selectedQueryAtom);
  const toggle = useSetAtom(toggleSelectionAtom);
  const setSelection = useSetAtom(setSelectionAtom);

  const clearAll = (): void => setSelection([]);

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>선택됨</span>
        <span className={styles.columnCount}>{selected.size}</span>
        <div className={styles.columnSpacer} />
        <button
          type="button"
          className={styles.columnAction}
          onClick={clearAll}
          disabled={selected.size === 0}
        >
          해제
        </button>
      </div>
      <div className={styles.searchPad}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={selected.size === 0}
        />
      </div>
      {filtered.length === 0 ? (
        <div className={styles.list}>
          <div className={styles.emptyState}>
            {selected.size === 0
              ? "우측에서 이벤트를 추가하세요"
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
              <span className={styles.checkboxChecked} aria-hidden="true">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8.5l3 3 7-7" />
                </svg>
              </span>
              <div className={styles.itemMain}>
                <span className={styles.itemTitle}>
                  {spec.humanEventName || spec.amplitudeEventName}
                </span>
                <span className={styles.itemSubtitle}>{spec.pageName}</span>
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

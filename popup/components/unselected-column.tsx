// 미선택 칼럼.
//
// 좌측: 체크박스로 아직 선택되지 않은 스펙을 노출. 체크 또는 행 클릭 시
// `toggleSelection`으로 우측 칼럼으로 이동한다. (실제 이동은 파생 atom이 다시
// 계산되며 자동으로 일어난다.)

import { useAtomValue, useSetAtom } from "jotai";

import {
  unselectedFilteredSpecsAtom,
  unselectedQueryAtom,
} from "../atoms/filter-atoms.ts";
import { toggleSelectionAtom } from "../atoms/recording-atoms.ts";
import { specsAtom } from "../atoms/specs-atoms.ts";

import * as styles from "./spec-selector.css.ts";

export function UnselectedColumn() {
  const filtered = useAtomValue(unselectedFilteredSpecsAtom);
  const allSpecs = useAtomValue(specsAtom);
  const query = useAtomValue(unselectedQueryAtom);
  const setQuery = useSetAtom(unselectedQueryAtom);
  const toggle = useSetAtom(toggleSelectionAtom);

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>미선택 이벤트 정의</span>
        <span className={styles.columnCount}>{filtered.length}개</span>
      </div>
      <input
        className={styles.searchInput}
        type="search"
        placeholder="이벤트명 · 페이지명"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={allSpecs.length === 0}
      />
      {filtered.length === 0 ? (
        <div className={styles.list}>
          <div className={styles.emptyState}>
            {allSpecs.length === 0
              ? "상단에서 스펙을 불러와 주세요."
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
              <input
                type="checkbox"
                checked={false}
                readOnly
                aria-label={spec.amplitudeEventName}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggle(spec.amplitudeEventName)}
              />
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

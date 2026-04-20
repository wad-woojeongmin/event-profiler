// 검증 대상 선택 리스트.
//
// 녹화 중에는 체크박스를 고정하여(disabled) 세션 중 대상 변경을 막는다.
// 대량 스펙도 단일 스크롤 영역에서 다루도록 maxHeight + overflow 패턴만 사용한다
// (가상화는 Phase 2: 1k+ 이벤트 환경에서 도입).

import { useAtomValue, useSetAtom } from "jotai";

import { filteredSpecsAtom, filterQueryAtom } from "../atoms/filter-atoms.ts";
import { recordingPhaseAtom, selectedEventNamesAtom, setSelectionAtom, toggleSelectionAtom } from "../atoms/recording-atoms.ts";
import { specsAtom } from "../atoms/specs-atoms.ts";

import * as styles from "./spec-list.css.ts";

export function SpecList() {
  const allSpecs = useAtomValue(specsAtom);
  const filtered = useAtomValue(filteredSpecsAtom);
  const selected = useAtomValue(selectedEventNamesAtom);
  const query = useAtomValue(filterQueryAtom);
  const phase = useAtomValue(recordingPhaseAtom);
  const setQuery = useSetAtom(filterQueryAtom);
  const toggle = useSetAtom(toggleSelectionAtom);
  const setSelection = useSetAtom(setSelectionAtom);

  const disabled = phase === "recording";
  // "표시 전체 선택"은 현재 필터 결과에 한정한다. 버튼 라벨로 이 경계를 명시하여
  // 필터 바깥 기존 선택이 덮어써지는 동작이 예측 가능하도록 한다.
  const selectVisible = (): void => {
    setSelection(filtered.map((spec) => spec.amplitudeEventName));
  };
  const clearAll = (): void => {
    setSelection([]);
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>검증 대상</span>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.miniButton}
            onClick={selectVisible}
            disabled={disabled || filtered.length === 0}
          >
            표시 전체 선택
          </button>
          <button
            type="button"
            className={styles.miniButton}
            onClick={clearAll}
            disabled={disabled || selected.size === 0}
          >
            전체 해제
          </button>
        </div>
      </div>

      <input
        className={styles.searchInput}
        type="search"
        placeholder="이벤트명 · 페이지명으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={allSpecs.length === 0}
      />

      <div className={styles.meta} aria-live="polite">
        {selected.size}개 선택 · 표시 {filtered.length}개 / 전체 {allSpecs.length}개
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          {allSpecs.length === 0
            ? "상단의 [스펙 불러오기]를 먼저 실행하세요."
            : "검색 조건에 맞는 이벤트가 없습니다."}
        </div>
      ) : (
        <ul className={styles.list}>
          {filtered.map((spec) => {
            const checked = selected.has(spec.amplitudeEventName);
            return (
              <li
                key={spec.amplitudeEventName + ":" + spec.sourceRow}
                className={styles.item}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(spec.amplitudeEventName)}
                  aria-label={spec.amplitudeEventName}
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
            );
          })}
        </ul>
      )}
    </section>
  );
}

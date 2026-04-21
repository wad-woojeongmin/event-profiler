// 스펙이 로드된 idle phase에서 상단에 뜨는 컨텍스트 헤더.
//
// 좌측: 뒤로 가기(Connect 화면 복귀) + 스펙 시트 이름/로드 수.
// 우측: 현재 선택된 대상 수.

import { useAtomValue, useSetAtom } from "jotai";

import { selectedEventNamesAtom } from "../atoms/recording-atoms.ts";
import { disconnectSpecsAtom, specsAtom } from "../atoms/specs-atoms.ts";

import * as styles from "./specs-context-header.css.ts";

const SPEC_SHEET_DISPLAY_TITLE = "CT App · Event Spec";

export function SpecsContextHeader() {
  const specs = useAtomValue(specsAtom);
  const selected = useAtomValue(selectedEventNamesAtom);
  const disconnect = useSetAtom(disconnectSpecsAtom);

  return (
    <section className={styles.wrapper}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => disconnect()}
        aria-label="연결 화면으로 돌아가기"
        title="연결 화면으로 돌아가기"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 3L5 8l5 5" />
        </svg>
      </button>
      <div className={styles.titleColumn}>
        <div className={styles.title}>{SPEC_SHEET_DISPLAY_TITLE}</div>
        <div className={styles.meta}>
          <strong className={styles.metaStrong}>
            {specs.length.toLocaleString()}
          </strong>
          개 스펙 로드됨
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.selectedCount}>{selected.size}</div>
        <div className={styles.selectedLabel}>검증 대상</div>
      </div>
    </section>
  );
}

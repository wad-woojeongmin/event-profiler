// 스펙이 로드된 idle phase에서 상단에 뜨는 컨텍스트 헤더.
//
// 좌측: 스펙 시트 로드 상태. 우측: 현재 선택된 대상 수. 새로고침 버튼으로
// 시트 최신화가 가능하되, 고정 시트이므로 URL 입력/교체 UI는 두지 않는다.

import { useAtomValue, useSetAtom } from "jotai";

import { loadSpecsAtom, specsAtom, specsLoadStateAtom } from "../atoms/specs-atoms.ts";
import { selectedEventNamesAtom } from "../atoms/recording-atoms.ts";

import * as styles from "./specs-context-header.css.ts";

export function SpecsContextHeader() {
  const specs = useAtomValue(specsAtom);
  const selected = useAtomValue(selectedEventNamesAtom);
  const loadState = useAtomValue(specsLoadStateAtom);
  const loadSpecs = useSetAtom(loadSpecsAtom);

  const isLoading = loadState === "loading";

  return (
    <section className={styles.wrapper}>
      <div className={styles.left}>
        <div className={styles.title}>스펙 시트</div>
        <div className={styles.meta}>
          <strong className={styles.metaStrong}>
            {specs.length.toLocaleString()}
          </strong>
          개 로드됨
        </div>
      </div>
      <button
        type="button"
        className={styles.refreshButton}
        onClick={() => void loadSpecs()}
        disabled={isLoading}
        aria-label="스펙 다시 불러오기"
        title="스펙 다시 불러오기"
      >
        {isLoading ? "⟳" : "↻"}
      </button>
      <div className={styles.right}>
        <div className={styles.selectedCount}>{selected.size}</div>
        <div className={styles.selectedLabel}>검증 대상</div>
      </div>
    </section>
  );
}

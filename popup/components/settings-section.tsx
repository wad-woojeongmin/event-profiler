// 상단 설정 섹션 — 시트 링크, 스펙 로드/로그인 버튼, 로드 상태 표시.
//
// 단일 고정 시트만 사용하므로 URL 입력 필드는 두지 않는다
// (docs/modules/m4-popup.md §UI 구성).

import { useAtomValue, useSetAtom } from "jotai";

import { SPEC_SHEET_URL } from "@/sheets/constants.ts";

import {
  authenticateAtom,
  loadSpecsAtom,
  specsAtom,
  specsErrorAtom,
  specsLoadStateAtom,
} from "../atoms/specs-atoms.ts";

import * as styles from "./settings-section.css.ts";

export function SettingsSection() {
  const loadState = useAtomValue(specsLoadStateAtom);
  const error = useAtomValue(specsErrorAtom);
  const specs = useAtomValue(specsAtom);
  const loadSpecs = useSetAtom(loadSpecsAtom);
  const authenticate = useSetAtom(authenticateAtom);

  const isLoading = loadState === "loading";

  return (
    <section className={styles.wrapper}>
      <div className={styles.label}>스펙 시트</div>
      <a
        className={styles.link}
        href={SPEC_SHEET_URL}
        target="_blank"
        rel="noreferrer noopener"
      >
        {SPEC_SHEET_URL}
      </a>

      <div className={styles.row}>
        <button
          className={styles.primaryButton}
          disabled={isLoading}
          onClick={() => void loadSpecs()}
        >
          {isLoading ? "불러오는 중…" : "스펙 불러오기"}
        </button>
        <button
          className={styles.button}
          disabled={isLoading}
          onClick={() => void authenticate()}
        >
          Google 로그인
        </button>
      </div>

      {loadState === "loaded" && (
        <div className={styles.meta} role="status">
          {specs.length}개 스펙 로드 완료
        </div>
      )}
      {error && (
        <div className={styles.errorText} role="alert">
          {error}
        </div>
      )}
    </section>
  );
}

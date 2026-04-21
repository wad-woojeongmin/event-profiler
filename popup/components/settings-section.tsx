// 스펙 연결(Connect) 화면.
//
// 스펙이 아직 로드되지 않은 idle 상태에서만 렌더된다(popup-app의 PhaseLayout 분기).
// 시트 URL은 고정이라 입력/선택 UI는 두지 않는다(docs/modules/m4-popup.md §UI 구성).
//
// 로그인 + 스펙 로드를 한 CTA 버튼으로 통합했다. `loadSpecsAtom`이 silent token
// 조회를 내부적으로 시도하므로 첫 클릭에서 OAuth → 로드까지 이어지고, 두 번째
// 클릭부터는 바로 로드만 돈다.

import { useAtomValue, useSetAtom } from "jotai";

import { SPEC_SHEET_URL } from "@/sheets/constants.ts";

import {
  authStatusAtom,
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
  const authStatus = useAtomValue(authStatusAtom);
  const loadSpecs = useSetAtom(loadSpecsAtom);

  const isLoading = loadState === "loading";
  const isAuthenticating = authStatus === "authenticating";
  const isBusy = isLoading || isAuthenticating;

  const ctaLabel = isLoading
    ? "스펙 불러오는 중…"
    : isAuthenticating
      ? "로그인 중…"
      : authStatus === "authenticated"
        ? "스펙 불러오기"
        : "Google로 로그인 후 스펙 불러오기";

  return (
    <section className={styles.wrapper}>
      <div className={styles.intro}>
        <h1 className={styles.heading}>Event Profiler</h1>
        <p className={styles.description}>
          웹앱에서 발생하는 이벤트를 녹화하고 스펙과 비교 검증합니다.
        </p>
      </div>

      <div className={styles.sheetCard}>
        <div className={styles.sheetLabel}>스펙 시트</div>
        <a
          className={styles.sheetLink}
          href={SPEC_SHEET_URL}
          target="_blank"
          rel="noreferrer noopener"
        >
          {SPEC_SHEET_URL}
        </a>
        {loadState === "loaded" && specs.length > 0 && (
          <div className={styles.sheetLoaded} role="status">
            <span className={styles.checkMark} aria-hidden="true">
              ✓
            </span>
            <span>
              <strong className={styles.loadedCount}>
                {specs.length.toLocaleString()}
              </strong>
              개 스펙 로드 완료
            </span>
          </div>
        )}
      </div>

      <div className={styles.spacer} />

      <button
        type="button"
        className={styles.primaryButton}
        disabled={isBusy}
        onClick={() => void loadSpecs()}
      >
        {ctaLabel}
      </button>
      <p className={styles.footnote}>
        OAuth 권한으로 지정된 스펙 시트에만 접근합니다.
      </p>

      {loadState === "loaded" && specs.length === 0 && (
        <div className={styles.errorText} role="status">
          불러온 스펙이 없습니다. 로그 정의 탭이 비어있거나 스펙 형식과 일치하지
          않습니다.
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

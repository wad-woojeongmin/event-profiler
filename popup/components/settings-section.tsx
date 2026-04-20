// 상단 설정 섹션 — 시트 링크, 스펙 로드/로그인 버튼, 로드 상태 표시.
//
// 단일 고정 시트만 사용하므로 URL 입력 필드는 두지 않는다
// (docs/modules/m4-popup.md §UI 구성).

import { useAtomValue, useSetAtom } from "jotai";

import { SPEC_SHEET_URL } from "@/sheets/constants.ts";

import {
  authStatusAtom,
  authenticateAtom,
  loadSpecsAtom,
  specsAtom,
  specsErrorAtom,
  specsLoadStateAtom,
} from "../atoms/specs-atoms.ts";

import * as styles from "./settings-section.css.ts";

const AUTH_BUTTON_LABEL = {
  idle: "Google 로그인",
  authenticating: "로그인 중…",
  authenticated: "✓ 로그인됨",
  failed: "Google 로그인 (재시도)",
} as const;

export function SettingsSection() {
  const loadState = useAtomValue(specsLoadStateAtom);
  const error = useAtomValue(specsErrorAtom);
  const specs = useAtomValue(specsAtom);
  const authStatus = useAtomValue(authStatusAtom);
  const loadSpecs = useSetAtom(loadSpecsAtom);
  const authenticate = useSetAtom(authenticateAtom);

  const isLoading = loadState === "loading";
  const isAuthenticating = authStatus === "authenticating";
  const isAuthenticated = authStatus === "authenticated";
  const authButtonClass = isAuthenticated ? styles.successButton : styles.button;

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
          className={authButtonClass}
          disabled={isLoading || isAuthenticating}
          onClick={() => void authenticate()}
          aria-live="polite"
        >
          {AUTH_BUTTON_LABEL[authStatus]}
        </button>
      </div>

      {loadState === "loaded" && (
        <div
          className={specs.length === 0 ? styles.errorText : styles.meta}
          role="status"
        >
          {specs.length === 0
            ? "불러온 스펙이 없습니다. 시트 첫 탭이 비어있거나 스펙 형식과 일치하지 않습니다."
            : `${specs.length}개 스펙 로드 완료`}
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

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

const SPEC_SHEET_DISPLAY_TITLE = "CT App · Event Spec";

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

  // 시트 URL에서 스펙 ID만 추출해 좁은 사이드패널에서도 끝이 보이도록 한다.
  const shortUrl = shortenSheetUrl(SPEC_SHEET_URL);

  return (
    <>
      <section className={styles.wrapper}>
        <div className={styles.intro}>
          <h1 className={styles.heading}>Event Profiler</h1>
          <p className={styles.description}>
            웹앱에서 발생하는 이벤트를 녹화하고 스펙과 비교 검증합니다.
          </p>
        </div>

        <div className={styles.sheetCard}>
          <div className={styles.sheetLabel}>스펙 시트</div>
          <div className={styles.sheetTitle}>{SPEC_SHEET_DISPLAY_TITLE}</div>
          <a
            className={styles.sheetLink}
            href={SPEC_SHEET_URL}
            target="_blank"
            rel="noreferrer noopener"
            title={SPEC_SHEET_URL}
          >
            {shortUrl}
          </a>
        </div>

        <div className={styles.spacer} />

        <button
          type="button"
          className={styles.primaryButton}
          disabled={isBusy}
          onClick={() => void loadSpecs()}
        >
          {authStatus !== "authenticated" && (
            <span className={styles.googleIcon} aria-hidden="true">
              <GoogleIcon />
            </span>
          )}
          {ctaLabel}
        </button>
        <p className={styles.footnote}>
          OAuth 권한으로 지정된 스펙 시트에만 접근합니다.
        </p>

        {loadState === "loaded" && specs.length === 0 && (
          <div className={styles.errorText} role="status">
            불러온 스펙이 없습니다. 로그 정의 탭이 비어있거나 스펙 형식과 일치
            하지 않습니다.
          </div>
        )}
        {error && (
          <div className={styles.errorText} role="alert">
            {error}
          </div>
        )}
      </section>
      <footer className={styles.footer}>
        <button type="button" className={styles.footerButton} disabled>
          스펙 로드 대기
        </button>
      </footer>
    </>
  );
}

function shortenSheetUrl(url: string): string {
  // docs.google.com/…/<id prefix>… 형태로 줄여 URL의 가독성 대신 식별 가능성만 남긴다.
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1] ?? "";
    const prefix = id.slice(0, 20);
    return `docs.google.com/…/${prefix}…`;
  } catch {
    return url;
  }
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M15.5 8.2c0-.5 0-1-.1-1.5H8v2.9h4.2c-.2 1-.7 1.8-1.5 2.3v2h2.4c1.4-1.3 2.2-3.2 2.2-5.4z"
      />
      <path
        fill="#34A853"
        d="M8 16c2 0 3.8-.7 5-1.8l-2.4-2c-.7.5-1.5.7-2.6.7-2 0-3.7-1.4-4.3-3.2H1.2v2.1C2.4 14.2 5 16 8 16z"
      />
      <path
        fill="#FBBC04"
        d="M3.7 9.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7v-2H1.2C.4 5.6 0 6.7 0 8s.4 2.4 1.2 3.7l2.5-2z"
      />
      <path
        fill="#EA4335"
        d="M8 3.2c1.1 0 2.1.4 2.9 1.1l2.1-2.1C11.8.8 10 0 8 0 5 0 2.4 1.8 1.2 4.3l2.5 2C4.3 4.6 6 3.2 8 3.2z"
      />
    </svg>
  );
}

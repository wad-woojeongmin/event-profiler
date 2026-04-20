// Google Sheets 기반 SheetsSource 어댑터.
//
// 외부 의존성(`browser.identity`, `fetch`)은 이 파일에서만 사용한다.
// 토큰 공급과 `fetch`는 주입 가능하게 분리해 `browser.identity` 없이도
// 어댑터 실구현을 단위 테스트에서 그대로 검증한다.

import { browser } from "wxt/browser";

import { SPEC_SPREADSHEET_ID } from "../constants.ts";
import {
  fetchSheetValues,
  fetchSpreadsheetTabs,
  SheetsApiError,
  type FetchFn,
} from "../google-sheets-api.ts";
import type { SheetTab, SheetsSource } from "../ports/sheets-source.ts";

const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
] as const;

/** 429 재시도 전 대기 시간(ms). 401/403은 백오프 없이 즉시 재발급·재시도. */
const RATE_LIMIT_BACKOFF_MS = 1_000;

/** 토큰 발급·폐기 경계. 테스트에서 `browser.identity` 없이 주입 가능. */
export interface TokenProvider {
  getToken(interactive: boolean): Promise<string>;
  removeToken(token: string): Promise<void>;
  clearAll(): Promise<void>;
}

export interface GoogleSheetsAdapterDeps {
  /** 기본값 = 전역 `fetch`. */
  fetchFn?: FetchFn;
  /** 기본값 = `SPEC_SPREADSHEET_ID`. */
  spreadsheetId?: string;
  /** 기본값 = `browser.identity` 기반 구현. */
  tokenProvider?: TokenProvider;
  /** 재시도 백오프 슬립. 테스트에서 즉시 resolve로 치환. */
  sleepFn?: (ms: number) => Promise<void>;
}

/**
 * 기본 어댑터 조립. `fetch`·`TokenProvider`·`sleep`을 주입 가능하게 두어
 * `browser.identity` 없이도 유닛 테스트에서 실구현을 그대로 검증한다.
 */
export function createGoogleSheetsSource(
  deps: GoogleSheetsAdapterDeps = {},
): SheetsSource {
  const fetchFn: FetchFn = deps.fetchFn ?? ((input, init) => fetch(input, init));
  const spreadsheetId = deps.spreadsheetId ?? SPEC_SPREADSHEET_ID;
  const tokenProvider = deps.tokenProvider ?? createBrowserTokenProvider();
  const sleepFn = deps.sleepFn ?? defaultSleep;

  /**
   * 토큰 발급 후 `job`을 실행한다. 재시도 정책은 "단일 분기 1회 한정":
   * - 401/403 → 토큰 폐기 + interactive 재발급 후 1회 재시도
   * - 429    → `RATE_LIMIT_BACKOFF_MS` 대기 후 1회 재시도
   * - 재시도 결과도 실패면 원인 에러 전파 (무한 루프 방지)
   *
   * 최초 토큰은 `interactive=false`로 요청해 불필요한 OAuth 팝업을 피하고,
   * 캐시 부재 시에만 interactive로 승급한다.
   */
  const runWithAuth = async <T>(
    job: (token: string) => Promise<T>,
  ): Promise<T> => {
    let token = await acquireInitialToken(tokenProvider);
    try {
      return await job(token);
    } catch (err) {
      if (isAuthError(err)) {
        await tokenProvider.removeToken(token);
        token = await tokenProvider.getToken(true);
        return await job(token);
      }
      if (isRateLimit(err)) {
        await sleepFn(RATE_LIMIT_BACKOFF_MS);
        return await job(token);
      }
      throw err;
    }
  };

  return {
    async authenticate(): Promise<void> {
      await tokenProvider.getToken(true);
    },

    async signOut(): Promise<void> {
      // `clearAllCachedAuthTokens`가 없는 폴리필 환경에서도 최소 1개 토큰은
      // 반드시 제거되도록, 캐시된 토큰을 먼저 명시적으로 폐기한다.
      try {
        const cached = await tokenProvider.getToken(false);
        await tokenProvider.removeToken(cached);
      } catch {
        // silent 실패 = 캐시 없음 → 이미 로그아웃 상태.
      }
      await tokenProvider.clearAll();
    },

    async listTabs(): Promise<SheetTab[]> {
      return runWithAuth((token) =>
        fetchSpreadsheetTabs(fetchFn, token, spreadsheetId),
      );
    },

    async fetchRows(sheetTitle: string): Promise<string[][]> {
      return runWithAuth((token) =>
        fetchSheetValues(fetchFn, token, sheetTitle, spreadsheetId),
      );
    },
  };
}

/**
 * 최초 토큰 획득. silent를 먼저 시도하고, 캐시 미스로 예외가 나면
 * interactive로 1회 승급한다. 이후 401/403/429 재시도는 `runWithAuth` 담당.
 */
async function acquireInitialToken(
  provider: TokenProvider,
): Promise<string> {
  try {
    return await provider.getToken(false);
  } catch {
    return await provider.getToken(true);
  }
}

/** `browser.identity` 기반 기본 TokenProvider. */
function createBrowserTokenProvider(): TokenProvider {
  return {
    async getToken(interactive) {
      const result = await browser.identity.getAuthToken({
        interactive,
        scopes: [...OAUTH_SCOPES],
      });
      const token = extractToken(result);
      if (!token) throw new Error("Google 인증 토큰을 얻지 못했습니다.");
      return token;
    },
    async removeToken(token) {
      await browser.identity.removeCachedAuthToken({ token });
    },
    async clearAll() {
      // `clearAllCachedAuthTokens`가 없는 폴리필이 있어 best-effort.
      // 호출자는 이 경로 이전에 캐시 토큰을 `removeToken`한 상태다.
      const fn = (
        browser.identity as unknown as {
          clearAllCachedAuthTokens?: () => Promise<void>;
        }
      ).clearAllCachedAuthTokens;
      if (typeof fn === "function") {
        await fn.call(browser.identity);
      }
    },
  };
}

/**
 * Chrome(MV3 polyfill)은 `{ token, grantedScopes }`, 일부 구현은 `string`을
 * 반환한다. 두 형태를 모두 `string | undefined`로 정규화한다.
 */
function extractToken(result: unknown): string | undefined {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "token" in result) {
    const t = (result as { token: unknown }).token;
    if (typeof t === "string") return t;
  }
  return undefined;
}

function isAuthError(err: unknown): boolean {
  return (
    err instanceof SheetsApiError && (err.status === 401 || err.status === 403)
  );
}

function isRateLimit(err: unknown): boolean {
  return err instanceof SheetsApiError && err.status === 429;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 공개 편의 함수(`sheets/index.ts`)가 사용하는 기본 인스턴스. */
export const googleSheetsSource: SheetsSource = createGoogleSheetsSource();

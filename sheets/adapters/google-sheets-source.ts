// Google Sheets 기반 SheetsSource 어댑터.
//
// 외부 의존성(`browser.identity`, `fetch`)은 여기에서만 쓴다. 토큰 발급/폐기와
// `fetch`는 주입 가능하도록 분리해 유닛 테스트에서 `browser.identity` 없이도
// 실구현을 그대로 검증할 수 있게 했다.

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

/** 401/403 재인증·429 레이트 리밋 양쪽 모두 "1회 고정 재시도"다. */
const RETRY_BACKOFF_MS = 1_000;

/** 토큰 발급·폐기 경계. 테스트에서 `browser.identity` 없이 주입 가능. */
export interface TokenProvider {
  getToken(interactive: boolean): Promise<string>;
  removeToken(token: string): Promise<void>;
  clearAll(): Promise<void>;
}

export interface GoogleSheetsAdapterDeps {
  /** 기본값은 전역 `fetch`. 테스트에서 mock 주입. */
  fetchFn?: FetchFn;
  /** 테스트에서 spreadsheet를 바꾸고 싶을 때 사용. */
  spreadsheetId?: string;
  /** 기본값은 `browser.identity` 기반. 테스트에서 fake 주입. */
  tokenProvider?: TokenProvider;
  /** 재시도 sleep 주입(테스트 속도 향상용). */
  sleepFn?: (ms: number) => Promise<void>;
}

/** 기본 어댑터 조립. */
export function createGoogleSheetsSource(
  deps: GoogleSheetsAdapterDeps = {},
): SheetsSource {
  const fetchFn: FetchFn = deps.fetchFn ?? ((input, init) => fetch(input, init));
  const spreadsheetId = deps.spreadsheetId ?? SPEC_SPREADSHEET_ID;
  const tokenProvider = deps.tokenProvider ?? createBrowserTokenProvider();
  const sleepFn = deps.sleepFn ?? defaultSleep;

  /**
   * 토큰을 받아 `job`을 실행한다.
   *
   * 재시도 정책은 "단일 분기 1회 고정 재시도" — 401/403이면 토큰 폐기 후
   * 대화형 재발급 1회, 429면 고정 백오프 후 1회만 더. 재시도 결과가 또 401/
   * 429여도 추가 재시도는 하지 않는다(무한 루프 방지).
   *
   * 최초 토큰은 `interactive=false`(silent)로 시도하여 UX를 해치지 않으며,
   * silent 실패 시에만 대화형으로 승급한다.
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
        await sleepFn(RETRY_BACKOFF_MS);
        return await job(token);
      }
      throw err;
    }
  };

  return {
    async authenticate(): Promise<void> {
      // UI에서 명시적으로 호출되는 로그인 플로우 — 항상 interactive.
      await tokenProvider.getToken(true);
    },

    async signOut(): Promise<void> {
      // 최신 토큰을 먼저 명시적으로 폐기한다. clearAll이 no-op인 브라우저
      // (`chrome.identity.clearAllCachedAuthTokens`가 없는 폴리필)에서도
      // 최소 한 개의 토큰은 반드시 제거되도록 보장한다.
      try {
        const cached = await tokenProvider.getToken(false);
        await tokenProvider.removeToken(cached);
      } catch {
        // silent 발급 실패(= 캐시 없음)는 이미 로그아웃 상태로 간주.
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
 * 최초 토큰 획득. silent(interactive=false)로 먼저 시도하고, 캐시가 비어
 * 예외가 나면 대화형으로 한 번 승급한다. 이후 재시도는 `runWithAuth` 책임.
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
      // 일부 폴리필/브라우저에서 이 API가 없을 수 있어 best-effort.
      // 호출자(adapter `signOut`)는 이 경로 이전에 알려진 토큰을 이미
      // 명시적으로 `removeToken`한다.
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
 * Chrome/Firefox/polyfill 반환값 차이를 흡수한다.
 * - Chrome(MV3 polyfill): `{ token: string, grantedScopes: string[] }`
 * - 일부 구현: `string` 자체
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

/** 모듈 기본 인스턴스. 공개 편의 함수(`sheets/index.ts`)가 이걸 사용한다. */
export const googleSheetsSource: SheetsSource = createGoogleSheetsSource();

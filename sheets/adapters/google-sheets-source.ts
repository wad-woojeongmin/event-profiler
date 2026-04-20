// Google Sheets 기반 SheetsSource 어댑터.
//
// 외부 의존성(`browser.identity`, `fetch`, `wxt/storage`)은 여기에서만 쓴다.
// 토큰 발급/폐기와 `fetch`는 주입 가능하도록 분리해 유닛 테스트에서
// `browser.identity`에 의존하지 않도록 했다.

import { browser } from "wxt/browser";
import { storage } from "wxt/utils/storage";

import { SPEC_SPREADSHEET_ID } from "../constants.ts";
import {
  fetchSheetValues,
  fetchSpreadsheetTabs,
  SheetsApiError,
  type FetchFn,
} from "../google-sheets-api.ts";
import type { SheetTab, SheetsSource } from "../ports/sheets-source.ts";

const OAUTH_SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

/** 레이트 리밋 시 재시도 전 대기 시간(ms). */
const RATE_LIMIT_BACKOFF_MS = 1_000;

/**
 * 탭별 raw rows 내부 캐시.
 *
 * `local:specsCache`(EventSpec[])는 스펙 파싱 후 소비자가 쓰는 경계 계약이며,
 * 이 키는 M5 내부에서만 쓰는 원본 rows 캐시다. 스펙 파싱 전 단계의 데이터라
 * 탭 전환·빠른 복구용으로만 사용한다.
 */
const rowsCache = storage.defineItem<Record<string, string[][]> | null>(
  "local:sheetRowsCache",
  { fallback: null },
);

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
   * 토큰을 받아 `job`을 실행. 401/403은 토큰 폐기 후 재발급하여 한 번,
   * 429는 백오프 후 한 번 재시도한다.
   */
  const runWithAuth = async <T>(
    job: (token: string) => Promise<T>,
  ): Promise<T> => {
    let token = await tokenProvider.getToken(true);
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
      // 토큰 획득만 수행. 결과는 외부로 노출하지 않는다(포트 무누출).
      await tokenProvider.getToken(true);
    },

    async signOut(): Promise<void> {
      await tokenProvider.clearAll();
    },

    async listTabs(): Promise<SheetTab[]> {
      return runWithAuth((token) =>
        fetchSpreadsheetTabs(fetchFn, token, spreadsheetId),
      );
    },

    async fetchRows(sheetTitle: string): Promise<string[][]> {
      const rows = await runWithAuth((token) =>
        fetchSheetValues(fetchFn, token, sheetTitle, spreadsheetId),
      );
      // 성공적으로 받은 rows만 캐시에 병합 저장.
      const current = (await rowsCache.getValue()) ?? {};
      await rowsCache.setValue({ ...current, [sheetTitle]: rows });
      return rows;
    },
  };
}

/** `browser.identity` 기반 기본 TokenProvider. */
function createBrowserTokenProvider(): TokenProvider {
  return {
    async getToken(interactive) {
      const result = await browser.identity.getAuthToken({
        interactive,
        scopes: OAUTH_SCOPES,
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

// M5 공개 API.
//
// 다른 모듈(팝업·백그라운드)은 이 파일만 import한다. 어댑터·API 헬퍼·
// 스토리지 키 등 내부 구현 디테일은 노출되지 않는다.

export type { SheetTab, SheetsSource } from "./ports/sheets-source.ts";
export { SPEC_SHEET_URL, SPEC_SPREADSHEET_ID } from "./constants.ts";
export {
  createGoogleSheetsSource,
  type GoogleSheetsAdapterDeps,
  type TokenProvider,
} from "./adapters/google-sheets-source.ts";
export { parseSpecCsv, parseSpecRows, parseParams } from "./spec-parser.ts";

import { googleSheetsSource } from "./adapters/google-sheets-source.ts";
import type { SheetTab } from "./ports/sheets-source.ts";

/** 명시적 인증 (최초 로그인 / 토큰 재발급 UI). */
export async function authenticate(): Promise<void> {
  return googleSheetsSource.authenticate();
}

/** 캐시된 Google 토큰을 모두 제거한다. */
export async function signOut(): Promise<void> {
  return googleSheetsSource.signOut();
}

/** 고정 스펙 시트의 탭 목록. */
export async function listSheetTabs(): Promise<SheetTab[]> {
  return googleSheetsSource.listTabs();
}

/** 지정 탭의 A1:ZZ 범위 값을 raw rows로 반환(M6 `parseSpecRows`에 직결). */
export async function fetchSheetRows(sheetTitle: string): Promise<string[][]> {
  return googleSheetsSource.fetchRows(sheetTitle);
}

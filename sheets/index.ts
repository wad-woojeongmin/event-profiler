// sheets 모듈 공개 API. 외부 모듈은 이 파일만 import한다.
// 팩토리(`createGoogleSheetsSource`)와 포트·상수·파서는 re-export하고,
// 기본 인스턴스(`googleSheetsSource`)·API 헬퍼는 파일 내부로 숨긴다.

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

/** UI에서 호출하는 명시적 인증 트리거 (항상 interactive). */
export async function authenticate(): Promise<void> {
  return googleSheetsSource.authenticate();
}

/** 캐시된 Google 토큰을 모두 제거한다. */
export async function signOut(): Promise<void> {
  return googleSheetsSource.signOut();
}

/** 캐시된 유효 토큰 유무 (silent 조회). UI가 팝업 재오픈 시 로그인 상태 복구용. */
export async function hasCachedToken(): Promise<boolean> {
  return googleSheetsSource.hasCachedToken();
}

/** 스펙 시트의 탭 목록을 반환한다. */
export async function listSheetTabs(): Promise<SheetTab[]> {
  return googleSheetsSource.listTabs();
}

/** 지정 탭의 A1:ZZ 값을 그대로 반환. `parseSpecRows`에 직접 투입 가능. */
export async function fetchSheetRows(sheetTitle: string): Promise<string[][]> {
  return googleSheetsSource.fetchRows(sheetTitle);
}

// Google Sheets API v4 호출을 담당하는 순수 함수 모듈.
//
// 이 파일은 `browser.*`·`wxt/storage` 등 확장 API에 의존하지 않는다. 토큰과
// `fetch`는 호출자로부터 주입받아 단위 테스트에서 모킹 가능하도록 설계했다.

import { SPEC_SPREADSHEET_ID } from "./constants.ts";
import type { SheetTab } from "./ports/sheets-source.ts";

const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

/** 호출자가 주입하는 `fetch` 인터페이스. 표준 `fetch`와 시그니처 호환. */
export type FetchFn = typeof fetch;

/**
 * `spreadsheets.get`으로 탭 메타데이터만 가져온다.
 * `fields` 파라미터로 응답 크기를 줄인다.
 */
export async function fetchSpreadsheetTabs(
  fetchFn: FetchFn,
  token: string,
  spreadsheetId: string = SPEC_SPREADSHEET_ID,
): Promise<SheetTab[]> {
  const url = `${API_BASE}/${encodeURIComponent(spreadsheetId)}?fields=${encodeURIComponent(
    "sheets(properties(sheetId,title))",
  )}`;
  const res = await fetchFn(url, buildRequestInit(token));
  await throwIfNotOk(res);
  const body = (await res.json()) as {
    sheets?: { properties?: { sheetId?: number; title?: string } }[];
  };
  const tabs: SheetTab[] = [];
  for (const sheet of body.sheets ?? []) {
    const props = sheet.properties;
    if (!props) continue;
    const { sheetId, title } = props;
    if (typeof sheetId !== "number" || typeof title !== "string") continue;
    tabs.push({ title, gid: sheetId });
  }
  return tabs;
}

/**
 * `spreadsheets.values.get`으로 탭의 값을 가져온다.
 * 범위는 A1:ZZ로 고정 — 스펙 시트 컬럼 수가 가변적이어서 여유를 둔다.
 */
export async function fetchSheetValues(
  fetchFn: FetchFn,
  token: string,
  sheetTitle: string,
  spreadsheetId: string = SPEC_SPREADSHEET_ID,
): Promise<string[][]> {
  // 탭 제목에 특수문자가 있으면 A1 노테이션에서 작은따옴표로 감싸야 한다.
  const quoted = sheetTitle.includes(" ") || /[^A-Za-z0-9_]/.test(sheetTitle)
    ? `'${sheetTitle.replace(/'/g, "''")}'`
    : sheetTitle;
  const range = `${quoted}!A1:ZZ`;
  const url = `${API_BASE}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const res = await fetchFn(url, buildRequestInit(token));
  await throwIfNotOk(res);
  const body = (await res.json()) as { values?: string[][] };
  return body.values ?? [];
}

/** Sheets API의 비정상 응답을 표현하는 에러. 상태 코드 기반 재시도에 사용. */
export class SheetsApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`Sheets API ${status}: ${body.slice(0, 200)}`);
    this.name = "SheetsApiError";
  }
}

function buildRequestInit(token: string): RequestInit {
  return {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  // body는 best-effort로 읽는다 — 이미 소비된 스트림이어도 무시.
  const text = await res.text().catch(() => "");
  throw new SheetsApiError(res.status, text);
}

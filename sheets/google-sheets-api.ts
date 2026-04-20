// Google Sheets API v4 호출 순수 함수. 확장 API(`browser.*`·storage)에
// 의존하지 않으며, 토큰과 `fetch`는 호출자가 주입한다.

import { SPEC_SPREADSHEET_ID } from "./constants.ts";
import type { SheetTab } from "./ports/sheets-source.ts";

const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

/** 표준 `fetch`와 시그니처 호환되는 주입 가능한 fetch 타입. */
export type FetchFn = typeof fetch;

/**
 * `spreadsheets.get`으로 탭 메타데이터만 조회한다.
 * `fields` 파라미터로 응답 크기를 최소화한다.
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
 * `spreadsheets.values.get`으로 탭 값을 조회한다.
 * 컬럼 수가 시트마다 달라 범위는 A1:ZZ로 여유 있게 고정.
 */
export async function fetchSheetValues(
  fetchFn: FetchFn,
  token: string,
  sheetTitle: string,
  spreadsheetId: string = SPEC_SPREADSHEET_ID,
): Promise<string[][]> {
  const range = `${quoteA1SheetTitle(sheetTitle)}!A1:ZZ`;
  const url = `${API_BASE}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const res = await fetchFn(url, buildRequestInit(token));
  await throwIfNotOk(res);
  const body = (await res.json()) as { values?: string[][] };
  return body.values ?? [];
}

/** Sheets API 비정상 응답. `status`로 재시도 분기(401/403/429)를 구분한다. */
export class SheetsApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`Sheets API ${status}: ${body.slice(0, 200)}`);
    this.name = "SheetsApiError";
  }
}

/**
 * A1 노테이션의 탭 제목 쿼팅.
 * ES 식별자 형태(`^[A-Za-z_]\w*$`)가 아닌 이름은 작은따옴표로 감싸야 한다.
 * 숫자 전용("2024")·공백 포함·한글은 unquoted 전달 시 API가 400을 반환한다.
 * 내부 `'`는 `''`로 escape.
 */
function quoteA1SheetTitle(title: string): string {
  if (/^[A-Za-z_]\w*$/.test(title)) return title;
  return `'${title.replace(/'/g, "''")}'`;
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
  // body 읽기는 best-effort — 이미 소비된 스트림이면 빈 문자열로 대체.
  const text = await res.text().catch(() => "");
  throw new SheetsApiError(res.status, text);
}

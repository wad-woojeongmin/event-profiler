import Papa from "papaparse";
import {
  EVENT_TYPES,
  LOG_TYPES,
  type EventSpec,
  type EventType,
  type LogType,
  type ParseResult,
  type ParseWarning,
} from "../types/spec.ts";

export interface ParseOptions {
  sheetName?: string;
  /** 0-indexed. 스펙 시트는 2번째 행(인덱스 1)이 실제 헤더. */
  headerRowIndex?: number;
}

const DEFAULT_HEADER_ROW = 1;

/**
 * 스펙 시트 CSV 문자열을 EventSpec 레코드로 변환한다.
 * CSV 업로드·클립보드 입력 경로용 얇은 래퍼이며, 프로덕션 Sheets API 경로는
 * `parseSpecRows`에 `string[][]`를 직접 넘겨 CSV 직렬화 왕복을 피한다.
 */
export function parseSpecCsv(
  csv: string,
  options: ParseOptions = {},
): ParseResult {
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: false });
  return parseSpecRows(parsed.data, options);
}

/**
 * 스펙 시트 행 배열을 EventSpec 레코드로 변환한다.
 * Sheets API `values.get`이 돌려주는 `values`를 그대로 받을 수 있다.
 *
 * 시트는 PM/DA가 자유롭게 편집하므로 관용적으로 동작한다:
 * - 컬럼은 위치가 아닌 **헤더 이름**으로 찾는다 (시트마다 컬럼 수 상이).
 * - `to-be` 값 우선, 비어있으면 `as-is`로 fallback.
 * - `extension` 셀은 placeholder·설명·중복이 섞인 자유 텍스트.
 * - status 필터 없음 — draft/broken 행도 검증 대상에 포함.
 */
export function parseSpecRows(
  rows: string[][],
  options: ParseOptions = {},
): ParseResult {
  const headerRowIndex = options.headerRowIndex ?? DEFAULT_HEADER_ROW;
  const sheetName = options.sheetName;

  const warnings: ParseWarning[] = [];
  const specs: EventSpec[] = [];

  const headerRow = rows[headerRowIndex];
  if (!headerRow) {
    warnings.push({
      code: "missing_header",
      row: headerRowIndex,
      message: `헤더 행 ${headerRowIndex}을 찾을 수 없음`,
    });
    return { specs, warnings };
  }

  const columns = buildColumnMap(headerRow);

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // 경고·리포트에 노출되는 행 번호는 시트 에디터와 동일한 1-indexed.
    const sourceRow = i + 1;

    if (isEmptyRow(row)) {
      warnings.push({
        code: "skipped_empty_row",
        row: sourceRow,
        message: "빈 행 스킵",
      });
      continue;
    }

    const amplitudeEventName = pickAmplitudeEventName(row, columns);
    const humanEventName = pickFirst(row, columns.eventName) ?? "";

    // 섹션 앵커 행(한 셀에만 섹션 제목)은 이벤트명 컬럼이 비어 있다.
    if (!amplitudeEventName && !humanEventName) {
      warnings.push({
        code: "skipped_anchor_row",
        row: sourceRow,
        message: "이벤트명이 없어 섹션 앵커 행으로 간주하고 스킵",
        detail: row.slice(0, 3).join("|"),
      });
      continue;
    }

    if (!amplitudeEventName) {
      warnings.push({
        code: "missing_event_name",
        row: sourceRow,
        message: `humanEventName="${humanEventName}"는 있으나 Amplitude 이벤트명 컬럼이 비어있음`,
      });
      continue;
    }

    const pageName = pickToBe(row, columns.pageName) ?? "";
    const sectionName = pickToBe(row, columns.objectContainer);
    const actionName = pickToBe(row, columns.objectType);
    const eventTypeRaw = pickToBe(row, columns.eventType) ?? "";
    const logTypeRaw = pickFirst(row, columns.logType);

    const eventType = normalizeEventType(eventTypeRaw, sourceRow, warnings);
    const logType = normalizeLogType(logTypeRaw, sourceRow, warnings);

    const objectCell = pickFirst(row, columns.object) ?? "";
    const extensionCell = pickFirst(row, columns.extension) ?? "";
    const { params, referencedExtensions } = parseParams(
      objectCell,
      extensionCell,
      sourceRow,
      warnings,
    );

    specs.push({
      amplitudeEventName,
      humanEventName,
      pageName,
      sectionName: sectionName || undefined,
      actionName: actionName || undefined,
      eventType,
      logType,
      params,
      referencedExtensions,
      rawExtension: extensionCell,
      status: pickFirst(row, columns.status) ?? "",
      sourceRow,
      sourceSheet: sheetName,
    });
  }

  return { specs, warnings };
}

// ---------- 컬럼 해결 ----------

interface ColumnMap {
  status: number[];
  pageName: { toBe: number[]; asIs: number[] };
  objectContainer: { toBe: number[]; asIs: number[] };
  objectType: { toBe: number[]; asIs: number[] };
  eventType: { toBe: number[]; asIs: number[] };
  logType: number[];
  eventName: number[];
  object: number[];
  extension: number[];
}

function buildColumnMap(headerRow: string[]): ColumnMap {
  const map: ColumnMap = {
    status: [],
    pageName: { toBe: [], asIs: [] },
    objectContainer: { toBe: [], asIs: [] },
    objectType: { toBe: [], asIs: [] },
    eventType: { toBe: [], asIs: [] },
    logType: [],
    eventName: [],
    object: [],
    extension: [],
  };

  headerRow.forEach((raw, index) => {
    const name = normalizeHeader(raw);
    if (!name) return;

    if (name === "status") map.status.push(index);
    else if (name === "pagename(to-be)") map.pageName.toBe.push(index);
    else if (name === "pagename(as-is)") map.pageName.asIs.push(index);
    else if (name === "objectcontainer(to-be)")
      map.objectContainer.toBe.push(index);
    else if (name === "objectcontainer(as-is)")
      map.objectContainer.asIs.push(index);
    else if (name === "objecttype(to-be)") map.objectType.toBe.push(index);
    else if (name === "objecttype(as-is)") map.objectType.asIs.push(index);
    else if (name === "eventtype(to-be)") map.eventType.toBe.push(index);
    else if (name === "eventtype(as-is)") map.eventType.asIs.push(index);
    else if (name === "logtype") map.logType.push(index);
    else if (name === "eventname") map.eventName.push(index);
    else if (name === "object(string)") map.object.push(index);
    else if (name === "extension") map.extension.push(index);
  });

  return map;
}

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "");
}

// ---------- 행 헬퍼 ----------

function isEmptyRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === "");
}

function pickFirst(row: string[], indices: number[]): string | undefined {
  for (const i of indices) {
    const v = row[i]?.trim();
    if (v) return v;
  }
  return undefined;
}

function pickToBe(
  row: string[],
  col: { toBe: number[]; asIs: number[] },
): string | undefined {
  return pickFirst(row, col.toBe) ?? pickFirst(row, col.asIs);
}

/**
 * Amplitude 이벤트명 = `__` 구분자·trailing `_` 모두 없는 마지막 `eventName`.
 * 시트에는 eventName 컬럼이 보통 3개 존재한다:
 *   1) human-readable: `click__banner`
 *   2) GA4 변형: `shopDetail_appDown_banner_click_`  (trailing `_`)
 *   3) Amplitude 최종: `shopDetail_appDown_banner_click`
 * (3)을 뒤에서부터 스캔해 찾는다.
 */
function pickAmplitudeEventName(row: string[], columns: ColumnMap): string {
  for (let i = columns.eventName.length - 1; i >= 0; i--) {
    const idx = columns.eventName[i];
    if (idx === undefined) continue;
    const v = row[idx]?.trim();
    if (!v) continue;
    if (v.includes("__")) continue; // human-readable 스킵
    if (v.endsWith("_")) continue; // GA4 변형 스킵
    return v;
  }

  // Fallback: `__`가 없는 마지막 값을 trailing `_` 제거 후 반환.
  for (let i = columns.eventName.length - 1; i >= 0; i--) {
    const idx = columns.eventName[i];
    if (idx === undefined) continue;
    const v = row[idx]?.trim();
    if (v && !v.includes("__")) return v.replace(/_+$/, "");
  }

  return "";
}

// ---------- 정규화 ----------

function normalizeEventType(
  raw: string,
  row: number,
  warnings: ParseWarning[],
): EventType | string {
  const v = raw.trim().toLowerCase();
  if (!v) return "";
  if ((EVENT_TYPES as readonly string[]).includes(v)) return v as EventType;
  warnings.push({
    code: "unknown_event_type",
    row,
    message: `알 수 없는 eventType "${raw}"`,
  });
  return v;
}

function normalizeLogType(
  raw: string | undefined,
  row: number,
  warnings: ParseWarning[],
): LogType | string | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if ((LOG_TYPES as readonly string[]).includes(v)) return v as LogType;
  warnings.push({
    code: "unknown_log_type",
    row,
    message: `알 수 없는 logType "${raw}"`,
  });
  return v;
}

// ---------- 파라미터 파싱 ----------

const EXTENSION_REFERENCE_PATTERN = /공통\s*extension/i;

export function parseParams(
  objectCell: string,
  extensionCell: string,
  row: number,
  warnings: ParseWarning[],
): { params: string[]; referencedExtensions: string[] } {
  const params: string[] = [];
  const referencedExtensions: string[] = [];
  const seen = new Set<string>();
  const seenRefs = new Set<string>();

  const pushParam = (name: string) => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    params.push(name);
  };
  const pushRef = (name: string) => {
    if (!name || seenRefs.has(name)) return;
    seenRefs.add(name);
    referencedExtensions.push(name);
  };

  const process = (cell: string) => {
    if (!cell) return;
    for (const rawToken of splitParamCell(cell)) {
      const token = rawToken.trim();
      if (!token) continue;

      // 공용 확장 참조 예: "[검색 관련 동작 공통 Extension]", "지도 관련 동작 공통 Extension".
      if (EXTENSION_REFERENCE_PATTERN.test(token)) {
        const cleaned = token.replace(/^\[|\]$/g, "").trim();
        pushRef(cleaned);
        continue;
      }

      // 대괄호로 감싼 미인식 토큰은 참조 후보로 보존해 리포트에서 확인 가능하게 한다.
      if (/^\[.*\]$/.test(token)) {
        pushRef(token.replace(/^\[|\]$/g, "").trim());
        continue;
      }

      // `$foo: description` → 콜론 앞 키만 남긴다.
      const key = extractParamKey(token);
      if (key) {
        pushParam(key);
        continue;
      }

      warnings.push({
        code: "param_unparseable_token",
        row,
        message: "파라미터 토큰을 해석할 수 없음",
        detail: token,
      });
    }
  };

  process(objectCell);
  process(extensionCell);

  return { params, referencedExtensions };
}

/** 셀 내부에 줄바꿈이 섞일 수 있어 쉼표·줄바꿈 모두를 구분자로 취급한다. */
function splitParamCell(cell: string): string[] {
  return cell
    .replace(/\r/g, "")
    .split(/,|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** `$shopRef`, `$feedback_type: positive / negative` 등에서 키만 추출한다. */
function extractParamKey(token: string): string | undefined {
  let t = token.trim();
  const colonIdx = t.indexOf(":");
  if (colonIdx >= 0) t = t.slice(0, colonIdx).trim();
  if (!t) return undefined;
  if (!t.startsWith("$")) return undefined;
  t = t.slice(1).trim();
  // `restaurantItem.shopRef` 같은 dotted path는 원형 그대로 유지한다.
  if (!/^[A-Za-z_][\w.]*$/.test(t)) return undefined;
  return t;
}

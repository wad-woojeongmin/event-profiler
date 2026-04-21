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

  const columns = resolveColumns(headerRow, headerRowIndex, warnings);

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

    const amplitudeEventName = pickAmplitudeEventName(
      row,
      columns,
      headerRow.length,
    );
    const humanEventName = pickHumanEventName(row, columns, amplitudeEventName);

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

/**
 * 단일 휴리스틱으로 헤더를 해석한다. 시트마다 편집자가 `(as-is)`·`(to-be)`
 * 접미사를 붙이는 방식이 제각각이라, 아래 규칙으로 관용 처리한다:
 *
 *  1) 정규화: 제어문자·언더스코어·공백을 모두 제거 후 소문자.
 *     예) `log_type`, `logType`, `LOG TYPE` → 모두 `logtype`.
 *  2) 경계: logType 컬럼을 base 필드(pageName/objectContainer/objectType/
 *     eventType)와 이벤트명·파라미터 영역의 구분선으로 쓴다. Tab 24처럼
 *     pageName이 두 번 등장하는 시트에서 뒷쪽 블록을 무시하기 위한 장치.
 *  3) bare-pair 관용: base 필드가 접미사 없이 두 번 등장하면 통상 앞이 as-is,
 *     뒤가 to-be. 편집자들이 `(as-is)`·`(to-be)` 표기를 생략한 탭 다수가
 *     이 패턴을 따른다(시트 가이드 없이 퍼진 사실상의 컨벤션).
 *
 * 명확하게 판단할 수 없는 경우에만 `ambiguous_header_resolution` 경고를
 * 발생시켜 리포트에 남긴다.
 */
function resolveColumns(
  headerRow: string[],
  headerRowIndex: number,
  warnings: ParseWarning[],
): ColumnMap {
  const headerSourceRow = headerRowIndex + 1;
  const normalized = headerRow.map((raw) => normalizeHeader(raw));

  const logType: number[] = [];
  normalized.forEach((name, idx) => {
    if (name === "logtype") logType.push(idx);
  });

  // base 필드 후보는 logType 왼쪽만 대상으로 삼는다. 없으면 전체 범위.
  const boundary = logType[0] ?? normalized.length;
  if (logType.length === 0) {
    warnings.push({
      code: "no_logtype_boundary",
      row: headerSourceRow,
      message:
        "logType 컬럼이 없어 base 필드(pageName/objectContainer/objectType/eventType) 경계를 판정할 수 없음",
    });
  }

  const resolvePair = (
    base: string,
  ): { toBe: number[]; asIs: number[] } => {
    const asIs: number[] = [];
    const toBe: number[] = [];
    const bare: number[] = [];
    normalized.forEach((name, idx) => {
      if (idx >= boundary) return;
      if (stripSuffix(name) !== base) return;
      if (/\(asis\)/.test(name)) asIs.push(idx);
      else if (/\(tobe\)/.test(name)) toBe.push(idx);
      else bare.push(idx);
    });

    if (bare.length === 0) return { toBe, asIs };

    if (asIs.length === 0 && toBe.length === 0) {
      // 전부 bare: 관용 컨벤션 적용. 3개 이상은 모호하므로 경고.
      if (bare.length === 1) {
        toBe.push(bare[0]!);
      } else if (bare.length === 2) {
        asIs.push(bare[0]!);
        toBe.push(bare[1]!);
      } else {
        warnings.push({
          code: "ambiguous_header_resolution",
          row: headerSourceRow,
          message: `"${base}" 헤더가 접미사 없이 ${bare.length}개 — 마지막만 to-be로 사용`,
          detail: `columns=${bare.join(",")}`,
        });
        toBe.push(bare[bare.length - 1]!);
        for (let i = 0; i < bare.length - 1; i++) asIs.push(bare[i]!);
      }
      return { toBe, asIs };
    }

    // 분류된 컬럼과 bare가 섞여 있음 — bare는 toBe로 보되 경고한다.
    warnings.push({
      code: "ambiguous_header_resolution",
      row: headerSourceRow,
      message: `"${base}" 헤더에 (as-is)/(to-be)와 접미사 없는 컬럼이 혼재`,
      detail: `asIs=${asIs.join(",")}, toBe=${toBe.join(",")}, bare=${bare.join(",")}`,
    });
    toBe.push(...bare);
    return { toBe, asIs };
  };

  const status: number[] = [];
  const eventName: number[] = [];
  const object: number[] = [];
  const extension: number[] = [];
  normalized.forEach((name, idx) => {
    if (name === "status") status.push(idx);
    else if (name.startsWith("eventname")) eventName.push(idx);
    else if (name === "object(string)") object.push(idx);
    else if (name === "extension") extension.push(idx);
  });

  return {
    status,
    pageName: resolvePair("pagename"),
    objectContainer: resolvePair("objectcontainer"),
    objectType: resolvePair("objecttype"),
    eventType: resolvePair("eventtype"),
    logType,
    eventName,
    object,
    extension,
  };
}

/**
 * 제어문자(`\x00-\x1F`)와 언더스코어를 제거해 `log_type`·`event_type`을
 * `logtype`·`eventtype`과 동치로 취급한다. 공백도 전부 제거해
 * `"objectType (as-is)"` 같은 표기를 흡수한다.
 */
function normalizeHeader(raw: string): string {
  return raw
    .replace(/[\x00-\x1F]/g, "")
    .replace(/_/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

/** `"pagename(to-be)"` → `"pagename"`. 괄호 블록을 모두 제거한다. */
function stripSuffix(normalized: string): string {
  return normalized.replace(/\([^)]*\)/g, "");
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
 * Amplitude 이벤트명은 **값 패턴**으로 식별한다 — 헤더 레이블은 탭마다
 * 뒤섞여 있어 신뢰할 수 없다. 예: Tab 22는 `eventName(GA)` 컬럼이 실제로는
 * Amplitude 규격(`bookmarkDone_bookmark_click`)을 담고, `eventName(Amplitude)`
 * 컬럼이 사람이 읽기 쉬운 `click__bookmark`를 담는 반전 배치다. Tab 21처럼
 * 헤더 행이 data rows보다 짧게 truncate되어 canonical eventName 컬럼이
 * 헤더 선언에서 아예 빠진 탭도 있다.
 *
 * 규칙:
 *   - 후보: **row의 모든 셀**. 헤더 선언 여부 무시.
 *   - 패턴: `lowerCamel(_segment)+` — 최소 1개의 `_`를 요구해 `shopDetail`
 *     같은 단어, `applied` 같은 status 값을 배제한다. `click__banner` 같은
 *     human 형식은 빈 세그먼트로 인해 자동 탈락.
 *   - 우→좌 스캔: canonical 컬럼이 통상 후행에 위치.
 *   - Fallback: trailing `_`가 붙은 GA4 변형만 뒤쪽 `_` 제거 후 재검증.
 */
const AMPLITUDE_NAME_PATTERN = /^[a-z][a-zA-Z0-9]*(?:_[a-zA-Z0-9]+)+$/;

/**
 * human-readable 이벤트명을 고른다. Tab 22처럼 `eventName(GA)` 컬럼이
 * 맨 앞에 있으면서 canonical 값을 담는 역배치 탭 때문에 단순히
 * `pickFirst`로 첫 컬럼을 고르면 human이 아니라 canonical이 돌아올 수
 * 있다. Amplitude 선택 결과를 제외하고 `__` 또는 canonical 패턴과
 * 다른 첫 값을 human으로 본다.
 */
function pickHumanEventName(
  row: string[],
  columns: ColumnMap,
  amplitudeEventName: string,
): string {
  for (const idx of columns.eventName) {
    const v = row[idx]?.trim();
    if (!v) continue;
    if (v === amplitudeEventName) continue;
    if (AMPLITUDE_NAME_PATTERN.test(v)) continue;
    if (v.replace(/_+$/, "") === amplitudeEventName) continue;
    return v;
  }
  // Fallback: 값이 하나뿐이면 그것을 그대로 — human/canonical 구분이 없는 탭 대비.
  return pickFirst(row, columns.eventName) ?? "";
}

function pickAmplitudeEventName(
  row: string[],
  columns: ColumnMap,
  headerLength: number,
): string {
  // 1) 헤더가 선언한 eventname* 컬럼을 우→좌로 스캔 (정상 케이스).
  for (let i = columns.eventName.length - 1; i >= 0; i--) {
    const idx = columns.eventName[i];
    if (idx === undefined) continue;
    const v = row[idx]?.trim();
    if (!v) continue;
    if (AMPLITUDE_NAME_PATTERN.test(v)) return v;
  }
  // 2) 헤더 선언 eventname* 컬럼에 trailing `_` GA4 변형이 있을 때.
  for (let i = columns.eventName.length - 1; i >= 0; i--) {
    const idx = columns.eventName[i];
    if (idx === undefined) continue;
    const v = row[idx]?.trim();
    if (!v) continue;
    if (v.includes("__")) continue;
    const stripped = v.replace(/_+$/, "");
    if (AMPLITUDE_NAME_PATTERN.test(stripped)) return stripped;
  }
  // 3) Tab 21처럼 헤더가 truncate된 경우: 헤더 범위 밖 셀만 스캔.
  //    헤더 내 다른 컬럼(예: status)의 값이 우연히 패턴과 일치해 앵커 행을
  //    이벤트 행으로 오판하지 않도록 스캔 범위를 제한한다.
  for (let i = row.length - 1; i >= headerLength; i--) {
    const v = row[i]?.trim();
    if (!v) continue;
    if (AMPLITUDE_NAME_PATTERN.test(v)) return v;
    if (v.includes("__")) continue;
    const stripped = v.replace(/_+$/, "");
    if (AMPLITUDE_NAME_PATTERN.test(stripped)) return stripped;
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

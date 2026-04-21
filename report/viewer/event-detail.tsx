// 선택된 검증 결과의 상세. 스펙/수집 2열 비교 + 이슈 배너 + 수집 로그.
//
// "수집됨" 열의 EXTRA 표시는 M7의 `param_unreferenced` 규칙과 같은 기준을 써야 한다.
// 스펙 시트는 `object`/`extension` 셀에 적힌 키만 `EventSpec.params`로 들어가고,
// taxonomy 컬럼(pageName·sectionName 등)과 웹앱이 기본으로 실어 보내는 base property
// (deviceId·buildVersion 등)는 params에 포함되지 않는다. 그래서 `spec.params`만 보고
// 비교하면 정상적으로 실린 파라미터까지 전부 EXTRA로 표시된다.

import type { CapturedEvent } from "@/types/event.ts";
import type { ValidationResult } from "@/types/validation.ts";

import { BASE_EVENT_PARAM_KEYS } from "@/shared/base-event-param-keys.ts";
import { TAXONOMY_PARAM_KEYS } from "@/shared/taxonomy-param-keys.ts";

import { formatClock } from "./format.ts";
import * as styles from "./event-detail.css.ts";

// "수집됨(actual)" 열에서 감출 키 집합.
// base property(앱 환경·유입경로·UTM·eventTimeStamp 등)는 모든 이벤트에 동일하게
// 실려오는 보일러플레이트라 스펙 비교에 시각적 잡음만 준다. 2열 비교의 포커스는
// "스펙이 요구한 params"와 "그걸 실제로 실었는가"에 있으므로 이 키들은 감춘다.
const HIDDEN_BASE_KEYS: ReadonlySet<string> = new Set(BASE_EVENT_PARAM_KEYS);

interface Props {
  result: ValidationResult;
  screenshotDataUrls: Record<string, string>;
}

export function EventDetail({ result }: Props) {
  const { spec, captured, issues } = result;
  const actualParamKeys = unionActualKeys(captured);
  // EXTRA 기준: M7 paramUnreferencedRule과 동일하게 spec.params + taxonomy + base 키를 합친다.
  // MISSING 기준은 그대로 spec.params만 본다. taxonomy/base 키는 스펙에 안 적혀 있어도
  // 웹앱이 항상 실어 보내므로 MISSING 대상이 아니다.
  const knownToSpec = new Set<string>([
    ...spec.params,
    ...TAXONOMY_PARAM_KEYS,
    ...BASE_EVENT_PARAM_KEYS,
  ]);

  return (
    <section className={styles.wrap} aria-label="이벤트 상세">
      <div className={styles.headerBar}>
        <span className={styles.headerName}>
          {spec.humanEventName || spec.amplitudeEventName}
        </span>
        <div className={styles.headerSpacer} />
        <span className={styles.headerFull}>{spec.amplitudeEventName}</span>
      </div>

      {issues.length > 0 && (
        <div className={styles.notice}>
          <div className={styles.noticeIcon} aria-hidden="true">
            <AlertIcon />
          </div>
          <div className={styles.noticeBody}>
            <div className={styles.noticeTitle}>이슈 {issues.length}건</div>
            {issues.map((issue, i) => (
              <div key={i} className={styles.noticeLine}>
                •{" "}
                {issue.param ? (
                  <>
                    파라미터 <code className={styles.code}>{issue.param}</code>{" "}
                  </>
                ) : null}
                {issue.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.twoCols}>
        <div className={`${styles.col} ${styles.colLeft}`}>
          <div className={styles.colTitle}>스펙 (expected)</div>
          <div className={styles.colBody}>
            <SpecLine k="event" v={spec.amplitudeEventName} />
            {spec.params.map((p) => (
              <SpecLine
                key={p}
                k={p}
                v="required"
                missing={!actualParamKeys.has(p)}
              />
            ))}
            {spec.params.length === 0 && (
              <SpecLine k="params" v="(없음)" />
            )}
          </div>
        </div>
        <div className={styles.col}>
          <div className={styles.colTitle}>수집됨 (actual)</div>
          <div className={styles.colBody}>
            <SpecLine k="event" v={spec.amplitudeEventName} />
            {Array.from(actualParamKeys)
              // 스펙이 명시한 키는 base와 이름이 겹쳐도 의미 있는 값이라 감추지 않는다.
              // (예: 스펙이 UTM `source`를 required로 선언한 경우 — 왼쪽 열의 `missing`
              //  판정과 오른쪽 열 노출 여부가 일관돼야 함.)
              .filter((p) => spec.params.includes(p) || !HIDDEN_BASE_KEYS.has(p))
              .map((p) => {
                const sample = firstSampleValue(captured, p);
                return (
                  <SpecLine
                    key={p}
                    k={p}
                    v={sample}
                    extra={!knownToSpec.has(p)}
                  />
                );
              })}
            {actualParamKeys.size === 0 && (
              <SpecLine k="params" v="(수집되지 않음)" />
            )}
          </div>
        </div>
      </div>

      <div className={styles.logSection}>
        <div className={styles.logLabel}>수집 로그 · {captured.length}건</div>
        {captured.length === 0 ? (
          <div className={styles.logEmpty}>수집된 이벤트가 없습니다.</div>
        ) : (
          captured.map((c) => (
            <div key={c.id} className={styles.logRow}>
              <span className={styles.logTime}>{formatClock(c.timestamp)}</span>
              <span className={styles.logParams}>
                {stringifyParams(c.params)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

interface SpecLineProps {
  k: string;
  v: string;
  missing?: boolean;
  extra?: boolean;
}

function SpecLine({ k, v, missing, extra }: SpecLineProps) {
  const className = missing
    ? `${styles.line} ${styles.lineVariant.missing}`
    : extra
      ? `${styles.line} ${styles.lineVariant.extra}`
      : styles.line;
  return (
    <div className={className}>
      <span className={styles.lineKey}>{k}</span>
      <span className={styles.lineValue}>{v}</span>
      {missing && (
        <span className={`${styles.flag} ${styles.flagMissing}`}>MISSING</span>
      )}
      {extra && (
        <span className={`${styles.flag} ${styles.flagExtra}`}>EXTRA</span>
      )}
    </div>
  );
}

function unionActualKeys(captured: CapturedEvent[]): Set<string> {
  const keys = new Set<string>();
  for (const c of captured) {
    for (const k of Object.keys(c.params)) keys.add(k);
  }
  return keys;
}

function firstSampleValue(captured: CapturedEvent[], key: string): string {
  for (const c of captured) {
    if (key in c.params) {
      const v = c.params[key];
      if (typeof v === "string") return JSON.stringify(v);
      if (v == null) return String(v);
      return String(v);
    }
  }
  return "—";
}

function stringifyParams(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    const rendered =
      typeof v === "string"
        ? JSON.stringify(v)
        : v == null
          ? String(v)
          : String(v);
    parts.push(`${k}=${rendered}`);
  }
  return parts.length > 0 ? parts.join(" ") : "(no params)";
}

function AlertIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 1.5L14.5 13H1.5L8 1.5z" />
      <path d="M8 6v3M8 11.2v.3" />
    </svg>
  );
}

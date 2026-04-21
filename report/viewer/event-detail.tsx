// 선택된 검증 결과의 상세. 스펙/수집 2열 비교 + 이슈 배너 + 수집 로그.
//
// 스펙 파라미터와 실제 수집된 파라미터 키를 비교해 missing/extra를 표시한다.
// 정교한 타입 비교는 M7의 규칙에 맡기고, 여기서는 "키가 스펙에 있는가/없는가"만
// 시각적으로 강조한다(디자인 원본과 동일한 UX).

import type { CapturedEvent } from "@/types/event.ts";
import type { ValidationResult } from "@/types/validation.ts";

import { formatClock } from "./format.ts";
import * as styles from "./event-detail.css.ts";

interface Props {
  result: ValidationResult;
  screenshotDataUrls: Record<string, string>;
}

export function EventDetail({ result }: Props) {
  const { spec, captured, issues } = result;
  const actualParamKeys = unionActualKeys(captured);
  const specParams = new Set(spec.params);

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
            {Array.from(actualParamKeys).map((p) => {
              const sample = firstSampleValue(captured, p);
              return (
                <SpecLine
                  key={p}
                  k={p}
                  v={sample}
                  extra={!specParams.has(p)}
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

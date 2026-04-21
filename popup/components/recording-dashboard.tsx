// 녹화 중/녹화 종료 대시보드.
//
// 섹션은 wrapper 패딩 없이 세로로 이어 붙이고, 섹션 간 경계는 borderBottom
// 하나로 처리한다(디자인 레퍼런스가 사이드바 에지까지 딱 붙는 flat-section
// 구조). 각 섹션 헤더는 연회색 바 형태로 제목 + 카운트를 표시한다.
//
// 섹션 구성:
//  1. REC 헤더(펄싱 점 + 경과 시간 + 시작 시각)
//  2. 카운터 스트립(총 수집 / PASS / FAIL / 중복 / 미수집)
//  3. "선택 이벤트 상태" 리스트 — max-height로 제한되어 스크롤
//  4. "실시간 스트림" 리스트 — 남은 공간을 flex:1로 차지
//
// 배경 SW의 `ValidationReport`를 폴링해 상태·스트림을 도출한다. 리포트 뷰어
// (`report/viewer/`)와 판정·색 토큰을 맞춘다.

import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import type { ValidationIssue, ValidationResult } from "@/types/validation.ts";
import { formatClock, statusLabel } from "@/report/viewer/format.ts";

import {
  liveResultsByNameAtom,
  liveStatsAtom,
  liveStreamAtom,
  type LiveStreamEntry,
  type LiveStreamStatus,
} from "../atoms/live-report-atoms.ts";
import {
  recordingPhaseAtom,
  recordingSessionAtom,
  selectedEventNamesAtom,
} from "../atoms/recording-atoms.ts";
import { specsAtom } from "../atoms/specs-atoms.ts";

import * as styles from "./recording-dashboard.css.ts";

const STATUS_ORDER: ValidationResult["status"][] = [
  "not_collected",
  "fail",
  "suspect_duplicate",
  "pass",
];

export function RecordingDashboard() {
  const phase = useAtomValue(recordingPhaseAtom);
  const session = useAtomValue(recordingSessionAtom);
  const specs = useAtomValue(specsAtom);
  const selected = useAtomValue(selectedEventNamesAtom);
  const stats = useAtomValue(liveStatsAtom);
  const resultsByName = useAtomValue(liveResultsByNameAtom);
  const stream = useAtomValue(liveStreamAtom);

  const rows = useMemo(
    () => buildSpecRows(specs, selected, resultsByName),
    [specs, selected, resultsByName],
  );

  if (!session.session) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.placeholder}>세션을 불러오는 중…</div>
      </section>
    );
  }

  const capturedTotal = session.capturedCount;
  const isRecording = phase === "recording";

  return (
    <section className={styles.wrapper}>
      <div className={styles.recHeader}>
        <span
          className={isRecording ? styles.liveDotRecording : styles.liveDotStopped}
          aria-hidden="true"
        />
        <span className={isRecording ? styles.recLabel : styles.recLabelStopped}>
          {isRecording ? "REC" : "STOP"}
        </span>
        <span className={styles.elapsed}>
          {isRecording ? (
            <ElapsedTime startedAt={session.session.startedAt} />
          ) : (
            formatElapsed(
              (session.session.endedAt ?? session.session.startedAt) -
                session.session.startedAt,
            )
          )}
        </span>
        <div className={styles.recStartMeta}>
          시작{" "}
          <span className={styles.recStartClock}>
            {formatClock(session.session.startedAt)}
          </span>
        </div>
      </div>

      <div className={styles.counterStrip}>
        <CounterCell label="총 수집" value={capturedTotal} kind="total" />
        <CounterCell label="PASS" value={stats.pass} kind="pass" />
        <CounterCell label="FAIL" value={stats.fail} kind="fail" />
        <CounterCell
          label="중복"
          value={stats.suspectDuplicate}
          kind="warn"
        />
        <CounterCell label="미수집" value={stats.notCollected} kind="missing" />
      </div>

      <section className={styles.specSection}>
        <SectionHeader title="선택 이벤트 상태" count={rows.length} />
        {rows.length === 0 ? (
          <div className={styles.placeholder}>선택된 이벤트가 없습니다.</div>
        ) : (
          <ul className={styles.specList}>
            {rows.map((row) => (
              <SpecRow key={row.amplitudeEventName} row={row} />
            ))}
          </ul>
        )}
      </section>

      <section className={styles.streamSection}>
        <SectionHeader
          title="실시간 스트림"
          right={
            isRecording ? (
              <span className={styles.liveBadge}>
                <span className={styles.liveBadgeDot} aria-hidden="true" />
                live
              </span>
            ) : undefined
          }
        />
        {stream.length === 0 ? (
          <div className={styles.placeholder}>
            {isRecording
              ? "수집된 이벤트가 아직 없습니다."
              : "녹화 중 수집된 이벤트가 없습니다."}
          </div>
        ) : (
          <ul className={styles.streamList}>
            {stream.map((entry, idx) => (
              <StreamRow
                key={entry.id}
                entry={entry}
                fresh={idx === 0 && isRecording}
              />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function SectionHeader({
  title,
  count,
  right,
}: {
  title: string;
  count?: number;
  right?: ReactNode;
}) {
  return (
    <header className={styles.sectionHeader}>
      <span className={styles.sectionTitle}>{title}</span>
      {count !== undefined && (
        <span className={styles.sectionCount}>{count}</span>
      )}
      <div className={styles.sectionSpacer} />
      {right}
    </header>
  );
}

interface CounterCellProps {
  label: string;
  value: number;
  kind: "total" | "pass" | "fail" | "warn" | "missing";
}

function CounterCell({ label, value, kind }: CounterCellProps) {
  const valueClass =
    kind === "total"
      ? styles.counterValue
      : value > 0
        ? styles.counterValueVariants[kind]
        : styles.counterValueZero;
  return (
    <div
      className={
        kind === "total" ? styles.counterCellTotal : styles.counterCell
      }
    >
      <div className={styles.counterLabel}>{label}</div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}

interface SpecRowModel {
  amplitudeEventName: string;
  humanEventName: string;
  pageName: string;
  status: ValidationResult["status"];
  capturedCount: number;
  primaryIssue: ValidationIssue | undefined;
  extraIssueCount: number;
}

function buildSpecRows(
  specs: readonly { amplitudeEventName: string; humanEventName: string; pageName: string }[],
  selected: ReadonlySet<string>,
  resultsByName: ReadonlyMap<string, ValidationResult>,
): SpecRowModel[] {
  const rows: SpecRowModel[] = [];
  for (const spec of specs) {
    if (!selected.has(spec.amplitudeEventName)) continue;
    const result = resultsByName.get(spec.amplitudeEventName);
    const status: ValidationResult["status"] = result?.status ?? "not_collected";
    const issues = result?.issues ?? [];
    const captured = result?.captured.length ?? 0;
    const primary = pickPrimaryIssue(status, issues);
    const extras = issues.length > 0 && primary ? issues.length - 1 : 0;
    rows.push({
      amplitudeEventName: spec.amplitudeEventName,
      humanEventName: spec.humanEventName,
      pageName: spec.pageName,
      status,
      capturedCount: captured,
      primaryIssue: primary,
      extraIssueCount: extras,
    });
  }
  rows.sort(compareByStatus);
  return rows;
}

function compareByStatus(a: SpecRowModel, b: SpecRowModel): number {
  return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
}

function pickPrimaryIssue(
  status: ValidationResult["status"],
  issues: readonly ValidationIssue[],
): ValidationIssue | undefined {
  if (issues.length === 0) return undefined;
  if (status === "suspect_duplicate") {
    return issues.find((i) => i.type === "suspect_duplicate") ?? issues[0];
  }
  if (status === "fail") {
    return (
      issues.find((i) => i.severity === "error") ??
      issues.find((i) => i.severity === "warning") ??
      issues[0]
    );
  }
  return issues[0];
}

function SpecRow({ row }: { row: SpecRowModel }) {
  const messageClass =
    row.status === "fail"
      ? styles.specMessageFail
      : row.status === "suspect_duplicate"
        ? styles.specMessageWarn
        : undefined;
  const defaultMessage: string =
    row.status === "not_collected"
      ? "아직 이벤트가 수집되지 않았습니다."
      : row.status === "pass"
        ? "정상 수집. 필수 파라미터와 이벤트명이 모두 일치합니다."
        : "";
  const message = row.primaryIssue?.message ?? defaultMessage;
  return (
    <li className={styles.specRow}>
      <span className={styles.statusPillVariants[row.status]}>
        <span className={styles.statusPillDotVariants[row.status]} />
        {statusLabel(row.status)}
      </span>
      <div className={styles.specMain}>
        <span className={styles.specTitle}>
          {row.humanEventName || row.amplitudeEventName}
        </span>
        <span className={styles.specSubtitle}>
          {row.pageName} · {row.amplitudeEventName}
        </span>
        {message && (
          <span
            className={[styles.specMessage, messageClass]
              .filter(Boolean)
              .join(" ")}
          >
            {message}
            {row.extraIssueCount > 0 ? ` +${row.extraIssueCount}` : ""}
          </span>
        )}
      </div>
      <div className={styles.specCountWrap}>
        <span className={styles.specCountValue}>{row.capturedCount}</span>
        <span className={styles.specCountUnit}>수집</span>
      </div>
    </li>
  );
}

function StreamRow({
  entry,
  fresh,
}: {
  entry: LiveStreamEntry;
  fresh: boolean;
}) {
  const paramStr = formatParams(entry.params);
  const dotClass = STREAM_DOT_CLASS[entry.status];
  const nameClass =
    entry.status === "exception"
      ? styles.streamNameException
      : styles.streamName;
  return (
    <li className={fresh ? styles.streamRowFresh : styles.streamRow}>
      <span className={dotClass} aria-hidden="true" />
      <div className={styles.streamMain}>
        <div className={styles.streamHead}>
          <span className={styles.streamTime}>{formatClock(entry.timestamp)}</span>
          {entry.status === "exception" && (
            <span className={styles.streamExceptionLabel}>예외</span>
          )}
        </div>
        <span className={nameClass}>{entry.eventName}</span>
        {paramStr && <span className={styles.streamParams}>{paramStr}</span>}
      </div>
    </li>
  );
}

const STREAM_DOT_CLASS: Record<LiveStreamStatus, string> = {
  pass: styles.streamDotPass,
  warn: styles.streamDotWarn,
  fail: styles.streamDotFail,
  exception: styles.streamDotException,
};

function formatParams(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    if (typeof v === "object") continue;
    parts.push(`${k}=${String(v)}`);
    if (parts.length >= 4) break;
  }
  return parts.join(" ");
}

function ElapsedTime({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(handle);
  }, []);
  return <>{formatElapsed(now - startedAt)}</>;
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

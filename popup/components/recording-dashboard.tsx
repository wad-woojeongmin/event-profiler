// 녹화 중/녹화 종료 대시보드.
//
// 상단: REC 헤더(펄싱 점 + 경과 시간 + 시작 시각)
// 중단: 카운터 스트립(총 수집 / PASS / FAIL / 중복 / 미수집)
// 하단: 선택 이벤트 상태 리스트 + 예외 이벤트 테이블
//
// 배경 SW가 최종 리포트와 같은 소스로 계산한 `ValidationReport`를 라이브로 받아
// 상태 카드·선택 스펙별 이슈 요약·예외 이벤트 목록을 보여준다. 리포트 뷰어
// (`report/viewer/`)와 판정·색 토큰을 맞춘다.

import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";

import { canonicalEventName } from "@/shared/canonical-event-name.ts";
import type { CapturedEvent } from "@/types/event.ts";
import type { ValidationIssue, ValidationResult } from "@/types/validation.ts";
import { formatClock, statusLabel } from "@/report/viewer/format.ts";

import {
  liveReportAtom,
  liveResultsByNameAtom,
  liveStatsAtom,
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
  const report = useAtomValue(liveReportAtom);
  const stats = useAtomValue(liveStatsAtom);
  const resultsByName = useAtomValue(liveResultsByNameAtom);

  // 선택된 스펙(녹화 시작 시점 기준)을 상태 우선순위로 정렬해 고정 렌더.
  // report가 아직 없으면 "not_collected"로 가정해 자리를 잡고, 이후 스냅샷이 도착하면
  // 상태·이슈가 자연스럽게 갱신된다.
  const rows = useMemo(
    () => buildSpecRows(specs, selected, resultsByName),
    [specs, selected, resultsByName],
  );

  const unexpectedGroups = useMemo(
    () => groupUnexpected(report?.unexpected ?? []),
    [report?.unexpected],
  );
  const [unexpectedQuery, setUnexpectedQuery] = useState("");
  const filteredUnexpected = useMemo(() => {
    const q = unexpectedQuery.trim().toLowerCase();
    if (!q) return unexpectedGroups;
    return unexpectedGroups.filter((g) =>
      (g.name + " " + g.category).toLowerCase().includes(q),
    );
  }, [unexpectedGroups, unexpectedQuery]);

  if (!session.session) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.emptyState}>세션을 불러오는 중…</div>
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

      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>선택한 이벤트 정의 상태</span>
        <span className={styles.sectionCount}>{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className={styles.emptyState}>선택된 이벤트가 없습니다.</div>
      ) : (
        <ul className={styles.specList}>
          {rows.map((row) => (
            <SpecRow key={row.amplitudeEventName} row={row} />
          ))}
        </ul>
      )}

      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>예외 이벤트</span>
        <span className={styles.sectionCount}>{unexpectedGroups.length}</span>
      </div>
      <input
        className={styles.searchInput}
        type="search"
        placeholder="이벤트 이름 또는 그룹으로 검색"
        value={unexpectedQuery}
        onChange={(e) => setUnexpectedQuery(e.target.value)}
        disabled={unexpectedGroups.length === 0}
      />
      {filteredUnexpected.length === 0 ? (
        <div className={styles.emptyState}>
          {unexpectedGroups.length === 0
            ? "예외 이벤트가 아직 없습니다."
            : "조건에 맞는 이벤트가 없습니다."}
        </div>
      ) : (
        <div className={styles.unexpectedTable}>
          <div className={styles.unexpectedHeader}>
            <span>이벤트</span>
            <span>카테고리</span>
            <span>최초 수집</span>
          </div>
          <div className={styles.unexpectedBody}>
            {filteredUnexpected.map((group) => (
              <div key={group.name} className={styles.unexpectedRow}>
                <span className={styles.unexpectedCellMono}>{group.name}</span>
                <span className={styles.unexpectedCell}>{group.category}</span>
                <span className={styles.unexpectedCell}>
                  {formatClock(group.firstSeenAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
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
  // 선택된 이름 집합은 시작 시점 고정(녹화 중에는 선택이 바뀌지 않음)이므로
  // specs 배열을 순회하며 선택된 것만 추린다. 스펙 캐시에 없는 이름(시트 변경
  // 등)은 드물어 Phase 1에서는 드랍한다.
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

interface UnexpectedGroup {
  name: string;
  category: string;
  firstSeenAt: number;
}

function groupUnexpected(events: readonly CapturedEvent[]): UnexpectedGroup[] {
  const map = new Map<string, UnexpectedGroup>();
  for (const event of events) {
    const name = canonicalEventName(event);
    const existing = map.get(name);
    if (existing) {
      if (event.timestamp < existing.firstSeenAt) {
        existing.firstSeenAt = event.timestamp;
      }
    } else {
      map.set(name, {
        name,
        category: buildCategory(event),
        firstSeenAt: event.timestamp,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.firstSeenAt - b.firstSeenAt);
}

function buildCategory(event: CapturedEvent): string {
  const parts = [event.params["pageName"], event.params["sectionName"]]
    .filter((v): v is string => typeof v === "string" && v.length > 0);
  return parts.length === 0 ? "-" : parts.join(" · ");
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

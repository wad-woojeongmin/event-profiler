// 검증 결과 테이블. 행 선택 시 상위(report-view)가 관리하는 `selectedIdx`를 갱신하여
// 우측 상세 패널이 같은 row 데이터를 렌더한다.
//
// 디자인 원본은 `<tr onClick>`로만 선택을 처리했지만, 여기서는 키보드/스크린리더도
// 쓸 수 있도록 `role=button` + `tabIndex=0` + `aria-pressed` + Enter/Space 키 핸들러를
// 건다.

import type { KeyboardEvent } from "react";

import type { ValidationResult } from "@/types/validation.ts";

import * as styles from "./results-table.css.ts";

interface Props {
  results: ValidationResult[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
}

type PillKind = "pass" | "fail" | "warn" | "missing";

export function ResultsTable({ results, selectedIdx, onSelect }: Props) {
  if (results.length === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.headerBar}>
          <div className={styles.headerTitle}>검증 결과</div>
        </div>
        <div className={styles.empty}>검증할 대상 스펙이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerBar}>
        <div className={styles.headerTitle}>검증 결과</div>
        <div className={styles.headerCount}>{results.length}개</div>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thStatus}>상태</th>
            <th>이벤트명</th>
            <th className={styles.thPage}>페이지</th>
            <th className={styles.thRight}>수집</th>
            <th className={styles.thRight}>이슈</th>
            <th className={styles.thChevron} aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const kind = pillKindFor(r.status);
            const selected = i === selectedIdx;
            const handleKey = (e: KeyboardEvent<HTMLTableRowElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(i);
              }
            };
            return (
              <tr
                key={r.spec.amplitudeEventName}
                className={selected ? styles.rowSelected : styles.row}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                onClick={() => onSelect(i)}
                onKeyDown={handleKey}
              >
                <td>
                  <StatusPill kind={kind} label={labelFor(r.status)} />
                </td>
                <td>
                  <div className={styles.eventCell}>
                    <EventName
                      name={r.spec.humanEventName || r.spec.amplitudeEventName}
                    />
                    <span className={styles.eventFull}>
                      {r.spec.amplitudeEventName}
                    </span>
                  </div>
                </td>
                <td className={styles.pageCell}>{r.spec.pageName}</td>
                <td className={styles.numberCell}>{r.captured.length}</td>
                <td className={styles.numberCell}>
                  {r.issues.length > 0 ? (
                    <span className={styles.issueHit}>{r.issues.length}</span>
                  ) : (
                    <span className={styles.issueEmpty}>—</span>
                  )}
                </td>
                <td className={styles.chevronCell} aria-hidden="true">
                  <ChevronRight />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 이벤트명은 `__` 기준으로 강조 분리. 디자인 원본은 `__`를 옅은 색으로 보여준다.
 */
function EventName({ name }: { name: string }) {
  const parts = name.split(/(__)/);
  return (
    <span className={styles.eventName}>
      {parts.map((p, i) =>
        p === "__" ? (
          <span key={i} className={styles.eventNameSeparator}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}

interface PillProps {
  kind: PillKind;
  label: string;
}

function StatusPill({ kind, label }: PillProps) {
  return (
    <span className={styles.pill[kind]} aria-label={`상태: ${label}`}>
      <span className={styles.pillDotKind[kind]} aria-hidden="true" />
      {label}
    </span>
  );
}

function pillKindFor(status: ValidationResult["status"]): PillKind {
  switch (status) {
    case "pass":
      return "pass";
    case "fail":
      return "fail";
    case "suspect_duplicate":
      return "warn";
    case "not_collected":
      return "missing";
  }
}

function labelFor(status: ValidationResult["status"]): string {
  switch (status) {
    case "pass":
      return "Pass";
    case "fail":
      return "Fail";
    case "suspect_duplicate":
      return "Warn";
    case "not_collected":
      return "Missing";
  }
}

function ChevronRight() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

// 검증 결과 테이블. row 클릭 시 해당 이벤트의 이슈·수집 params·스크린샷을 펼친다.
//
// 확장 상태는 row 단위 로컬 state로만 관리(리프 컴포넌트라 상위 트리를
// 오염시키지 않음). 이 컴포넌트는 `ReportData`의 하위 `results` + `screenshotDataUrls`만
// 받는 순수 컴포넌트라 향후 `renderToString` 경로에서도 초기 접힘 상태로 재사용 가능.

import { useState } from "react";

import type { CapturedEvent } from "@/types/event.ts";
import type { ValidationResult } from "@/types/validation.ts";

import { formatClock, statusLabel } from "./format.ts";
import * as styles from "./results-table.css.ts";

interface Props {
  results: ValidationResult[];
  screenshotDataUrls: Record<string, string>;
}

export function ResultsTable({ results, screenshotDataUrls }: Props) {
  if (results.length === 0) {
    return <div className={styles.empty}>검증할 대상 스펙이 없습니다.</div>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thStatus}>상태</th>
            <th>이벤트</th>
            <th className={styles.thCount}>수집</th>
            <th>이슈</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <Row
              key={r.spec.amplitudeEventName}
              result={r}
              screenshotDataUrls={screenshotDataUrls}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface RowProps {
  result: ValidationResult;
  screenshotDataUrls: Record<string, string>;
}

function Row({ result, screenshotDataUrls }: RowProps) {
  const [open, setOpen] = useState(false);
  const { spec, captured, issues, status } = result;
  const hasDetails = issues.length > 0 || captured.length > 0;

  return (
    <>
      <tr
        className={hasDetails ? styles.rowInteractive : styles.row}
        onClick={hasDetails ? () => setOpen((v) => !v) : undefined}
      >
        <td>
          <span className={styles.badge[status]}>{statusLabel(status)}</span>
        </td>
        <td>
          <div className={styles.eventName}>{spec.amplitudeEventName}</div>
          <div className={styles.eventMeta}>
            {spec.pageName}
            {spec.sectionName ? ` · ${spec.sectionName}` : ""}
            {" · "}
            {spec.eventType}
          </div>
        </td>
        <td className={styles.capturedCount}>
          {captured.length}
          <span className={styles.capturedUnit}>건</span>
        </td>
        <td>
          {issues.length === 0 ? (
            <span className={styles.issueEmpty}>—</span>
          ) : (
            <span className={styles.issueSummary}>{issues.length}건</span>
          )}
        </td>
      </tr>
      {open && hasDetails && (
        <tr className={styles.detailRow}>
          <td colSpan={4}>
            <RowDetails
              captured={captured}
              issues={issues}
              screenshotDataUrls={screenshotDataUrls}
            />
          </td>
        </tr>
      )}
    </>
  );
}

interface DetailsProps {
  captured: CapturedEvent[];
  issues: ValidationResult["issues"];
  screenshotDataUrls: Record<string, string>;
}

function RowDetails({ captured, issues, screenshotDataUrls }: DetailsProps) {
  return (
    <div className={styles.details}>
      {issues.length > 0 && (
        <div className={styles.detailsBlock}>
          <div className={styles.detailsLabel}>이슈</div>
          <ul className={styles.issueList}>
            {issues.map((issue, i) => (
              <li key={i} className={styles.issueItem}>
                <span className={styles.severity[issue.severity]}>
                  {issue.severity}
                </span>
                {issue.param && (
                  <code className={styles.paramKey}>{issue.param}</code>
                )}
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {captured.length > 0 && (
        <div className={styles.detailsBlock}>
          <div className={styles.detailsLabel}>수집된 이벤트</div>
          <ul className={styles.capturedList}>
            {captured.map((c) => {
              const shot = c.screenshotId
                ? screenshotDataUrls[c.screenshotId]
                : undefined;
              return (
                <li key={c.id} className={styles.capturedItem}>
                  <div className={styles.capturedMeta}>
                    <span className={styles.capturedTime}>
                      {formatClock(c.timestamp)}
                    </span>
                    <span className={styles.capturedUrl}>{c.pageUrl}</span>
                  </div>
                  <pre className={styles.params}>
                    {JSON.stringify(c.params, null, 2)}
                  </pre>
                  {shot && (
                    <a
                      className={styles.thumbLink}
                      href={shot}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <img
                        className={styles.thumb}
                        src={shot}
                        alt="스크린샷"
                        loading="lazy"
                      />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

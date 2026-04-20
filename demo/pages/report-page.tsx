import type { ValidationReport } from "@/types/validation.ts";
import { TimelineChart } from "../components/timeline-chart.tsx";

interface Props {
  report: ValidationReport;
  onBack: () => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}분 ${ss}초`;
}

/** 리포트 전체 뷰. M8이 실제 구현 시 이 레이아웃을 React renderToString으로 정적 HTML화. */
export function ReportPage({ report, onBack }: Props) {
  const { session, stats, results, unexpected } = report;
  const duration = (session.endedAt ?? Date.now()) - session.startedAt;

  return (
    <div className="report-frame">
      <div className="report-back">
        <button type="button" onClick={onBack}>
          ← 팝업으로 돌아가기
        </button>
      </div>

      <header className="report-header">
        <h2>Event Profiler 리포트</h2>
        <div className="meta">
          생성 시각 {formatTime(report.generatedAt)} · 녹화 {formatDuration(duration)} ·
          대상 {stats.totalSpecs}개 · 총 수집 {stats.totalCaptured}건
        </div>
      </header>

      <div className="report-stats">
        <div className="stat-card pass">
          <div className="label">Pass</div>
          <div className="value">{stats.pass}</div>
        </div>
        <div className="stat-card fail">
          <div className="label">Fail</div>
          <div className="value">{stats.fail}</div>
        </div>
        <div className="stat-card dupe">
          <div className="label">중복 의심</div>
          <div className="value">{stats.suspectDuplicate}</div>
        </div>
        <div className="stat-card miss">
          <div className="label">미수집</div>
          <div className="value">{stats.notCollected}</div>
        </div>
      </div>

      <section className="report-section">
        <h3>타임라인</h3>
        <TimelineChart
          session={session}
          captured={results.flatMap((r) => r.captured)}
        />
      </section>

      <section className="report-section">
        <h3>검증 결과 ({results.length})</h3>
        <table className="results-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>상태</th>
              <th>이벤트명</th>
              <th style={{ width: 120 }}>수집 수</th>
              <th>이슈</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.spec.amplitudeEventName}>
                <td>
                  <span className={`status-badge ${r.status}`}>
                    {statusLabel(r.status)}
                  </span>
                </td>
                <td>
                  <div style={{ fontFamily: "SF Mono, Consolas, monospace" }}>
                    {r.spec.amplitudeEventName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {r.spec.pageName}
                    {r.spec.sectionName ? ` · ${r.spec.sectionName}` : ""}
                    {" · "}
                    {r.spec.eventType}
                  </div>
                </td>
                <td>
                  {r.captured.length}
                  <span className="captured-count">건</span>
                </td>
                <td>
                  {r.issues.length === 0 ? (
                    <span style={{ color: "var(--text-subtle)" }}>—</span>
                  ) : (
                    <ul className="issue-list">
                      {r.issues.map((issue, i) => (
                        <li key={i}>
                          <span className={`severity ${issue.severity}`}>
                            {issue.severity}
                          </span>
                          {issue.param && <code>{issue.param}</code>}{" "}
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {unexpected.length > 0 && (
        <section className="report-section">
          <h3>예외 이벤트 ({unexpected.length})</h3>
          <div className="unexpected-card">
            <h4>타겟 밖 수집</h4>
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>
              선택한 스펙 목록에 없지만 녹화 중 수집된 이벤트입니다. 스펙 누락이거나 불필요한 이벤트일 수 있습니다.
            </p>
            <ul className="unexpected-list">
              {unexpected.map((c) => (
                <li key={c.id}>
                  <code>{c.eventName}</code> @ {formatTime(c.timestamp)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "pass":
      return "✓ Pass";
    case "fail":
      return "✗ Fail";
    case "not_collected":
      return "○ 미수집";
    case "suspect_duplicate":
      return "⚠ 중복 의심";
    default:
      return status;
  }
}

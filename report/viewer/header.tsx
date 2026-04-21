// 리포트 헤더. 로고·타이틀·생성시각(mono) + 우측 메타 3개 + 내보내기 버튼.
//
// 내보내기 클릭 처리는 상위(ReportView)가 ReportData 전체를 들고 있으므로
// `onExport` 콜백으로 위임. 버튼은 네이티브 `<button type="button">` —
// 디자인 원본이 `<div onClick>`이었던 것과 구분.

import type { CapturedEvent } from "@/types/event.ts";
import type { ValidationReport } from "@/types/validation.ts";

import {
  formatClockDuration,
  formatGeneratedAt,
  primaryHost,
} from "./format.ts";
import * as styles from "./header.css.ts";

interface Props {
  report: ValidationReport;
  captured: CapturedEvent[];
  onExport: () => void;
}

export function Header({ report, captured, onExport }: Props) {
  const { session, stats, generatedAt } = report;
  const duration = (session.endedAt ?? Date.now()) - session.startedAt;
  const host = primaryHost(captured.map((c) => c.pageUrl));
  const subtitle = host
    ? `${formatGeneratedAt(generatedAt)} · ${host}`
    : formatGeneratedAt(generatedAt);

  return (
    <header className={styles.wrap}>
      <div className={styles.logo} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 11 11" fill="currentColor">
          <circle cx="3" cy="3" r="1.4" />
          <circle cx="8" cy="3" r="1.4" opacity=".5" />
          <circle cx="3" cy="8" r="1.4" opacity=".5" />
          <circle cx="8" cy="8" r="1.4" />
        </svg>
      </div>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Event Profiler 리포트</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <div className={styles.spacer} />
      <div className={styles.metaRow}>
        <MetaCol label="녹화 시간" value={formatClockDuration(duration)} mono />
        <MetaCol label="대상 스펙" value={String(stats.totalSpecs)} />
        <MetaCol label="총 수집" value={String(stats.totalCaptured)} />
        <div className={styles.divider} aria-hidden="true" />
        <button
          type="button"
          className={styles.btnDefault}
          onClick={onExport}
        >
          <DownloadIcon />
          내보내기
        </button>
      </div>
    </header>
  );
}

interface MetaColProps {
  label: string;
  value: string;
  mono?: boolean;
}

function MetaCol({ label, value, mono }: MetaColProps) {
  return (
    <div className={styles.metaCol}>
      <div className={styles.metaLabel}>{label}</div>
      <div
        className={
          mono ? `${styles.metaValue} ${styles.metaValueMono}` : styles.metaValue
        }
      >
        {value}
      </div>
    </div>
  );
}

function DownloadIcon() {
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
      aria-hidden="true"
    >
      <path d="M8 2v8M4 7l4 4 4-4M2 13h12" />
    </svg>
  );
}


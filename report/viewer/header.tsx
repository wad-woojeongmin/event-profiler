import type { ValidationReport } from "@/types/validation.ts";

import { formatDuration, formatTime } from "./format.ts";
import * as styles from "./header.css.ts";

interface Props {
  report: ValidationReport;
}

export function Header({ report }: Props) {
  const { session, stats, generatedAt } = report;
  const duration = (session.endedAt ?? Date.now()) - session.startedAt;

  return (
    <header className={styles.wrap}>
      <h1 className={styles.title}>Event Profiler 리포트</h1>
      <dl className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>생성 시각</dt>
          <dd className={styles.metaValue}>{formatTime(generatedAt)}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>녹화 시간</dt>
          <dd className={styles.metaValue}>{formatDuration(duration)}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>대상 스펙</dt>
          <dd className={styles.metaValue}>{stats.totalSpecs}개</dd>
        </div>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>총 수집</dt>
          <dd className={styles.metaValue}>{stats.totalCaptured}건</dd>
        </div>
      </dl>
    </header>
  );
}

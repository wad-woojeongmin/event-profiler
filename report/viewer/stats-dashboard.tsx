// 상단 요약 4카드(BigStats). 값 0은 숫자 톤을 죽여 "없음"임을 한눈에 구분.
// 네 상태 모두 전체 스펙 대비 비율을 progress bar로 노출한다.
// (디자인 원본은 Pass·Missing에만 pct를 걸었지만 실제 리포트에선 Fail·중복 의심
//  비율도 의미가 있어 네 카드 모두 일관되게 표시한다.)

import type { ValidationReport } from "@/types/validation.ts";

import * as styles from "./stats-dashboard.css.ts";

interface Props {
  stats: ValidationReport["stats"];
}

type Kind = "pass" | "fail" | "warn" | "missing";

export function StatsDashboard({ stats }: Props) {
  const total = Math.max(1, stats.totalSpecs);
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <section className={styles.grid} aria-label="요약 통계">
      <BigStat kind="pass" label="Pass" value={stats.pass} pct={pct(stats.pass)} />
      <BigStat kind="fail" label="Fail" value={stats.fail} pct={pct(stats.fail)} />
      <BigStat
        kind="warn"
        label="중복 의심"
        value={stats.suspectDuplicate}
        pct={pct(stats.suspectDuplicate)}
      />
      <BigStat
        kind="missing"
        label="미수집"
        value={stats.notCollected}
        pct={pct(stats.notCollected)}
      />
    </section>
  );
}

interface BigStatProps {
  kind: Kind;
  label: string;
  value: number;
  pct?: number;
}

function BigStat({ kind, label, value, pct }: BigStatProps) {
  return (
    <div className={styles.card}>
      <div className={styles.labelRow}>
        <span className={styles.dotKind[kind]} aria-hidden="true" />
        <span className={styles.label[kind]}>{label}</span>
      </div>
      <div className={value > 0 ? styles.value.on : styles.value.off}>
        {value}
      </div>
      {pct != null && (
        <div className={styles.progress}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill[kind]}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={styles.progressPct}>{pct}%</div>
        </div>
      )}
    </div>
  );
}

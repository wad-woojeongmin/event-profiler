import type { ValidationReport } from "@/types/validation.ts";

import * as styles from "./stats-dashboard.css.ts";

interface Props {
  stats: ValidationReport["stats"];
}

export function StatsDashboard({ stats }: Props) {
  return (
    <section className={styles.grid}>
      <Card tone="pass" label="Pass" value={stats.pass} />
      <Card tone="fail" label="Fail" value={stats.fail} />
      <Card tone="dupe" label="중복 의심" value={stats.suspectDuplicate} />
      <Card tone="miss" label="미수집" value={stats.notCollected} />
    </section>
  );
}

interface CardProps {
  tone: keyof typeof styles.card;
  label: string;
  value: number;
}

function Card({ tone, label, value }: CardProps) {
  return (
    <div className={styles.card[tone]}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  );
}

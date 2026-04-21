// 로드된 리포트의 전체 레이아웃. 순수 props 소비만 하므로 테스트에서 임의의
// `ReportData`를 주입해 시각 회귀를 확인할 수 있다.

import type { ReportData } from "@/types/storage.ts";

import { Header } from "./header.tsx";
import { ResultsTable } from "./results-table.tsx";
import { StatsDashboard } from "./stats-dashboard.tsx";
import { TimelineChart } from "./timeline-chart.tsx";
import { UnexpectedList } from "./unexpected-list.tsx";
import * as styles from "./report-view.css.ts";

interface Props {
  data: ReportData;
}

export function ReportView({ data }: Props) {
  const { report, screenshotDataUrls } = data;
  // 결과에 묶인 captured 이벤트를 모두 합쳐 타임라인에 표시.
  const capturedAll = report.results.flatMap((r) => r.captured);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Header report={report} />
        <StatsDashboard stats={report.stats} />
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>타임라인</h2>
          <TimelineChart session={report.session} captured={capturedAll} />
        </section>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            검증 결과 ({report.results.length})
          </h2>
          <ResultsTable
            results={report.results}
            screenshotDataUrls={screenshotDataUrls}
          />
        </section>
        {report.unexpected.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              예외 이벤트 ({report.unexpected.length})
            </h2>
            <UnexpectedList events={report.unexpected} />
          </section>
        )}
      </div>
    </main>
  );
}

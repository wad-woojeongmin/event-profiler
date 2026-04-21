// 로드된 리포트의 전체 레이아웃. 순수 props 소비만 하므로 테스트에서 임의의
// `ReportData`를 주입해 시각 회귀를 확인할 수 있다.
//
// 디자인 원본(design-bundle/components/report-variations.jsx `ReportPage`)의
// 섹션 순서를 그대로 따른다:
//   Header · BigStats · Timeline(필름스트립 정렬) · [결과표 | 상세] · 예외 리스트.

import { useMemo, useState } from "react";

import type { ReportData } from "@/types/storage.ts";
import type { ValidationResult } from "@/types/validation.ts";

import { EventDetail } from "./event-detail.tsx";
import { ExceptionList } from "./exception-list.tsx";
import { Header } from "./header.tsx";
import { ResultsTable } from "./results-table.tsx";
import { StatsDashboard } from "./stats-dashboard.tsx";
import { TimelineChart } from "./timeline-chart.tsx";
import * as styles from "./report-view.css.ts";

interface Props {
  data: ReportData;
}

export function ReportView({ data }: Props) {
  const { report, screenshotDataUrls } = data;

  // 타임라인이 한 곳에서 captured 전체를 훑으므로 상위에서 한 번만 flatten한다.
  const capturedAll = useMemo(
    () => report.results.flatMap((r) => r.captured),
    [report.results],
  );

  // 타임라인 마커/썸네일 점 색을 이름 단위로 결정. 이름이 같으면 스펙도 같고 상태도
  // 같다는 전제(one spec per amplitudeEventName)에 기댄다.
  const statusByEventName = useMemo(() => {
    const map = new Map<string, ValidationResult["status"]>();
    for (const r of report.results) {
      map.set(r.spec.amplitudeEventName, r.status);
    }
    return map;
  }, [report.results]);

  // 초기 선택 규칙: 이슈가 가장 많은 결과 → 없으면 captured가 있는 첫 행 → 없으면 0.
  // 디자인 원본은 `idx=4`를 하드코딩했지만 실데이터는 길이가 다르므로 의미 기반 선택.
  const initialIdx = useMemo(() => pickInitialIdx(report.results), [report.results]);
  const [selectedIdx, setSelectedIdx] = useState(initialIdx);
  const selected =
    report.results[selectedIdx] ?? report.results[0];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Header report={report} captured={capturedAll} />
        <div className={styles.body}>
          <StatsDashboard stats={report.stats} />
          <TimelineChart
            session={report.session}
            captured={capturedAll}
            screenshotDataUrls={screenshotDataUrls}
            statusByEventName={statusByEventName}
          />
          {selected && (
            <div className={styles.twoColumn}>
              <ResultsTable
                results={report.results}
                selectedIdx={selectedIdx}
                onSelect={setSelectedIdx}
              />
              <EventDetail
                result={selected}
                screenshotDataUrls={screenshotDataUrls}
              />
            </div>
          )}
          {report.unexpected.length > 0 && (
            <ExceptionList events={report.unexpected} />
          )}
        </div>
      </div>
    </main>
  );
}

function pickInitialIdx(
  results: ReportData["report"]["results"],
): number {
  let bestIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (!r) continue;
    const score = r.issues.length * 10 + (r.captured.length > 0 ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

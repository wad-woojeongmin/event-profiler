// 로드된 리포트의 전체 레이아웃. 순수 props 소비만 하므로 테스트에서 임의의
// `ReportData`를 주입해 시각 변경이 생겼는지 확인할 수 있다.
//
// 디자인 원본(design-bundle/components/report-variations.jsx `ReportPage`)의
// 섹션 순서를 그대로 따른다:
//   Header · BigStats · Timeline(필름스트립 정렬) · [결과표 | 상세] · 예외 리스트.

import { useCallback, useMemo, useState } from "react";

import type { ReportData } from "@/types/storage.ts";
import type { ValidationResult } from "@/types/validation.ts";

import { EventDetail } from "./event-detail.tsx";
import { ExceptionList } from "./exception-list.tsx";
import { Header } from "./header.tsx";
import { ResultsTable } from "./results-table.tsx";
import { formatReportAsText } from "./report-text.ts";
import { StatsDashboard } from "./stats-dashboard.tsx";
import { buildStatusByEventName } from "./status-map.ts";
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

  // 타임라인 마커/썸네일 점 색 lookup. 구현 배경과 주의점은 `status-map.ts` 참조.
  const statusByEventName = useMemo(
    () => buildStatusByEventName(report.results),
    [report.results],
  );

  // 초기 선택 규칙: 이슈가 가장 많은 결과 → 없으면 captured가 있는 첫 행 → 없으면 0.
  // 디자인 원본은 `idx=4`를 하드코딩했지만 실데이터는 길이가 다르므로 의미 기반 선택.
  const initialIdx = useMemo(() => pickInitialIdx(report.results), [report.results]);
  const [selectedIdx, setSelectedIdx] = useState(initialIdx);
  const selected =
    report.results[selectedIdx] ?? report.results[0];

  // 내보내기: ReportData를 평문으로 직렬화해 클립보드에 복사. 클립보드 API가
  // 거부되는 환경(HTTPS 아님·포커스 없음 등)을 대비해 실패 시 새 창에 텍스트를 띄워
  // 사용자가 직접 복사하도록 폴백. 스크린샷은 이미지라 텍스트 직렬화 대상이 아니다.
  const handleExport = useCallback(async () => {
    const text = formatReportAsText(data);
    try {
      await navigator.clipboard.writeText(text);
      alert("리포트 텍스트가 클립보드에 복사되었습니다.");
    } catch {
      const w = window.open("", "_blank");
      if (w) {
        w.document.body.innerText = text;
      } else {
        console.info(text);
        alert(
          "클립보드 복사에 실패했습니다. 콘솔에 출력된 텍스트를 복사해 주세요.",
        );
      }
    }
  }, [data]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Header report={report} captured={capturedAll} onExport={handleExport} />
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

// 초기 선택 우선순위: 상태(fail > 중복 의심 > 미수집 > pass) → 이슈 수 → captured 존재.
// 이슈 수만 보면 not_collected/suspect_duplicate는 이슈 0건인 경로가 있어 하위로
// 밀리는 문제가 있었다. status 랭크를 먼저 곱해 발견 우선순위를 지키게 한다.
const STATUS_RANK: Record<ValidationResult["status"], number> = {
  fail: 3,
  suspect_duplicate: 2,
  not_collected: 1,
  pass: 0,
};

function pickInitialIdx(
  results: ReportData["report"]["results"],
): number {
  let bestIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (!r) continue;
    const score =
      STATUS_RANK[r.status] * 1000 +
      r.issues.length * 10 +
      (r.captured.length > 0 ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestIdx;
}

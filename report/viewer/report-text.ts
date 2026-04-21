// ReportData → 공유용 텍스트 직렬화.
//
// 내보내기 버튼에서 쓰이는 순수 함수. 개발자와 공유할 때 붙여넣기 쉽도록 간결한
// Markdown 풍 평문으로 낸다. 예외 이벤트(`unexpected`)는 사용자가 선택한 스펙
// 밖이라 제외(요구사항).

import { BASE_EVENT_PARAM_KEYS } from "@/shared/base-event-param-keys.ts";
import type { ReportData } from "@/types/storage.ts";
import type { ValidationResult } from "@/types/validation.ts";

import {
  formatClock,
  formatClockDuration,
  formatGeneratedAt,
  primaryHost,
} from "./format.ts";

// 수집 로그 params에서 제외할 키 집합. 모든 이벤트에 동일하게 실리는 앱 환경·유입경로·
// UTM·eventTimeStamp 같은 보일러플레이트는 개발자가 이슈를 해석하는 데 도움이 안 되고
// 라인을 길게 늘려 LLM 핸드오프 시 토큰도 낭비시킨다. UI 상세 패널과 동일한 필터.
const HIDDEN_LOG_KEYS: ReadonlySet<string> = new Set(BASE_EVENT_PARAM_KEYS);

/** 상태 표시 순서. 개발자가 처리해야 할 것부터 위로. */
const STATUS_ORDER: ValidationResult["status"][] = [
  "fail",
  "suspect_duplicate",
  "not_collected",
  "pass",
];

const STATUS_BADGE: Record<ValidationResult["status"], string> = {
  fail: "FAIL",
  suspect_duplicate: "WARN",
  not_collected: "MISSING",
  pass: "PASS",
};

export function formatReportAsText(data: ReportData): string {
  const { report } = data;
  const { session, stats, generatedAt, results } = report;

  const duration = (session.endedAt ?? Date.now()) - session.startedAt;
  const captured = results.flatMap((r) => r.captured);
  const host = primaryHost(captured.map((c) => c.pageUrl));

  const lines: string[] = [];
  lines.push("# Event Profiler 리포트");
  lines.push("");
  lines.push(`생성: ${formatGeneratedAt(generatedAt)}`);
  lines.push(`녹화: ${formatClockDuration(duration)}`);
  if (host) lines.push(`호스트: ${host}`);
  lines.push(`대상 스펙 ${stats.totalSpecs}개 · 총 수집 ${stats.totalCaptured}건`);
  lines.push("");

  lines.push("## 요약");
  const total = Math.max(1, stats.totalSpecs);
  const pct = (n: number) => Math.round((n / total) * 100);
  lines.push(
    [
      `Pass ${stats.pass} (${pct(stats.pass)}%)`,
      `Fail ${stats.fail} (${pct(stats.fail)}%)`,
      `중복 의심 ${stats.suspectDuplicate} (${pct(stats.suspectDuplicate)}%)`,
      `미수집 ${stats.notCollected} (${pct(stats.notCollected)}%)`,
    ].join(" · "),
  );
  lines.push("");

  lines.push("## 검증 결과");
  lines.push("");
  const ordered = [...results].sort(compareResults);
  for (const r of ordered) {
    appendResult(lines, r);
  }

  return lines.join("\n").replace(/\n+$/, "") + "\n";
}

function compareResults(a: ValidationResult, b: ValidationResult): number {
  const ai = STATUS_ORDER.indexOf(a.status);
  const bi = STATUS_ORDER.indexOf(b.status);
  if (ai !== bi) return ai - bi;
  return a.spec.amplitudeEventName.localeCompare(b.spec.amplitudeEventName);
}

function appendResult(lines: string[], r: ValidationResult): void {
  const { spec, captured, issues } = r;
  const parts = [`${spec.pageName}`, `수집 ${captured.length}건`];
  if (issues.length > 0) parts.push(`이슈 ${issues.length}건`);
  // 스펙 시트 역추적용 출처. 시트명이 있으면 `시트 "메인" 행 47`, 없으면 `시트 행 47`로.
  const origin = spec.sourceSheet
    ? `시트 "${spec.sourceSheet}" 행 ${spec.sourceRow}`
    : `시트 행 ${spec.sourceRow}`;
  parts.push(origin);
  lines.push(
    `### [${STATUS_BADGE[r.status]}] ${spec.amplitudeEventName} (${parts.join(" · ")})`,
  );

  if (issues.length > 0) {
    for (const issue of issues) {
      const paramPart = issue.param ? ` "${issue.param}":` : "";
      lines.push(`- [${issue.severity}]${paramPart} ${issue.message}`);
    }
  }

  if (spec.params.length > 0) {
    lines.push(`스펙 params: ${spec.params.join(", ")}`);
  }

  if (captured.length > 0) {
    // 스펙이 명시한 키는 base와 이름이 겹쳐도(UTM source 등) 의미 있는 값이라 보존한다.
    const specKeySet = new Set(spec.params);
    lines.push("수집 로그:");
    for (const c of captured) {
      lines.push(
        `- ${formatClock(c.timestamp)}  ${stringifyParams(c.params, specKeySet)}`,
      );
    }
  }

  lines.push("");
}

function stringifyParams(
  params: Record<string, unknown>,
  specKeys: ReadonlySet<string>,
): string {
  const entries = Object.entries(params).filter(
    ([k]) => specKeys.has(k) || !HIDDEN_LOG_KEYS.has(k),
  );
  if (entries.length === 0) return "(no params)";
  return entries
    .map(([k, v]) => {
      if (typeof v === "string") return `${k}=${JSON.stringify(v)}`;
      if (v == null) return `${k}=${String(v)}`;
      return `${k}=${String(v)}`;
    })
    .join(" ");
}


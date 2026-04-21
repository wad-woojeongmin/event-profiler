// 녹화 중 라이브 검증 스냅샷 아톰.
//
// 배경 SW가 최종 리포트와 동일한 입력으로 `validate()`를 호출한 결과를 캐시한다.
// 폴링 주기는 세션 구독과 동일한 500ms(messaging-background-client.ts) — 수집 대시보드가
// "지금 잘 찍히고 있나"를 초 단위로 보여주면 충분하다.

import { atom } from "jotai";

import { canonicalEventName } from "@/shared/canonical-event-name.ts";
import type { ValidationReport, ValidationResult } from "@/types/validation.ts";

import { backgroundClientAtom, requireBackgroundClient } from "./client-atom.ts";
import { recordingPhaseAtom } from "./recording-atoms.ts";

export const liveReportAtom = atom<ValidationReport | null>(null);

/**
 * 배경 SW에서 스냅샷을 끌어와 `liveReportAtom`에 저장한다.
 *
 * idle phase에서는 호출 의미가 없어 no-op(세션 없으면 SW도 `null`을 돌려주지만
 * 불필요한 RPC를 피한다). 예외는 조용히 삼킨다 — 다음 tick에서 복구된다.
 */
export const hydrateLiveReportAtom = atom(null, async (get, set) => {
  const phase = get(recordingPhaseAtom);
  if (phase === "idle") {
    if (get(liveReportAtom) !== null) set(liveReportAtom, null);
    return;
  }
  const client = requireBackgroundClient(get(backgroundClientAtom));
  try {
    const snapshot = await client.getValidationSnapshot();
    set(liveReportAtom, snapshot);
  } catch {
    // silent: 다음 tick에서 재시도.
  }
});

/**
 * 상태 카드용 카운트. 스냅샷이 없으면 모두 0.
 * `stats.pass + fail + notCollected + suspectDuplicate === totalSpecs` 불변식을
 * validator가 보장하므로 여기서는 단순 passthrough로 족하다.
 */
export const liveStatsAtom = atom((get) => {
  const report = get(liveReportAtom);
  if (!report) {
    return { pass: 0, fail: 0, notCollected: 0, suspectDuplicate: 0 };
  }
  const { pass, fail, notCollected, suspectDuplicate } = report.stats;
  return { pass, fail, notCollected, suspectDuplicate };
});

/**
 * 이름 → 최신 `ValidationResult` 매핑. 대시보드의 선택된 스펙 리스트가
 * O(1)로 상태·이슈를 조회하기 위함.
 */
export const liveResultsByNameAtom = atom<Map<string, ValidationResult>>(
  (get) => {
    const report = get(liveReportAtom);
    const map = new Map<string, ValidationResult>();
    if (!report) return map;
    for (const r of report.results) {
      map.set(r.spec.amplitudeEventName, r);
    }
    return map;
  },
);

export type LiveStreamStatus = "pass" | "warn" | "fail" | "exception";

export interface LiveStreamEntry {
  id: string;
  timestamp: number;
  eventName: string;
  params: Record<string, unknown>;
  status: LiveStreamStatus;
}

/**
 * 녹화 중 화면의 "실시간 스트림" 리스트에 노출되는 이벤트. 선택된 스펙에 매칭되어
 * 검증된 이벤트와 예외 이벤트를 하나의 시간축에 모아 최신순으로 정렬한다. 스냅샷
 * 폴링(500ms)이 리스트 소스이므로 DOM animation은 첫 행에만 얕게 걸어 시각적
 * 갱신감을 낸다(UI 측에서 처리).
 */
export const liveStreamAtom = atom<LiveStreamEntry[]>((get) => {
  const report = get(liveReportAtom);
  if (!report) return [];
  const entries: LiveStreamEntry[] = [];
  for (const r of report.results) {
    const status = mapResultStatus(r.status);
    for (const captured of r.captured) {
      entries.push({
        id: captured.id,
        timestamp: captured.timestamp,
        eventName: canonicalEventName(captured),
        params: captured.params,
        status,
      });
    }
  }
  for (const captured of report.unexpected) {
    entries.push({
      id: captured.id,
      timestamp: captured.timestamp,
      eventName: canonicalEventName(captured),
      params: captured.params,
      status: "exception",
    });
  }
  entries.sort((a, b) => b.timestamp - a.timestamp);
  return entries.slice(0, 50);
});

function mapResultStatus(
  status: ValidationResult["status"],
): LiveStreamStatus {
  switch (status) {
    case "pass":
      return "pass";
    case "fail":
      return "fail";
    case "suspect_duplicate":
      return "warn";
    default:
      // not_collected는 captured가 없어 스트림에 도달하지 않는다.
      return "pass";
  }
}

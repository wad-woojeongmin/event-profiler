// 녹화 중 라이브 검증 스냅샷 아톰.
//
// 배경 SW가 최종 리포트와 동일한 입력으로 `validate()`를 호출한 결과를 캐시한다.
// 폴링 주기는 세션 구독과 동일한 500ms(messaging-background-client.ts) — 수집 대시보드가
// "지금 잘 찍히고 있나"를 초 단위로 보여주면 충분하다.

import { atom } from "jotai";

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

// M8 SW 어셈블러 — 포트 조립 + `local:reportData` write까지 담당.
//
// 순수 로직은 `assemble`에 위임하고, 여기서는 I/O 경계(스펙 캐시 read,
// 이벤트 조회, 스크린샷 Blob 로드, reportData write)만 처리한다.
//
// 호출 경로: `entrypoints/background.ts` → `onMessage("generateReport")` →
// `ReportAssembler.run()`.

import type { CapturedEvent } from "@/types/event.ts";
import type { ReportData } from "@/types/storage.ts";
import { defaultRules } from "@/validator/index.ts";
import type { ScreenshotReader } from "@/background/index.ts";

import { assemble } from "./assemble.ts";
import { blobToDataUrl } from "./blob-to-data-url.ts";
import type { ReportWriter } from "./ports/report-writer.ts";
import type { SessionSource } from "./ports/session-source.ts";
import type { SpecsCacheReader } from "./ports/specs-cache-reader.ts";

export interface ReportAssemblerDeps {
  specsCacheReader: SpecsCacheReader;
  screenshotReader: ScreenshotReader;
  reportWriter: ReportWriter;
  /** 현재 세션 이벤트 + 세션 메타 + targetEventNames 공급자. */
  sessionSource: SessionSource;
}

export interface ReportAssembler {
  /**
   * 리포트를 어셈블해 `local:reportData`에 write한다.
   *
   * - 세션이 없거나 specs 캐시가 비어있으면 `null`을 반환한다(호출자는 no-op).
   * - 스크린샷 로드 실패 건은 `screenshotDataUrls`에서 누락되며, 리포트는 그대로 생성.
   *
   * @returns write한 `ReportData`. 사전 조건 미충족 시 `null`.
   */
  run(): Promise<ReportData | null>;
}

export function createReportAssembler(
  deps: ReportAssemblerDeps,
): ReportAssembler {
  return {
    async run() {
      const state = await deps.sessionSource.getState();
      if (!state.session) return null;

      const allSpecs = await deps.specsCacheReader.read();
      if (!allSpecs || allSpecs.length === 0) return null;

      // 리포트의 검증 결과는 사용자가 녹화 시작 시 선택한 이벤트로 국한한다.
      // 캐시 자체는 전체 스펙을 보존 — 선택 변경 시 재로드 없이 재어셈블 가능하고
      // R5 unexpected(선택 외 이벤트 감지)도 전체 스펙 맥락과 무관하게 동작한다.
      const targetSet = new Set(state.targetEventNames);
      const specs = allSpecs.filter((s) => targetSet.has(s.amplitudeEventName));
      if (specs.length === 0) return null;

      const captured = await deps.sessionSource.listCurrentEvents();
      const screenshotDataUrls = await loadScreenshotDataUrls(
        captured,
        deps.screenshotReader,
      );

      const data = assemble({
        specs,
        captured,
        targetEventNames: state.targetEventNames,
        session: state.session,
        rules: defaultRules,
        screenshotDataUrls,
      });
      await deps.reportWriter.write(data);
      return data;
    },
  };
}

/**
 * 캡처된 이벤트의 스크린샷을 병렬 로드하여 id → data URL 맵을 만든다.
 *
 * - 같은 id가 여러 이벤트에 공유되므로 중복 로드를 피하기 위해 unique id만 요청.
 * - 개별 로드 실패는 해당 id만 드롭. 전체 어셈블을 실패시키지 않는다.
 */
async function loadScreenshotDataUrls(
  captured: CapturedEvent[],
  reader: ScreenshotReader,
): Promise<Record<string, string>> {
  const ids = new Set<string>();
  for (const e of captured) {
    if (e.screenshotId) ids.add(e.screenshotId);
  }

  const entries = await Promise.all(
    Array.from(ids).map(async (id): Promise<[string, string] | null> => {
      try {
        const blob = await reader.load(id);
        if (!blob) return null;
        return [id, await blobToDataUrl(blob)];
      } catch {
        return null;
      }
    }),
  );

  const map: Record<string, string> = {};
  for (const entry of entries) {
    if (entry) map[entry[0]] = entry[1];
  }
  return map;
}

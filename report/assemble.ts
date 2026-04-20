// M8 순수 어셈블 함수.
//
// `validate()`가 이미 검증 로직을 소유하므로 여기서는 입력을 모아 `validate`
// 호출 + 스크린샷 data URL 맵 결합만 한다. 외부 I/O·`browser.*`·난수·시간 직접
// 접근 금지(`validate` 내부의 `Date.now()`는 예외 — docs/02-contracts 참고).

import type { CapturedEvent, RecordingSession } from "@/types/event.ts";
import type { EventSpec } from "@/types/spec.ts";
import type { ReportData } from "@/types/storage.ts";
import { validate } from "@/validator/index.ts";
import type { ValidationRule } from "@/validator/index.ts";

export interface AssembleInput {
  specs: EventSpec[];
  captured: CapturedEvent[];
  targetEventNames: string[];
  session: RecordingSession;
  rules: ValidationRule[];
  /** screenshotId → data URL (M8 SW 어셈블러가 사전 로드해 넘겨줌). */
  screenshotDataUrls: Record<string, string>;
}

/**
 * 입력값으로부터 M4 뷰어가 즉시 렌더할 수 있는 `ReportData`를 만든다.
 *
 * - 매칭/집계/상태 결정은 `validate()`에 위임
 * - 스크린샷 데이터는 이미 base64로 인코딩된 상태로 주입받는다(순수성 유지)
 */
export function assemble(input: AssembleInput): ReportData {
  const report = validate(
    input.specs,
    input.captured,
    input.targetEventNames,
    input.session,
    input.rules,
  );
  return {
    report,
    screenshotDataUrls: input.screenshotDataUrls,
  };
}

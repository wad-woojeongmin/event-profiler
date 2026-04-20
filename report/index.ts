// M8 report 모듈 공개 API.
//
// 외부(엔트리포인트)가 필요한 팩토리·포트 타입만 re-export한다. 순수 로직
// (`assemble`, `blobToDataUrl`)은 테스트에서만 직접 쓰므로 여기서 재노출하지
// 않는다. 어댑터는 엔트리포인트 조립에서 import.

export { assemble, type AssembleInput } from "./assemble.ts";
export {
  createReportAssembler,
  type ReportAssembler,
  type ReportAssemblerDeps,
} from "./report-assembler.ts";
export { createWxtSpecsCacheReader } from "./adapters/wxt-specs-cache-reader.ts";
export { createWxtReportWriter } from "./adapters/wxt-report-writer.ts";
export type { SpecsCacheReader } from "./ports/specs-cache-reader.ts";
export type { ReportWriter } from "./ports/report-writer.ts";
export type { SessionSource } from "./ports/session-source.ts";

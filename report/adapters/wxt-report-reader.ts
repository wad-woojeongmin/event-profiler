// `wxt/storage` 기반 ReportReader 어댑터.
//
// `local:reportData`는 M8이 소유(쓰기)하고 뷰어가 소비(읽기)하는 공용 스토리지 키.
// 이 어댑터는 read만 수행한다. 키/스키마/fallback은 `types/storage.ts`의 공용
// 심볼을 그대로 재사용해 writer 쪽과 드리프트가 발생하지 않게 한다.

import { storage } from "wxt/utils/storage";

import { REPORT_DATA_KEY, type ReportPayload } from "@/types/storage.ts";

import type { ReportReader } from "../ports/report-reader.ts";

const reportDataItem = storage.defineItem<ReportPayload>(REPORT_DATA_KEY, {
  fallback: null,
});

export function createWxtReportReader(): ReportReader {
  return {
    async read() {
      return reportDataItem.getValue();
    },
  };
}

// `wxt/storage` 기반 ReportWriter 어댑터.
//
// `local:reportData`는 M8이 소유(쓰기)·M4가 소비(읽기)하는 공용 스토리지 키.
// 이 어댑터에서는 write만 수행한다.

import { storage } from "wxt/utils/storage";

import { REPORT_DATA_KEY, type ReportPayload } from "@/types/storage.ts";

import type { ReportWriter } from "../ports/report-writer.ts";

const reportDataItem = storage.defineItem<ReportPayload>(REPORT_DATA_KEY, {
  fallback: null,
});

export function createWxtReportWriter(): ReportWriter {
  return {
    async write(report) {
      await reportDataItem.setValue(report);
    },
  };
}

// IndexedDB 기반 EventWriter/EventReader 어댑터.

import type { CapturedEvent } from "@/types/event.ts";

import type {
  EventReader,
  EventWriter,
} from "../ports/event-store.ts";
import { runTx, STORE_EVENTS } from "./idb-database.ts";

export function createIdbEventStore(): EventWriter & EventReader {
  return {
    async add(event) {
      await runTx<IDBValidKey>(STORE_EVENTS, "readwrite", (os) => os.put(event));
    },
    async clear() {
      await runTx<undefined>(STORE_EVENTS, "readwrite", (os) => {
        os.clear();
      });
    },
    async listBySession(_sessionId) {
      // Phase 1은 세션 경계에서 store를 clear하므로 "현재 세션 전체"와 동일.
      // 차후 세션 히스토리가 필요해지면 index(`sessionId`)를 추가한다.
      const rows = await runTx<CapturedEvent[]>(
        STORE_EVENTS,
        "readonly",
        (os) => os.getAll() as IDBRequest<CapturedEvent[]>,
      );
      const list = rows ?? [];
      return list.slice().sort((a, b) => a.timestamp - b.timestamp);
    },
  };
}

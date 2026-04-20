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
      // keyPath `id`로 put — 존재하면 덮어쓰기(포트 계약의 멱등성 보장).
      await runTx<IDBValidKey>(STORE_EVENTS, "readwrite", (os) => os.put(event));
    },
    async clear() {
      await runTx<undefined>(STORE_EVENTS, "readwrite", (os) => {
        os.clear();
      });
    },
    async listBySession(_sessionId) {
      // Phase 1은 세션 전환 시 store를 clear하므로 `sessionId`는 현재 전체와
      // 동치. 히스토리 도입 전까지는 `_sessionId`를 무시해도 안전하다.
      const rows = await runTx<CapturedEvent[]>(
        STORE_EVENTS,
        "readonly",
        (os) => os.getAll() as IDBRequest<CapturedEvent[]>,
      );
      const list = rows ?? [];
      // IDB `getAll`은 키 순서를 보장하지만 `timestamp` 기준 정렬을 포트 계약으로
      // 고정해 두었으므로 명시적으로 다시 정렬한다.
      return list.slice().sort((a, b) => a.timestamp - b.timestamp);
    },
  };
}

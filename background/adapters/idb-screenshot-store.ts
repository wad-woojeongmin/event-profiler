// IndexedDB 기반 ScreenshotWriter/ScreenshotReader 어댑터.

import type {
  ScreenshotReader,
  ScreenshotWriter,
} from "../ports/screenshot-store.ts";
import { runTx, STORE_SCREENSHOTS } from "./idb-database.ts";

interface StoredScreenshot {
  id: string;
  blob: Blob;
}

export function createIdbScreenshotStore(): ScreenshotWriter & ScreenshotReader {
  return {
    async save(id, image) {
      const row: StoredScreenshot = { id, blob: image };
      await runTx<IDBValidKey>(STORE_SCREENSHOTS, "readwrite", (os) =>
        os.put(row),
      );
    },
    async load(id) {
      const row = await runTx<StoredScreenshot | undefined>(
        STORE_SCREENSHOTS,
        "readonly",
        (os) => os.get(id) as IDBRequest<StoredScreenshot | undefined>,
      );
      return row?.blob ?? null;
    },
    async clear() {
      await runTx<undefined>(STORE_SCREENSHOTS, "readwrite", (os) => {
        os.clear();
      });
    },
  };
}

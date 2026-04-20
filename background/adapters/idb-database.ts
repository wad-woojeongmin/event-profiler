// IndexedDB 공통 오픈 헬퍼.
//
// events/screenshots 두 개의 object store를 하나의 DB에 둔다. WXT 폴리필은
// IndexedDB를 커버하지 않으므로 어댑터는 실제 IDB API를 그대로 쓴다. 포트
// 외부에는 IDBDatabase·IDBTransaction을 노출하지 않는다.

export const DB_NAME = "event-validator";
export const DB_VERSION = 1;
export const STORE_EVENTS = "events";
export const STORE_SCREENSHOTS = "screenshots";

export type IdbStoreName = typeof STORE_EVENTS | typeof STORE_SCREENSHOTS;

let dbPromise: Promise<IDBDatabase> | undefined;

/**
 * SW 생애주기 동안 하나의 연결을 공유한다.
 *
 * SW가 Idle로 내려간 뒤 깨어날 때는 모듈이 다시 평가되므로 `dbPromise`가 재
 * 초기화된다. 여러 탭이 동시에 쓰더라도 `db.transaction`이 직렬화를 처리한다.
 */
export function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_EVENTS)) {
          db.createObjectStore(STORE_EVENTS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_SCREENSHOTS)) {
          db.createObjectStore(STORE_SCREENSHOTS, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () =>
        reject(new Error("IndexedDB open blocked — 이전 연결을 닫지 못했습니다."));
    });
  }
  return dbPromise;
}

/** 테스트에서 모듈 단위 캐시를 초기화할 때 사용. */
export function resetDbCache(): void {
  dbPromise = undefined;
}

/** 단일 store에 대한 트랜잭션 실행 헬퍼. IDBRequest를 Promise로 감싼다. */
export async function runTx<T>(
  store: IdbStoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const os = tx.objectStore(store);
    let result: T | undefined;
    const req = fn(os);
    if (req) {
      req.onsuccess = () => {
        result = req.result;
      };
      req.onerror = () => reject(req.error);
    }
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(tx.error ?? new Error("IDB transaction aborted"));
    tx.onerror = () => reject(tx.error);
  });
}

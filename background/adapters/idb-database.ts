// IndexedDB 공통 오픈 헬퍼.
//
// events/screenshots 두 store를 단일 DB에 둔다. WxtVitest의 fake-browser는
// IndexedDB를 폴리필하지 않으므로 어댑터 테스트에는 `fake-indexeddb`를 별도로
// 끼워야 한다. `IDBDatabase`·`IDBTransaction`은 포트 밖으로 노출하지 않는다.

export const DB_NAME = "event-validator";
export const DB_VERSION = 1;
export const STORE_EVENTS = "events";
export const STORE_SCREENSHOTS = "screenshots";

export type IdbStoreName = typeof STORE_EVENTS | typeof STORE_SCREENSHOTS;

let dbPromise: Promise<IDBDatabase> | undefined;

/**
 * DB 커넥션을 싱글톤으로 획득한다.
 *
 * SW가 idle→깨어나면 모듈이 재평가되며 `dbPromise`도 재초기화되므로 stale 핸들
 * 문제는 없다. 동시 쓰기는 IDB의 트랜잭션 직렬화가 처리. `onblocked`는 다른
 * 탭이 구버전 연결을 놓지 못하면 발생 — 명시적 에러로 전파한다.
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

/** 싱글톤 캐시 초기화. fake-indexeddb를 매 테스트마다 리셋할 때 사용. */
export function resetDbCache(): void {
  dbPromise = undefined;
}

/**
 * 단일 store 트랜잭션 실행 헬퍼.
 *
 * `IDBRequest`를 Promise로 감싸되 완료 신호는 `tx.oncomplete`로 받는다
 * (`req.onsuccess`만으로는 write 지속성이 보장되지 않음).
 * @param fn - `os`에서 `IDBRequest`를 반환하면 결과가 Promise로 전달되고,
 *   void를 반환하면 `undefined`로 해결된다.
 * @throws 트랜잭션 abort/error 또는 request error 시.
 */
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

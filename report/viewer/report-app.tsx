// 뷰어 루트. `ReportReader`로 `local:reportData`를 한 번 read한 뒤
// loading/empty/loaded 3상태로 분기한다.
//
// SW가 write를 마친 직후 탭을 열기 때문에 일반 경로는 "tab 로드 시점에 이미 존재"다.
// 그래도 race 가능성(탭 로딩 중 write 완료)을 대비해 초기 read가 `null`인 경우 500ms
// 뒤 한 번 재시도한다. 그 이상의 실시간 반영은 본 스코프 외(out of scope).

import { useEffect, useState } from "react";

import type { ReportData } from "@/types/storage.ts";

import type { ReportReader } from "../ports/report-reader.ts";
import { ReportView } from "./report-view.tsx";
import * as styles from "./report-app.css.ts";

interface Props {
  reader: ReportReader;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "loaded"; data: ReportData };

export function ReportApp({ reader }: Props) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let alive = true;

    async function load() {
      const data = await reader.read();
      if (!alive) return;
      if (data) {
        setState({ kind: "loaded", data });
        return;
      }
      // 드문 race(탭 로딩 중 write 완료)를 대비한 1회 재시도.
      await new Promise((r) => setTimeout(r, 500));
      if (!alive) return;
      const retry = await reader.read();
      if (!alive) return;
      setState(retry ? { kind: "loaded", data: retry } : { kind: "empty" });
    }
    void load();

    return () => {
      alive = false;
    };
  }, [reader]);

  if (state.kind === "loading") {
    return <div className={styles.placeholder}>리포트를 불러오는 중…</div>;
  }
  if (state.kind === "empty") {
    return (
      <div className={styles.placeholder}>
        저장된 리포트가 없습니다. 팝업에서 "리포트 생성 (새 탭)"을 다시 눌러 주세요.
      </div>
    );
  }
  return <ReportView data={state.data} />;
}

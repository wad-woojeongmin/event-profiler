// Report 뷰어 엔트리포인트 — React 루트 mount만 담당한다.
//
// 어댑터 주입(`ReportReader`)은 여기서 수행. 뷰어 컴포넌트는 `report/viewer/`에
// 있고 이 파일은 얇은 조립 계층이다(03-conventions §SRP).

import React from "react";
import ReactDOM from "react-dom/client";

import { createWxtReportReader } from "@/report/index.ts";
import { ReportApp } from "@/report/viewer/report-app.tsx";

import "@/report/viewer/styles/reset.css.ts";

const root = document.getElementById("root");
if (!root) {
  throw new Error("report root element가 없습니다.");
}

const reader = createWxtReportReader();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ReportApp reader={reader} />
  </React.StrictMode>,
);

// Side panel 엔트리포인트 — React 루트 mount만 담당한다.
//
// 어댑터 주입은 여기서 수행. 비즈니스 로직은 `popup/` 모듈에 있고 이 파일은
// 얇은 조립 계층이다(03-conventions §SRP).

import React from "react";
import ReactDOM from "react-dom/client";

import { createMessagingBackgroundClient, PopupApp } from "@/popup/index.ts";

const root = document.getElementById("root");
if (!root) {
  throw new Error("sidepanel root element가 없습니다.");
}

const client = createMessagingBackgroundClient();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <PopupApp client={client} />
  </React.StrictMode>,
);

import { PopupPage } from "./pages/popup-page.tsx";
import { ReportPage } from "./pages/report-page.tsx";
import { useDemoState } from "./state/use-demo-state.ts";
import "./styles/app.css";

/**
 * Phase 0 Demo 엔트리.
 *
 * 실제 확장 동작을 시뮬레이션하는 React 앱.
 * - OAuth/스토리지/Sheets API/메시징/IndexedDB는 모두 in-memory fake
 * - 팝업 레이아웃은 확장 브라우저 액션(420×640) 크기 그대로 프레임으로 렌더
 * - "리포트 열기"는 같은 페이지 내 뷰 전환으로 시뮬레이션
 */
export function App() {
  const handle = useDemoState();
  const { state, actions } = handle;

  return (
    <div className="demo-shell">
      <header className="demo-header">
        <div>
          <h1>
            Event Validator
            <span className="demo-tag">Phase 0 Demo</span>
          </h1>
          <div className="demo-subtitle">
            실제 확장 동작을 시뮬레이션한 UI 목업입니다. 데이터는 모두 fixture.
          </div>
        </div>
        {state.view === "report" && (
          <button type="button" onClick={actions.backToPopup}>
            ← 팝업으로
          </button>
        )}
      </header>

      <main className={`demo-stage view-${state.view}`}>
        {state.view === "popup" && (
          <>
            <PopupPage {...handle} />
            <aside className="demo-explainer">
              <strong>흐름 안내</strong>
              <ol>
                <li>Google 계정으로 로그인 (데모: 즉시 통과)</li>
                <li>스펙 불러오기 (고정 시트, 가짜 0.8초 지연)</li>
                <li>검증할 이벤트 선택 (검색·전체 선택 가능)</li>
                <li>녹화 시작 → 수집 수가 자동으로 증가</li>
                <li>녹화 종료 → 리포트 열기</li>
              </ol>
            </aside>
          </>
        )}
        {state.view === "report" && state.report && (
          <ReportPage report={state.report} onBack={actions.backToPopup} />
        )}
      </main>
    </div>
  );
}

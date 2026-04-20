import { AuthGate } from "../components/auth-gate.tsx";
import { EventChecklist } from "../components/event-checklist.tsx";
import { RecordingControls } from "../components/recording-controls.tsx";
import { SpecLoader } from "../components/spec-loader.tsx";
import type { useDemoState } from "../state/use-demo-state.ts";

type StateHandle = ReturnType<typeof useDemoState>;

/** Popup UI. 420x640 브라우저 액션 팝업 크기를 그대로 재현. */
export function PopupPage({ state, actions }: StateHandle) {
  const recordingActive =
    state.recording === "recording" || state.recording === "recording_done";

  return (
    <div className="popup-frame" aria-label="Event Profiler 팝업">
      <div className="popup-frame-bar">
        <span className="dot red" />
        <span className="dot yellow" />
        <span className="dot green" />
        <span style={{ marginLeft: "auto" }}>chrome-extension://…/popup.html</span>
      </div>

      {state.auth === "signed_out" ? (
        <AuthGate onSignIn={actions.signIn} />
      ) : (
        <div className="popup-body">
          <SpecLoader
            specsLoaded={state.specs.length}
            loading={state.specsLoading}
            onLoad={actions.loadSpecs}
          />

          <EventChecklist
            specs={state.specs}
            selected={state.selectedEventNames}
            disabled={recordingActive}
            onToggle={actions.toggleSelection}
            onSelectAll={actions.selectAll}
            onClear={actions.clearSelection}
          />

          <RecordingControls
            status={state.recording}
            selectedCount={state.selectedEventNames.size}
            capturedCount={state.capturedCount}
            recordingStartedAt={state.recordingStartedAt}
            onStart={actions.startRecording}
            onStop={actions.stopRecording}
            onOpenReport={actions.openReport}
            onReset={actions.resetRecording}
          />

          <div className="row space-between" style={{ marginTop: "auto" }}>
            <span className="url-hint">v0.1.0 — Phase 0 Demo</span>
            <button className="ghost" type="button" onClick={actions.signOut}>
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

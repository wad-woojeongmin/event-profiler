import { useCallback, useEffect, useRef, useState } from "react";
import type { EventSpec } from "@/types/spec.ts";
import type { ValidationReport } from "@/types/validation.ts";
import { fakeEventSpecs } from "../fixtures/event-specs.ts";
import { fakeValidationReport } from "../fixtures/validation-report.ts";

/** 데모용 상태 머신. 실제 확장에서는 M4(popup) + M3(background)가 협조하여 관리. */
export type DemoView = "popup" | "report";

export type AuthStatus = "signed_out" | "signed_in";

export type RecordingStatus =
  | "idle"              // 아무 것도 안 함
  | "recording"         // 진행 중 (경과 시간 + 수집 수 증가 시뮬레이션)
  | "recording_done";   // 완료, 리포트 생성 가능

export interface DemoState {
  view: DemoView;
  auth: AuthStatus;

  // spec 로드 흐름
  sheetUrl: string;
  specs: EventSpec[];
  specsLoading: boolean;

  // 선택
  selectedEventNames: Set<string>;

  // 녹화
  recording: RecordingStatus;
  recordingStartedAt: number | null;
  capturedCount: number;

  // 리포트
  report: ValidationReport | null;
}

const DEMO_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1ABCdef-DEMO-FIXTURE/edit";

const initialState: DemoState = {
  view: "popup",
  auth: "signed_out",
  sheetUrl: "",
  specs: [],
  specsLoading: false,
  selectedEventNames: new Set(),
  recording: "idle",
  recordingStartedAt: null,
  capturedCount: 0,
  report: null,
};

export function useDemoState() {
  const [state, setState] = useState<DemoState>(initialState);

  // 녹화 중엔 초마다 `capturedCount`를 흔들어 움직이는 연출을 제공.
  const tickRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.recording !== "recording") return;
    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.recording !== "recording") return prev;
        // fakeValidationReport 전체 수집 수보다 많아지지 않게 상한.
        if (prev.capturedCount >= fakeValidationReport.stats.totalCaptured) {
          return prev;
        }
        return { ...prev, capturedCount: prev.capturedCount + 1 };
      });
    }, 650);
    tickRef.current = id;
    return () => window.clearInterval(id);
  }, [state.recording]);

  const signIn = useCallback(() => {
    setState((prev) => ({ ...prev, auth: "signed_in" }));
  }, []);

  const signOut = useCallback(() => {
    setState(() => ({ ...initialState }));
  }, []);

  const setSheetUrl = useCallback((url: string) => {
    setState((prev) => ({ ...prev, sheetUrl: url }));
  }, []);

  const prefillDemoSheet = useCallback(() => {
    setState((prev) => ({ ...prev, sheetUrl: DEMO_SHEET_URL }));
  }, []);

  const loadSpecs = useCallback(async () => {
    setState((prev) => ({ ...prev, specsLoading: true }));
    await new Promise((r) => setTimeout(r, 800));
    setState((prev) => ({
      ...prev,
      specs: fakeEventSpecs,
      specsLoading: false,
    }));
  }, []);

  const toggleSelection = useCallback((name: string) => {
    setState((prev) => {
      const next = new Set(prev.selectedEventNames);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { ...prev, selectedEventNames: next };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedEventNames: new Set(prev.specs.map((s) => s.amplitudeEventName)),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedEventNames: new Set() }));
  }, []);

  const startRecording = useCallback(() => {
    setState((prev) => ({
      ...prev,
      recording: "recording",
      recordingStartedAt: Date.now(),
      capturedCount: 0,
    }));
  }, []);

  const stopRecording = useCallback(() => {
    setState((prev) => ({
      ...prev,
      recording: "recording_done",
      report: fakeValidationReport,
    }));
  }, []);

  const resetRecording = useCallback(() => {
    setState((prev) => ({
      ...prev,
      recording: "idle",
      recordingStartedAt: null,
      capturedCount: 0,
      report: null,
    }));
  }, []);

  const openReport = useCallback(() => {
    setState((prev) => ({ ...prev, view: "report" }));
  }, []);

  const backToPopup = useCallback(() => {
    setState((prev) => ({ ...prev, view: "popup" }));
  }, []);

  return {
    state,
    actions: {
      signIn,
      signOut,
      setSheetUrl,
      prefillDemoSheet,
      loadSpecs,
      toggleSelection,
      selectAll,
      clearSelection,
      startRecording,
      stopRecording,
      resetRecording,
      openReport,
      backToPopup,
    },
  };
}

import { useEffect, useState } from "react";
import type { RecordingStatus } from "../state/use-demo-state.ts";

interface Props {
  status: RecordingStatus;
  selectedCount: number;
  capturedCount: number;
  recordingStartedAt: number | null;
  onStart: () => void;
  onStop: () => void;
  onOpenReport: () => void;
  onReset: () => void;
}

function formatElapsed(startedAt: number | null): string {
  if (!startedAt) return "00:00";
  const ms = Date.now() - startedAt;
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** 녹화 시작/중지/리포트 생성 컨트롤. 상태에 따라 3가지 UI. */
export function RecordingControls({
  status,
  selectedCount,
  capturedCount,
  recordingStartedAt,
  onStart,
  onStop,
  onOpenReport,
  onReset,
}: Props) {
  // 녹화 중엔 초 단위로 경과 시간이 다시 렌더되도록.
  const [, force] = useState(0);
  useEffect(() => {
    if (status !== "recording") return;
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  if (status === "idle") {
    return (
      <section className="popup-section rec-idle">
        <h2>녹화</h2>
        <button
          className="primary"
          type="button"
          onClick={onStart}
          disabled={selectedCount === 0}
        >
          ● 녹화 시작 {selectedCount > 0 ? `(${selectedCount}개 이벤트)` : ""}
        </button>
        {selectedCount === 0 && (
          <div className="helper">대상 이벤트를 1개 이상 선택하세요.</div>
        )}
      </section>
    );
  }

  if (status === "recording") {
    return (
      <section className="popup-section rec-active">
        <div className="rec-indicator">
          <span className="pulse" /> REC
        </div>
        <div className="rec-metrics">
          <div className="rec-metric">
            <div className="value">{capturedCount}</div>
            <div className="label">수집</div>
          </div>
          <div className="rec-metric">
            <div className="value">{formatElapsed(recordingStartedAt)}</div>
            <div className="label">경과</div>
          </div>
        </div>
        <button className="danger" type="button" onClick={onStop}>
          ■ 녹화 종료
        </button>
      </section>
    );
  }

  // recording_done
  return (
    <section className="popup-section rec-done">
      <h2>녹화 완료</h2>
      <div className="stats">
        총 <strong>{capturedCount}</strong>건 수집됨. 리포트에서 검증 결과를 확인하세요.
      </div>
      <button className="primary" type="button" onClick={onOpenReport}>
        리포트 열기 (새 탭)
      </button>
      <button type="button" onClick={onReset}>
        초기화
      </button>
    </section>
  );
}

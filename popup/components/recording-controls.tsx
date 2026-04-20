// 녹화 상태에 따라 녹화 시작/진행/완료 3개 화면을 분기한다.
//
// 경과 시간은 세션 `startedAt`에서 현재 시각까지의 차이로 표시한다. 팝업이 닫혔다
// 다시 열려도 startedAt은 SW에 영속되므로 정확한 경과가 복원된다.

import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import {
  generateReportAtom,
  recordingPhaseAtom,
  recordingSessionAtom,
  startRecordingAtom,
  stopRecordingAtom,
  selectedEventNamesAtom,
} from "../atoms/recording-atoms.ts";

import * as styles from "./recording-controls.css.ts";

export function RecordingControls() {
  const phase = useAtomValue(recordingPhaseAtom);
  const session = useAtomValue(recordingSessionAtom);
  const selected = useAtomValue(selectedEventNamesAtom);
  const start = useSetAtom(startRecordingAtom);
  const stop = useSetAtom(stopRecordingAtom);
  const generate = useSetAtom(generateReportAtom);

  if (phase === "recording" && session.session) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.stats}>
          <span>
            <span className={styles.statLabel}>경과</span>
            <ElapsedTime startedAt={session.session.startedAt} />
          </span>
          <span>
            <span className={styles.statLabel}>수집</span>
            {session.capturedCount}건
          </span>
        </div>
        <button
          type="button"
          className={styles.buttonVariants.stop}
          onClick={() => void stop()}
        >
          ■ 녹화 종료
        </button>
      </section>
    );
  }

  if (phase === "recording_done" && session.session) {
    return (
      <section className={styles.wrapper}>
        <div className={styles.stats}>
          <span>
            <span className={styles.statLabel}>총</span>
            {session.capturedCount}건 수집
          </span>
        </div>
        <button
          type="button"
          className={styles.buttonVariants.start}
          onClick={() => void generate()}
        >
          리포트 생성 (새 탭)
        </button>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.buttonVariants.secondary}
            onClick={() => void start()}
            disabled={selected.size === 0}
          >
            다시 녹화
          </button>
        </div>
      </section>
    );
  }

  const disabled = selected.size === 0;
  return (
    <section className={styles.wrapper}>
      <button
        type="button"
        className={styles.buttonVariants.start}
        onClick={() => void start()}
        disabled={disabled}
      >
        ● 녹화 시작
      </button>
    </section>
  );
}

function ElapsedTime({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(handle);
  }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return <>{`${mm}:${ss}`}</>;
}

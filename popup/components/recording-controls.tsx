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
import { specsAtom } from "../atoms/specs-atoms.ts";
import { isSupportedTabAtom } from "../atoms/tab-atoms.ts";

import * as styles from "./recording-controls.css.ts";

export function RecordingControls() {
  const phase = useAtomValue(recordingPhaseAtom);
  const session = useAtomValue(recordingSessionAtom);
  const selected = useAtomValue(selectedEventNamesAtom);
  const isSupported = useAtomValue(isSupportedTabAtom);
  const specs = useAtomValue(specsAtom);
  const start = useSetAtom(startRecordingAtom);
  const stop = useSetAtom(stopRecordingAtom);
  const generate = useSetAtom(generateReportAtom);

  // SpecsBridge가 팝업 마운트 시 `local:specsCache`로부터 specsAtom을 복원하므로,
  // 재오픈 후에도 캐시에 남은 스펙이 있으면 이 값이 채워진다. M8 어셈블러가 읽는
  // 소스(캐시)와 UI 소스가 동일한 셈이라 플래그 하나로 가드가 성립한다.
  const canGenerate = specs.length > 0;

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

  // 재시작/시작 모두 동일 가드 — 선택 0건 또는 호스트 미매치는 차단.
  // `isSupported === null`(아직 hydrate 전)은 허용 쪽으로 편향해 첫 프레임에서
  // 버튼이 깜빡 disabled되는 것을 막는다; 액션 아톰이 재확인하므로 안전하다.
  const startDisabled = selected.size === 0 || isSupported === false;

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
          disabled={!canGenerate}
        >
          리포트 생성 (새 탭)
        </button>
        {!canGenerate && (
          <p className={styles.guardMessage}>스펙을 먼저 불러와 주세요.</p>
        )}
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.buttonVariants.secondary}
            onClick={() => void start()}
            disabled={startDisabled}
          >
            다시 녹화
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <button
        type="button"
        className={styles.buttonVariants.start}
        onClick={() => void start()}
        disabled={startDisabled}
      >
        ● 녹화 시작
      </button>
    </section>
  );
}

function ElapsedTime({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  // 표시 단위가 초이므로 1s tick이면 충분하다. 팝업 유휴 CPU를 절반으로 줄인다.
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(handle);
  }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return <>{`${mm}:${ss}`}</>;
}

// 녹화 제어 푸터.
//
// - idle: "녹화 시작" 전용 풀폭 버튼. 선택 0건/비지원 탭에서 disabled.
// - recording: "녹화 종료" 체크박스 + "리포트 보기"(비활성, 가드 안내). 체크 순간
//   `stopRecording`을 호출한다.
// - recording_done: "이벤트 다시 선택"(secondary) + "다시 녹화"(secondary) +
//   "리포트 보기"(primary). "이벤트 다시 선택"은 세션을 초기화해 idle phase로
//   되돌린다 → 선택 UI가 다시 보여 사용자가 다른 이벤트 세트를 고를 수 있다.
//
// 경과 시간·수집 건수·세부 상태는 `RecordingDashboard`가 표시하므로 여기서는
// 버튼 그룹만 담당한다.

import { useAtomValue, useSetAtom } from "jotai";

import {
  generateReportAtom,
  recordingPhaseAtom,
  resetSessionAtom,
  selectedEventNamesAtom,
  startRecordingAtom,
  stopRecordingAtom,
} from "../atoms/recording-atoms.ts";
import { specsAtom } from "../atoms/specs-atoms.ts";
import { isSupportedTabAtom } from "../atoms/tab-atoms.ts";

import * as styles from "./recording-controls.css.ts";

export function RecordingControls() {
  const phase = useAtomValue(recordingPhaseAtom);
  const selected = useAtomValue(selectedEventNamesAtom);
  const isSupported = useAtomValue(isSupportedTabAtom);
  const specs = useAtomValue(specsAtom);
  const start = useSetAtom(startRecordingAtom);
  const stop = useSetAtom(stopRecordingAtom);
  const reset = useSetAtom(resetSessionAtom);
  const generate = useSetAtom(generateReportAtom);

  const canGenerate = specs.length > 0;
  // isSupported === null은 hydrate 전으로 허용 쪽으로 편향(깜빡임 방지). 액션 아톰이 재확인.
  const startDisabled = selected.size === 0 || isSupported === false;

  if (phase === "recording") {
    return (
      <section className={styles.wrapper}>
        <div className={styles.buttonRow}>
          <label className={styles.stopCheckbox}>
            <input
              type="checkbox"
              checked={false}
              onChange={() => void stop()}
            />
            <span>녹화 종료</span>
          </label>
          <button
            type="button"
            className={styles.buttonVariants.start}
            onClick={() => void generate()}
            disabled
          >
            리포트 보기
          </button>
        </div>
      </section>
    );
  }

  if (phase === "recording_done") {
    return (
      <section className={styles.wrapper}>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.buttonVariants.secondary}
            onClick={() => void reset()}
          >
            이벤트 다시 선택
          </button>
          <button
            type="button"
            className={styles.buttonVariants.secondary}
            onClick={() => void start()}
            disabled={startDisabled}
          >
            다시 녹화
          </button>
          <button
            type="button"
            className={styles.buttonVariants.start}
            onClick={() => void generate()}
            disabled={!canGenerate}
          >
            리포트 보기
          </button>
        </div>
        {!canGenerate && (
          <p className={styles.guardMessage}>스펙을 먼저 불러와 주세요.</p>
        )}
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

// 타임라인 · DOM 캡처. 왼쪽 160px 고정 라벨 + 오른쪽 가로 스크롤 본체.
// 필름스트립과 lane marker가 같은 inner width 위에 놓여 x축이 자동 정렬된다.
//
// 디자인 원본은 pxPerSec=8 고정(292초 → 2336px)이지만 실제 녹화 길이에 따라
// 눈금 간격만 `pickTickInterval`로 조절한다. px/sec은 가독성 레퍼런스 그대로 둔다.

import type { CapturedEvent, RecordingSession } from "@/types/event.ts";
import type { ValidationResult } from "@/types/validation.ts";

import { formatTimelineTick, offsetSec } from "./format.ts";
import * as styles from "./timeline-chart.css.ts";

interface Props {
  session: RecordingSession;
  captured: CapturedEvent[];
  /** 필름스트립 썸네일 렌더 시 사용. 없으면 hatch 플레이스홀더로 대체. */
  screenshotDataUrls?: Record<string, string>;
  /** 각 captured event의 상태를 name 단위로 주입. 없으면 pass로 간주. */
  statusByEventName?: Map<string, ValidationResult["status"]>;
}

const PX_PER_SEC = 8;

type MarkerKind = "pass" | "warn" | "fail";

export function TimelineChart({
  session,
  captured,
  screenshotDataUrls,
  statusByEventName,
}: Props) {
  if (captured.length === 0) {
    return <div className={styles.empty}>녹화 중 수집된 이벤트가 없습니다.</div>;
  }

  const start = session.startedAt;
  const end = session.endedAt ?? Date.now();
  const totalSec = Math.max(1, Math.ceil((end - start) / 1000));
  const innerWidth = totalSec * PX_PER_SEC;

  const ticks = buildTicks(totalSec);
  const lanes = uniqueLanes(captured);

  return (
    <div className={styles.wrap}>
      <div className={styles.headerBar}>
        <div className={styles.headerTitle}>타임라인 · DOM 캡처</div>
        <div className={styles.headerMeta}>
          {captured.length}개 이벤트 · {formatTimelineTick(totalSec)}
        </div>
        <div className={styles.headerSpacer} />
        <div className={styles.legend} aria-label="상태 범례">
          <span className={styles.legendItem}>
            <span className={styles.legendDotKind.pass} aria-hidden="true" />
            Pass
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDotKind.warn} aria-hidden="true" />
            Warn
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDotKind.fail} aria-hidden="true" />
            Fail
          </span>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.labels} aria-hidden="true">
          <div className={styles.filmstripLabel}>캡처</div>
          <div className={styles.rulerLabel} />
          {lanes.map((l, i) => (
            <div
              key={l}
              className={
                i < lanes.length - 1
                  ? `${styles.laneLabel} ${styles.laneLabelDivider}`
                  : styles.laneLabel
              }
              title={l}
            >
              {l}
            </div>
          ))}
        </div>

        <div className={styles.scrollArea}>
          <div
            className={styles.timelineInner}
            style={{ width: `${innerWidth}px` }}
          >
            <div className={styles.tickLayer}>
              {ticks.map((t) => (
                <div
                  key={t}
                  className={styles.tickLine}
                  style={{ left: `${t * PX_PER_SEC}px` }}
                />
              ))}
            </div>

            <div className={styles.filmstrip}>
              {captured.map((ev) => {
                const sec = offsetSec(ev.timestamp, start);
                const kind = markerKindFor(ev, statusByEventName);
                const data = ev.screenshotId
                  ? screenshotDataUrls?.[ev.screenshotId]
                  : undefined;
                return (
                  <div
                    key={ev.id}
                    className={styles.thumb}
                    style={{ left: `${sec * PX_PER_SEC}px` }}
                    title={`${ev.eventName} @ ${formatTimelineTick(sec)}`}
                  >
                    {data ? (
                      <div className={styles.thumbImageReal}>
                        <img
                          className={styles.thumbImg}
                          src={data}
                          alt=""
                          loading="lazy"
                        />
                        <span
                          className={styles.thumbStatusDotKind[kind]}
                          aria-hidden="true"
                        />
                      </div>
                    ) : (
                      <div className={styles.thumbImage}>
                        <span
                          className={styles.thumbStatusDotKind[kind]}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                    <div className={styles.thumbCaption}>
                      {formatTimelineTick(sec)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.ruler}>
              {ticks.map((t) => (
                <div
                  key={t}
                  className={styles.rulerTick}
                  style={{ left: `${t * PX_PER_SEC}px` }}
                >
                  {formatTimelineTick(t)}
                </div>
              ))}
            </div>

            <div
              className={styles.lanes}
              style={{ height: `${lanes.length * 32}px` }}
            >
              {lanes.map((l, i) => (
                <div
                  key={l}
                  className={
                    i < lanes.length - 1
                      ? `${styles.laneRow} ${styles.laneRowDivider}`
                      : styles.laneRow
                  }
                  style={{ top: `${i * 32}px` }}
                />
              ))}
              {captured.map((ev) => {
                const laneIdx = lanes.indexOf(ev.eventName);
                if (laneIdx < 0) return null;
                const sec = offsetSec(ev.timestamp, start);
                const kind = markerKindFor(ev, statusByEventName);
                return (
                  <span
                    key={ev.id}
                    className={styles.markerKind[kind]}
                    style={{
                      top: `${laneIdx * 32 + 6}px`,
                      left: `${sec * PX_PER_SEC - 1.5}px`,
                    }}
                    title={`${ev.eventName} · ${formatTimelineTick(sec)}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function uniqueLanes(captured: CapturedEvent[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of captured) {
    if (!seen.has(c.eventName)) {
      seen.add(c.eventName);
      out.push(c.eventName);
    }
  }
  return out;
}

function markerKindFor(
  ev: CapturedEvent,
  byName: Props["statusByEventName"],
): MarkerKind {
  const status = byName?.get(ev.eventName);
  if (status === "fail") return "fail";
  if (status === "suspect_duplicate") return "warn";
  return "pass";
}

function buildTicks(totalSec: number): number[] {
  // 녹화 길이에 따른 눈금 간격. 디자인 원본(292s)은 30s 간격이었고, 더 긴 녹화에선
  // 라벨이 겹치지 않도록 간격을 늘린다.
  const interval = pickTickInterval(totalSec);
  const out: number[] = [];
  for (let t = 0; t < totalSec; t += interval) out.push(t);
  out.push(totalSec);
  return out;
}

function pickTickInterval(totalSec: number): number {
  if (totalSec <= 5 * 60) return 30;
  if (totalSec <= 20 * 60) return 120;
  return 300;
}

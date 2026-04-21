// 타임라인 · DOM 캡처. 왼쪽 160px 고정 라벨 + 오른쪽 가로 스크롤 본체.
// 필름스트립과 lane marker가 같은 inner width 위에 놓여 x축이 자동 정렬된다.
//
// 디자인 원본은 pxPerSec=8 고정(292초 → 2336px)이지만 실제 녹화 길이에 따라
// 눈금 간격만 `pickTickInterval`로 조절한다. px/sec은 가독성 레퍼런스 그대로 둔다.

import type { MouseEvent } from "react";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

import { canonicalEventName } from "@/shared/canonical-event-name.ts";
import type { CapturedEvent, RecordingSession } from "@/types/event.ts";
import type { ValidationResult } from "@/types/validation.ts";

import { formatClock, formatTimelineTick, offsetSec } from "./format.ts";
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

interface Preview {
  data: string;
  /** gtag 포맷(스펙 시트와 동일한 canonical 이름). */
  gtagName: string;
  /** 웹앱이 Amplitude에 쏜 원본 이벤트명(humanEventName 포맷). */
  rawName: string;
  timeLabel: string;
  /** 타겟의 viewport 기준 중앙 x. */
  anchorX: number;
  /** 타겟의 viewport 기준 top. */
  anchorTop: number;
  /** 타겟의 viewport 기준 bottom. */
  anchorBottom: number;
}

export function TimelineChart({
  session,
  captured,
  screenshotDataUrls,
  statusByEventName,
}: Props) {
  const [preview, setPreview] = useState<Preview | null>(null);

  const showPreview = useCallback(
    (e: MouseEvent<HTMLElement>, ev: CapturedEvent) => {
      const data = ev.screenshotId
        ? screenshotDataUrls?.[ev.screenshotId]
        : undefined;
      if (!data) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setPreview({
        data,
        gtagName: canonicalEventName(ev),
        rawName: ev.eventName,
        timeLabel: formatClock(ev.timestamp),
        anchorX: rect.left + rect.width / 2,
        anchorTop: rect.top,
        anchorBottom: rect.bottom,
      });
    },
    [screenshotDataUrls],
  );
  const hidePreview = useCallback(() => setPreview(null), []);

  if (captured.length === 0) {
    return (
      <div className={styles.empty}>녹화 중 수집된 이벤트가 없습니다.</div>
    );
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
                    title={`${canonicalEventName(ev)} (${ev.eventName}) @ ${formatTimelineTick(sec)}`}
                    onMouseEnter={(e) => showPreview(e, ev)}
                    onMouseLeave={hidePreview}
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
                    title={`${canonicalEventName(ev)} (${ev.eventName}) · ${formatTimelineTick(sec)}`}
                    onMouseEnter={(e) => showPreview(e, ev)}
                    onMouseLeave={hidePreview}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {preview && <ScreenshotPreview preview={preview} />}
    </div>
  );
}

/**
 * 호버된 타겟의 viewport 위치를 기준으로 스크린샷 프리뷰를 body에 portal 렌더.
 * 기본은 타겟 위쪽으로 띄우고, 상단에 공간이 부족하면 아래로 뒤집는다.
 */
function ScreenshotPreview({ preview }: { preview: Preview }) {
  const PREVIEW_WIDTH = 480;
  const GAP = 10;
  const flipBelow = preview.anchorTop < 320;
  const left = clamp(
    preview.anchorX - PREVIEW_WIDTH / 2,
    8,
    window.innerWidth - PREVIEW_WIDTH - 8,
  );
  const styleObj: React.CSSProperties = flipBelow
    ? { left, top: preview.anchorBottom + GAP }
    : {
        left,
        top: preview.anchorTop - GAP,
        transform: "translateY(-100%)",
      };
  return createPortal(
    <div className={styles.previewRoot} style={styleObj}>
      <img src={preview.data} alt="" className={styles.previewImg} />
      <div className={styles.previewCaption}>
        <div className={styles.previewNameGtag}>{preview.gtagName}</div>
        <div className={styles.previewNameRaw}>
          {preview.rawName} · {preview.timeLabel}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
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

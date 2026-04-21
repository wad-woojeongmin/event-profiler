// 타임라인 SVG — 이벤트 발생 시점을 점으로 찍고 500ms 내 중복 구간을 하이라이트.
//
// demo의 `demo/components/timeline-chart.tsx`를 레퍼런스로 포팅했고, SVG 자체는
// 텍스트·색만 vanilla-extract 토큰으로 맞췄다. props-only로 동작하며 Jotai/컨텍스트
// 의존이 없어 향후 renderToString 경로(Phase 2 다운로드)에서도 그대로 재사용 가능.

import type { CapturedEvent, RecordingSession } from "@/types/event.ts";

import * as styles from "./timeline-chart.css.ts";

interface Props {
  session: RecordingSession;
  captured: CapturedEvent[];
}

const WIDTH = 1000;
const HEIGHT = 220;
const PADDING_X = 140;
const PADDING_Y = 30;
const DUPLICATE_WINDOW_MS = 500;

export function TimelineChart({ session, captured }: Props) {
  const start = session.startedAt;
  const end = session.endedAt ?? Date.now();
  const span = Math.max(1000, end - start);

  const uniqueEventNames = Array.from(new Set(captured.map((c) => c.eventName)));
  const laneHeight =
    (HEIGHT - PADDING_Y * 2) / Math.max(1, uniqueEventNames.length);

  function xOf(t: number): number {
    const ratio = (t - start) / span;
    return PADDING_X + ratio * (WIDTH - PADDING_X - 20);
  }

  function laneOf(name: string): number {
    const idx = uniqueEventNames.indexOf(name);
    return PADDING_Y + idx * laneHeight + laneHeight / 2;
  }

  const duplicates = findDuplicates(captured);

  const tickIntervalMs = pickTickInterval(span);
  const tickCount = Math.floor(span / tickIntervalMs);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickIntervalMs);

  if (captured.length === 0) {
    return (
      <div className={styles.empty}>녹화 중 수집된 이벤트가 없습니다.</div>
    );
  }

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="녹화 타임라인"
      >
        {uniqueEventNames.map((name, i) => (
          <line
            key={name}
            x1={PADDING_X}
            x2={WIDTH - 20}
            y1={PADDING_Y + i * laneHeight + laneHeight / 2}
            y2={PADDING_Y + i * laneHeight + laneHeight / 2}
            className={styles.laneLine}
          />
        ))}

        {ticks.map((t) => {
          const x = xOf(start + t);
          const sec = Math.floor(t / 1000);
          return (
            <g key={t}>
              <line
                x1={x}
                x2={x}
                y1={PADDING_Y - 4}
                y2={HEIGHT - PADDING_Y + 4}
                className={styles.tickLine}
              />
              <text
                x={x}
                y={HEIGHT - 8}
                textAnchor="middle"
                className={styles.tickLabel}
              >
                {formatTick(sec)}
              </text>
            </g>
          );
        })}

        {captured.map((c) => {
          const isDup = duplicates.has(c.id);
          return (
            <circle
              key={c.id}
              cx={xOf(c.timestamp)}
              cy={laneOf(c.eventName)}
              r={isDup ? 6 : 4}
              className={isDup ? styles.dotDuplicate : styles.dotNormal}
            >
              <title>
                {c.eventName} @ {new Date(c.timestamp).toLocaleTimeString()}
              </title>
            </circle>
          );
        })}

        {uniqueEventNames.map((name, i) => (
          <text
            key={name}
            x={PADDING_X - 10}
            y={PADDING_Y + i * laneHeight + laneHeight / 2 + 4}
            textAnchor="end"
            className={styles.laneLabel}
          >
            {name.length > 28 ? name.slice(0, 26) + "…" : name}
          </text>
        ))}
      </svg>
    </div>
  );
}

function findDuplicates(captured: CapturedEvent[]): Set<string> {
  const byName = new Map<string, CapturedEvent[]>();
  for (const c of captured) {
    const list = byName.get(c.eventName) ?? [];
    list.push(c);
    byName.set(c.eventName, list);
  }
  const hits = new Set<string>();
  for (const list of byName.values()) {
    list.sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const curr = list[i];
      if (prev && curr && curr.timestamp - prev.timestamp <= DUPLICATE_WINDOW_MS) {
        hits.add(prev.id);
        hits.add(curr.id);
      }
    }
  }
  return hits;
}

// 녹화 길이에 따라 tick 간격을 조정. 5분 이하는 30초, 20분 이하는 2분, 그 이상은 5분.
function pickTickInterval(spanMs: number): number {
  if (spanMs <= 5 * 60_000) return 30_000;
  if (spanMs <= 20 * 60_000) return 120_000;
  return 300_000;
}

function formatTick(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  return ss === 0 ? `${mm}m` : `${mm}m${ss}s`;
}

import type { CapturedEvent } from "@/types/event.ts";
import type { RecordingSession } from "@/types/event.ts";

interface Props {
  session: RecordingSession;
  captured: CapturedEvent[];
}

const WIDTH = 1000;
const HEIGHT = 180;
const PADDING_X = 40;
const PADDING_Y = 30;

/** 간단한 타임라인 SVG — 이벤트 발생 시점을 점으로 찍고 500ms 내 중복 구간을 하이라이트. */
export function TimelineChart({ session, captured }: Props) {
  const start = session.startedAt;
  const end = session.endedAt ?? Date.now();
  const span = Math.max(1000, end - start);

  const uniqueEventNames = Array.from(new Set(captured.map((c) => c.eventName)));
  const laneHeight =
    (HEIGHT - PADDING_Y * 2) / Math.max(1, uniqueEventNames.length);

  function xOf(t: number): number {
    const ratio = (t - start) / span;
    return PADDING_X + ratio * (WIDTH - PADDING_X * 2);
  }

  function laneOf(name: string): number {
    const idx = uniqueEventNames.indexOf(name);
    return PADDING_Y + idx * laneHeight + laneHeight / 2;
  }

  // 500ms 이내 중복 이벤트 찾기
  const duplicates = new Set<string>();
  const byName = new Map<string, CapturedEvent[]>();
  for (const c of captured) {
    const list = byName.get(c.eventName) ?? [];
    list.push(c);
    byName.set(c.eventName, list);
  }
  for (const list of byName.values()) {
    list.sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const curr = list[i];
      if (prev && curr && curr.timestamp - prev.timestamp <= 500) {
        duplicates.add(prev.id);
        duplicates.add(curr.id);
      }
    }
  }

  // 시간 축 tick (30초 간격)
  const tickIntervalMs = 30_000;
  const tickCount = Math.floor(span / tickIntervalMs);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickIntervalMs);

  return (
    <div className="timeline-wrap">
      <svg
        className="timeline-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="녹화 타임라인"
      >
        {/* 가로 기준선 */}
        {uniqueEventNames.map((name, i) => (
          <line
            key={name}
            x1={PADDING_X}
            x2={WIDTH - PADDING_X}
            y1={PADDING_Y + i * laneHeight + laneHeight / 2}
            y2={PADDING_Y + i * laneHeight + laneHeight / 2}
            stroke="#e5e7eb"
            strokeDasharray="2 3"
          />
        ))}

        {/* 시간 tick */}
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
                stroke="#d1d5db"
              />
              <text
                x={x}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {sec}s
              </text>
            </g>
          );
        })}

        {/* 이벤트 점 */}
        {captured.map((c) => {
          const isDup = duplicates.has(c.id);
          return (
            <g key={c.id}>
              <circle
                cx={xOf(c.timestamp)}
                cy={laneOf(c.eventName)}
                r={isDup ? 6 : 4}
                fill={isDup ? "#d97706" : "#2563eb"}
                fillOpacity={isDup ? 0.85 : 0.7}
                stroke={isDup ? "#92400e" : "#1d4ed8"}
                strokeWidth={1}
              >
                <title>
                  {c.eventName} @ {new Date(c.timestamp).toLocaleTimeString()}
                </title>
              </circle>
            </g>
          );
        })}

        {/* 레인 라벨 */}
        {uniqueEventNames.map((name, i) => (
          <text
            key={name}
            x={PADDING_X - 6}
            y={PADDING_Y + i * laneHeight + laneHeight / 2 + 3}
            textAnchor="end"
            fontSize="10"
            fill="#374151"
          >
            {name.length > 28 ? name.slice(0, 26) + "…" : name}
          </text>
        ))}
      </svg>
    </div>
  );
}

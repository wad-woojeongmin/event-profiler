// Report — single variation (C-based, refined per feedback).
// - No side nav, no "recent" history (static export)
// - Filmstrip thumbnails align to the timeline x-axis, horizontal scroll
// - Pass/Warn/Fail colors use well-separated hues (see tokens)

const T3r = window.TOKENS;

function ReportPage({ width = 1200 }) {
  const [sel, setSel] = React.useState(4);
  return (
    <div style={{
      width, minHeight: 1400, background: T3r.bg, fontFamily: T3r.fontSans,
      color: T3r.text, fontSize: 13, borderRadius: 4, overflow: 'hidden',
      border: `1px solid ${T3r.border}`,
    }}>
      <TabBar/>
      <ReportHeader/>
      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BigStats/>
        <TimelineWithAlignedThumbs/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'flex-start' }}>
          <ValidationTable onSelect={setSel} selectedIdx={sel}/>
          <EventDetail idx={sel}/>
        </div>
        <ExceptionList/>
      </div>
    </div>
  );
}

function TabBar() {
  return (
    <div style={{
      background: '#dadce0', padding: '6px 10px 0',
      display: 'flex', alignItems: 'center', gap: 4,
      borderBottom: `1px solid ${T3r.border}`,
    }}>
      <div style={{
        padding: '6px 12px 8px', background: T3r.bg, borderRadius: '8px 8px 0 0',
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
        border: `1px solid ${T3r.border}`, borderBottom: 'none',
      }}>
        <div style={{ width: 12, height: 12, borderRadius: 2, background: T3r.text, display: 'grid', placeItems: 'center' }}>
          <svg width="7" height="7" viewBox="0 0 11 11" fill="#fff">
            <circle cx="3" cy="3" r="1.4"/><circle cx="8" cy="3" r="1.4" opacity=".5"/>
            <circle cx="3" cy="8" r="1.4" opacity=".5"/><circle cx="8" cy="8" r="1.4"/>
          </svg>
        </div>
        <span style={{ fontWeight: 500 }}>Event Profiler 리포트</span>
        <SvgIcon name="close" size={10}/>
      </div>
      <div style={{ padding: '6px 10px', display: 'grid', placeItems: 'center', color: '#5f6368' }}>
        <SvgIcon name="plus" size={12}/>
      </div>
    </div>
  );
}

// Aligned timeline — filmstrip and lanes share the exact same x-axis & width.
// Both panels live inside one horizontally-scrolling container.
function TimelineWithAlignedThumbs() {
  const total = 292;               // duration in seconds
  const pxPerSec = 8;              // controls overall width
  const innerWidth = total * pxPerSec; // 2336px — horizontal scroll
  const ticks = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, total];

  // Sample thumbnails at the times of the timeline events (first N)
  const thumbs = window.MOCK.MOCK_TIMELINE
    .slice()
    .sort((a,b) => a.t - b.t);

  return (
    <div style={{ background: T3r.surface, border: `1px solid ${T3r.border}`, borderRadius: T3r.r3, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T3r.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>타임라인 · DOM 캡처</div>
        <div style={{ fontSize: 11, color: T3r.textMuted }}>{window.MOCK.MOCK_TIMELINE.length}개 이벤트 · 4:52</div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10.5, color: T3r.textMuted }}>
          <LegendDot color={T3r.pass} label="Pass"/>
          <LegendDot color={T3r.warn} label="Warn"/>
          <LegendDot color={T3r.fail} label="Fail"/>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Lane labels — fixed (don't scroll) */}
        <div style={{ width: 160, borderRight: `1px solid ${T3r.divider}`, background: T3r.surfaceAlt, flexShrink: 0 }}>
          {/* Filmstrip row label */}
          <div style={{
            height: 84, display: 'flex', alignItems: 'center', padding: '0 12px',
            borderBottom: `1px solid ${T3r.divider}`,
            fontSize: 10, color: T3r.textMuted, fontWeight: 600,
            letterSpacing: 0.3, textTransform: 'uppercase',
          }}>캡처</div>
          {/* Ruler row label */}
          <div style={{
            height: 22, display: 'flex', alignItems: 'center', padding: '0 12px',
            borderBottom: `1px solid ${T3r.divider}`,
            fontSize: 10, color: T3r.textSubtle,
          }}/>
          {/* Lane labels */}
          {window.MOCK.LANES.map((l, i) => (
            <div key={l} style={{
              height: 32, display: 'flex', alignItems: 'center', padding: '0 12px',
              borderBottom: i < window.MOCK.LANES.length - 1 ? `1px solid ${T3r.divider}` : 'none',
              fontFamily: T3r.fontMono, fontSize: 10.5, fontWeight: 500, color: T3r.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{l}</div>
          ))}
        </div>

        {/* Right side — horizontally scrollable, contains both filmstrip & lanes
            inside the SAME width-controlled container so x positions align. */}
        <div className="ep-scroll" style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ width: innerWidth, position: 'relative' }}>
            {/* Vertical tick lines — span full height of both panels */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
              {ticks.map(t => (
                <div key={t} style={{
                  position: 'absolute', top: 0, bottom: 0, left: t * pxPerSec, width: 1,
                  background: T3r.divider,
                }}/>
              ))}
            </div>

            {/* Filmstrip — thumbnails positioned at the time of each event */}
            <div style={{
              height: 84, position: 'relative',
              borderBottom: `1px solid ${T3r.divider}`,
              background: T3r.surfaceAlt,
            }}>
              {thumbs.map((ev, i) => {
                const color = ev.status === 'pass' ? T3r.pass : ev.status === 'warn' ? T3r.warn : T3r.fail;
                const left = ev.t * pxPerSec;
                return (
                  <div key={i} style={{
                    position: 'absolute', top: 8, left, transform: 'translateX(-50%)',
                    width: 68,
                    border: `1px solid ${T3r.border}`, borderRadius: 3, overflow: 'hidden',
                    background: T3r.surface,
                  }}>
                    <div style={{
                      height: 42,
                      backgroundImage: `repeating-linear-gradient(135deg, ${T3r.border} 0 1px, transparent 1px 6px)`,
                      backgroundColor: T3r.surfaceAlt,
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', top: 3, left: 3,
                        width: 5, height: 5, borderRadius: 999, background: color,
                      }}/>
                    </div>
                    <div style={{
                      padding: '2px 4px', fontSize: 9, fontFamily: T3r.fontMono,
                      color: T3r.textSubtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      textAlign: 'center', lineHeight: 1.3,
                    }}>
                      {fmt(ev.t)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time ruler */}
            <div style={{ height: 22, position: 'relative', borderBottom: `1px solid ${T3r.divider}` }}>
              {ticks.map(t => (
                <div key={t} style={{
                  position: 'absolute', top: 4, left: t * pxPerSec, transform: 'translateX(-50%)',
                  fontSize: 9.5, color: T3r.textSubtle, fontFamily: T3r.fontMono,
                  fontVariantNumeric: 'tabular-nums',
                }}>{fmt(t)}</div>
              ))}
            </div>

            {/* Lanes area — markers at the same x positions */}
            <div style={{ position: 'relative', height: window.MOCK.LANES.length * 32 }}>
              {window.MOCK.LANES.map((l, i) => (
                <div key={l} style={{
                  position: 'absolute', left: 0, right: 0, top: i * 32, height: 32,
                  borderBottom: i < window.MOCK.LANES.length - 1 ? `1px solid ${T3r.divider}` : 'none',
                }}/>
              ))}
              {window.MOCK.MOCK_TIMELINE.map((ev, i) => {
                const lane = window.MOCK.LANES.indexOf(ev.lane);
                const isWarn = ev.status === 'warn';
                const isFail = ev.status === 'fail';
                const color = isFail ? T3r.fail : isWarn ? T3r.warn : T3r.pass;
                const left = ev.t * pxPerSec;
                return (
                  <div key={i} style={{
                    position: 'absolute',
                    top: lane * 32 + 6, height: 20,
                    left: left - 1.5, width: 3,
                    background: color, borderRadius: 1,
                  }} title={`${ev.lane} · ${fmt(ev.t)}`}/>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmt(sec) {
  if (sec === 0) return '0s';
  if (sec >= 60) {
    const m = Math.floor(sec/60); const r = sec % 60;
    return r ? `${m}m${r}s` : `${m}m`;
  }
  return `${sec}s`;
}

Object.assign(window, { ReportPage });

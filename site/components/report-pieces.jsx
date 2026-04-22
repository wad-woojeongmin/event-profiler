// Screen 3 — Report (new tab, wide layout). Three variations.

const T3 = window.TOKENS;

// ─── Shared report pieces ─────────────────────────────────────

function ReportHeader({ compact }) {
  return (
    <div style={{
      padding: compact ? '16px 20px' : '20px 28px',
      background: T3.surface, borderBottom: `1px solid ${T3.border}`,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: T3.text, display: 'grid', placeItems: 'center', color: '#fff' }}>
        <svg width="18" height="18" viewBox="0 0 11 11" fill="currentColor">
          <circle cx="3" cy="3" r="1.4"/><circle cx="8" cy="3" r="1.4" opacity=".5"/>
          <circle cx="3" cy="8" r="1.4" opacity=".5"/><circle cx="8" cy="8" r="1.4"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3 }}>Event Profiler 리포트</div>
        <div style={{ fontSize: 12, color: T3.textMuted, fontFamily: T3.fontMono, marginTop: 2 }}>
          2026.04.21 · 16:34:42 · beta4-app.catchtable.co.kr
        </div>
      </div>
      <div style={{ flex: 1 }}/>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <MetaCol label="녹화 시간" value="4:52" mono/>
        <MetaCol label="대상 스펙" value="5"/>
        <MetaCol label="총 수집" value="201"/>
        <div style={{ width: 1, height: 32, background: T3.border }}/>
        <Btn size="sm" leading={<SvgIcon name="download" size={11}/>}>내보내기</Btn>
        <Btn size="sm" variant="primary" leading={<SvgIcon name="copy" size={11}/>}>공유</Btn>
      </div>
    </div>
  );
}

function MetaCol({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T3.textMuted, fontWeight: 500, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: mono ? T3.fontMono : T3.fontSans, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3 }}>{value}</div>
    </div>
  );
}

function BigStats() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      <BigStat label="Pass" value={4} kind="pass" pct={80}/>
      <BigStat label="Fail" value={0} kind="fail"/>
      <BigStat label="중복 의심" value={0} kind="warn"/>
      <BigStat label="미수집" value={1} kind="missing" pct={20}/>
    </div>
  );
}

function BigStat({ label, value, kind, pct }) {
  const colorMap = {
    pass: { bar: T3.pass, text: T3.passText, soft: T3.passSoft },
    fail: { bar: T3.fail, text: T3.failText, soft: T3.failSoft },
    warn: { bar: T3.warn, text: T3.warnText, soft: T3.warnSoft },
    missing: { bar: T3.missing, text: T3.textMuted, soft: T3.missingSoft },
  }[kind];
  return (
    <div style={{
      background: T3.surface, border: `1px solid ${T3.border}`, borderRadius: T3.r3,
      padding: 16, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: 999, background: colorMap.bar }}/>
        <div style={{ fontSize: 11, fontWeight: 600, color: colorMap.text, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</div>
      </div>
      <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1.2, fontVariantNumeric: 'tabular-nums',
        color: value > 0 ? T3.text : T3.textMuted }}>{value}</div>
      {pct != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <div style={{ flex: 1, height: 3, background: T3.surfaceAlt, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: colorMap.bar }}/>
          </div>
          <div style={{ fontSize: 11, color: T3.textMuted, fontVariantNumeric: 'tabular-nums' }}>{pct}%</div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline — two styles ────────────────────────────────────

function TimelineLanes({ style = 'dots' }) {
  const total = 292;
  const ticks = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270];
  return (
    <div style={{ background: T3.surface, border: `1px solid ${T3.border}`, borderRadius: T3.r3, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T3.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>타임라인</div>
        <div style={{ fontSize: 11, color: T3.textMuted }}>{window.MOCK.MOCK_TIMELINE.length}개 이벤트 · 4:52</div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10.5, color: T3.textMuted }}>
          <LegendDot color={T3.pass} label="Pass"/>
          <LegendDot color={T3.warn} label="Warn"/>
          <LegendDot color={T3.fail} label="Fail"/>
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 160, borderRight: `1px solid ${T3.divider}`, background: T3.surfaceAlt }}>
          {window.MOCK.LANES.map((l, i) => (
            <div key={l} style={{
              height: 36, display: 'flex', alignItems: 'center', padding: '0 12px',
              borderBottom: i < window.MOCK.LANES.length - 1 ? `1px solid ${T3.divider}` : 'none',
              fontFamily: T3.fontMono, fontSize: 11, fontWeight: 500, color: T3.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{l}</div>
          ))}
        </div>
        <div style={{ flex: 1, position: 'relative', minHeight: window.MOCK.LANES.length * 36 }}>
          {/* Time ruler */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {ticks.map(t => (
              <div key={t} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(t/total)*100}%`, width: 1, background: T3.divider }}/>
            ))}
          </div>
          {/* Lanes background */}
          {window.MOCK.LANES.map((l, i) => (
            <div key={l} style={{
              position: 'absolute', left: 0, right: 0, top: i * 36, height: 36,
              borderBottom: i < window.MOCK.LANES.length - 1 ? `1px solid ${T3.divider}` : 'none',
            }}/>
          ))}
          {/* Markers */}
          {window.MOCK.MOCK_TIMELINE.map((ev, i) => {
            const lane = window.MOCK.LANES.indexOf(ev.lane);
            const color = ev.status === 'pass' ? T3.pass : ev.status === 'warn' ? T3.warn : T3.fail;
            const left = `${(ev.t/total)*100}%`;
            if (style === 'bars') {
              return (
                <div key={i} style={{
                  position: 'absolute', top: lane * 36 + 11, left, width: 3, height: 14,
                  background: color, borderRadius: 1.5,
                }}/>
              );
            }
            return (
              <div key={i} style={{
                position: 'absolute', top: lane * 36 + 12, left,
                width: 12, height: 12, marginLeft: -6,
                borderRadius: 999, background: color,
                border: `2px solid ${T3.surface}`, boxShadow: '0 0 0 1px ' + color,
              }} title={`${ev.lane} @ ${ev.t}s`}/>
            );
          })}
          {/* Time labels */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: -20, height: 20, display: 'flex' }}>
            {ticks.map(t => (
              <div key={t} style={{
                position: 'absolute', left: `${(t/total)*100}%`, transform: 'translateX(-50%)',
                fontSize: 10, color: T3.textSubtle, fontFamily: T3.fontMono, fontVariantNumeric: 'tabular-nums',
              }}>{t === 0 ? '0s' : t >= 60 ? `${Math.floor(t/60)}m${t%60 ? (t%60)+'s' : ''}` : `${t}s`}</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 24 }}/>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: color }}/>{label}
    </span>
  );
}

// ─── Timeline with inline thumbnails ──────────────────────────
function TimelineWithThumbs() {
  const samples = window.MOCK.MOCK_TIMELINE.slice(0, 8);
  return (
    <div style={{ background: T3.surface, border: `1px solid ${T3.border}`, borderRadius: T3.r3, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T3.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>타임라인 · 스크린샷</div>
        <div style={{ flex: 1 }}/>
        <Btn size="sm" leading={<SvgIcon name="camera" size={11}/>}>모든 캡처 보기</Btn>
      </div>
      <div style={{ padding: '16px 16px 20px', overflowX: 'auto' }} className="ep-scroll">
        <div style={{ display: 'flex', gap: 10, minWidth: 'max-content' }}>
          {samples.map((ev, i) => {
            const color = ev.status === 'pass' ? T3.pass : ev.status === 'warn' ? T3.warn : T3.fail;
            return (
              <div key={i} style={{
                width: 140, border: `1px solid ${T3.border}`, borderRadius: T3.r2, overflow: 'hidden',
                background: T3.surfaceAlt,
              }}>
                <ThumbPlaceholder label={`dom capture @ ${ev.t}s`}/>
                <div style={{ padding: '6px 8px', background: T3.surface, borderTop: `1px solid ${T3.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <div style={{ width: 5, height: 5, borderRadius: 999, background: color }}/>
                    <div style={{ fontSize: 10, fontFamily: T3.fontMono, color: T3.textSubtle }}>{ev.t}s</div>
                  </div>
                  <div style={{ fontSize: 10.5, fontFamily: T3.fontMono, fontWeight: 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.lane.replace('__', '_')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ThumbPlaceholder({ label }) {
  return (
    <div style={{
      height: 90,
      backgroundImage: `repeating-linear-gradient(135deg, ${T3.border} 0 1px, transparent 1px 8px)`,
      backgroundColor: T3.surfaceAlt,
      display: 'grid', placeItems: 'center',
      fontFamily: T3.fontMono, fontSize: 9.5, color: T3.textSubtle, letterSpacing: -0.1,
      textAlign: 'center', padding: 4,
    }}>{label}</div>
  );
}

// ─── Validation results table ─────────────────────────────────
function ValidationTable({ onSelect, selectedIdx }) {
  return (
    <div style={{ background: T3.surface, border: `1px solid ${T3.border}`, borderRadius: T3.r3, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T3.divider}`, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>검증 결과</div>
        <div style={{ fontSize: 11, color: T3.textMuted, marginLeft: 8 }}>{window.MOCK.MOCK_SELECTED.length}개</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: T3.surfaceAlt }}>
            <HeadCell style={{ width: 80 }}>상태</HeadCell>
            <HeadCell>이벤트명</HeadCell>
            <HeadCell style={{ width: 100 }}>페이지</HeadCell>
            <HeadCell style={{ width: 70, textAlign: 'right' }}>수집</HeadCell>
            <HeadCell style={{ width: 70, textAlign: 'right' }}>이슈</HeadCell>
            <HeadCell style={{ width: 30 }}/>
          </tr>
        </thead>
        <tbody>
          {window.MOCK.MOCK_SELECTED.map((e, i) => (
            <tr key={e.full} className="ep-row ep-focus"
              tabIndex={0}
              aria-selected={selectedIdx === i}
              aria-label={`${e.full} 상세 보기`}
              onClick={() => onSelect && onSelect(i)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  onSelect && onSelect(i);
                }
              }}
              style={{
                cursor: 'pointer', borderTop: `1px solid ${T3.divider}`,
                background: selectedIdx === i ? T3.blueSoft : 'transparent',
              }}>
              <td style={{ padding: '10px 16px' }}><StatusPill kind={e.status} size="sm"/></td>
              <td style={{ padding: '10px 16px' }}>
                <EventName name={e.name} size={12} weight={600}/>
                <div style={{ fontSize: 10.5, color: T3.textSubtle, fontFamily: T3.fontMono, marginTop: 1 }}>{e.full}</div>
              </td>
              <td style={{ padding: '10px 16px', fontSize: 11, color: T3.textMuted, fontFamily: T3.fontMono }}>{e.page}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {e.count}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                {e.issues > 0 ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: T3.failText, fontVariantNumeric: 'tabular-nums' }}>{e.issues}</span>
                ) : (
                  <span style={{ fontSize: 11, color: T3.textSubtle }}>—</span>
                )}
              </td>
              <td style={{ padding: '10px 10px', color: T3.textSubtle }}><SvgIcon name="forward" size={11}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeadCell({ children, style = {} }) {
  return (
    <th style={{
      padding: '9px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 600,
      color: T3.textMuted, letterSpacing: 0.3, textTransform: 'uppercase',
      borderBottom: `1px solid ${T3.divider}`,
      ...style,
    }}>{children}</th>
  );
}

// ─── Detail panel ─────────────────────────────────────────────
function EventDetail({ idx = 4 }) {
  const e = window.MOCK.MOCK_SELECTED[idx] || window.MOCK.MOCK_SELECTED[4];
  const logs = [
    { t: '04:31:08', params: { shopId: '48291', shopRef: 'list', position: 2 }, issue: 'extra' },
  ];
  return (
    <div style={{ background: T3.surface, border: `1px solid ${T3.border}`, borderRadius: T3.r3, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T3.divider}`,
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusPill kind={e.status} size="sm"/>
        <EventName name={e.name} size={13} weight={600}/>
        <div style={{ flex: 1 }}/>
        <div style={{ fontSize: 11, color: T3.textSubtle, fontFamily: T3.fontMono }}>{e.full}</div>
      </div>

      {e.note && (
        <div style={{
          padding: '10px 16px', background: T3.warnSoft, borderBottom: `1px solid ${T3.divider}`,
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <div style={{ color: T3.warnText, marginTop: 2 }}><SvgIcon name="alert" size={12}/></div>
          <div style={{ fontSize: 12, color: T3.warnText, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>이슈 2건</div>
            <div>• 파라미터 <code style={{ fontFamily: T3.fontMono, background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3 }}>shopRef</code>가 스펙에 선언되지 않았습니다.</div>
            <div>• 필수 파라미터 <code style={{ fontFamily: T3.fontMono, background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3 }}>source</code> 누락.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <DetailCol title="스펙 (expected)" mono>
          <SpecLine k="event" v={e.full}/>
          <SpecLine k="shopId" v="number · required"/>
          <SpecLine k="source" v="string · required" missing/>
          <SpecLine k="position" v="number · optional"/>
        </DetailCol>
        <DetailCol title="수집됨 (actual)" mono right>
          <SpecLine k="event" v={e.full}/>
          <SpecLine k="shopId" v="48291"/>
          <SpecLine k="position" v="2"/>
          <SpecLine k="shopRef" v='"list"' extra/>
        </DetailCol>
      </div>

      <div style={{ borderTop: `1px solid ${T3.divider}`, padding: '10px 16px', background: T3.surfaceAlt }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: T3.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8 }}>
          수집 로그 · {e.count}건
        </div>
        {Array.from({ length: e.count }).map((_, i) => (
          <div key={i} style={{
            padding: '6px 8px', background: T3.surface, borderRadius: T3.r2,
            border: `1px solid ${T3.border}`, marginBottom: 4,
            fontFamily: T3.fontMono, fontSize: 11,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ color: T3.textSubtle }}>{`04:3${i+1}:08`}</span>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {`shopId=48291 shopRef="list" position=2`}
            </span>
            <StatusPill kind="warn" size="sm">+1</StatusPill>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailCol({ title, children, mono, right }) {
  return (
    <div style={{ padding: '12px 16px', borderRight: right ? 'none' : `1px solid ${T3.divider}` }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: T3.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontFamily: mono ? T3.fontMono : T3.fontSans, fontSize: 11.5 }}>{children}</div>
    </div>
  );
}

function SpecLine({ k, v, missing, extra }) {
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '3px 0', alignItems: 'baseline',
      color: missing ? T3.failText : extra ? T3.warnText : T3.text,
    }}>
      <span style={{ minWidth: 70, color: T3.textMuted }}>{k}</span>
      <span style={{ flex: 1, wordBreak: 'break-all' }}>{v}</span>
      {missing && <span style={{ fontSize: 10, color: T3.failText, fontWeight: 600 }}>MISSING</span>}
      {extra && <span style={{ fontSize: 10, color: T3.warnText, fontWeight: 600 }}>EXTRA</span>}
    </div>
  );
}

// ─── Exception panel ──────────────────────────────────────────
function ExceptionList({ collapsed }) {
  const [expanded, setExpanded] = React.useState(!collapsed);
  return (
    <div style={{ background: T3.surface, border: `1px solid ${T3.border}`, borderRadius: T3.r3, overflow: 'hidden' }}>
      <button className="ep-btn" onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', padding: '12px 16px', background: 'transparent',
          display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
        <SvgIcon name="chevron" size={12}/>
        <div style={{ fontSize: 12, fontWeight: 600 }}>예외 이벤트</div>
        <div style={{ fontSize: 11, color: T3.textMuted }}>{window.MOCK.MOCK_EXCEPTIONS.length + 174}건</div>
        <div style={{ flex: 1 }}/>
        <div style={{ fontSize: 10.5, color: T3.textSubtle }}>선택 스펙에 없지만 수집된 이벤트</div>
      </button>
      {expanded && (
        <div style={{ borderTop: `1px solid ${T3.divider}`, maxHeight: 360, overflow: 'auto' }} className="ep-scroll">
          {window.MOCK.MOCK_EXCEPTIONS.map((e, i) => (
            <div key={i} style={{
              padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i < window.MOCK.MOCK_EXCEPTIONS.length - 1 ? `1px solid ${T3.divider}` : 'none',
              fontFamily: T3.fontMono, fontSize: 11.5,
            }}>
              <span style={{ color: T3.textSubtle, fontVariantNumeric: 'tabular-nums' }}>{e.time}</span>
              <span style={{ flex: 1, color: T3.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
              <span style={{ color: T3.textMuted, fontSize: 10.5 }}>{e.page}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  ReportHeader, BigStats, TimelineLanes, TimelineWithThumbs,
  ValidationTable, EventDetail, ExceptionList, LegendDot,
});

// Screen 2 — Recording in progress. Live stream + event status.

const T2 = window.TOKENS;

function Screen2Recording({ onStop, onBack, width = 400, density = 'normal' }) {
  const [elapsed, setElapsed] = React.useState(292); // 4:52
  const [counts, setCounts] = React.useState({ total: 201, pass: 4, fail: 0, warn: 0, missing: 1 });
  React.useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <SidebarFrame width={width} height={720}>
      {/* Recording header */}
      <div style={{
        padding: '10px 12px', background: T2.surface,
        borderBottom: `1px solid ${T2.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <LiveDot/>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: T2.fail }}>
          REC
        </div>
        <div style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', fontFamily: T2.fontMono, fontWeight: 600, letterSpacing: -0.3 }}>
          {fmt(elapsed)}
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ fontSize: 11, color: T2.textMuted }}>
          시작 <span style={{ fontFamily: T2.fontMono, color: T2.text }}>04:29:42</span>
        </div>
      </div>

      {/* Counter strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        borderBottom: `1px solid ${T2.border}`, background: T2.surface,
      }}>
        <CountCell label="총 수집" value={counts.total} main/>
        <CountCell label="PASS" value={counts.pass} kind="pass"/>
        <CountCell label="FAIL" value={counts.fail} kind="fail"/>
        <CountCell label="중복" value={counts.warn} kind="warn"/>
        <CountCell label="미수집" value={counts.missing} kind="missing" last/>
      </div>

      {/* Spec status list */}
      <div style={{ borderBottom: `1px solid ${T2.border}`, maxHeight: 220, display: 'flex', flexDirection: 'column' }}>
        <SectionHeader title="선택 이벤트 상태" count={window.MOCK.MOCK_SELECTED.length}/>
        <div className="ep-scroll" style={{ overflow: 'auto' }}>
          {window.MOCK.MOCK_SELECTED.map(e => (
            <SpecStatusRow key={e.full} e={e} density={density}/>
          ))}
        </div>
      </div>

      {/* Live stream */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <SectionHeader title="실시간 스트림"
          right={<div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T2.textMuted }}>
            <LiveDot size={5}/> live
          </div>}
        />
        <div className="ep-scroll" style={{ flex: 1, overflow: 'auto' }}>
          {window.MOCK.MOCK_STREAM.map((ev, i) => (
            <StreamRow key={i} ev={ev} fresh={i === 0}/>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${T2.border}`, padding: 10, background: T2.surface,
        display: 'flex', gap: 8,
      }}>
        <Btn size="md" onClick={onBack} style={{ flex: 1 }}>
          다시 선택
        </Btn>
        <Btn size="md" variant="primary" onClick={onStop} style={{ flex: 2, background: T2.fail }}
          leading={<SvgIcon name="stop" size={10}/>}>
          녹화 종료 · 리포트 보기
        </Btn>
      </div>
    </SidebarFrame>
  );
}

function CountCell({ label, value, kind = 'neutral', main, last }) {
  const colorMap = {
    neutral: T2.text, pass: T2.passText, fail: value > 0 ? T2.failText : T2.textMuted,
    warn: value > 0 ? T2.warnText : T2.textMuted, missing: value > 0 ? T2.warnText : T2.textMuted,
  };
  return (
    <div style={{
      padding: '10px 10px', borderRight: last ? 'none' : `1px solid ${T2.divider}`,
      background: main ? T2.surfaceAlt : 'transparent',
    }}>
      <div style={{ fontSize: 10, color: T2.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{
        fontSize: main ? 20 : 18, fontWeight: 600, letterSpacing: -0.5,
        color: colorMap[kind], fontVariantNumeric: 'tabular-nums', marginTop: 1,
      }}>{value}</div>
    </div>
  );
}

function SpecStatusRow({ e, density }) {
  const tight = density === 'compact';
  return (
    <div style={{
      padding: tight ? '6px 12px' : '9px 12px',
      borderBottom: `1px solid ${T2.divider}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <StatusPill kind={e.status} size="sm"/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <EventName name={e.name} size={12} weight={600}/>
        <div style={{
          fontSize: 10.5, color: T2.textSubtle, fontFamily: T2.fontMono,
          marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <span style={{ color: T2.textMuted }}>{e.page}</span> · {e.full}
        </div>
        {e.note && !tight && (
          <div style={{
            fontSize: 11, color: T2.warnText, marginTop: 4,
            padding: '3px 6px', background: T2.warnSoft, borderRadius: 4,
            fontFamily: T2.fontMono,
          }}>{e.note}</div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: e.status === 'missing' ? T2.textMuted : T2.text,
        }}>{e.count}</div>
        <div style={{ fontSize: 10, color: T2.textSubtle }}>수집</div>
      </div>
    </div>
  );
}

function StreamRow({ ev, fresh }) {
  const statusColor = {
    pass: T2.pass, warn: T2.warn, fail: T2.fail, exception: T2.textSubtle,
  }[ev.status];
  const paramStr = Object.entries(ev.params).map(([k,v]) => `${k}=${v}`).join(' ');
  return (
    <div style={{
      padding: '6px 12px', display: 'flex', alignItems: 'flex-start', gap: 10,
      borderBottom: `1px solid ${T2.divider}`,
      animation: fresh ? 'ep-slidein .25s ease-out' : 'none',
      background: fresh ? T2.blueSoft : 'transparent',
      transition: 'background .6s',
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: 999, background: statusColor,
        marginTop: 6, flexShrink: 0,
      }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 1 }}>
          <span style={{ fontFamily: T2.fontMono, fontSize: 10.5, color: T2.textSubtle, letterSpacing: -0.2 }}>
            {ev.t}
          </span>
          {ev.status === 'exception' && (
            <span style={{ fontSize: 10, color: T2.textSubtle, fontStyle: 'italic' }}>예외</span>
          )}
        </div>
        <div style={{ fontFamily: T2.fontMono, fontSize: 11.5, fontWeight: 500,
          color: ev.status === 'exception' ? T2.textMuted : T2.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ev.name}
        </div>
        {paramStr && (
          <div style={{
            fontFamily: T2.fontMono, fontSize: 10.5, color: T2.textSubtle,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1,
          }}>{paramStr}</div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Screen2Recording });

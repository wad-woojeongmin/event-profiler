// Shared small UI primitives for Event Profiler screens.

const Tp = window.TOKENS;

// ─── Chrome sidebar frame ─────────────────────────────────────
function SidebarFrame({ width = 400, height = 720, children }) {
  return (
    <div style={{
      width, height, background: Tp.bg, display: 'flex', flexDirection: 'column',
      fontFamily: Tp.fontSans, color: Tp.text, fontSize: 13, lineHeight: 1.5,
      borderLeft: `1px solid ${Tp.border}`,
      position: 'relative', overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function EPLogo() {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: 4, background: Tp.text,
      display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10, fontWeight: 700,
      letterSpacing: -0.5,
    }}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <circle cx="3" cy="3" r="1.4" fill="currentColor"/>
        <circle cx="8" cy="3" r="1.4" fill="currentColor" opacity=".5"/>
        <circle cx="3" cy="8" r="1.4" fill="currentColor" opacity=".5"/>
        <circle cx="8" cy="8" r="1.4" fill="currentColor"/>
      </svg>
    </div>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <button className="ep-btn" onClick={onClick} title={title}
      style={{ width: 22, height: 22, borderRadius: 4, background: 'transparent',
        display: 'grid', placeItems: 'center', color: 'inherit' }}
      onMouseEnter={e => e.currentTarget.style.background = Tp.hover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >{children}</button>
  );
}

// ─── SVG Icons ───────────────────────────────────────────────
function SvgIcon({ name, size = 14 }) {
  const stroke = "currentColor";
  const props = { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case 'pin':    return <svg {...props}><path d="M8 2v5l2 2v1H6v-1l2-2V2M8 10v4"/></svg>;
    case 'more':   return <svg {...props}><circle cx="3" cy="8" r=".8" fill={stroke}/><circle cx="8" cy="8" r=".8" fill={stroke}/><circle cx="13" cy="8" r=".8" fill={stroke}/></svg>;
    case 'close':  return <svg {...props}><path d="M4 4l8 8M12 4l-8 8"/></svg>;
    case 'check':  return <svg {...props}><path d="M3 8.5l3 3 7-7"/></svg>;
    case 'plus':   return <svg {...props}><path d="M8 3v10M3 8h10"/></svg>;
    case 'minus':  return <svg {...props}><path d="M3 8h10"/></svg>;
    case 'x':      return <svg {...props}><path d="M4 4l8 8M12 4l-8 8"/></svg>;
    case 'search': return <svg {...props}><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>;
    case 'sheet':  return <svg {...props}><rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M2.5 6.5h11M2.5 10h11M6 2.5v11"/></svg>;
    case 'link':   return <svg {...props}><path d="M7 9a2 2 0 002.8 0l2.5-2.5a2 2 0 10-2.8-2.8L8 5M9 7a2 2 0 00-2.8 0L3.7 9.5a2 2 0 102.8 2.8L8 11"/></svg>;
    case 'google': return <svg width={size} height={size} viewBox="0 0 16 16"><path fill="#4285F4" d="M15.5 8.2c0-.5 0-1-.1-1.5H8v2.9h4.2c-.2 1-.7 1.8-1.5 2.3v2h2.4c1.4-1.3 2.2-3.2 2.2-5.4z"/><path fill="#34A853" d="M8 16c2 0 3.8-.7 5-1.8l-2.4-2c-.7.5-1.5.7-2.6.7-2 0-3.7-1.4-4.3-3.2H1.2v2.1C2.4 14.2 5 16 8 16z"/><path fill="#FBBC04" d="M3.7 9.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7v-2H1.2C.4 5.6 0 6.7 0 8s.4 2.4 1.2 3.7l2.5-2z"/><path fill="#EA4335" d="M8 3.2c1.1 0 2.1.4 2.9 1.1l2.1-2.1C11.8.8 10 0 8 0 5 0 2.4 1.8 1.2 4.3l2.5 2C4.3 4.6 6 3.2 8 3.2z"/></svg>;
    case 'record': return <svg {...props}><circle cx="8" cy="8" r="3" fill={stroke}/></svg>;
    case 'stop':   return <svg {...props}><rect x="5" y="5" width="6" height="6" rx="1" fill={stroke} stroke="none"/></svg>;
    case 'back':   return <svg {...props}><path d="M10 3L5 8l5 5"/></svg>;
    case 'forward':return <svg {...props}><path d="M6 3l5 5-5 5"/></svg>;
    case 'chevron':return <svg {...props}><path d="M4 6l4 4 4-4"/></svg>;
    case 'eye':    return <svg {...props}><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="1.8"/></svg>;
    case 'alert':  return <svg {...props}><path d="M8 1.5L14.5 13H1.5L8 1.5z"/><path d="M8 6v3M8 11.2v.3" strokeLinecap="round"/></svg>;
    case 'info':   return <svg {...props}><circle cx="8" cy="8" r="6"/><path d="M8 11V7M8 5.5v.1"/></svg>;
    case 'copy':   return <svg {...props}><rect x="5" y="5" width="8" height="8" rx="1"/><path d="M3 11V4a1 1 0 011-1h7"/></svg>;
    case 'filter': return <svg {...props}><path d="M2 3h12l-4.5 6v4l-3 1v-5L2 3z"/></svg>;
    case 'camera': return <svg {...props}><rect x="1.5" y="4" width="13" height="9" rx="1.5"/><circle cx="8" cy="8.5" r="2.5"/><path d="M5 4l1-1.5h4L11 4"/></svg>;
    case 'download': return <svg {...props}><path d="M8 2v8M4 7l4 4 4-4M2 13h12"/></svg>;
    case 'external': return <svg {...props}><path d="M9 2h5v5M14 2L8 8M12 9v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4"/></svg>;
    case 'refresh': return <svg {...props}><path d="M13 8A5 5 0 108 13M13 3v4h-4"/></svg>;
    default:       return null;
  }
}

// ─── Buttons ──────────────────────────────────────────────────
function Btn({ variant = 'default', size = 'md', children, onClick, style = {}, leading, disabled, full }) {
  const sizes = { sm: { h: 26, px: 8, fs: 12 }, md: { h: 32, px: 12, fs: 13 }, lg: { h: 40, px: 16, fs: 14 } };
  const s = sizes[size];
  const variants = {
    primary: { bg: Tp.blue, color: '#fff', border: 'transparent', hover: 'oklch(50% 0.16 255)' },
    default: { bg: Tp.surface, color: Tp.text, border: Tp.border, hover: Tp.hover },
    ghost:   { bg: 'transparent', color: Tp.text, border: 'transparent', hover: Tp.hover },
    danger:  { bg: Tp.surface, color: Tp.failText, border: Tp.border, hover: Tp.failSoft },
  };
  const v = variants[variant];
  const [hover, setHover] = React.useState(false);
  return (
    <button disabled={disabled} onClick={onClick} className="ep-btn ep-focus"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        height: s.h, padding: `0 ${s.px}px`, fontSize: s.fs, fontWeight: 500,
        background: disabled ? Tp.surfaceAlt : (hover ? v.hover : v.bg),
        color: disabled ? Tp.textSubtle : v.color,
        border: `1px solid ${v.border}`,
        borderRadius: Tp.r2,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        width: full ? '100%' : 'auto',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}>
      {leading}{children}
    </button>
  );
}

// ─── Status badges / pills ────────────────────────────────────
function StatusPill({ kind, children, size = 'md' }) {
  const map = {
    pass:    { bg: Tp.passSoft, color: Tp.passText, dot: Tp.pass, label: 'Pass' },
    fail:    { bg: Tp.failSoft, color: Tp.failText, dot: Tp.fail, label: 'Fail' },
    warn:    { bg: Tp.warnSoft, color: Tp.warnText, dot: Tp.warn, label: 'Warn' },
    dup:     { bg: Tp.warnSoft, color: Tp.warnText, dot: Tp.warn, label: 'Dup' },
    missing: { bg: Tp.missingSoft, color: Tp.textMuted, dot: Tp.missing, label: 'Missing' },
    info:    { bg: Tp.blueSoft, color: Tp.blueText, dot: Tp.blue, label: 'Info' },
  };
  const c = map[kind] || map.info;
  const dims = size === 'sm' ? { fs: 10.5, px: 5, h: 16, dot: 5 } : { fs: 11, px: 6, h: 18, dot: 6 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: dims.h, padding: `0 ${dims.px + 1}px 0 ${dims.px}px`,
      background: c.bg, color: c.color,
      borderRadius: 999, fontSize: dims.fs, fontWeight: 600,
      letterSpacing: 0.1, fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: dims.dot, height: dims.dot, borderRadius: 999, background: c.dot, flexShrink: 0 }}/>
      {children || c.label}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────
function Card({ children, style = {}, padding = 0 }) {
  return (
    <div style={{
      background: Tp.surface, border: `1px solid ${Tp.border}`,
      borderRadius: Tp.r3, boxShadow: Tp.shadow1,
      padding, ...style,
    }}>{children}</div>
  );
}

// ─── Metric stat — compact version for sidebar, roomy for report ─
function Stat({ label, value, unit, kind = 'neutral', trend }) {
  const kinds = {
    neutral: { c: Tp.text, accent: Tp.border },
    pass: { c: Tp.passText, accent: Tp.pass },
    fail: { c: Tp.failText, accent: Tp.fail },
    warn: { c: Tp.warnText, accent: Tp.warn },
    missing: { c: Tp.textMuted, accent: Tp.missing },
  };
  const k = kinds[kind];
  return (
    <div style={{
      padding: '10px 12px', background: Tp.surface, border: `1px solid ${Tp.border}`,
      borderLeft: `3px solid ${k.accent}`, borderRadius: Tp.r2, minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: Tp.textMuted, fontWeight: 500, letterSpacing: 0.2, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: k.c, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>{value}</div>
        {unit && <div style={{ fontSize: 11, color: Tp.textMuted, fontWeight: 500 }}>{unit}</div>}
        {trend && <div style={{ fontSize: 10.5, color: Tp.textSubtle, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{trend}</div>}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────
function SectionHeader({ title, count, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderBottom: `1px solid ${Tp.divider}`,
      background: Tp.surfaceAlt,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: Tp.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' }}>{title}</div>
      {count != null && <div style={{ fontSize: 11, color: Tp.textSubtle, fontVariantNumeric: 'tabular-nums' }}>{count}</div>}
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}

// ─── Event name — mono, two-toned on double underscore ────────
function EventName({ name, size = 13, weight = 500 }) {
  const parts = name.split(/(__)/);
  return (
    <span style={{ fontFamily: Tp.fontMono, fontSize: size, fontWeight: weight, letterSpacing: -0.1 }}>
      {parts.map((p, i) => p === '__'
        ? <span key={i} style={{ color: Tp.textSubtle }}>__</span>
        : <span key={i}>{p}</span>
      )}
    </span>
  );
}

// ─── Progress indeterminate bar ───────────────────────────────
function LiveDot({ size = 8, color = Tp.fail }) {
  return (
    <span aria-hidden="true" style={{
      display: 'inline-block', width: size, height: size, borderRadius: 999,
      background: color, animation: 'ep-pulse 1.2s ease-in-out infinite',
      flexShrink: 0,
    }}/>
  );
}

Object.assign(window, {
  SidebarFrame, EPLogo, IconBtn, SvgIcon,
  Btn, StatusPill, Card, Stat, SectionHeader, EventName, LiveDot,
});

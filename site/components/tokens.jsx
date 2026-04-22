// Design tokens for Event Profiler extension
// Light, data-forward aesthetic. Cool neutral grays, single blue accent, semantic status.

const TOKENS = {
  // Neutrals — oklch with cool-neutral hue, low chroma
  bg:         'oklch(99% 0.003 240)',   // app bg, lightest
  surface:    'oklch(100% 0 0)',         // cards
  surfaceAlt: 'oklch(97.5% 0.004 240)',  // subtle panels / headers
  hover:      'oklch(96% 0.005 240)',
  border:     'oklch(91% 0.006 240)',
  borderStrong: 'oklch(85% 0.008 240)',
  divider:    'oklch(94% 0.005 240)',

  // Text
  text:       'oklch(22% 0.01 240)',
  textMuted:  'oklch(50% 0.012 240)',
  textSubtle: 'oklch(65% 0.01 240)',

  // Accents — shared chroma 0.14, lightness ~60%, hue varies
  blue:       'oklch(56% 0.16 255)',      // primary action
  blueSoft:   'oklch(96% 0.03 255)',
  blueText:   'oklch(42% 0.14 255)',

  // Status — semantic. Hues chosen for max separation:
  // pass=green 150°, warn=amber 60° (well away from red), fail=red 25°.
  pass:       'oklch(62% 0.16 150)',
  passSoft:   'oklch(95% 0.05 150)',
  passText:   'oklch(38% 0.14 150)',

  fail:       'oklch(55% 0.22 25)',
  failSoft:   'oklch(95% 0.05 25)',
  failText:   'oklch(42% 0.19 25)',

  warn:       'oklch(76% 0.17 80)',
  warnSoft:   'oklch(96% 0.07 80)',
  warnText:   'oklch(50% 0.14 70)',

  missing:    'oklch(60% 0.01 240)',
  missingSoft:'oklch(95% 0.005 240)',

  // Typography
  fontSans:   '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontMono:   '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',

  // Radii
  r1: '3px',
  r2: '6px',
  r3: '8px',
  r4: '12px',

  // Shadows
  shadow1: '0 1px 2px rgba(15, 20, 30, 0.04), 0 1px 1px rgba(15, 20, 30, 0.03)',
  shadow2: '0 4px 12px rgba(15, 20, 30, 0.06), 0 1px 2px rgba(15, 20, 30, 0.04)',
};

// Inject base font imports + reset once
if (typeof document !== 'undefined' && !document.getElementById('ep-fonts')) {
  const link = document.createElement('link');
  link.id = 'ep-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';
  document.head.appendChild(link);

  const s = document.createElement('style');
  s.textContent = `
    .ep-scroll::-webkit-scrollbar{width:10px;height:10px}
    .ep-scroll::-webkit-scrollbar-track{background:transparent}
    .ep-scroll::-webkit-scrollbar-thumb{background:${TOKENS.border};border-radius:5px;border:2px solid transparent;background-clip:padding-box}
    .ep-scroll::-webkit-scrollbar-thumb:hover{background:${TOKENS.borderStrong};background-clip:padding-box;border:2px solid transparent}
    .ep-btn{cursor:pointer;border:none;font-family:inherit;transition:background .12s, border-color .12s, color .12s}
    .ep-row:hover{background:${TOKENS.hover}}
    .ep-focus:focus-visible{outline:2px solid ${TOKENS.blue};outline-offset:1px}
    @keyframes ep-pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes ep-slidein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  `;
  document.head.appendChild(s);
}

window.TOKENS = TOKENS;

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sortable } from '@shopify/draggable';

// ─── Constants ─────────────────────────────────────────────────────────────────
const FONT_GROUPS = {
  Serif:      ['Playfair Display','Cormorant Garamond','DM Serif Display','Libre Baskerville','Cinzel','EB Garamond','Lora'],
  'Sans-Serif':['Bebas Neue','Josefin Sans','Unbounded','Space Grotesk','Inter','DM Sans','Outfit','Figtree'],
  Display:    ['Abril Fatface','Righteous','Lobster','Pacifico','Titan One'],
  Mono:       ['Space Mono','IBM Plex Mono','Fira Mono'],
};

const FONT_OPTS = Object.entries(FONT_GROUPS).map(([g, fonts]) => ({
  g, items: fonts.map(f => ({ v:f, l:f })),
}));

const ANIM_FROM = {
  fadeUp:    { o:'0', t:'translateY(40px)',               f:'none'      },
  fadeDown:  { o:'0', t:'translateY(-40px)',              f:'none'      },
  fadeLeft:  { o:'0', t:'translateX(-40px)',              f:'none'      },
  fadeRight: { o:'0', t:'translateX(40px)',               f:'none'      },
  scale:     { o:'0', t:'scale(0.5)',                     f:'none'      },
  blur:      { o:'0', t:'translateY(20px)',               f:'blur(18px)'},
  flip:      { o:'0', t:'rotateY(90deg)',                 f:'none'      },
  slide:     { o:'0', t:'translateX(-60px) skewX(-8deg)', f:'none'     },
  none:      { o:'1', t:'none',                           f:'none'      },
};

const BG_SWATCHES = [
  '#ffffff','#fafaf9','#f1f5f9','#fef3c7','#ecfdf5','#18181b','#09090b','#1e1b4b',
];

const SEG_PRESETS = [
  { text:'Design',    fontFamily:'Playfair Display',   fontSize:80,  fontWeight:'300', color:'#18181b', letterSpacing:'0em',   textTransform:'none',      italic:false },
  { text:'&',         fontFamily:'Cormorant Garamond', fontSize:112, fontWeight:'300', color:'#a1a1aa', letterSpacing:'0em',   textTransform:'none',      italic:true  },
  { text:'CRAFT',     fontFamily:'Bebas Neue',          fontSize:100, fontWeight:'400', color:'#18181b', letterSpacing:'0.1em', textTransform:'uppercase', italic:false },
  { text:'EST. 2024', fontFamily:'Josefin Sans',        fontSize:18,  fontWeight:'300', color:'#71717a', letterSpacing:'0.2em', textTransform:'uppercase', italic:false },
];

const mkSeg = (n) => ({
  ...SEG_PRESETS[(n - 1) % 4],
  textDecoration:'none', lineHeight:'1', rotation:0,
  badge:false, badgeColor:'#e4e4e7', badgePadding:'4px 10px', badgeRadius:'6px',
  effect:'none', strokeColor:'#000000', strokeWidth:'2px', strokeHollow:false,
  gradient:false, gradStart:'#3b82f6', gradEnd:'#60a5fa', gradDir:'horizontal',
  gapAfter:null, offsetX:0, offsetY:0,
});

// ─── Design Tokens (Tan) ────────────────────────────────────────────────────
const T = {
  glass:       'rgba(255,255,255,0.52)',
  glassBorder: 'rgba(255,255,255,0.48)',
  glassStrong: 'rgba(255,255,255,0.70)',
  blur:        'blur(24px) saturate(180%)',
  shadow:      '0 4px 24px rgba(0,0,0,0.045), 0 1px 3px rgba(0,0,0,0.02)',
  shadowHover: '0 8px 32px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.03)',
  inner:       'inset 0 1px 0 rgba(255,255,255,0.55)',
  text1:       '#0f172a',
  text2:       '#334155',
  text3:       '#94a3b8',
  text4:       '#64748b',
  border:      'rgba(0,0,0,0.05)',
  border2:     'rgba(0,0,0,0.09)',
  accent:      '#3b82f6',
  accentGrad:  '#3b82f6',
  accentSoft:  'rgba(59,130,246,0.08)',
  accentGlow:  '0 0 0 3px rgba(59,130,246,0.14)',
  ctrl:        'rgba(255,255,255,0.60)',
  ctrlBorder:  'rgba(0,0,0,0.07)',
  ctrlHover:   'rgba(255,255,255,0.85)',
};

const EASE = {
  out:    'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const sysFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif";

const ctrlBase = {
  height:28, background:T.ctrl, border:`1px solid ${T.ctrlBorder}`,
  borderRadius:7, color:T.text1, fontSize:11, padding:'0 8px',
  width:'100%', outline:'none', fontFamily:'inherit', appearance:'none',
  boxSizing:'border-box', transition:`all 300ms ${EASE.out}`,
};

const glassPanel = { background:T.glass, backdropFilter:T.blur, WebkitBackdropFilter:T.blur, border:`1px solid ${T.glassBorder}`, boxShadow:`${T.shadow}, ${T.inner}`, borderRadius:14 };
const glassBar   = { background:T.glassStrong, backdropFilter:T.blur, WebkitBackdropFilter:T.blur, borderBottom:`1px solid ${T.glassBorder}`, boxShadow:'0 1px 3px rgba(0,0,0,0.02)' };

// ─── Option Arrays ─────────────────────────────────────────────────────────────
const O = {
  weight:   ['100','200','300','400','500','600','700','800','900'].map(v=>({v,l:v})),
  case_:    [{v:'none',l:'None'},{v:'uppercase',l:'UPPER'},{v:'lowercase',l:'lower'},{v:'capitalize',l:'Title'}],
  track:    ['-0.05em','0em','0.02em','0.05em','0.075em','0.1em','0.15em','0.2em','0.3em'].map(v=>({v,l:v})),
  lh:       ['0.85','0.95','1','1.1','1.25','1.5'].map(v=>({v,l:v})),
  deco:     [{v:'none',l:'None'},{v:'underline',l:'Underline'},{v:'line-through',l:'Strike'},{v:'overline',l:'Overline'}],
  rot:      [-30,-20,-15,-10,-5,0,5,10,15,20,30].map(v=>({v:String(v),l:v>0?`+${v}\u00B0`:`${v}\u00B0`})),
  tag:      ['h1','h2','h3','h4','p','span'].map(t=>({v:t,l:t.toUpperCase()})),
  dir:      [{v:'row',l:'Row \u2192'},{v:'column',l:'Column \u2193'}],
  align:    [{v:'flex-start',l:'Start'},{v:'center',l:'Center'},{v:'flex-end',l:'End'}],
  trigger:  [{v:'entrance',l:'Entrance'},{v:'scroll',l:'On Scroll'},{v:'manual',l:'Manual'}],
  preset:   ['none','fadeUp','fadeDown','fadeLeft','fadeRight','scale','blur','flip','slide'].map(p=>({v:p,l:p.charAt(0).toUpperCase()+p.slice(1)})),
  dur:      [300,400,500,600,750,900,1200].map(v=>({v:String(v),l:v+'ms'})),
  stag:     [50,100,150,180,250,400,600].map(v=>({v:String(v),l:v+'ms'})),
  delay:    [0,200,300,500,800].map(v=>({v:String(v),l:v+'ms'})),
  ease:     [{v:'cubic-bezier(0.22,1,0.36,1)',l:'Power Out'},{v:'ease-out',l:'Ease Out'},{v:'ease-in-out',l:'InOut'},{v:'cubic-bezier(0.34,1.56,0.64,1)',l:'Spring'},{v:'linear',l:'Linear'}],
  effect:   [{v:'none',l:'None'},{v:'outline',l:'Outline'},{v:'soft-shadow',l:'Soft Shadow'},{v:'hard-shadow',l:'Hard Shadow'},{v:'3d-extrude',l:'3D Extrude'},{v:'neon-glow',l:'Neon Glow'},{v:'retro',l:'Retro'}],
  strokeW:  ['1px','1.5px','2px','3px','4px','5px'].map(v=>({v,l:v})),
  badgePad: [{v:'2px 8px',l:'Compact'},{v:'4px 10px',l:'Small'},{v:'6px 14px',l:'Medium'},{v:'8px 18px',l:'Large'},{v:'10px 24px',l:'XLarge'}],
  badgeRad: [{v:'0px',l:'Square'},{v:'3px',l:'Subtle'},{v:'6px',l:'Rounded'},{v:'10px',l:'More'},{v:'999px',l:'Pill'}],
  gradDir:  [{v:'horizontal',l:'\u2192 Horizontal'},{v:'vertical',l:'\u2193 Vertical'},{v:'diagonal',l:'\u2198 Diagonal'}],
};

// ─── UI Primitives (stable references) ─────────────────────────────────────────
const Lbl = ({ children }) => (
  <span style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, display:'block', marginBottom:4 }}>
    {children}
  </span>
);

const Field = ({ label, children, w }) => (
  <div style={{ display:'flex', flexDirection:'column', flex: w ? `0 0 ${w}px` : 1, minWidth:0 }}>
    {label && <Lbl>{label}</Lbl>}
    {children}
  </div>
);

const Row = ({ children }) => (
  <div style={{ display:'flex', gap:7, marginBottom:8, alignItems:'flex-end' }}>
    {children}
  </div>
);

const Sep = () => <div style={{ height:1, background:T.border, margin:'10px 0' }}/>;

const NumIn = ({ val, onChange, min=0, max=9999 }) => (
  <input type="number" value={val} min={min} max={max}
    onChange={e=>onChange(+e.target.value)}
    style={{ ...ctrlBase, MozAppearance:'textfield' }}
  />
);

const TxtIn = ({ val, onChange }) => (
  <input type="text" value={val} onChange={e=>onChange(e.target.value)} style={ctrlBase}/>
);

const ColorField = ({ val, onChange }) => (
  <div style={{ display:'flex', gap:5 }}>
    <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(val)?val:'#000000'} onChange={e=>onChange(e.target.value)}
      style={{ width:28, height:28, border:`1px solid ${T.ctrlBorder}`, borderRadius:7, padding:2, cursor:'pointer', background:T.ctrl, flexShrink:0, boxSizing:'border-box', transition:`all 300ms ${EASE.out}` }}
    />
    <input type="text" value={val} onChange={e=>onChange(e.target.value)}
      style={{ ...ctrlBase, fontFamily:"'SF Mono','Fira Code',monospace", fontSize:10 }}
    />
  </div>
);

const Sw = ({ val, onChange }) => (
  <button onClick={()=>onChange(!val)} style={{
    position:'relative', width:36, height:20, cursor:'pointer', flexShrink:0,
    background:'none', border:'none', padding:0,
  }}>
    <div style={{
      position:'absolute', inset:0,
      background: val ? T.accentGrad : '#cbd5e1',
      borderRadius:99,
      transition:`background 400ms ${EASE.out}, box-shadow 500ms ${EASE.spring}`,
      boxShadow: val ? '0 2px 10px rgba(59,130,246,0.35), inset 0 1px 1px rgba(255,255,255,0.15)' : 'inset 0 1px 2px rgba(0,0,0,0.06)',
      willChange: 'background, box-shadow',
    }}/>
    <div style={{
      position:'absolute', top:2, left:2,
      width:16, height:16, background:'#fff', borderRadius:'50%',
      transform: `translateX(${val ? 16 : 0}px) scale(${val ? 1 : 0.92})`,
      transition:`transform 450ms ${EASE.spring}, box-shadow 400ms ${EASE.out}`,
      boxShadow: val ? '0 1px 4px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(0,0,0,0.06)',
      willChange: 'transform',
    }}/>
  </button>
);

const TRow = ({ label, val, onChange }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:28, marginBottom:2 }}>
    <span style={{ fontSize:11, color:T.text2 }}>{label}</span>
    <Sw val={val} onChange={onChange}/>
  </div>
);

const Sub = ({ show, children }) => (
  <div style={{ display:'grid', gridTemplateRows: show ? '1fr' : '0fr', transition:`grid-template-rows 350ms ${EASE.out}` }}>
    <div style={{ overflow:'hidden' }}>
      <div style={{ background:'rgba(255,255,255,0.35)', border:`1px solid ${T.border}`, borderRadius:8, padding:10, marginTop:6, opacity:show?1:0, transition:`opacity 300ms ${EASE.out}` }}>
        {children}
      </div>
    </div>
  </div>
);

const Sel = ({ val, onChange, opts, fontPreview }) => {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const trigRef = React.useRef(null);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (open) setMounted(true);
    else { const t = setTimeout(() => setMounted(false), 200); return () => clearTimeout(t); }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (trigRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (!trigRef.current) return;
    setRect(trigRef.current.getBoundingClientRect());
    setOpen(true);
  };

  const pick = (v) => { onChange(v); setOpen(false); };

  const label = (() => {
    for (const o of opts) {
      if (o.g) { const f = o.items.find(i => String(i.v) === String(val)); if (f) return f.l; }
      else if (String(o.v) === String(val)) return o.l;
    }
    return val;
  })();

  const chevron = (
    <svg width={8} height={5} viewBox="0 0 8 5" fill="none" style={{
      flexShrink:0, marginLeft:4,
      transition:`transform 300ms ${EASE.out}`,
      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    }}>
      <path d="M0.5 0.5L4 4.5L7.5 0.5" stroke={T.text3} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const optBtn = (item, isActive) => (
    <button key={item.v} onClick={() => pick(item.v)} style={{
      width:'100%', padding:'6px 10px', textAlign:'left',
      background: isActive ? T.accentSoft : 'transparent',
      border:'none', borderRadius:6, cursor:'pointer',
      color: isActive ? T.accent : T.text1,
      fontWeight: isActive ? 500 : 400,
      fontSize:11, fontFamily: fontPreview ? `'${item.v}', ${sysFont}` : 'inherit',
      transition:`all 300ms ${EASE.out}`,
      display:'block',
    }}
      onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='rgba(0,0,0,0.03)'; }}
      onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background='transparent'; }}
    >{item.l}</button>
  );

  const spaceBelow = rect ? window.innerHeight - rect.bottom - 8 : 300;
  const openUp = spaceBelow < 180 && (rect?.top || 0) > spaceBelow;

  return (
    <div style={{ position:'relative', width:'100%' }}>
      <button ref={trigRef} onClick={toggle} style={{
        ...ctrlBase, display:'flex', alignItems:'center', justifyContent:'space-between',
        cursor:'pointer', textAlign:'left', padding:'0 8px',
        borderColor: open ? T.accent : T.ctrlBorder,
        boxShadow: open ? T.accentGlow : 'none',
      }}>
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{label}</span>
        {chevron}
      </button>
      {mounted && createPortal(
        <div ref={menuRef} style={{
          position:'fixed',
          left: rect?.left || 0,
          width: rect?.width || 0,
          ...(openUp
            ? { bottom: rect ? window.innerHeight - rect.top + 4 : 0 }
            : { top: rect ? rect.bottom + 4 : 0 }),
          background:'rgba(255,255,255,0.94)',
          backdropFilter:'blur(20px) saturate(160%)',
          WebkitBackdropFilter:'blur(20px) saturate(160%)',
          border:`1px solid ${T.glassBorder}`,
          borderRadius:10,
          boxShadow:'0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04)',
          zIndex:9999,
          maxHeight: Math.min(openUp ? (rect?.top || 300) - 12 : spaceBelow, 260),
          overflowY:'auto',
          padding:4,
          opacity: open ? 1 : 0,
          transform: open ? 'none' : `translateY(${openUp ? '4px' : '-4px'})`,
          pointerEvents: open ? 'auto' : 'none',
          transition:`opacity 300ms ${EASE.out}, transform 300ms ${EASE.out}`,
          fontFamily: sysFont,
          fontSize:11,
        }}>
          {opts.map((o, oi) => o.g ? (
            <div key={oi}>
              <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:T.text4, padding:'7px 10px 3px' }}>{o.g}</div>
              {o.items.map(item => optBtn(item, String(val) === String(item.v)))}
            </div>
          ) : optBtn(o, String(val) === String(o.v)))}
        </div>,
        document.body
      )}
    </div>
  );
};

const Acc = ({ open, onToggle, num, title, children }) => (
  <div style={{ borderBottom:`1px solid ${T.border}` }}>
    <button onClick={onToggle}
      style={{
        display:'flex', alignItems:'center', padding:'0 14px', height:38,
        cursor:'pointer', userSelect:'none', width:'100%', textAlign:'left',
        background:'none', border:'none', fontFamily:'inherit',
        transition:`background 350ms ${EASE.out}`,
      }}
      onMouseEnter={e=>e.currentTarget.style.background=T.accentSoft}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <span style={{
        fontSize:9, fontWeight:700, letterSpacing:'0.06em',
        color:open?T.accent:T.text4, width:18, marginRight:8,
        transition:`color 400ms ${EASE.out}`,
      }}>{num}</span>
      <span style={{
        fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase',
        color:open?T.text1:T.text3, flex:1,
        transition:`color 400ms ${EASE.out}`,
      }}>{title}</span>
      <svg width={10} height={6} viewBox="0 0 10 6" fill="none" stroke={open?T.accent:T.text4} strokeWidth={1.5}
        style={{
          transition:`transform 500ms ${EASE.spring}, stroke 400ms ${EASE.out}`,
          transform:open?'rotate(0deg)':'rotate(-90deg)',
          flexShrink:0,
        }}>
        <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
    <div style={{
      display:'grid',
      gridTemplateRows:open?'1fr':'0fr',
      transition:`grid-template-rows 450ms ${EASE.out}`,
    }}>
      <div style={{ overflow:'hidden' }}>
        <div style={{
          padding:'10px 14px 14px',
          opacity:open?1:0,
          transform:open?'translateY(0)':'translateY(-6px)',
          transition:`opacity 350ms ${EASE.out} ${open?'80ms':'0ms'}, transform 450ms ${EASE.spring} ${open?'40ms':'0ms'}`,
        }}>{children}</div>
      </div>
    </div>
  </div>
);

const TBtn = ({ onClick, dark, icon, children }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap:5, height:28, padding:'0 12px',
    background: dark ? T.accent : 'rgba(255,255,255,0.50)',
    border: dark ? 'none' : `1px solid ${T.ctrlBorder}`,
    borderRadius:8, color:dark?'#fff':T.text2,
    fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.01em', whiteSpace:'nowrap',
    transition:`all 300ms ${EASE.out}`,
    boxShadow: dark ? '0 2px 10px rgba(59,130,246,0.3)' : 'none',
  }}
    onMouseEnter={e=>{
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.boxShadow = dark ? '0 4px 16px rgba(59,130,246,0.4)' : '0 2px 10px rgba(0,0,0,0.06)';
      if (!dark) e.currentTarget.style.background = T.ctrlHover;
    }}
    onMouseLeave={e=>{
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = dark ? '0 2px 10px rgba(59,130,246,0.3)' : 'none';
      if (!dark) e.currentTarget.style.background = 'rgba(255,255,255,0.50)';
    }}
    onMouseDown={e=>{ e.currentTarget.style.transform = 'translateY(0) scale(0.97)'; }}
    onMouseUp={e=>{ e.currentTarget.style.transform = 'translateY(-1px)'; }}
  >{icon}{children}</button>
);

// ─── A11y Helpers ──────────────────────────────────────────────────────────────
const getContrastRatio = (fg, bg) => {
  const hex2rgb = (h) => {
    h = h.replace('#','');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  };
  const lum = ([r,g,b]) => {
    const s = [r,g,b].map(c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); });
    return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
  };
  try {
    const l1 = lum(hex2rgb(fg)), l2 = lum(hex2rgb(bg));
    return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
  } catch { return 21; }
};

const a11yAudit = (ss, count, tag, renderMode) => {
  const active = ss.slice(0, count);
  const issues = [];
  const passes = [];
  const headings = ['h1','h2','h3','h4','h5','h6'];
  const isHeading = headings.includes(tag);
  if (isHeading) passes.push({ id:'semantic-tag', severity:'pass', label:'Semantic heading tag', detail:`Using <${tag}> provides document structure` });
  else if (tag === 'p') passes.push({ id:'semantic-tag', severity:'pass', label:'Semantic paragraph tag', detail:`Using <${tag}> for text content` });
  else issues.push({ id:'semantic-tag', severity:'warning', label:'Non-semantic container', detail:`<${tag}> does not convey meaning to screen readers. Consider <h1>\u2013<h6> or <p>.` });
  if (tag === 'h1') passes.push({ id:'h1-present', severity:'pass', label:'H1 heading present', detail:'Primary heading helps SEO and screen reader navigation' });
  active.forEach((seg, i) => {
    const contrast = getContrastRatio(seg.color, '#ffffff');
    const minNeeded = seg.fontSize >= 24 ? 3 : 4.5;
    if (contrast >= minNeeded) passes.push({ id:`contrast-${i}`, severity:'pass', label:`Segment ${i+1} contrast`, detail:`Ratio ${contrast.toFixed(1)}:1 (min ${minNeeded}:1 for ${seg.fontSize >= 24 ? 'large' : 'normal'} text)` });
    else issues.push({ id:`contrast-${i}`, severity:'error', label:`Segment ${i+1} low contrast`, detail:`Ratio ${contrast.toFixed(1)}:1 \u2014 needs ${minNeeded}:1 (WCAG AA)` });
  });
  if (renderMode === 'svg') {
    passes.push({ id:'svg-sr', severity:'pass', label:'SVG has sr-only text', detail:'Hidden heading with text content ensures screen reader access' });
    passes.push({ id:'svg-aria', severity:'pass', label:'SVG is aria-hidden', detail:'Decorative SVG is hidden from assistive tech' });
  }
  if (active.length > 0) passes.push({ id:'motion', severity:'pass', label:'Respects prefers-reduced-motion', detail:'Animation is disabled when user prefers reduced motion' });
  if (active.every(seg => seg.text.trim().length > 0)) passes.push({ id:'non-empty', severity:'pass', label:'All segments have text', detail:'No empty segments that could confuse screen readers' });
  else issues.push({ id:'non-empty', severity:'warning', label:'Empty text segment', detail:'Empty segments may produce unexpected screen reader behavior' });
  const score = Math.round((passes.length / (passes.length + issues.length)) * 100);
  return { issues, passes, score };
};

const A11yScoreBadge = ({ segs: ss, segCount: cnt, gTag: tag, mode: m }) => {
  const { score } = a11yAudit(ss, cnt, tag, m);
  const color = score >= 90 ? '#16a34a' : score >= 70 ? '#ca8a04' : '#dc2626';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginRight:8 }}>
      <svg width={20} height={20} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={3}/>
        <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${score*0.974} 100`}
          strokeLinecap="round" transform="rotate(-90 18 18)"
          style={{ transition:`stroke-dasharray 600ms ${EASE.out}, stroke 300ms ${EASE.out}` }}/>
      </svg>
      <span style={{ fontSize:12, fontWeight:700, color, fontVariantNumeric:'tabular-nums' }}>{score}</span>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function App() {

  const [segs,     setSegs]     = useState([mkSeg(1),mkSeg(2),mkSeg(3),mkSeg(4)]);
  const [activeSeg,setActiveSeg]= useState(0);
  const [segCount, setSegCount] = useState(3);
  const [mode,     setMode]     = useState('html');
  const [bgColor,  setBgColor]  = useState('#ffffff');
  const [codeOpen, setCodeOpen] = useState(false);
  const [acc,      setAcc]      = useState({ layers:true, a1:true, a2:true, a3:true });
  const [toast,    setToast]    = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [canvasSel,setCanvasSel]= useState(null);
  const [dragRot,  setDragRot]  = useState(false);
  const layerRef = useRef(null);
  const sortableRef = useRef(null);

  const [gTag,  setGTag]  = useState('h1');
  const [gDir,  setGDir]  = useState('row');
  const [gAlign,setGAlign]= useState('center');
  const [gGap,  setGGap]  = useState(16);
  const [gPad,  setGPad]  = useState(48);
  const [gWrap, setGWrap] = useState(true);

  const [gTrigger, setGTrigger] = useState('entrance');
  const [gPreset,  setGPreset]  = useState('fadeUp');
  const [gDur,     setGDur]     = useState(750);
  const [gStagger, setGStagger] = useState(180);
  const [gDelay,   setGDelay]   = useState(300);
  const [gEase,    setGEase]    = useState('cubic-bezier(0.22,1,0.36,1)');

  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);

  const stageRef    = useRef(null);
  const hasAnimated = useRef(false);
  const animTimer   = useRef(null);
  const obsRef      = useRef(null);
  const loadedFonts = useRef(new Set());
  const uid = useMemo(() => 'tc' + Math.random().toString(36).substr(2,6), []);

  const s = segs[activeSeg];
  const getGap = (i) => segs[i]?.gapAfter ?? gGap;

  const upd = (field, val) =>
    setSegs(prev => { const n=[...prev]; n[activeSeg]={...n[activeSeg],[field]:val}; return n; });

  // ── Mount entrance ─────────────────────────────────────────────────────────
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  // ── CSS injection ──────────────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tcFadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
      @keyframes tcFadeDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
      @keyframes tcSlideR { from { opacity:0; transform:translateX(-14px) } to { opacity:1; transform:none } }
      @keyframes tcSlideL { from { opacity:0; transform:translateX(10px) } to { opacity:1; transform:none } }
      @keyframes tcScale { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:none } }
      [data-uid="${uid}"] ::-webkit-scrollbar { width: 5px; }
      [data-uid="${uid}"] ::-webkit-scrollbar-track { background: transparent; }
      [data-uid="${uid}"] ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.10); border-radius: 99px; }
      [data-uid="${uid}"] ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.18); }
      [data-uid="${uid}"] input:focus {
        border-color: ${T.accent} !important;
        box-shadow: ${T.accentGlow} !important;
        outline: none;
      }
      [data-uid="${uid}"] .draggable-mirror {
        opacity: 0.85;
        background: rgba(59,130,246,0.08) !important;
        border-radius: 6px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        z-index: 9999;
      }
      [data-uid="${uid}"] .draggable-source--is-dragging {
        opacity: 0.3;
      }
    `;
    document.head.appendChild(style);
    return () => { try { document.head.removeChild(style); } catch(_){} };
  }, [uid]);

  const enter = (anim, delay) => ready
    ? { animation: `${anim} 550ms ${EASE.out} ${delay}ms backwards` }
    : { opacity: 0 };

  // ── Font loading ───────────────────────────────────────────────────────────
  const fontKey = segs.slice(0,segCount).map(s=>s.fontFamily).join('|');
  useEffect(() => {
    const needed = [...new Set(segs.slice(0,segCount).map(s=>s.fontFamily))]
      .filter(f => !loadedFonts.current.has(f));
    if (!needed.length) return;
    const q = needed.map(f=>
      `family=${encodeURIComponent(f)}:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500`
    ).join('&');
    const el = document.createElement('link');
    el.rel  = 'stylesheet';
    el.href = `https://fonts.googleapis.com/css2?${q}&display=swap`;
    el.onload = () => needed.forEach(f => loadedFonts.current.add(f));
    document.head.appendChild(el);
    needed.forEach(f => loadedFonts.current.add(f));
    return () => { try { document.head.removeChild(el); } catch(_){} };
  }, [fontKey]);

  // ── Sortable layer list (Shopify Draggable) ────────────────────────────────
  useEffect(() => {
    if (!layerRef.current) return;
    if (sortableRef.current) { sortableRef.current.destroy(); sortableRef.current = null; }
    const el = layerRef.current;
    if (el.children.length < 2) return;
    const sortable = new Sortable(el, {
      draggable: '[data-layer-idx]',
      handle: 'svg',
      mirror: { constrainDimensions: true },
      delay: { mouse: 80, drag: 0, touch: 100 },
    });
    sortable.on('sortable:stop', (evt) => {
      const oldIdx = evt.oldIndex;
      const newIdx = evt.newIndex;
      if (oldIdx === newIdx) return;
      setSegs(prev => {
        const items = prev.slice(0, segCount);
        const rest = prev.slice(segCount);
        const [moved] = items.splice(oldIdx, 1);
        items.splice(newIdx, 0, moved);
        return [...items, ...rest];
      });
      if (activeSeg === oldIdx) setActiveSeg(newIdx);
      else if (oldIdx < activeSeg && newIdx >= activeSeg) setActiveSeg(activeSeg - 1);
      else if (oldIdx > activeSeg && newIdx <= activeSeg) setActiveSeg(activeSeg + 1);
    });
    sortableRef.current = sortable;
    return () => { sortable.destroy(); sortableRef.current = null; };
  }, [segCount]);

  // ── Animation engine ───────────────────────────────────────────────────────
  const runAnim = useCallback(() => {
    if (gPreset === 'none') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fr  = ANIM_FROM[gPreset] || ANIM_FROM.fadeUp;
    const els = document.querySelectorAll(`[data-uid="${uid}"] .tc-seg`);
    els.forEach(el => {
      el.style.transition = 'none';
      el.style.opacity    = fr.o;
      el.style.transform  = fr.t;
      el.style.filter     = fr.f;
    });
    els.forEach((el, i) => {
      setTimeout(() => {
        el.style.transition = `opacity ${gDur}ms ${gEase}, transform ${gDur}ms ${gEase}, filter ${gDur}ms ${gEase}`;
        el.style.opacity    = '1';
        el.style.transform  = 'none';
        el.style.filter     = 'none';
        if (i === els.length - 1) hasAnimated.current = true;
      }, i * gStagger + 16);
    });
  }, [uid, gPreset, gDur, gStagger, gEase]);

  useEffect(() => {
    if (gTrigger !== 'entrance') return;
    clearTimeout(animTimer.current);
    animTimer.current = setTimeout(runAnim, gDelay);
    return () => clearTimeout(animTimer.current);
  }, [tick, gTrigger, runAnim, gDelay]);

  useEffect(() => {
    if (obsRef.current) obsRef.current.disconnect();
    if (gTrigger === 'manual' || !stageRef.current) return;
    obsRef.current = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        if (gTrigger === 'entrance' && hasAnimated.current) return;
        runAnim();
      });
    }, { threshold: 0.25 });
    obsRef.current.observe(stageRef.current);
    return () => { if (obsRef.current) obsRef.current.disconnect(); };
  }, [gTrigger, runAnim]);

  const replay = () => { hasAnimated.current = false; setTick(t=>t+1); };

  const dispText = (seg) => {
    if (seg.textTransform === 'uppercase') return seg.text.toUpperCase();
    if (seg.textTransform === 'lowercase') return seg.text.toLowerCase();
    if (seg.textTransform === 'capitalize') return seg.text.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
    return seg.text;
  };

  const fxStyle = (seg) => {
    switch (seg.effect) {
      case 'outline':
        return { WebkitTextStroke:`${seg.strokeWidth} ${seg.strokeColor}`, WebkitTextFillColor:seg.strokeHollow?'transparent':seg.color, paintOrder:'stroke fill' };
      case 'soft-shadow':  return { textShadow:'2px 3px 12px rgba(0,0,0,0.22)' };
      case 'hard-shadow':  return { textShadow:'4px 4px 0 rgba(0,0,0,0.85)' };
      case '3d-extrude':   return { textShadow: Array.from({length:8},(_,i)=>`${i+1}px ${i+1}px 0 rgba(0,0,0,${(0.065+i*0.01).toFixed(3)})`).join(',') };
      case 'neon-glow':    return { textShadow:`0 0 8px ${seg.color}99,0 0 20px ${seg.color}66,0 0 42px ${seg.color}44` };
      case 'retro':        return { WebkitTextStroke:`${seg.strokeWidth} ${seg.strokeColor}`, WebkitTextFillColor:seg.color, textShadow:`5px 5px 0 ${seg.strokeColor}` };
      default: return {};
    }
  };

  const segStyle = (seg) => ({
    fontFamily:     `'${seg.fontFamily}', sans-serif`,
    fontSize:       seg.fontSize,
    fontWeight:     seg.fontWeight,
    color:          seg.color,
    letterSpacing:  seg.letterSpacing,
    fontStyle:      seg.italic ? 'italic' : 'normal',
    textTransform:  seg.textTransform,
    textDecoration: seg.textDecoration,
    lineHeight:     seg.lineHeight,
    transform:      seg.rotation ? `rotate(${seg.rotation}deg)` : undefined,
    background:     seg.badge ? seg.badgeColor : undefined,
    padding:        seg.badge ? seg.badgePadding : undefined,
    borderRadius:   seg.badge ? seg.badgeRadius : undefined,
    display:        'inline-block',
    ...fxStyle(seg),
  });

  // ── SVG builder ────────────────────────────────────────────────────────────
  const buildSVG = () => {
    const ss  = segs.slice(0, segCount);
    const cv  = document.createElement('canvas');
    const ctx = cv.getContext('2d');
    const pH=30, pV=30;
    const meas = ss.map(seg => {
      const d = dispText(seg);
      ctx.font = `${seg.italic?'italic ':' '}${seg.fontWeight} ${seg.fontSize}px "${seg.fontFamily}",sans-serif`;
      const raw = ctx.measureText(d).width;
      const ls  = parseFloat(seg.letterSpacing) * seg.fontSize;
      return { w: raw + Math.max(0, ls * (d.length-1)), h: seg.fontSize, d };
    });
    let svgW, svgH, pos;
    if (gDir === 'row') {
      let totalW = 0;
      meas.forEach((m, i) => { totalW += m.w; if (i < ss.length-1) totalW += getGap(i); });
      const mh = Math.max(...meas.map(m=>m.h));
      svgW=totalW+pH*2; svgH=mh+pV*2;
      let cx=pH;
      pos = meas.map((m,i)=>{ const p={x:cx,y:pV+mh*0.82}; cx+=m.w+(i<ss.length-1?getGap(i):0); return p; });
    } else {
      svgW=Math.max(...meas.map(m=>m.w))+pH*2;
      let cy=pV;
      pos = meas.map((m,i)=>{ const p={x:pH,y:cy+m.h*0.82}; cy+=m.h*1.35+(i<ss.length-1?getGap(i):0); return p; });
      svgH=pos[pos.length-1].y+ss[ss.length-1].fontSize*0.3+pV;
    }
    const SemanticTag = gTag;
    return (
      <div style={{ position:'relative', display:'inline-block' }}>
        <SemanticTag style={{ position:'absolute',width:1,height:1,padding:0,margin:-1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap',border:0,fontSize:1 }}>
          {ss.map(s=>dispText(s)).join(' ')}
        </SemanticTag>
        <svg aria-hidden="true" width={Math.ceil(svgW)} height={Math.ceil(svgH)} viewBox={`0 0 ${Math.ceil(svgW)} ${Math.ceil(svgH)}`} style={{ overflow:'visible', maxWidth:'100%', height:'auto', display:'block' }}>
          <defs>
            {ss.map((seg,i) => seg.gradient ? (
              <linearGradient key={i} id={`${uid}g${i}`}
                x1="0%" y1="0%"
                x2={seg.gradDir==='vertical'?'0%':seg.gradDir==='diagonal'?'100%':'100%'}
                y2={seg.gradDir==='vertical'?'100%':seg.gradDir==='diagonal'?'100%':'0%'}>
                <stop offset="0%" stopColor={seg.gradStart}/>
                <stop offset="100%" stopColor={seg.gradEnd}/>
              </linearGradient>
            ) : null)}
            {ss.map((seg,i) => {
              const fid=`${uid}f${i}`;
              if (seg.effect==='soft-shadow') return <filter key={i} id={fid} x="-20%" y="-20%" width="160%" height="160%"><feDropShadow dx="2" dy="3" stdDeviation="5" floodOpacity="0.22"/></filter>;
              if (seg.effect==='hard-shadow') return <filter key={i} id={fid} x="-10%" y="-10%" width="140%" height="140%"><feDropShadow dx="4" dy="4" stdDeviation="0" floodOpacity="0.85"/></filter>;
              if (seg.effect==='3d-extrude')  return <filter key={i} id={fid} x="-10%" y="-10%" width="150%" height="150%"><feDropShadow dx="3" dy="3" stdDeviation="0" floodOpacity="0.1"/><feDropShadow dx="6" dy="6" stdDeviation="0" floodOpacity="0.07"/></filter>;
              if (seg.effect==='neon-glow')   return <filter key={i} id={fid} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>;
              return null;
            })}
          </defs>
          {ss.map((seg,i) => {
            const p    = pos[i];
            const fill = seg.gradient ? `url(#${uid}g${i})` : (seg.effect==='outline'&&seg.strokeHollow?'none':seg.color);
            const hasStroke = seg.effect==='outline'||seg.effect==='retro';
            const hasFilt   = ['soft-shadow','hard-shadow','3d-extrude','neon-glow'].includes(seg.effect);
            let badge = null;
            if (seg.badge) {
              const parts=seg.badgePadding.split(' ');
              const pv=parseFloat(parts[0]), ph2=parseFloat(parts[1]||parts[0]);
              badge = <rect x={p.x-ph2} y={p.y-meas[i].h*0.82-pv} width={meas[i].w+ph2*2} height={meas[i].h+pv*2} rx={parseFloat(seg.badgeRadius)} fill={seg.badgeColor}/>;
            }
            const ox = seg.offsetX || 0, oy = seg.offsetY || 0;
            return (
              <g key={i} className="tc-seg" style={{ display:'inline-block' }}
                transform={(ox || oy) ? `translate(${ox},${oy})` : undefined}>
                {badge}
                <text x={p.x} y={p.y} fill={fill}
                  stroke={hasStroke?seg.strokeColor:'none'}
                  strokeWidth={hasStroke?seg.strokeWidth:0}
                  paintOrder="stroke fill"
                  fontFamily={`'${seg.fontFamily}', sans-serif`}
                  fontSize={seg.fontSize} fontWeight={seg.fontWeight}
                  fontStyle={seg.italic?'italic':'normal'}
                  letterSpacing={seg.letterSpacing}
                  textDecoration={seg.textDecoration}
                  filter={hasFilt?`url(#${uid}f${i})`:undefined}
                  transform={seg.rotation?`rotate(${seg.rotation} ${p.x} ${p.y})`:undefined}
                >{meas[i].d}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const buildHTML = () => {
    const Tag = gTag;
    const ss = segs.slice(0,segCount);
    const hasPerGap = ss.some(seg => seg.gapAfter !== null);
    return (
      <Tag style={{ display:'inline-flex', flexDirection:gDir, flexWrap:gWrap?'wrap':'nowrap', gap: hasPerGap ? 0 : gGap, alignItems:gDir==='column'?gAlign:'baseline', justifyContent:gAlign, margin:0, padding:0 }}>
        {ss.map((seg,i) => {
          const gap = hasPerGap ? getGap(i) : 0;
          const isLast = i === ss.length - 1;
          const marginProp = gDir === 'column' ? 'marginBottom' : 'marginRight';
          return (
            <span key={i} className="tc-seg"
              onClick={(e) => { e.stopPropagation(); setCanvasSel(i); setActiveSeg(i); }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (seg.offsetX || seg.offsetY) {
                  setSegs(prev => { const n=[...prev]; n[i]={...n[i], offsetX:0, offsetY:0}; return n; });
                }
              }}
              onMouseDown={(e) => {
                if (canvasSel !== i) return;
                if (e.target.closest('[data-handle]')) return;
                e.preventDefault();
                const el = e.currentTarget;
                const startX = e.clientX, startY = e.clientY;
                const origOX = seg.offsetX || 0, origOY = seg.offsetY || 0;
                let moved = false, finalDx = 0, finalDy = 0;
                document.body.style.cursor = 'grabbing';
                el.style.willChange = 'transform';
                const onMove = (ev) => {
                  finalDx = ev.clientX - startX;
                  finalDy = ev.clientY - startY;
                  if (!moved && Math.abs(finalDx) < 1 && Math.abs(finalDy) < 1) return;
                  moved = true;
                  el.style.transform = `translate(${origOX + finalDx}px, ${origOY + finalDy}px)`;
                };
                const onUp = () => {
                  document.body.style.cursor = '';
                  el.style.willChange = '';
                  document.removeEventListener('mousemove', onMove);
                  document.removeEventListener('mouseup', onUp);
                  if (moved) {
                    setSegs(prev => {
                      const n = [...prev];
                      n[i] = { ...n[i], offsetX: origOX + finalDx, offsetY: origOY + finalDy };
                      return n;
                    });
                  }
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
              }}
              style={{
                display:'inline-block', cursor: canvasSel === i ? 'grab' : 'pointer', position:'relative',
                outline: canvasSel === i ? `2px solid ${T.accent}` : '2px solid transparent',
                outlineOffset: 3, borderRadius: 4,
                transition: `outline-color 300ms ${EASE.out}`,
                transform: (seg.offsetX || seg.offsetY) ? `translate(${seg.offsetX||0}px, ${seg.offsetY||0}px)` : undefined,
                zIndex: canvasSel === i ? 5 : undefined,
                ...(hasPerGap && !isLast ? { [marginProp]: gap } : {}),
              }}>
              <span style={segStyle(seg)}>{dispText(seg)}</span>
              {canvasSel === i && (
                <div data-handle="rotate" style={{
                  position:'absolute', top:-8, right:-8, width:16, height:16, borderRadius:'50%',
                  background:T.accent, border:'2px solid #fff', cursor:'grab',
                  boxShadow:'0 2px 6px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center',
                  zIndex:10,
                }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const parent = e.currentTarget.parentElement;
                    const inner = parent.querySelector('span');
                    const rect = parent.getBoundingClientRect();
                    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
                    let finalAngle = seg.rotation || 0;
                    document.body.style.cursor = 'grabbing';
                    const onMove = (ev) => {
                      finalAngle = Math.round(Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180/Math.PI));
                      if (inner) inner.style.transform = `rotate(${finalAngle}deg)`;
                    };
                    const onUp = () => {
                      document.body.style.cursor = '';
                      document.removeEventListener('mousemove', onMove);
                      document.removeEventListener('mouseup', onUp);
                      upd('rotation', finalAngle);
                    };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                  }}
                >
                  <svg width={8} height={8} viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth={1.5}>
                    <path d="M7 1.5A4 4 0 1 1 3 1.5" strokeLinecap="round"/>
                    <path d="M7 1.5L5.5 0M7 1.5L8.5 0" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
              {canvasSel === i && (seg.offsetX !== 0 || seg.offsetY !== 0) && (
                <div data-handle="reset" onClick={(e) => {
                  e.stopPropagation();
                  setSegs(prev => { const n=[...prev]; n[i]={...n[i], offsetX:0, offsetY:0}; return n; });
                }} style={{
                  position:'absolute', top:-8, left:-8, width:16, height:16, borderRadius:'50%',
                  background:'#ef4444', border:'2px solid #fff', cursor:'pointer',
                  boxShadow:'0 2px 6px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center',
                  zIndex:10,
                }}>
                  <svg width={7} height={7} viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
                    <line x1="2.5" y1="2.5" x2="7.5" y2="7.5"/><line x1="7.5" y1="2.5" x2="2.5" y2="7.5"/>
                  </svg>
                </div>
              )}
              {canvasSel === i && !isLast && (
                <div data-handle="gap" style={{
                  position:'absolute',
                  ...(gDir === 'column' ? { bottom: -(gap/2)-6, left:'50%', transform:'translateX(-50%)' } : { right: -(gap/2)-6, top:'50%', transform:'translateY(-50%)' }),
                  width:12, height:12, borderRadius:'50%',
                  background:'rgba(255,255,255,0.9)', border:`1.5px solid ${T.accent}`,
                  cursor: gDir === 'column' ? 'ns-resize' : 'ew-resize',
                  display:'flex', alignItems:'center', justifyContent:'center', zIndex:10,
                  boxShadow:'0 1px 4px rgba(0,0,0,0.15)',
                }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const segEl = e.currentTarget.parentElement;
                    const containerEl = segEl.parentElement;
                    const handleEl = e.currentTarget;
                    const gapInput = document.querySelector(`[data-gap-idx="${i}"]`);
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    const startPos = gDir === 'column' ? e.clientY : e.clientX;
                    const startGap = getGap(i);
                    const cssProp = gDir === 'column' ? 'marginBottom' : 'marginRight';
                    const handleProp = gDir === 'column' ? 'bottom' : 'right';
                    containerEl.style.gap = '0px';
                    const allSegs = containerEl.querySelectorAll('.tc-seg');
                    allSegs.forEach((s, idx) => {
                      if (idx < allSegs.length - 1) s.style[cssProp] = getGap(idx) + 'px';
                    });
                    let finalGap = startGap;
                    const onMove = (ev) => {
                      const delta = (gDir === 'column' ? ev.clientY : ev.clientX) - startPos;
                      finalGap = Math.max(0, Math.round(startGap + delta));
                      segEl.style[cssProp] = finalGap + 'px';
                      handleEl.style[handleProp] = -(finalGap / 2) - 6 + 'px';
                      if (gapInput) { nativeSetter.call(gapInput, String(finalGap)); }
                    };
                    const onUp = () => {
                      document.removeEventListener('mousemove', onMove);
                      document.removeEventListener('mouseup', onUp);
                      setSegs(prev => {
                        const n = [...prev];
                        for (let j = 0; j < segCount; j++) {
                          n[j] = { ...n[j], gapAfter: j === i ? finalGap : (n[j].gapAfter ?? gGap) };
                        }
                        return n;
                      });
                    };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                  }}
                >
                  <svg width={6} height={6} viewBox="0 0 6 6" fill="none" stroke={T.accent} strokeWidth={1}>
                    {gDir === 'column'
                      ? <><line x1="0" y1="2" x2="6" y2="2"/><line x1="0" y1="4" x2="6" y2="4"/></>
                      : <><line x1="2" y1="0" x2="2" y2="6"/><line x1="4" y1="0" x2="4" y2="6"/></>}
                  </svg>
                </div>
              )}
            </span>
          );
        })}
      </Tag>
    );
  };

  const genCode = () => {
    const ss    = segs.slice(0,segCount);
    const fonts = [...new Set(ss.map(s=>s.fontFamily))];
    const q     = fonts.map(f=>`family=${encodeURIComponent(f)}:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400`).join('&');
    let c = `<!-- Google Fonts -->\n<link href="https://fonts.googleapis.com/css2?${q}&display=swap" rel="stylesheet">\n\n`;
    if (mode === 'html') {
      const ws = `display:inline-flex; flex-direction:${gDir}; gap:${gGap}px; align-items:${gDir==='column'?gAlign:'baseline'}; flex-wrap:${gWrap?'wrap':'nowrap'}; margin:0; padding:0`;
      c += `<${gTag} style="${ws}">\n`;
      ss.forEach(seg => {
        const fx  = Object.entries(fxStyle(seg)).map(([k,v])=>`${k.replace(/([A-Z])/g,m=>'-'+m.toLowerCase())}:${v}`).join('; ');
        const sty = [
          `font-family:'${seg.fontFamily}', sans-serif`,`font-size:${seg.fontSize}px`,`font-weight:${seg.fontWeight}`,
          `color:${seg.color}`,`letter-spacing:${seg.letterSpacing}`,
          seg.italic?'font-style:italic':'',`text-transform:${seg.textTransform}`,
          seg.textDecoration!=='none'?`text-decoration:${seg.textDecoration}`:'',
          seg.badge?`background:${seg.badgeColor}; padding:${seg.badgePadding}; border-radius:${seg.badgeRadius}`:'',
          fx,
        ].filter(Boolean).join('; ');
        c += `  <span style="${sty}">${dispText(seg)}</span>\n`;
      });
      c += `</${gTag}>`;
    } else {
      c += `<style>.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0)}</style>\n\n`;
      c += `<!-- Copy the SVG from browser DevTools for full SVG markup -->`;
    }
    return c;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(genCode()).then(() => { setToast(true); setTimeout(()=>setToast(false),1800); });
  };

  const IcoReplay = <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M1.5 6a4.5 4.5 0 1 0 1.1-3" strokeLinecap="round"/><path d="M1.5 3v3h3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const IcoCopy   = <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="4" y="4" width="7" height="7" rx="1"/><path d="M8 4V2.5a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1V7a1 1 0 0 0 1 1H3.5" strokeLinecap="round"/></svg>;
  const IcoCode   = <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3.5 4L1 6l2.5 2M8.5 4l2.5 2-2.5 2M7 2.5l-2 7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const IcoA11y   = <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="6" cy="2" r="1.2"/><path d="M2.5 4.5L6 5l3.5-.5M6 5v2.5M4 11l2-3.5 2 3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

  const A11yPanel = ({ segs: ss, segCount: cnt, gTag: tag, gDir: dir, gAlign: al, gGap: gap, gWrap: wrap, mode: m, dispText: dt, fxStyle: fx, segStyle: sst, genCode: gc }) => {
    const [activeTab, setActiveTab] = useState('tree');
    const active = ss.slice(0, cnt);
    const audit = a11yAudit(ss, cnt, tag, m);

    const tabs = [
      { id:'tree',    label:'Accessibility Tree' },
      { id:'reader',  label:'Screen Reader' },
      { id:'seo',     label:'SEO Tags' },
      { id:'issues',  label:`Issues (${audit.issues.length})` },
    ];

    const mono = "'SF Mono','Fira Code',monospace";

    const TreeView = () => {
      const headings = ['h1','h2','h3','h4','h5','h6'];
      const role = headings.includes(tag) ? `heading (level ${tag[1]})` : tag === 'p' ? 'paragraph' : 'generic';
      const fullText = active.map(s => dt(s)).join(' ');
      return (
        <div style={{ padding:16 }}>
          <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, marginBottom:10 }}>Accessibility Tree</div>
          <div style={{ background:'rgba(255,255,255,0.5)', border:`1px solid ${T.border}`, borderRadius:10, padding:14, fontFamily:mono, fontSize:11, lineHeight:2 }}>
            <div style={{ color:T.text3 }}>document</div>
            <div style={{ paddingLeft:16 }}>
              <span style={{ color:'#7c3aed' }}>role=</span>
              <span style={{ color:'#059669' }}>"{role}"</span>
              {headings.includes(tag) && <><span style={{ color:T.text3 }}> </span><span style={{ color:'#7c3aed' }}>level=</span><span style={{ color:'#059669' }}>"{tag[1]}"</span></>}
            </div>
            {m === 'svg' && (
              <div style={{ paddingLeft:32, color:T.text3, fontStyle:'italic' }}>
                <span style={{ color:'#7c3aed' }}>role=</span><span style={{ color:'#059669' }}>"img"</span>
                <span style={{ color:T.text3 }}> </span><span style={{ color:'#7c3aed' }}>aria-hidden=</span><span style={{ color:'#059669' }}>"true"</span>
              </div>
            )}
            <div style={{ paddingLeft:32 }}>
              <span style={{ color:'#0369a1' }}>StaticText</span>
              <span style={{ color:T.text1, fontWeight:500 }}> "{fullText}"</span>
            </div>
            {active.map((seg, i) => (
              <div key={i} style={{ paddingLeft:32 }}>
                <span style={{ color:'#7c3aed' }}>role=</span>
                <span style={{ color:'#059669' }}>"text"</span>
                <span style={{ color:T.text3 }}> — </span>
                <span style={{ color:T.text1 }}>"{dt(seg)}"</span>
                <span style={{ color:T.text3, fontSize:10 }}> {seg.fontFamily} {seg.fontWeight} {seg.fontSize}px</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const ReaderView = () => {
      const fullText = active.map(s => dt(s)).join(' ');
      const headings = ['h1','h2','h3','h4','h5','h6'];
      const [reading, setReading] = useState(false);
      const [readIdx, setReadIdx] = useState(-1);

      const startReading = () => {
        window.speechSynthesis?.cancel();
        setReading(true);
        setReadIdx(0);
        const headingAnnounce = headings.includes(tag) ? `heading level ${tag[1]}. ` : tag === 'p' ? 'paragraph. ' : '';
        let i = 0;
        const speakNext = () => {
          if (i >= active.length) { setReading(false); setReadIdx(-1); return; }
          setReadIdx(i);
          const text = (i === 0 ? headingAnnounce : '') + dt(active[i]);
          const utt = new SpeechSynthesisUtterance(text);
          utt.rate = 0.9;
          utt.pitch = 1;
          utt.onend = () => { i++; speakNext(); };
          utt.onerror = () => { i++; speakNext(); };
          window.speechSynthesis?.speak(utt);
        };
        speakNext();
      };

      const stopReading = () => {
        window.speechSynthesis?.cancel();
        setReading(false);
        setReadIdx(-1);
      };

      return (
        <div style={{ padding:16 }}>
          <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, marginBottom:10 }}>Screen Reader Simulation</div>

          <div style={{ background:'#0f172a', borderRadius:10, padding:16, color:'#e2e8f0', fontFamily:mono, fontSize:12, lineHeight:1.8, marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, borderBottom:'1px solid rgba(255,255,255,0.08)', paddingBottom:10 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: reading ? '#22c55e' : '#64748b', transition:`background 300ms ${EASE.out}` }}/>
              <span style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>VoiceOver Output</span>
              <div style={{ flex:1 }}/>
              <button onClick={reading ? stopReading : startReading} style={{
                fontSize:10, fontWeight:600, fontFamily:'inherit', padding:'4px 12px',
                background: reading ? '#dc2626' : T.accent,
                color: '#fff', border:'none', borderRadius:6,
                cursor: 'pointer',
                transition:`all 300ms ${EASE.out}`,
              }}>{reading ? 'Stop' : 'Play'}</button>
            </div>
            {headings.includes(tag) && (
              <div style={{ color:'#60a5fa', marginBottom:4 }}>
                <span style={{ color:'#94a3b8', fontSize:10 }}>▸ </span>
                heading level {tag[1]}
              </div>
            )}
            {tag === 'p' && (
              <div style={{ color:'#60a5fa', marginBottom:4 }}>
                <span style={{ color:'#94a3b8', fontSize:10 }}>▸ </span>
                paragraph
              </div>
            )}
            {active.map((seg, i) => (
              <div key={i} style={{
                padding:'2px 6px', borderRadius:4, marginBottom:2,
                background: readIdx === i ? 'rgba(59,130,246,0.2)' : 'transparent',
                borderLeft: readIdx === i ? '2px solid #3b82f6' : '2px solid transparent',
                transition:`all 300ms ${EASE.out}`,
              }}>
                <span style={{ color:'#94a3b8', fontSize:10 }}>▸ </span>
                <span style={{ color: readIdx === i ? '#fff' : '#cbd5e1' }}>{dt(seg)}</span>
              </div>
            ))}
            <div style={{ color:'#94a3b8', fontSize:10, marginTop:8, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:8 }}>
              Combined: <span style={{ color:'#e2e8f0' }}>"{fullText}"</span>
            </div>
          </div>

          <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, marginBottom:8 }}>Reading Order</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {active.map((seg, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'rgba(255,255,255,0.45)', borderRadius:8, border:`1px solid ${T.border}` }}>
                <span style={{ fontSize:9, fontWeight:700, color:T.accent, width:16, textAlign:'center' }}>{i+1}</span>
                <span style={{ fontSize:11, color:T.text1, fontWeight:500 }}>{dt(seg)}</span>
                <div style={{ flex:1 }}/>
                <span style={{ fontSize:9, color:T.text3 }}>{seg.fontFamily}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const SeoView = () => {
      const headings = ['h1','h2','h3','h4','h5','h6'];
      const fullText = active.map(s => dt(s)).join(' ');
      const charCount = fullText.length;
      const wordCount = fullText.split(/\s+/).filter(Boolean).length;

      return (
        <div style={{ padding:16 }}>
          <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, marginBottom:10 }}>SEO & HTML Structure</div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            {[
              { label:'Tag', value:`<${tag}>`, ok: headings.includes(tag) || tag === 'p' },
              { label:'Role', value:headings.includes(tag) ? `heading (level ${tag[1]})` : tag === 'p' ? 'paragraph' : 'generic', ok: tag !== 'span' },
              { label:'Characters', value: charCount, ok: headings.includes(tag) ? charCount <= 70 : true },
              { label:'Words', value: wordCount, ok: true },
            ].map((item, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.45)', borderRadius:8, padding:'10px 12px', border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, marginBottom:4 }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:600, color: item.ok ? T.text1 : '#dc2626', display:'flex', alignItems:'center', gap:6 }}>
                  {String(item.value)}
                  <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke={item.ok ? '#16a34a' : '#dc2626'} strokeWidth={1.5}>
                    {item.ok
                      ? <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round"/>
                      : <><line x1="3" y1="3" x2="7" y2="7" strokeLinecap="round"/><line x1="7" y1="3" x2="3" y2="7" strokeLinecap="round"/></>}
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, marginBottom:8 }}>Heading Hierarchy</div>
          <div style={{ background:'rgba(255,255,255,0.45)', borderRadius:8, padding:12, border:`1px solid ${T.border}`, fontFamily:mono, fontSize:11, lineHeight:2.2 }}>
            {headings.map(h => {
              const isActive = tag === h;
              return (
                <div key={h} style={{ paddingLeft: (parseInt(h[1])-1) * 16, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:4,
                    background: isActive ? T.accent : 'rgba(0,0,0,0.04)',
                    color: isActive ? '#fff' : T.text3,
                  }}>{h.toUpperCase()}</span>
                  <span style={{ color: isActive ? T.text1 : T.text3, fontWeight: isActive ? 500 : 400 }}>
                    {isActive ? fullText : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, marginBottom:8, marginTop:14 }}>Generated HTML Preview</div>
          <pre style={{ fontFamily:mono, fontSize:10, lineHeight:1.8, color:T.text2, whiteSpace:'pre-wrap', background:'rgba(255,255,255,0.45)', padding:12, borderRadius:8, border:`1px solid ${T.border}`, overflowX:'auto' }}>
{gc()}
          </pre>
        </div>
      );
    };

    const IssuesView = () => (
      <div style={{ padding:16 }}>
        {audit.issues.length > 0 && (
          <>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#dc2626', marginBottom:10 }}>Issues ({audit.issues.length})</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
              {audit.issues.map(issue => (
                <div key={issue.id} style={{ background: issue.severity === 'error' ? 'rgba(220,38,38,0.06)' : 'rgba(234,179,8,0.06)', border:`1px solid ${issue.severity === 'error' ? 'rgba(220,38,38,0.15)' : 'rgba(234,179,8,0.15)'}`, borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke={issue.severity === 'error' ? '#dc2626' : '#ca8a04'} strokeWidth={1.5}>
                      {issue.severity === 'error'
                        ? <><circle cx="5" cy="5" r="4"/><line x1="5" y1="3" x2="5" y2="5.5" strokeLinecap="round"/><circle cx="5" cy="7" r="0.4" fill={issue.severity === 'error' ? '#dc2626' : '#ca8a04'}/></>
                        : <><path d="M5 1L9.5 8.5H0.5Z"/><line x1="5" y1="4" x2="5" y2="6" strokeLinecap="round"/><circle cx="5" cy="7.2" r="0.4" fill="#ca8a04"/></>}
                    </svg>
                    <span style={{ fontSize:11, fontWeight:600, color: issue.severity === 'error' ? '#dc2626' : '#ca8a04' }}>{issue.label}</span>
                  </div>
                  <div style={{ fontSize:10, color:T.text2, paddingLeft:16 }}>{issue.detail}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#16a34a', marginBottom:10 }}>Passing ({audit.passes.length})</div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {audit.passes.map(pass => (
            <div key={pass.id} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', background:'rgba(22,163,74,0.04)', borderRadius:8, border:`1px solid rgba(22,163,74,0.08)` }}>
              <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="#16a34a" strokeWidth={1.5} style={{ flexShrink:0, marginTop:2 }}>
                <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div style={{ fontSize:11, fontWeight:500, color:T.text1, marginBottom:1 }}>{pass.label}</div>
                <div style={{ fontSize:10, color:T.text3 }}>{pass.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex:1, height:34, background:'none', border:'none', borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : '2px solid transparent',
              color: activeTab === tab.id ? T.text1 : T.text3, fontSize:10, fontWeight: activeTab === tab.id ? 600 : 400,
              letterSpacing:'0.04em', cursor:'pointer', fontFamily:'inherit',
              transition:`all 300ms ${EASE.out}`,
            }}>{tab.label}</button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {activeTab === 'tree'   && <TreeView/>}
          {activeTab === 'reader' && <ReaderView/>}
          {activeTab === 'seo'    && <SeoView/>}
          {activeTab === 'issues' && <IssuesView/>}
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div data-uid={uid} style={{
      position:'absolute', inset:0,
      background:'linear-gradient(145deg, #eef2f7 0%, #e8edf5 50%, #f0f3f8 100%)',
      display:'flex', flexDirection:'column',
      fontFamily: sysFont, fontSize:12, color:T.text1,
      WebkitFontSmoothing:'antialiased', overflow:'hidden',
    }}>

      {/* ── TOPBAR ── */}
      <div style={{ ...glassBar, display:'flex', alignItems:'center', gap:0, padding:'0 18px', height:48, flexShrink:0, zIndex:20, ...enter('tcFadeDown', 0) }}>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:T.text1, paddingRight:18, marginRight:6, borderRight:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>
          Text Combination
        </span>
        <div style={{ display:'flex', height:'100%', marginRight:'auto', marginLeft:6 }}>
          {['html','svg'].map((m,mi)=>(
            <button key={m} onClick={()=>setMode(m)} style={{
              height:'100%', padding:'0 14px', background:'none', border:'none',
              borderBottom: mode===m ? `2px solid ${T.accent}` : '2px solid transparent',
              color:mode===m?T.text1:T.text3, fontSize:11, fontWeight:mode===m?600:400,
              letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit',
              transition:`all 300ms ${EASE.out}`, ...enter('tcFadeDown', 60 + mi * 40),
            }}>{m.toUpperCase()}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:7, alignItems:'center' }}>
          {[
            { onClick:replay, icon:IcoReplay, label:'Replay', dark:false, d:120 },
            { onClick:copyCode, icon:IcoCopy, label:'Copy', dark:false, d:160 },
            { onClick:()=>setCodeOpen(o=>!o), icon:IcoCode, label:codeOpen?'Hide Code':'Code', dark:codeOpen, d:200 },
            { onClick:()=>setA11yOpen(o=>!o), icon:IcoA11y, label:a11yOpen?'Close A11y':'A11y', dark:a11yOpen, d:240 },
          ].map((b,bi)=>(
            <div key={bi} style={enter('tcSlideL', b.d)}>
              <TBtn onClick={b.onClick} icon={b.icon} dark={b.dark}>{b.label}</TBtn>
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:'flex', gap:12, padding:12, overflow:'hidden', minHeight:0 }}>

        {/* ── PANEL ── */}
        <div style={{ ...glassPanel, width:280, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden', ...enter('tcSlideR', 100) }}>

          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
            <span style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, marginRight:2, whiteSpace:'nowrap' }}>Seg</span>
            <div style={{ display:'flex', gap:3, flex:1, flexWrap:'wrap' }}>
              {Array.from({length:segCount},(_,i)=>(
                <button key={i} onClick={()=>setActiveSeg(i)} style={{
                  height:24, padding:'0 10px',
                  background: activeSeg===i ? T.accent : 'rgba(255,255,255,0.45)',
                  border: activeSeg===i ? 'none' : `1px solid ${T.ctrlBorder}`,
                  borderRadius:12, color:activeSeg===i?'#fff':T.text2,
                  fontSize:10, fontWeight:500, fontFamily:'inherit', cursor:'pointer',
                  transition:`all 300ms ${EASE.spring}`,
                  boxShadow: activeSeg===i ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                  transform: activeSeg===i ? 'scale(1.05)' : 'scale(1)',
                }}>{i+1}</button>
              ))}
            </div>
            <div style={{ display:'flex', border:`1px solid ${T.ctrlBorder}`, borderRadius:7, overflow:'hidden', height:24, flexShrink:0, background:'rgba(255,255,255,0.4)' }}>
              {['plus','minus'].map((type,di)=>(
                <button key={type} onClick={()=>{
                  const n=Math.max(1,Math.min(4,segCount+(di===0?1:-1)));
                  if(n!==segCount){setSegCount(n);if(activeSeg>=n)setActiveSeg(n-1);}
                }} style={{
                  width:24, height:24, background:'none', border:'none', color:T.text3,
                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  padding:0,
                  borderRight:type==='plus'?`1px solid ${T.border}`:'none',
                  transition:`all 300ms ${EASE.out}`,
                }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=T.accentSoft; e.currentTarget.querySelector('svg').style.stroke=T.accent; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='none'; e.currentTarget.querySelector('svg').style.stroke=T.text3; }}
                >
                  <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke={T.text3} strokeWidth={1.6} strokeLinecap="round">
                    {type==='plus' && <><line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/></>}
                    {type==='minus' && <line x1="1" y1="5" x2="9" y2="5"/>}
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* ── LAYER LIST (collapsible) ── */}
          <div style={{ borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
            <button onClick={() => setAcc(p => ({ ...p, layers: !p.layers }))}
              style={{
                display:'flex', alignItems:'center', padding:'0 14px', height:32,
                cursor:'pointer', userSelect:'none', width:'100%', textAlign:'left',
                background:'none', border:'none', fontFamily:'inherit',
                transition:`background 350ms ${EASE.out}`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.accentSoft}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width={8} height={10} viewBox="0 0 8 10" fill={acc.layers ? T.accent : T.text4} style={{ flexShrink:0, marginRight:8 }}>
                <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
                <circle cx="2" cy="5" r="1.2"/><circle cx="6" cy="5" r="1.2"/>
                <circle cx="2" cy="8" r="1.2"/><circle cx="6" cy="8" r="1.2"/>
              </svg>
              <span style={{
                fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase',
                color: acc.layers ? T.text1 : T.text3, flex:1,
                transition:`color 400ms ${EASE.out}`,
              }}>Layers</span>
              <span style={{ fontSize:9, color:T.text4, marginRight:8 }}>{segCount}</span>
              <svg width={10} height={6} viewBox="0 0 10 6" fill="none" stroke={acc.layers ? T.accent : T.text4} strokeWidth={1.5}
                style={{
                  transition:`transform 500ms ${EASE.spring}, stroke 400ms ${EASE.out}`,
                  transform: acc.layers ? 'rotate(0deg)' : 'rotate(-90deg)',
                  flexShrink:0,
                }}>
                <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div style={{
              display:'grid',
              gridTemplateRows: acc.layers ? '1fr' : '0fr',
              transition:`grid-template-rows 450ms ${EASE.out}`,
            }}>
              <div style={{ overflow:'hidden' }}>
                <div ref={layerRef} style={{
                  opacity: acc.layers ? 1 : 0,
                  transform: acc.layers ? 'translateY(0)' : 'translateY(-4px)',
                  transition:`opacity 350ms ${EASE.out} ${acc.layers ? '80ms' : '0ms'}, transform 450ms ${EASE.spring} ${acc.layers ? '40ms' : '0ms'}`,
                }}>
                  {segs.slice(0,segCount).map((seg,i) => (
                    <div key={i} data-layer-idx={i} style={{
                      display:'flex', alignItems:'center', gap:6, padding:'5px 12px',
                      background: activeSeg===i ? T.accentSoft : 'transparent',
                      cursor:'grab', userSelect:'none',
                      borderTop: `1px solid ${T.border}`,
                      transition:`background 300ms ${EASE.out}`,
                    }}
                      onClick={()=>{ setActiveSeg(i); setCanvasSel(i); }}
                    >
                      <svg width={8} height={10} viewBox="0 0 8 10" fill={T.text3} style={{ flexShrink:0, cursor:'grab' }}>
                        <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
                        <circle cx="2" cy="5" r="1.2"/><circle cx="6" cy="5" r="1.2"/>
                        <circle cx="2" cy="8" r="1.2"/><circle cx="6" cy="8" r="1.2"/>
                      </svg>
                      <span style={{ fontSize:9, fontWeight:700, color:T.accent, width:12 }}>{i+1}</span>
                      <span style={{ fontSize:10, color:T.text1, fontWeight:500, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:`'${seg.fontFamily}', sans-serif` }}>
                        {dispText(seg)}
                      </span>
                      <span style={{ fontSize:8, color:T.text3, flexShrink:0 }}>{seg.fontSize}px</span>
                      {i < segCount-1 && (
                        <div style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0, marginLeft:4 }}>
                          <svg width={6} height={6} viewBox="0 0 6 6" fill="none" stroke={T.text3} strokeWidth={0.8}>
                            <line x1="0" y1="3" x2="6" y2="3"/><line x1="3" y1="0" x2="3" y2="6"/>
                          </svg>
                          <input type="number" data-gap-idx={i} value={seg.gapAfter ?? gGap} min={0} max={200}
                            onClick={e => e.stopPropagation()}
                            onChange={e => {
                              const v = +e.target.value;
                              setSegs(prev => { const n=[...prev]; n[i]={...n[i], gapAfter: v}; return n; });
                            }}
                            style={{ width:32, height:18, fontSize:9, fontFamily:'inherit', textAlign:'center', border:`1px solid ${T.ctrlBorder}`, borderRadius:4, background:T.ctrl, color:T.text2, padding:0, outline:'none' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>

            <Acc open={acc.a1} onToggle={()=>setAcc(p=>({...p,a1:!p.a1}))} num="01" title="Text Style">
              <Row>
                <Field label="Text"><TxtIn val={s.text} onChange={v=>upd('text',v)}/></Field>
                <Field label="px" w={52}><NumIn val={s.fontSize} onChange={v=>upd('fontSize',v)} min={6} max={400}/></Field>
              </Row>
              <Row><Field label="Font Family"><Sel val={s.fontFamily} onChange={v=>upd('fontFamily',v)} opts={FONT_OPTS} fontPreview/></Field></Row>
              <Row>
                <Field label="Weight"><Sel val={s.fontWeight} onChange={v=>upd('fontWeight',v)} opts={O.weight}/></Field>
                <Field label="Case"><Sel val={s.textTransform} onChange={v=>upd('textTransform',v)} opts={O.case_}/></Field>
              </Row>
              <Row>
                <Field label="Tracking"><Sel val={s.letterSpacing} onChange={v=>upd('letterSpacing',v)} opts={O.track}/></Field>
                <Field label="Line Height"><Sel val={s.lineHeight} onChange={v=>upd('lineHeight',v)} opts={O.lh}/></Field>
              </Row>
              <Row>
                <Field label="Decoration"><Sel val={s.textDecoration} onChange={v=>upd('textDecoration',v)} opts={O.deco}/></Field>
                <Field label="Rotation"><Sel val={String(s.rotation)} onChange={v=>upd('rotation',+v)} opts={O.rot}/></Field>
              </Row>
              <TRow label="Italic" val={s.italic} onChange={v=>upd('italic',v)}/>
              <Sep/>
              <Row><Field label="Color"><ColorField val={s.color} onChange={v=>upd('color',v)}/></Field></Row>
            </Acc>

            <Acc open={acc.a2} onToggle={()=>setAcc(p=>({...p,a2:!p.a2}))} num="02" title="Composition">
              <Row>
                <Field label="Tag"><Sel val={gTag} onChange={setGTag} opts={O.tag}/></Field>
                <Field label="Direction"><Sel val={gDir} onChange={setGDir} opts={O.dir}/></Field>
              </Row>
              <Row>
                <Field label="Align"><Sel val={gAlign} onChange={setGAlign} opts={O.align}/></Field>
                <Field label="Base Gap" w={64}><NumIn val={gGap} onChange={setGGap} min={0} max={120}/></Field>
              </Row>
              <Row>
                <Field label="Padding" w={80}><NumIn val={gPad} onChange={setGPad} min={0} max={200}/></Field>
                <Field label=""/>
              </Row>
              <TRow label="Wrap" val={gWrap} onChange={setGWrap}/>
              <Sep/>
              <Row>
                <Field label="Trigger"><Sel val={gTrigger} onChange={setGTrigger} opts={O.trigger}/></Field>
                <Field label="Animation"><Sel val={gPreset} onChange={setGPreset} opts={O.preset}/></Field>
              </Row>
              <Row>
                <Field label="Duration"><Sel val={String(gDur)} onChange={v=>setGDur(+v)} opts={O.dur}/></Field>
                <Field label="Stagger"><Sel val={String(gStagger)} onChange={v=>setGStagger(+v)} opts={O.stag}/></Field>
              </Row>
              <Row>
                <Field label="Init Delay"><Sel val={String(gDelay)} onChange={v=>setGDelay(+v)} opts={O.delay}/></Field>
                <Field label="Easing"><Sel val={gEase} onChange={setGEase} opts={O.ease}/></Field>
              </Row>
            </Acc>

            <Acc open={acc.a3} onToggle={()=>setAcc(p=>({...p,a3:!p.a3}))} num="03" title="Effects">
              <Row><Field label="Effect"><Sel val={s.effect} onChange={v=>upd('effect',v)} opts={O.effect}/></Field></Row>
              <Sub show={s.effect==='outline'||s.effect==='retro'}>
                <Row>
                  <Field label="Stroke"><ColorField val={s.strokeColor} onChange={v=>upd('strokeColor',v)}/></Field>
                  <Field label="W" w={62}><Sel val={s.strokeWidth} onChange={v=>upd('strokeWidth',v)} opts={O.strokeW}/></Field>
                </Row>
                <TRow label="Hollow" val={s.strokeHollow} onChange={v=>upd('strokeHollow',v)}/>
              </Sub>
              <Sep/>
              <TRow label="Badge" val={s.badge} onChange={v=>upd('badge',v)}/>
              <Sub show={s.badge}>
                <Row><Field label="Color"><ColorField val={s.badgeColor} onChange={v=>upd('badgeColor',v)}/></Field></Row>
                <Row>
                  <Field label="Padding"><Sel val={s.badgePadding} onChange={v=>upd('badgePadding',v)} opts={O.badgePad}/></Field>
                  <Field label="Radius"><Sel val={s.badgeRadius} onChange={v=>upd('badgeRadius',v)} opts={O.badgeRad}/></Field>
                </Row>
              </Sub>
              <Sep/>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:28, opacity:mode==='svg'?1:0.35, transition:`opacity 300ms ${EASE.out}` }}>
                <span style={{ fontSize:11, color:T.text2 }}>
                  Gradient
                  <span style={{ fontSize:8, letterSpacing:'0.07em', textTransform:'uppercase', color:T.accent, background:T.accentSoft, padding:'2px 6px', borderRadius:4, marginLeft:6, fontWeight:600 }}>SVG</span>
                </span>
                <Sw val={s.gradient&&mode==='svg'} onChange={v=>mode==='svg'&&upd('gradient',v)}/>
              </div>
              <Sub show={s.gradient&&mode==='svg'}>
                <Row><Field label="From"><ColorField val={s.gradStart} onChange={v=>upd('gradStart',v)}/></Field></Row>
                <Row><Field label="To"><ColorField val={s.gradEnd} onChange={v=>upd('gradEnd',v)}/></Field></Row>
                <Row><Field label="Direction"><Sel val={s.gradDir} onChange={v=>upd('gradDir',v)} opts={O.gradDir}/></Field></Row>
              </Sub>
            </Acc>

          </div>
        </div>

        {/* ── CANVAS ── */}
        <div style={{ ...glassPanel, flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden', ...enter('tcScale', 140) }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 16px', height:42, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
            <span style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, marginRight:4 }}>
              {a11yOpen ? 'Accessibility' : 'Canvas'}
            </span>
            {!a11yOpen && <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              {BG_SWATCHES.map(v=>(
                <button key={v} onClick={()=>setBgColor(v)} title={v} style={{
                  width:16, height:16, borderRadius:'50%', background:v,
                  border: bgColor===v ? `2px solid ${T.accent}` : `1px solid ${T.border2}`,
                  cursor:'pointer', boxSizing:'border-box', padding:0,
                  transform:bgColor===v?'scale(1.35)':'scale(1)',
                  transition:`all 300ms ${EASE.spring}`,
                  boxShadow: bgColor===v ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
                }}/>
              ))}
            </div>}
            <div style={{ flex:1 }}/>
            {a11yOpen && <A11yScoreBadge segs={segs} segCount={segCount} gTag={gTag} mode={mode}/>}
            <span style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.accent, padding:'3px 8px', background:T.accentSoft, borderRadius:6 }}>
              {a11yOpen ? 'AUDIT' : mode.toUpperCase()}
            </span>
          </div>

          {a11yOpen ? (
            <A11yPanel segs={segs} segCount={segCount} gTag={gTag} gDir={gDir} gAlign={gAlign} gGap={gGap} gWrap={gWrap} mode={mode} dispText={dispText} fxStyle={fxStyle} segStyle={segStyle} genCode={genCode}/>
          ) : (
            <>
              <div ref={stageRef} onClick={() => setCanvasSel(null)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:bgColor, overflow:'hidden', transition:`background 300ms ${EASE.out}`, padding:gPad, borderRadius:'0 0 13px 0' }}>
                {mode === 'html' ? buildHTML() : buildSVG()}
              </div>

              <div style={{ borderTop:`1px solid ${T.border}`, flexShrink:0, maxHeight:codeOpen?'42%':40, overflow:'hidden', transition:`max-height 350ms ${EASE.out}` }}>
                <button onClick={()=>setCodeOpen(o=>!o)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'0 16px', height:40, cursor:'pointer', userSelect:'none', width:'100%', background:'none', border:'none', fontFamily:'inherit', transition:`background 300ms ${EASE.out}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.accentSoft}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:T.text4 }}>Generated Code</span>
                  <div style={{ flex:1 }}/>
                  <svg width={10} height={6} viewBox="0 0 10 6" fill="none" stroke={codeOpen?T.accent:T.text4} strokeWidth={1.5}
                    style={{ transition:`transform 300ms ${EASE.out}, stroke 300ms ${EASE.out}`, transform:codeOpen?'rotate(0deg)':'rotate(-90deg)', flexShrink:0 }}>
                    <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div style={{ padding:'10px 16px 16px', background:'rgba(0,0,0,0.02)', overflowY:'auto', maxHeight:'calc(42% - 40px)' }}>
                  <pre style={{ fontFamily:"'SF Mono','Fira Code',monospace", fontSize:10, lineHeight:1.7, color:T.text2, whiteSpace:'pre', overflowX:'auto', background:'rgba(255,255,255,0.4)', padding:12, borderRadius:8, border:`1px solid ${T.border}` }}>
                    {genCode()}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TOAST ── */}
      <div style={{
        position:'fixed', bottom:20, right:20,
        background:'rgba(15,23,42,0.88)',
        backdropFilter:'blur(16px) saturate(120%)', WebkitBackdropFilter:'blur(16px) saturate(120%)',
        color:'#fff', borderRadius:12, padding:'9px 18px',
        fontSize:12, fontWeight:500, letterSpacing:'0.01em',
        boxShadow:'0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        opacity:toast?1:0, transform:toast?'none':'translateY(8px) scale(0.96)',
        transition:`all 300ms ${EASE.spring}`, pointerEvents:'none', zIndex:999,
      }}>Copied to clipboard</div>

    </div>
  );
}

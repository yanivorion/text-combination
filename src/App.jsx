import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sortable } from '@shopify/draggable';

// ─── Persistence helpers ────────────────────────────────────────────────────────
const LS_KEY = 'tc_creations';
const SAVE_FIELDS = ['segs','segCount','mode','bgColor','gTag','gDir','gAlign','gGap','gPad','gWrap','gTrigger','gPreset','gDur','gStagger','gDelay','gEase'];
const API = '/api/creations';

const lsCache  = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } };
const lsSync   = (list) => { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {} };

const api = async (method, opts = {}) => {
  try {
    const { id, body } = opts;
    const url = id ? `${API}?id=${id}` : API;
    const res = await fetch(url, {
      method,
      ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(res.statusText);
    const list = await res.json();
    lsSync(list);
    return list;
  } catch {
    return null;
  }
};

const cloudRead   = ()             => api('GET');
const cloudSave   = (name, snap)   => api('POST',   { body: { name, snap } });
const cloudDel    = (id)           => api('DELETE',  { id });
const cloudRename = (id, name)     => api('PATCH',  { id, body: { name } });
const cloudPut    = (list)         => api('PUT',     { body: list });

const stateToSnap = (g) => {
  const o = {};
  SAVE_FIELDS.forEach(k => { o[k] = g[k]; });
  return o;
};

const snapEncode = (snap) => {
  try { return btoa(encodeURIComponent(JSON.stringify(snap))); } catch { return ''; }
};
const snapDecode = (str) => {
  try { return JSON.parse(decodeURIComponent(atob(str))); } catch { return null; }
};

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
  layering:false, layerCount:4, layerColors:['#8b5cf6','#c084fc','#f59e0b','#fbbf24'], layerAngle:150, layerSpace:6,
  twist:false, twistPattern:'wave', twistOffset:10, twistApply:'char',
  gapAfter:null, offsetX:0, offsetY:0,
});

const COMBO_PRESETS = [
  { name:'Script + Sans', segs:[
    { text:'New', fontFamily:'Pacifico', fontSize:48, fontWeight:'400', color:'#ef4444', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'COLLECTION', fontFamily:'Bebas Neue', fontSize:56, fontWeight:'400', color:'#18181b', letterSpacing:'0.1em', textTransform:'uppercase', italic:false },
  ]},
  { name:'Bold + Script', segs:[
    { text:'BOLD', fontFamily:'Abril Fatface', fontSize:64, fontWeight:'400', color:'#1d4ed8', letterSpacing:'0em', textTransform:'uppercase', italic:false },
    { text:'& Retro', fontFamily:'Lobster', fontSize:48, fontWeight:'400', color:'#f59e0b', letterSpacing:'0em', textTransform:'none', italic:true },
  ]},
  { name:'Sticker Pop', segs:[
    { text:'WOW!', fontFamily:'Bebas Neue', fontSize:72, fontWeight:'400', color:'#ffffff', letterSpacing:'0em', textTransform:'uppercase', italic:false, effect:'retro', strokeColor:'#000000', strokeWidth:'3px' },
  ]},
  { name:'Neon Glow', segs:[
    { text:'NEON', fontFamily:'Space Grotesk', fontSize:64, fontWeight:'700', color:'#00ffdd', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, effect:'neon-glow' },
  ]},
  { name:'Stacked', dir:'column', segs:[
    { text:'COMING', fontFamily:'Inter', fontSize:24, fontWeight:'300', color:'#71717a', letterSpacing:'0.2em', textTransform:'uppercase', italic:false },
    { text:'SOON', fontFamily:'Bebas Neue', fontSize:72, fontWeight:'400', color:'#18181b', letterSpacing:'0.15em', textTransform:'uppercase', italic:false },
  ]},
  { name:'CTA Badge', segs:[
    { text:'CALL', fontFamily:'Abril Fatface', fontSize:56, fontWeight:'400', color:'#059669', letterSpacing:'0em', textTransform:'uppercase', italic:false },
    { text:'NOW', fontFamily:'Inter', fontSize:32, fontWeight:'700', color:'#ffffff', letterSpacing:'0em', textTransform:'uppercase', italic:false, badge:true, badgeColor:'#059669', badgePadding:'6px 14px', badgeRadius:'6px' },
  ]},
  { name:'Vintage', segs:[
    { text:'Exclusive', fontFamily:'Playfair Display', fontSize:40, fontWeight:'400', color:'#78350f', letterSpacing:'0em', textTransform:'none', italic:true },
    { text:'VINTAGE', fontFamily:'Josefin Sans', fontSize:48, fontWeight:'700', color:'#78350f', letterSpacing:'0.1em', textTransform:'uppercase', italic:false, textDecoration:'underline' },
  ]},
  { name:'3D Extrude', segs:[
    { text:'FUTURE', fontFamily:'Bebas Neue', fontSize:96, fontWeight:'400', color:'#ec4899', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, layering:true, layerCount:5, layerColors:['#8b5cf6','#c084fc','#f59e0b','#fbbf24','#e879f9'], layerAngle:150, layerSpace:6 },
  ]},
  { name:'Minimal', segs:[
    { text:'Prepared for', fontFamily:'Inter', fontSize:20, fontWeight:'300', color:'#71717a', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'CLIENT', fontFamily:'Inter', fontSize:40, fontWeight:'600', color:'#18181b', letterSpacing:'0.05em', textTransform:'uppercase', italic:false },
  ]},
  { name:'Celebration', segs:[
    { text:"It's my", fontFamily:'Lobster', fontSize:36, fontWeight:'400', color:'#8b5cf6', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'PARTY!', fontFamily:'Bebas Neue', fontSize:56, fontWeight:'400', color:'#ec4899', letterSpacing:'0.05em', textTransform:'uppercase', italic:false },
  ]},
  { name:'Win Win', dir:'column', gap:0, segs:[
    { text:'WIN', fontFamily:'Bebas Neue', fontSize:72, fontWeight:'400', color:'#dc2626', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, lineHeight:'0.85' },
    { text:'WIN', fontFamily:'Bebas Neue', fontSize:72, fontWeight:'400', color:'#dc2626', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, lineHeight:'0.85' },
  ]},
  { name:'Sale Event', segs:[
    { text:'SALE', fontFamily:'DM Serif Display', fontSize:48, fontWeight:'400', color:'#18181b', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, textDecoration:'line-through' },
    { text:'is On', fontFamily:'Pacifico', fontSize:28, fontWeight:'400', color:'#b45309', letterSpacing:'0em', textTransform:'none', italic:false },
  ]},
  { name:'Open Colorful', segs:[
    { text:'O', fontFamily:'Titan One', fontSize:56, fontWeight:'400', color:'#18181b', letterSpacing:'0em', textTransform:'uppercase', italic:false, badge:true, badgeColor:'#fbbf24', badgePadding:'4px 12px', badgeRadius:'999px' },
    { text:'P', fontFamily:'Titan One', fontSize:56, fontWeight:'400', color:'#ffffff', letterSpacing:'0em', textTransform:'uppercase', italic:false, badge:true, badgeColor:'#16a34a', badgePadding:'4px 12px', badgeRadius:'999px' },
    { text:'E', fontFamily:'Titan One', fontSize:56, fontWeight:'400', color:'#ffffff', letterSpacing:'0em', textTransform:'uppercase', italic:false, badge:true, badgeColor:'#ea580c', badgePadding:'4px 12px', badgeRadius:'999px' },
    { text:'N', fontFamily:'Titan One', fontSize:56, fontWeight:'400', color:'#ffffff', letterSpacing:'0em', textTransform:'uppercase', italic:false, badge:true, badgeColor:'#2563eb', badgePadding:'4px 12px', badgeRadius:'999px' },
  ]},
  { name:'Rate Us', dir:'column', gap:0, segs:[
    { text:'PLEASE', fontFamily:'Bebas Neue', fontSize:40, fontWeight:'400', color:'#18181b', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, lineHeight:'0.95' },
    { text:'RATE', fontFamily:'Bebas Neue', fontSize:56, fontWeight:'400', color:'#18181b', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, lineHeight:'0.95' },
    { text:'US', fontFamily:'Bebas Neue', fontSize:48, fontWeight:'400', color:'#18181b', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, lineHeight:'0.95' },
  ]},
  { name:'Join Us', dir:'column', gap:0, segs:[
    { text:'Join', fontFamily:'Playfair Display', fontSize:40, fontWeight:'400', color:'#991b1b', letterSpacing:'0em', textTransform:'none', italic:false, lineHeight:'1.1' },
    { text:'Us', fontFamily:'Playfair Display', fontSize:40, fontWeight:'400', color:'#991b1b', letterSpacing:'0em', textTransform:'none', italic:false, lineHeight:'1.1' },
    { text:'Now', fontFamily:'Playfair Display', fontSize:40, fontWeight:'400', color:'#991b1b', letterSpacing:'0em', textTransform:'none', italic:false, lineHeight:'1.1' },
  ]},
  { name:'Construction', dir:'column', gap:4, segs:[
    { text:'Under', fontFamily:'Inter', fontSize:22, fontWeight:'400', color:'#18181b', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'Construction', fontFamily:'Inter', fontSize:22, fontWeight:'400', color:'#18181b', letterSpacing:'0em', textTransform:'none', italic:false, badge:true, badgeColor:'#fef3c7', badgePadding:'4px 12px', badgeRadius:'3px' },
  ]},
  { name:'Agenda', dir:'column', gap:8, segs:[
    { text:'Agenda', fontFamily:'Playfair Display', fontSize:48, fontWeight:'400', color:'#18181b', letterSpacing:'0em', textTransform:'none', italic:true },
    { text:'ENJOY.  EAT.  CREATE', fontFamily:'Josefin Sans', fontSize:12, fontWeight:'300', color:'#71717a', letterSpacing:'0.15em', textTransform:'uppercase', italic:false },
  ]},
  { name:'Party Badge', segs:[
    { text:"IT'S MY", fontFamily:'Josefin Sans', fontSize:16, fontWeight:'300', color:'#18181b', letterSpacing:'0.1em', textTransform:'uppercase', italic:false },
    { text:'PARTY', fontFamily:'Bebas Neue', fontSize:48, fontWeight:'400', color:'#ffffff', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, badge:true, badgeColor:'#f59e0b', badgePadding:'4px 14px', badgeRadius:'3px' },
  ]},
  { name:'So On', dir:'column', gap:0, segs:[
    { text:'COMING', fontFamily:'Inter', fontSize:14, fontWeight:'300', color:'#71717a', letterSpacing:'0.2em', textTransform:'uppercase', italic:false },
    { text:'SO', fontFamily:'Bebas Neue', fontSize:64, fontWeight:'400', color:'#18181b', letterSpacing:'0.1em', textTransform:'uppercase', italic:false, lineHeight:'0.95' },
    { text:'ON', fontFamily:'Bebas Neue', fontSize:64, fontWeight:'400', color:'#18181b', letterSpacing:'0.1em', textTransform:'uppercase', italic:false, lineHeight:'0.85' },
  ]},
  { name:'Site Notice', dir:'column', gap:6, segs:[
    { text:'Site under', fontFamily:'Inter', fontSize:16, fontWeight:'300', color:'#71717a', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'construction', fontFamily:'Unbounded', fontSize:26, fontWeight:'400', color:'#18181b', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'COMING SOON.', fontFamily:'Inter', fontSize:10, fontWeight:'300', color:'#71717a', letterSpacing:'0.15em', textTransform:'uppercase', italic:false },
  ]},
  { name:'Coming Soon', dir:'column', gap:0, segs:[
    { text:'C O M I N G', fontFamily:'Josefin Sans', fontSize:14, fontWeight:'300', color:'#18181b', letterSpacing:'0.3em', textTransform:'uppercase', italic:false, textDecoration:'overline' },
    { text:'S O O N', fontFamily:'Josefin Sans', fontSize:14, fontWeight:'300', color:'#18181b', letterSpacing:'0.3em', textTransform:'uppercase', italic:false, textDecoration:'underline' },
  ]},
  { name:'Business Card', dir:'column', align:'flex-start', gap:4, segs:[
    { text:'CREATED FOR', fontFamily:'Josefin Sans', fontSize:10, fontWeight:'300', color:'#71717a', letterSpacing:'0.2em', textTransform:'uppercase', italic:false },
    { text:'BILLY WESTOR', fontFamily:'Bebas Neue', fontSize:36, fontWeight:'400', color:'#18181b', letterSpacing:'0.05em', textTransform:'uppercase', italic:false },
    { text:'Head Executive, Polero Builders Inc.', fontFamily:'Inter', fontSize:9, fontWeight:'400', color:'#71717a', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'11 Olive Rd, Huntington Station, NY', fontFamily:'Inter', fontSize:8, fontWeight:'300', color:'#a1a1aa', letterSpacing:'0em', textTransform:'none', italic:false },
  ]},
  { name:'Legacies', segs:[
    { text:'Legacies', fontFamily:'Playfair Display', fontSize:80, fontWeight:'400', color:'#d4d4d8', letterSpacing:'0em', textTransform:'none', italic:false },
  ]},
  { name:'Pizza Time', dir:'column', gap:2, segs:[
    { text:'Pizza', fontFamily:'Pacifico', fontSize:56, fontWeight:'400', color:'#dc2626', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'TIME', fontFamily:'Bebas Neue', fontSize:36, fontWeight:'400', color:'#f59e0b', letterSpacing:'0.1em', textTransform:'uppercase', italic:false, layering:true, layerCount:3, layerColors:['#fbbf24','#fcd34d','#fef3c7'], layerAngle:150, layerSpace:3 },
  ]},
  { name:'Proposal', dir:'column', align:'flex-start', gap:4, segs:[
    { text:'Prepared for', fontFamily:'Lobster', fontSize:16, fontWeight:'400', color:'#71717a', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'HALLIWELL STUDIO', fontFamily:'Inter', fontSize:14, fontWeight:'600', color:'#18181b', letterSpacing:'0.1em', textTransform:'uppercase', italic:false },
    { text:'PROPOSAL', fontFamily:'Bebas Neue', fontSize:64, fontWeight:'400', color:'#18181b', letterSpacing:'0.05em', textTransform:'uppercase', italic:false },
  ]},
  { name:'Graduation', dir:'column', gap:2, segs:[
    { text:'Congrats!', fontFamily:'Pacifico', fontSize:22, fontWeight:'400', color:'#71717a', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'MICHAEL', fontFamily:'Bebas Neue', fontSize:48, fontWeight:'400', color:'#18181b', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, lineHeight:'0.95' },
    { text:'DALE', fontFamily:'Bebas Neue', fontSize:48, fontWeight:'400', color:'#18181b', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, lineHeight:'0.95' },
    { text:'Class of 2021', fontFamily:'Inter', fontSize:11, fontWeight:'300', color:'#71717a', letterSpacing:'0.05em', textTransform:'none', italic:false },
  ]},
  { name:'Wedding', dir:'column', gap:8, segs:[
    { text:'Thank you for coming!', fontFamily:'Pacifico', fontSize:20, fontWeight:'400', color:'#18181b', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'We would like to express our sincerest gratitude for celebrating our wedding with us.', fontFamily:'Inter', fontSize:9, fontWeight:'300', color:'#71717a', letterSpacing:'0em', textTransform:'none', italic:false, lineHeight:'1.5' },
    { text:'BELLA & BRYLE', fontFamily:'Josefin Sans', fontSize:12, fontWeight:'600', color:'#18181b', letterSpacing:'0.1em', textTransform:'uppercase', italic:false },
  ]},
  { name:'Dictionary', dir:'column', align:'flex-start', gap:8, segs:[
    { text:'35%', fontFamily:'Inter', fontSize:72, fontWeight:'800', color:'#18181b', letterSpacing:'-0.05em', textTransform:'none', italic:false },
    { text:'the action or activity of gathering information about consumers\u2019 needs and preferences.', fontFamily:'Inter', fontSize:12, fontWeight:'300', color:'#52525b', letterSpacing:'0em', textTransform:'none', italic:false, lineHeight:'1.5' },
  ]},
  { name:'Enroll', segs:[
    { text:'Enroll', fontFamily:'Bebas Neue', fontSize:48, fontWeight:'400', color:'#dc2626', letterSpacing:'0em', textTransform:'none', italic:false, rotation:-5 },
    { text:'Now!', fontFamily:'Bebas Neue', fontSize:48, fontWeight:'400', color:'#ffffff', letterSpacing:'0em', textTransform:'none', italic:false, badge:true, badgeColor:'#eab308', badgePadding:'6px 14px', badgeRadius:'6px', rotation:5 },
  ]},
  { name:'Postcard', dir:'column', align:'flex-start', gap:6, segs:[
    { text:'CHESTER,', fontFamily:'Josefin Sans', fontSize:10, fontWeight:'600', color:'#71717a', letterSpacing:'0.15em', textTransform:'uppercase', italic:false },
    { text:'Finally found my new home!', fontFamily:'DM Serif Display', fontSize:28, fontWeight:'400', color:'#18181b', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:"LET'S KEEP IN TOUCH.", fontFamily:'Josefin Sans', fontSize:8, fontWeight:'300', color:'#71717a', letterSpacing:'0.1em', textTransform:'uppercase', italic:false },
    { text:'Anna', fontFamily:'Pacifico', fontSize:16, fontWeight:'400', color:'#18181b', letterSpacing:'0em', textTransform:'none', italic:false },
  ]},
  { name:'Open Daily', segs:[
    { text:'open', fontFamily:'Pacifico', fontSize:32, fontWeight:'400', color:'#f59e0b', letterSpacing:'0em', textTransform:'none', italic:false },
    { text:'DAILY', fontFamily:'Bebas Neue', fontSize:52, fontWeight:'400', color:'#ea580c', letterSpacing:'0.05em', textTransform:'uppercase', italic:false, effect:'retro', strokeColor:'#fbbf24', strokeWidth:'2px' },
  ]},
];

const TOUR_STEPS = [
  { sel:'[data-tour="topbar"]', title:'Toolbar', desc:'Switch between HTML and SVG render modes. Replay animations, copy generated code, audit accessibility, or browse the presets gallery.', pos:'bottom' },
  { sel:'[data-tour="seg-select"]', title:'Segments', desc:'Your composition is built from up to 4 text segments. Select one to edit its style, or use + and \u2212 to add and remove segments.', pos:'bottom' },
  { sel:'[data-tour="text-style"]', title:'Text Style', desc:'Style the active segment \u2014 change text content, font family, size, weight, color, letter-spacing, line-height, case, decoration, and rotation.', pos:'right' },
  { sel:'[data-tour="composition"]', title:'Composition', desc:'Control the overall layout: direction, alignment, gap, padding, and wrapping. Set up entrance animations with trigger, preset, duration, stagger, delay, and easing.', pos:'right' },
  { sel:'[data-tour="effects"]', title:'Effects', desc:'Apply visual effects to each segment: stroke outline, shadows, 3D extrude, neon glow, retro. Plus layering, text twist, badges, and SVG gradients.', pos:'right' },
  { sel:'[data-tour="canvas"]', title:'Canvas', desc:'Your live preview. Click a segment to select it and drag to reposition. Double-click to reset. Use the corner handle to rotate.', pos:'left' },
  { sel:'[data-tour="layers"]', title:'Layers', desc:'View all segments at a glance. Drag to reorder, click to select. Adjust per-segment gaps. Grab the header to drag this panel anywhere on the canvas.', pos:'right' },
  { sel:'[data-tour="bg-swatches"]', title:'Background', desc:'Preview your design against different canvas colors \u2014 light, warm, dark, and deep tones \u2014 to see how it looks in different contexts.', pos:'bottom' },
  { sel:'[data-tour="presets-btn"]', title:'Presets', desc:'Open a gallery of 30 ready-made text combinations. Click any preset to instantly apply its fonts, colors, effects, and layout.', pos:'bottom' },
];

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
  twistPat: [{v:'wave',l:'Wave'},{v:'bounce',l:'Bounce'},{v:'collage',l:'Collage'}],
  twistApply:[{v:'char',l:'Character'},{v:'word',l:'Word'}],
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
    const onScroll = (e) => { if (menuRef.current?.contains(e.target)) return; setOpen(false); };
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

const Acc = ({ open, onToggle, num, title, children, ...rest }) => (
  <div {...rest} style={{ borderBottom:`1px solid ${T.border}` }}>
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
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [tourStep,    setTourStep]    = useState(-1);
  const [tourRect,    setTourRect]    = useState(null);
  const [acc,      setAcc]      = useState({ layers:true, a1:true, a2:true, a3:true, a4:false });
  const [toast,    setToast]    = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [canvasSel,setCanvasSel]= useState(null);
  const [layerPos, setLayerPos] = useState({ x:12, y:12 });
  const [dragRot,  setDragRot]  = useState(false);
  const [creationsOpen, setCreationsOpen] = useState(false);
  const [creations, setCreations] = useState(lsCache);
  const [saveToast, setSaveToast] = useState('');
  const [cloudReady, setCloudReady] = useState(false);
  const [presentMode, setPresentMode] = useState(false);
  const [presentSlide, setPresentSlide] = useState(0);
  const fileInputRef = useRef(null);
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

  const applyComboPreset = (preset) => {
    const newSegs = preset.segs.map((ps, i) => ({
      ...mkSeg(i + 1),
      ...ps,
      textDecoration: ps.textDecoration || 'none',
      lineHeight: ps.lineHeight || '1',
      rotation: ps.rotation || 0,
    }));
    while (newSegs.length < 4) newSegs.push(mkSeg(newSegs.length + 1));
    setSegs(newSegs);
    setSegCount(preset.segs.length);
    setActiveSeg(0);
    setGDir(preset.dir || 'row');
    setGAlign(preset.align || 'center');
    setGGap(preset.gap !== undefined ? preset.gap : 16);
  };

  // ── Save / Load / Share helpers ────────────────────────────────────────────
  const getSnap = () => stateToSnap({ segs, segCount, mode, bgColor, gTag, gDir, gAlign, gGap, gPad, gWrap, gTrigger, gPreset, gDur, gStagger, gDelay, gEase });

  const restoreSnap = (snap) => {
    if (!snap) return;
    if (snap.segs) { const ns = snap.segs.slice(); while (ns.length < 4) ns.push(mkSeg(ns.length + 1)); setSegs(ns); }
    if (snap.segCount != null) setSegCount(snap.segCount);
    if (snap.mode)     setMode(snap.mode);
    if (snap.bgColor)  setBgColor(snap.bgColor);
    if (snap.gTag)     setGTag(snap.gTag);
    if (snap.gDir)     setGDir(snap.gDir);
    if (snap.gAlign)   setGAlign(snap.gAlign);
    if (snap.gGap != null) setGGap(snap.gGap);
    if (snap.gPad != null) setGPad(snap.gPad);
    if (snap.gWrap != null) setGWrap(snap.gWrap);
    if (snap.gTrigger) setGTrigger(snap.gTrigger);
    if (snap.gPreset)  setGPreset(snap.gPreset);
    if (snap.gDur != null)     setGDur(snap.gDur);
    if (snap.gStagger != null) setGStagger(snap.gStagger);
    if (snap.gDelay != null)   setGDelay(snap.gDelay);
    if (snap.gEase)    setGEase(snap.gEase);
    setActiveSeg(0);
    setCanvasSel(null);
  };

  const handleSave = async () => {
    const name = prompt('Name your creation:');
    if (!name) return;
    const snap = getSnap();
    const list = await cloudSave(name.trim(), snap);
    if (list) { setCreations(list); setSaveToast('Saved!'); }
    else setSaveToast('Save failed');
    setTimeout(() => setSaveToast(''), 2000);
  };

  const handleShare = () => {
    const encoded = snapEncode(getSnap());
    const url = `${window.location.origin}${window.location.pathname}#creation=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setSaveToast('Share link copied!');
      setTimeout(() => setSaveToast(''), 2500);
    });
  };

  const handleExport = () => {
    const snap = getSnap();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `text-combination-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const snap = JSON.parse(ev.target.result);
        restoreSnap(snap);
        setSaveToast('Imported!');
        setTimeout(() => setSaveToast(''), 2000);
      } catch { setSaveToast('Invalid file'); setTimeout(() => setSaveToast(''), 2000); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [demoMode, setDemoMode] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#creation=')) {
      const snap = snapDecode(hash.slice('#creation='.length));
      if (snap) { restoreSnap(snap); window.history.replaceState(null, '', window.location.pathname); }
    }
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo) {
      setDemoMode(demo);
      const presetMap = {
        style: 'Win Win', layout: 'Open Colorful', effects: 'Neon Glow',
        animation: 'Script + Sans', wrapper: 'Sale Event', screenreader: 'Join Us',
        custom: 'Business Card', html: 'Sale Event', svg: 'Neon Glow',
        compare: 'Sale Event', 'flow-preset': null, 'flow-edit': 'Rate Us',
        'flow-style': 'Construction', 'flow-effects': 'Sticker Pop', 'flow-publish': 'Join Us',
      };
      const panelMap = {
        style: 'a1', layout: 'a2', effects: 'a3', animation: 'a2',
        wrapper: 'a1', screenreader: null, custom: 'a1',
        html: 'a1', svg: 'a1', compare: 'a1',
        'flow-preset': null, 'flow-edit': null, 'flow-style': 'a1',
        'flow-effects': 'a3', 'flow-publish': null,
      };
      const bgMap = {
        effects: '#0a0a0a', animation: '#ffffff', svg: '#0a0a0a',
        'flow-effects': '#0a0a0a', screenreader: '#0a0a0a',
      };
      const modeMap = { svg: 'svg', html: 'html', compare: 'html' };
      if (presetMap[demo]) {
        const p = COMBO_PRESETS.find(c => c.name === presetMap[demo]);
        if (p) setTimeout(() => applyComboPreset(p), 100);
      }
      if (panelMap[demo]) setTimeout(() => setAcc(prev => ({ ...prev, a1:false, a2:false, a3:false, a4:false, [panelMap[demo]]:true })), 150);
      if (bgMap[demo]) setTimeout(() => setBgColor(bgMap[demo]), 100);
      if (modeMap[demo]) setTimeout(() => setMode(modeMap[demo]), 100);
      if (demo === 'flow-preset') setTimeout(() => setPresetsOpen(true), 200);
      if (demo === 'screenreader') setTimeout(() => setA11yOpen(true), 200);
    }
  }, []);

  useEffect(() => {
    cloudRead().then(async (cloud) => {
      if (cloud) {
        const local = lsCache();
        if (local.length && !cloud.length) {
          const migrated = await cloudPut(local);
          if (migrated) { setCreations(migrated); setCloudReady(true); return; }
        }
        setCreations(cloud);
      }
      setCloudReady(true);
    });
  }, []);

  // ── Tour spotlight ─────────────────────────────────────────────────────────
  const accBeforeTour = useRef(null);
  useEffect(() => {
    if (tourStep < 0) {
      setTourRect(null);
      if (accBeforeTour.current) { setAcc(accBeforeTour.current); accBeforeTour.current = null; }
      return;
    }
    if (!accBeforeTour.current) accBeforeTour.current = { ...acc };
    const step = TOUR_STEPS[tourStep];
    const accMap = { '[data-tour="text-style"]':'a1', '[data-tour="composition"]':'a2', '[data-tour="effects"]':'a3' };
    const openKey = accMap[step.sel];
    setAcc({ layers:true, a1: openKey === 'a1', a2: openKey === 'a2', a3: openKey === 'a3' });
    const measure = () => {
      const el = document.querySelector(step.sel);
      if (!el) { setTourRect(null); return; }
      el.scrollIntoView({ block:'nearest', behavior:'instant' });
      setTourRect(el.getBoundingClientRect());
    };
    const t = setTimeout(measure, 480);
    const onResize = () => { const el = document.querySelector(step.sel); if (el) setTourRect(el.getBoundingClientRect()); };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, [tourStep]);

  // ── Presentation mode ──────────────────────────────────────────────────────
  const PRESENT_SLIDES = [
    { type:'cover' },
    { type:'agenda' },

    // ── Ch 1: User Intent ───────────────────────────────────────────────────
    { type:'chapter', num:1, title:'User Intent',
      summary:'A bundle of styled text components that together create a single visual composition, like a designed sticker.' },
    { type:'content', chapterNum:1, chapterTitle:'User Intent', section:'What',
      body:'A text combination is a bundle of styled text components that together form a single visual composition\u2014like a designed sticker. Users want an editable, pre-designed element they can drop on their site: creative, impressive, and easy to customize.',
      demo:'definition' },

    // ── Ch 2: The Problem ───────────────────────────────────────────────────
    { type:'chapter', num:2, title:'The Problem',
      summary:'Each text component has its own HTML tag. Reading order, semantics, and accessibility are broken for screen readers and search engines.' },
    { type:'content', chapterNum:2, chapterTitle:'The Problem', section:'Semantics, Accessibility and Reading Order',
      body:'Multiple independent heading tags confuse Google\u2019s hierarchy. A composition of H1 + H2 + H3 is treated as three separate headings, not one combined message. Screen readers announce disconnected fragments with no defined reading order. The accessibility team blocks shipping in the current form\u2014a proper HTML solution is required before release.',
      demo:'seo' },

    // ── Ch 3: Research ────────────────────────────────────────────────────
    { type:'chapter', num:3, title:'Research',
      summary:'Canva, Adobe Express, and Figma Sites already offer text compositions. Users are asking for this. We need to close the gap.' },
    { type:'content', chapterNum:3, chapterTitle:'Research', section:'Market',
      body:'Canva offers premade text combination presets via grouped elements. Adobe Express ships styled compositions with a rich preset library. Figma is moving into web building where text styling is a key differentiator.',
      demo:'competitors' },

    // ── Ch 4: Our Approach ──────────────────────────────────────────────────
    { type:'chapter', num:4, title:'Our Approach',
      summary:'A new designated component with 2 output alternatives: HTML Mode or SVG Mode.' },
    { type:'content', chapterNum:4, chapterTitle:'Our Approach', section:'New Designated Component',
      body:'This is not regular text components grouped together. It\u2019s a new custom component with a new experience. Content is edited in a panel\u2014not on the canvas. The DOM order stays correct at all times, and screen readers read the composition as a single semantic unit.',
      demo:'custom' },
    { type:'content', chapterNum:4, chapterTitle:'Our Approach', section:'HTML Mode',
      body:'Full SEO value with direct heading weight. Native accessibility\u2014no workarounds. Text selection works. Structure: a semantic wrapper tag (<h1>\u2013<h6> or <p>) with <span> children. Best for headlines, SEO-critical content, and body text. Simpler structure, fewer moving parts.',
      demo:'html' },
    { type:'content', chapterNum:4, chapterTitle:'Our Approach', section:'SVG Mode',
      body:'Gradient text fills, pixel-perfect positioning, native SVG stroke, and SVG filters (blur, glow, drop shadow). Structure: a hidden semantic tag for screen readers + decorative <svg aria-hidden>. Best for decorative stickers, branded visuals, and advanced effects.',
      demo:'svg' },
    { type:'content', chapterNum:4, chapterTitle:'Our Approach', section:'Screen Reader',
      body:'Both modes produce correct screen reader output. In HTML Mode, the semantic tag is read directly. In SVG Mode, an sr-only hidden tag carries the text while the SVG is marked aria-hidden. The result: one continuous reading, correct DOM order, proper heading hierarchy.',
      demo:'screenreader' },

    // ── Ch 5: The Solution \u2014 Bottom to Top ──────────────────────────────────
    { type:'chapter', num:5, title:'The Solution',
      summary:'A bottom-to-top approach. Tackling the most critical structural challenge first, then layering style, layout, effects, and animation on top.' },
    { type:'content', chapterNum:5, chapterTitle:'The Solution', section:'Priority',
      body:'We build from the foundation up. Each layer is less critical than the one below it\u2014but together they create the complete experience. The semantic wrapper is non-negotiable; animations are nice-to-have.',
      demo:'pyramid' },
    { type:'content', chapterNum:5, chapterTitle:'The Solution', section:'Layer 1 \u2014 Semantic Wrapper',
      body:'The most critical layer. Multiple text segments wrapped under a single HTML tag (<h1>\u2013<h6>, <p>, or <span>). This solves the SEO hierarchy problem, gives screen readers a single semantic unit, and unblocks the accessibility review. Without this, nothing else ships.',
      demo:'wrapper' },
    { type:'content', chapterNum:5, chapterTitle:'The Solution', section:'Layer 2 \u2014 Text Style',
      body:'The foundation of every composition. Font family, font size (6\u2013400px), font weight (100\u2013900), color, letter-spacing (-0.05em to 0.3em), line-height (0.85\u20131.5), text case (upper, lower, title), decoration, italic, and rotation (-30\u00b0 to +30\u00b0).',
      demo:'style' },
    { type:'content', chapterNum:5, chapterTitle:'The Solution', section:'Layer 3 \u2014 Layout',
      body:'How segments arrange in space. Direction (row or column), alignment (start, center, end), base gap (0\u2013120px), per-segment gap overrides, padding (0\u2013200px), flex wrap, and individual segment offsets. The composition can reflow while maintaining its visual intent.',
      demo:'layout' },
    { type:'content', chapterNum:5, chapterTitle:'The Solution', section:'Layer 4 \u2014 Effects',
      body:'Visual polish that makes compositions stand out. Stroke outline (1\u20135px, hollow option), soft shadow, hard shadow, 3D extrude, neon glow, retro. Plus layering, text twist (wave, bounce, collage), badges with background, and SVG gradients (horizontal, vertical, diagonal).',
      demo:'effects' },
    { type:'content', chapterNum:5, chapterTitle:'The Solution', section:'Layer 5 \u2014 Animation',
      body:'The top layer\u2014we can live without it, but it elevates the experience. 8 presets: fade up/down/left/right, scale, blur, flip, slide. Three trigger modes: entrance, scroll, manual. Configurable duration (300\u20131200ms), stagger (50\u2013600ms), delay, and easing. Respects prefers-reduced-motion.',
      demo:'animation' },

    // ── Ch 6: The Flow ──────────────────────────────────────────────────────
    { type:'chapter', num:6, title:'The Flow',
      summary:'End-to-end: from selecting a preset to a fully styled, animated, accessible text combination. Every step in the creation process.' },
    { type:'content', chapterNum:6, chapterTitle:'The Flow', section:'Step 1 \u2014 Choose Preset',
      body:'Open the presets gallery with 30+ ready-made text combinations. Each preset carries fonts, colors, effects, and layout. Click to instantly apply\u2014the composition appears on the canvas ready to customize.',
      demo:'flow-preset' },
    { type:'content', chapterNum:6, chapterTitle:'The Flow', section:'Step 2 \u2014 Edit Content',
      body:'Content is edited in the side panel\u2014not on the canvas. Each segment has its own text field. Add or remove segments with + and \u2212. Drag to reorder in the layers panel. The DOM order updates in real time.',
      demo:'flow-edit' },
    { type:'content', chapterNum:6, chapterTitle:'The Flow', section:'Step 3 \u2014 Style & Layout',
      body:'Select a segment and style it: font, size, weight, color, spacing. Switch to the composition panel to adjust direction, alignment, gap, and padding. The live preview updates instantly on the canvas.',
      demo:'flow-style' },
    { type:'content', chapterNum:6, chapterTitle:'The Flow', section:'Step 4 \u2014 Effects & Animation',
      body:'Apply effects: outline, shadow, 3D extrude, neon glow, retro. Add layering, text twist, or badges. Set up entrance animations with preset, duration, stagger, and easing. Hit replay to preview the full animation sequence.',
      demo:'flow-effects' },
    { type:'content', chapterNum:6, chapterTitle:'The Flow', section:'Step 5 \u2014 Publish',
      body:'Audit accessibility\u2014check semantic tags, contrast ratios, screen reader output. Copy the generated code (HTML or SVG) with all styles inlined. Preview against different background colors. The composition is ready for production.',
      demo:'flow-publish' },
  ];
  const presentNext = () => setPresentSlide(s => Math.min(s + 1, PRESENT_SLIDES.length - 1));
  const presentPrev = () => setPresentSlide(s => Math.max(s - 1, 0));
  const presentExit = () => { setPresentMode(false); setPresentSlide(0); };

  useEffect(() => {
    if (!presentMode) return;
    const onKey = (e) => {
      if (e.key === 'Escape') presentExit();
      else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); presentNext(); }
      else if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); presentPrev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presentMode]);

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
      [data-uid="${uid}"] input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px; height: 12px; border-radius: 50%;
        background: ${T.accent}; border: none; cursor: pointer;
        box-shadow: 0 1px 4px rgba(59,130,246,0.3);
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
      @keyframes pdSlideUp { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:none } }
      @keyframes pdFadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes pdSlideRight { from { opacity:0; transform:translateX(-30px) } to { opacity:1; transform:none } }
      @keyframes pdScale { from { opacity:0; transform:scale(0.85) } to { opacity:1; transform:none } }
      @keyframes pdPulse { 0%,100% { opacity:0.35 } 50% { opacity:1 } }
      @keyframes pdDraw { from { stroke-dashoffset:200 } to { stroke-dashoffset:0 } }
      @keyframes pdBlink { 0%,100% { opacity:1 } 50% { opacity:0 } }
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
    const base = (() => {
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
    })();
    if (seg.layering) {
      const layers = [];
      const rad = (seg.layerAngle || 150) * Math.PI / 180;
      for (let j = seg.layerCount - 1; j >= 0; j--) {
        const dist = (j + 1) * (seg.layerSpace || 6);
        const dx = Math.round(Math.cos(rad) * dist * 10) / 10;
        const dy = Math.round(Math.sin(rad) * dist * 10) / 10;
        layers.push(`${dx}px ${dy}px 0 ${seg.layerColors[j % seg.layerColors.length]}`);
      }
      const existing = base.textShadow || '';
      base.textShadow = existing ? `${existing}, ${layers.join(', ')}` : layers.join(', ');
    }
    return base;
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

  const twistCalc = (idx, total, pattern, offset) => {
    const t = total > 1 ? idx / (total - 1) : 0;
    switch (pattern) {
      case 'wave':   return { y: Math.sin(idx * 0.9) * offset, r: Math.sin(idx * 0.7) * offset * 0.4 };
      case 'bounce': return { y: idx % 2 === 0 ? -offset : offset, r: 0 };
      case 'collage': {
        const seed = ((idx * 997 + 7) % 17) / 17;
        const seed2 = ((idx * 631 + 13) % 19) / 19;
        return { y: (seed - 0.5) * offset * 2, r: (seed2 - 0.5) * offset * 3 };
      }
      default: return { y: 0, r: 0 };
    }
  };

  const renderSegContent = (seg) => {
    const text = dispText(seg);
    if (!seg.twist) return text;
    const units = seg.twistApply === 'word' ? text.split(/(\s+)/) : text.split('');
    return units.map((ch, ci) => {
      if (ch.trim() === '') return <span key={ci} style={{ display:'inline-block', width:ch.length>0?'0.25em':0 }}>{ch}</span>;
      const { y, r } = twistCalc(ci, units.filter(u => u.trim()).length, seg.twistPattern, seg.twistOffset);
      return <span key={ci} style={{ display:'inline-block', transform:`translateY(${y}px) rotate(${r}deg)`, transition:'transform 200ms ease' }}>{ch}</span>;
    });
  };

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
    const scaleOf = (svgEl) => { if (!svgEl?.clientWidth) return 1; const vb = svgEl.viewBox?.baseVal; return vb?.width ? svgEl.clientWidth / vb.width : 1; };
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
              const pv2=parseFloat(parts[0]), ph2=parseFloat(parts[1]||parts[0]);
              badge = <rect x={p.x-ph2} y={p.y-meas[i].h*0.82-pv2} width={meas[i].w+ph2*2} height={meas[i].h+pv2*2} rx={parseFloat(seg.badgeRadius)} fill={seg.badgeColor}/>;
            }
            const ox = seg.offsetX || 0, oy = seg.offsetY || 0;
            const isSel = canvasSel === i;
            const isLast = i === ss.length - 1;
            const gap = getGap(i);
            const bb = seg.badge ? (() => {
              const pts = seg.badgePadding.split(' ');
              const bpv = parseFloat(pts[0]), bph = parseFloat(pts[1] || pts[0]);
              return { x: p.x - bph - 2, y: p.y - meas[i].h * 0.82 - bpv - 2, w: meas[i].w + bph * 2 + 4, h: meas[i].h + bpv * 2 + 4 };
            })() : { x: p.x - 3, y: p.y - meas[i].h - 2, w: meas[i].w + 6, h: meas[i].h * 1.2 + 4 };
            return (
              <g key={i} className="tc-seg" style={{ cursor: isSel ? 'grab' : 'pointer' }}
                transform={(ox || oy) ? `translate(${ox},${oy})` : undefined}
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
                  const gEl = e.currentTarget;
                  const sc = scaleOf(gEl.ownerSVGElement);
                  const startX = e.clientX, startY = e.clientY;
                  const origOX = seg.offsetX || 0, origOY = seg.offsetY || 0;
                  let moved = false, fdx = 0, fdy = 0;
                  document.body.style.cursor = 'grabbing';
                  const onMove = (ev) => {
                    const pxDx = ev.clientX - startX, pxDy = ev.clientY - startY;
                    if (!moved && Math.abs(pxDx) < 2 && Math.abs(pxDy) < 2) return;
                    moved = true;
                    fdx = pxDx / sc; fdy = pxDy / sc;
                    gEl.setAttribute('transform', `translate(${origOX + fdx},${origOY + fdy})`);
                  };
                  const onUp = () => {
                    document.body.style.cursor = '';
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    if (moved) {
                      setSegs(prev => {
                        const n = [...prev];
                        n[i] = { ...n[i], offsetX: Math.round(origOX + fdx), offsetY: Math.round(origOY + fdy) };
                        return n;
                      });
                    }
                  };
                  document.addEventListener('mousemove', onMove);
                  document.addEventListener('mouseup', onUp);
                }}
              >
                {isSel && (
                  <rect x={bb.x} y={bb.y} width={bb.w} height={bb.h}
                    fill="none" stroke={T.accent} strokeWidth={2} rx={4}
                    style={{ pointerEvents:'none' }}
                  />
                )}
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
                {isSel && (
                  <g data-handle="rotate" style={{ cursor:'grab' }}
                    onMouseDown={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      const gEl = e.currentTarget.parentElement;
                      const textEl = gEl.querySelector('text');
                      const rect = textEl.getBoundingClientRect();
                      const ccx = rect.left + rect.width / 2, ccy = rect.top + rect.height / 2;
                      let finalAngle = seg.rotation || 0;
                      document.body.style.cursor = 'grabbing';
                      const onMove = (ev) => {
                        finalAngle = Math.round(Math.atan2(ev.clientY - ccy, ev.clientX - ccx) * (180 / Math.PI));
                        textEl.setAttribute('transform', `rotate(${finalAngle} ${p.x} ${p.y})`);
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
                    <circle cx={bb.x + bb.w} cy={bb.y} r={8} fill={T.accent} stroke="#fff" strokeWidth={2}/>
                    <svg x={bb.x + bb.w - 4} y={bb.y - 4} width={8} height={8} viewBox="0 0 10 10" overflow="visible">
                      <path d="M7 1.5A4 4 0 1 1 3 1.5" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round"/>
                      <path d="M7 1.5L5.5 0M7 1.5L8.5 0" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round"/>
                    </svg>
                  </g>
                )}
                {isSel && (seg.offsetX !== 0 || seg.offsetY !== 0) && (
                  <g data-handle="reset" style={{ cursor:'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSegs(prev => { const n=[...prev]; n[i]={...n[i], offsetX:0, offsetY:0}; return n; });
                    }}
                  >
                    <circle cx={bb.x} cy={bb.y} r={8} fill="#ef4444" stroke="#fff" strokeWidth={2}/>
                    <svg x={bb.x - 3.5} y={bb.y - 3.5} width={7} height={7} viewBox="0 0 10 10" overflow="visible">
                      <line x1="2.5" y1="2.5" x2="7.5" y2="7.5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"/>
                      <line x1="7.5" y1="2.5" x2="2.5" y2="7.5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round"/>
                    </svg>
                  </g>
                )}
                {isSel && !isLast && (() => {
                  const ghx = gDir === 'column' ? bb.x + bb.w / 2 : bb.x + bb.w + gap / 2;
                  const ghy = gDir === 'column' ? bb.y + bb.h + gap / 2 : bb.y + bb.h / 2;
                  return (
                    <g data-handle="gap" style={{ cursor: gDir === 'column' ? 'ns-resize' : 'ew-resize' }}
                      onMouseDown={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const svgEl = e.currentTarget.closest('svg');
                        const sc = scaleOf(svgEl);
                        const startPos = gDir === 'column' ? e.clientY : e.clientX;
                        const startGap = getGap(i);
                        const allGs = [...svgEl.querySelectorAll(':scope > g.tc-seg')];
                        const origTfs = allGs.slice(i + 1).map(g => g.getAttribute('transform') || '');
                        let finalGap = startGap;
                        const onMove = (ev) => {
                          const delta = ((gDir === 'column' ? ev.clientY : ev.clientX) - startPos) / sc;
                          finalGap = Math.max(0, Math.round(startGap + delta));
                          const diff = finalGap - startGap;
                          allGs.slice(i + 1).forEach((g, j) => {
                            const shift = gDir === 'column' ? `translate(0,${diff})` : `translate(${diff},0)`;
                            g.setAttribute('transform', origTfs[j] ? `${origTfs[j]} ${shift}` : shift);
                          });
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
                      <circle cx={ghx} cy={ghy} r={6} fill="rgba(255,255,255,0.9)" stroke={T.accent} strokeWidth={1.5}/>
                      {gDir === 'column'
                        ? <svg x={ghx - 3} y={ghy - 3} width={6} height={6} viewBox="0 0 6 6" overflow="visible">
                            <line x1="0" y1="2" x2="6" y2="2" stroke={T.accent} strokeWidth={1}/>
                            <line x1="0" y1="4" x2="6" y2="4" stroke={T.accent} strokeWidth={1}/>
                          </svg>
                        : <svg x={ghx - 3} y={ghy - 3} width={6} height={6} viewBox="0 0 6 6" overflow="visible">
                            <line x1="2" y1="0" x2="2" y2="6" stroke={T.accent} strokeWidth={1}/>
                            <line x1="4" y1="0" x2="4" y2="6" stroke={T.accent} strokeWidth={1}/>
                          </svg>
                      }
                    </g>
                  );
                })()}
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
              <span style={segStyle(seg)}>{renderSegContent(seg)}</span>
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
  const IcoPresets = <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="1" y="1" width="4" height="4" rx="0.5"/><rect x="7" y="1" width="4" height="4" rx="0.5"/><rect x="1" y="7" width="4" height="4" rx="0.5"/><rect x="7" y="7" width="4" height="4" rx="0.5"/></svg>;
  const IcoTour = <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><circle cx="6" cy="6" r="5"/><path d="M4.5 4.2a1.7 1.7 0 0 1 3.2.8c0 1.2-1.7 1-1.7 2.2"/><circle cx="6" cy="9.2" r="0.01" strokeWidth="2"/></svg>;
  const IcoSave = <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M2 1h6.6L10 2.4a1 1 0 0 1 .3.7V10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/><path d="M4 1v3h4V1"/><rect x="3" y="7" width="6" height="3" rx="0.5"/></svg>;
  const IcoShare = <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="2.5" r="1.5"/><circle cx="9" cy="9.5" r="1.5"/><circle cx="3" cy="6" r="1.5"/><line x1="4.4" y1="5.2" x2="7.6" y2="3.3"/><line x1="4.4" y1="6.8" x2="7.6" y2="8.7"/></svg>;
  const IcoFolder = <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M1 3V10a1 1 0 001 1h8a1 1 0 001-1V5a1 1 0 00-1-1H6L4.5 2.5A1 1 0 003.8 2H2A1 1 0 001 3z"/></svg>;
  const IcoPresent = <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1.5" width="10" height="7" rx="1"/><path d="M4 10.5h4M6 8.5v2"/><path d="M4.5 5L8 5M4.5 3.5L6.5 3.5"/></svg>;

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
      <div data-tour="topbar" style={{ ...glassBar, display:'flex', alignItems:'center', gap:0, padding:'0 18px', height:48, flexShrink:0, zIndex:20, ...enter('tcFadeDown', 0),
        ...(demoMode ? { height:0, overflow:'hidden', padding:0, minHeight:0, flexShrink:0 } : {}),
      }}>
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
            { onClick:()=>setPresetsOpen(o=>!o), icon:IcoPresets, label:'Presets', dark:presetsOpen, d:280, tour:'presets-btn' },
            { onClick:handleSave, icon:IcoSave, label:'Save', dark:false, d:320 },
            { onClick:handleShare, icon:IcoShare, label:'Share', dark:false, d:360 },
            { onClick:()=>setCreationsOpen(o=>!o), icon:IcoFolder, label:'My Files', dark:creationsOpen, d:400 },
            { onClick:()=>{ setPresentMode(true); setPresentSlide(0); }, icon:IcoPresent, label:'Present', dark:false, d:440 },
            { onClick:()=>setTourStep(0), icon:IcoTour, label:'Tour', dark:tourStep>=0, d:480 },
          ].map((b,bi)=>(
            <div key={bi} data-tour={b.tour||undefined} style={enter('tcSlideL', b.d)}>
              <TBtn onClick={b.onClick} icon={b.icon} dark={b.dark}>{b.label}</TBtn>
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex:1, display:'flex', gap: demoMode ? 0 : 12, padding: demoMode ? 0 : 12, overflow:'hidden', minHeight:0 }}>

        {/* ── PANEL ── */}
        <div style={{ ...glassPanel, width:280, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden', ...enter('tcSlideR', 100),
          ...(demoMode && ['flow-preset','screenreader'].includes(demoMode) ? { width:0, overflow:'hidden', padding:0, border:'none' } : {}),
          ...(demoMode ? { borderRadius:0, border:'none', boxShadow:'none' } : {}),
        }}>

          <div data-tour="seg-select" style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
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

          <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>

            <Acc data-tour="text-style" open={acc.a1} onToggle={()=>setAcc(p=>({...p,a1:!p.a1}))} num="01" title="Text Style">
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

            <Acc data-tour="composition" open={acc.a2} onToggle={()=>setAcc(p=>({...p,a2:!p.a2}))} num="02" title="Composition">
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

            <Acc data-tour="effects" open={acc.a3} onToggle={()=>setAcc(p=>({...p,a3:!p.a3}))} num="03" title="Effects">
              <Lbl>Quick Effect Presets</Lbl>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
                {O.effect.map(e => (
                  <button key={e.v} onClick={() => upd('effect', e.v)} style={{
                    padding:'5px 9px', fontSize:9, fontWeight:500, fontFamily:'inherit',
                    background: s.effect === e.v ? T.accent : T.ctrl,
                    color: s.effect === e.v ? '#fff' : T.text2,
                    border: `1px solid ${s.effect === e.v ? T.accent : T.ctrlBorder}`,
                    borderRadius:5, cursor:'pointer',
                    transition:`all 200ms ${EASE.out}`,
                    boxShadow: s.effect === e.v ? '0 2px 8px rgba(59,130,246,0.25)' : 'none',
                  }}>{e.l}</button>
                ))}
              </div>
              <Sub show={s.effect==='outline'||s.effect==='retro'}>
                <Row>
                  <Field label="Stroke"><ColorField val={s.strokeColor} onChange={v=>upd('strokeColor',v)}/></Field>
                  <Field label="W" w={62}><Sel val={s.strokeWidth} onChange={v=>upd('strokeWidth',v)} opts={O.strokeW}/></Field>
                </Row>
                <TRow label="Hollow" val={s.strokeHollow} onChange={v=>upd('strokeHollow',v)}/>
              </Sub>
              <Sep/>
              <TRow label="Layering" val={s.layering} onChange={v=>upd('layering',v)}/>
              <Sub show={s.layering}>
                <Row>
                  <Field label="Layers" w={52}><NumIn val={s.layerCount} onChange={v=>upd('layerCount',v)} min={1} max={8}/></Field>
                  <Field label="Space" w={52}><NumIn val={s.layerSpace} onChange={v=>upd('layerSpace',v)} min={1} max={60}/></Field>
                </Row>
                <Row>
                  <Field label="Angle">
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <input type="range" min={0} max={360} value={s.layerAngle} onChange={e=>upd('layerAngle',+e.target.value)}
                        style={{ flex:1, height:3, appearance:'none', WebkitAppearance:'none', background:T.ctrlBorder, borderRadius:2, outline:'none', cursor:'pointer' }}/>
                      <span style={{ fontSize:9, color:T.text3, minWidth:28, textAlign:'right' }}>{s.layerAngle}°</span>
                    </div>
                  </Field>
                </Row>
                <Lbl>Layer Colors</Lbl>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8 }}>
                  {Array.from({ length: s.layerCount }, (_, ci) => (
                    <div key={ci} style={{ position:'relative', width:22, height:22, borderRadius:5, border:`1px solid ${T.ctrlBorder}`, overflow:'hidden', cursor:'pointer' }}>
                      <input type="color" value={s.layerColors[ci % s.layerColors.length] || '#888888'}
                        onChange={e => {
                          const nc = [...s.layerColors];
                          while (nc.length <= ci) nc.push('#888888');
                          nc[ci] = e.target.value;
                          upd('layerColors', nc);
                        }}
                        style={{ position:'absolute', inset:-4, width:'130%', height:'130%', cursor:'pointer', border:'none' }}/>
                    </div>
                  ))}
                </div>
              </Sub>
              <Sep/>
              <TRow label="Text Twist" val={s.twist} onChange={v=>upd('twist',v)}/>
              <Sub show={s.twist}>
                <Row>
                  <Field label="Apply Per"><Sel val={s.twistApply} onChange={v=>upd('twistApply',v)} opts={O.twistApply}/></Field>
                  <Field label="Pattern"><Sel val={s.twistPattern} onChange={v=>upd('twistPattern',v)} opts={O.twistPat}/></Field>
                </Row>
                <Row>
                  <Field label="Offset">
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <input type="range" min={1} max={40} value={s.twistOffset} onChange={e=>upd('twistOffset',+e.target.value)}
                        style={{ flex:1, height:3, appearance:'none', WebkitAppearance:'none', background:T.ctrlBorder, borderRadius:2, outline:'none', cursor:'pointer' }}/>
                      <span style={{ fontSize:9, color:T.text3, minWidth:20, textAlign:'right' }}>{s.twistOffset}</span>
                    </div>
                  </Field>
                </Row>
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
        <div style={{ ...glassPanel, flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden', ...enter('tcScale', 140),
          ...(demoMode ? { borderRadius:0, border:'none', boxShadow:'none' } : {}),
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 16px', height:42, borderBottom:`1px solid ${T.border}`, flexShrink:0,
            ...(demoMode ? { height:0, overflow:'hidden', padding:0, borderBottom:'none' } : {}),
          }}>
            <span style={{ fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text4, marginRight:4 }}>
              {a11yOpen ? 'Accessibility' : 'Canvas'}
            </span>
            {!a11yOpen && <div data-tour="bg-swatches" style={{ display:'flex', gap:6, alignItems:'center' }}>
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
              <div data-tour="canvas" style={{ flex:1, position:'relative', overflow:'hidden', borderRadius:'0 0 13px 0' }}>
                <div ref={stageRef} onClick={() => setCanvasSel(null)} style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:bgColor, overflow:'hidden', transition:`background 300ms ${EASE.out}`, padding:gPad }}>
                  {mode === 'html' ? buildHTML() : buildSVG()}
                </div>

                {/* ── Floating Layers Panel ── */}
                <div data-tour="layers" onClick={e => e.stopPropagation()} style={{
                  position:'absolute', top:layerPos.y, left:layerPos.x, width:210, zIndex:10,
                  background:'rgba(255,255,255,0.82)', backdropFilter:'blur(20px) saturate(160%)', WebkitBackdropFilter:'blur(20px) saturate(160%)',
                  border:`1px solid ${T.glassBorder}`, borderRadius:10,
                  boxShadow:'0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03)',
                  overflow:'hidden',
                }}>
                  <div
                    style={{
                      display:'flex', alignItems:'center', padding:'0 10px', height:28,
                      cursor:'grab', userSelect:'none',
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX, startY = e.clientY;
                      const origX = layerPos.x, origY = layerPos.y;
                      let moved = false;
                      document.body.style.cursor = 'grabbing';
                      const onMove = (ev) => {
                        const dx = ev.clientX - startX, dy = ev.clientY - startY;
                        if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
                        moved = true;
                        setLayerPos({ x: origX + dx, y: origY + dy });
                      };
                      const onUp = () => {
                        document.body.style.cursor = '';
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                        if (!moved) setAcc(p => ({ ...p, layers: !p.layers }));
                      };
                      document.addEventListener('mousemove', onMove);
                      document.addEventListener('mouseup', onUp);
                    }}
                  >
                    <svg width={7} height={9} viewBox="0 0 8 10" fill={T.accent} style={{ flexShrink:0, marginRight:6 }}>
                      <circle cx="2" cy="2" r="1.1"/><circle cx="6" cy="2" r="1.1"/>
                      <circle cx="2" cy="5" r="1.1"/><circle cx="6" cy="5" r="1.1"/>
                      <circle cx="2" cy="8" r="1.1"/><circle cx="6" cy="8" r="1.1"/>
                    </svg>
                    <span style={{ fontSize:9, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:T.text1, flex:1 }}>Layers</span>
                    <span style={{ fontSize:8, color:T.text4, marginRight:6 }}>{segCount}</span>
                    <svg width={8} height={5} viewBox="0 0 10 6" fill="none" stroke={T.accent} strokeWidth={1.5}
                      style={{ transition:`transform 300ms ${EASE.spring}`, transform: acc.layers ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink:0 }}>
                      <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{
                    display:'grid', gridTemplateRows: acc.layers ? '1fr' : '0fr',
                    transition:`grid-template-rows 350ms ${EASE.out}`,
                  }}>
                    <div style={{ overflow:'hidden' }}>
                      <div ref={layerRef} style={{ borderTop:`1px solid ${T.border}` }}>
                        {segs.slice(0,segCount).map((seg,i) => (
                          <div key={i} data-layer-idx={i} style={{
                            display:'flex', alignItems:'center', gap:5, padding:'3px 10px',
                            background: activeSeg===i ? T.accentSoft : 'transparent',
                            cursor:'grab', userSelect:'none',
                            borderTop: i > 0 ? `1px solid ${T.border}` : 'none',
                            transition:`background 200ms ${EASE.out}`,
                          }}
                            onClick={()=>{ setActiveSeg(i); setCanvasSel(i); }}
                          >
                            <svg width={6} height={8} viewBox="0 0 8 10" fill={T.text3} style={{ flexShrink:0, cursor:'grab' }}>
                              <circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/>
                              <circle cx="2" cy="5" r="1"/><circle cx="6" cy="5" r="1"/>
                              <circle cx="2" cy="8" r="1"/><circle cx="6" cy="8" r="1"/>
                            </svg>
                            <span style={{ fontSize:8, fontWeight:700, color:T.accent, width:10 }}>{i+1}</span>
                            <span style={{ fontSize:9, color:T.text1, fontWeight:500, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:`'${seg.fontFamily}', sans-serif` }}>
                              {dispText(seg)}
                            </span>
                            <span style={{ fontSize:7, color:T.text3, flexShrink:0 }}>{seg.fontSize}px</span>
                            {i < segCount-1 && (
                              <input type="number" data-gap-idx={i} value={seg.gapAfter ?? gGap} min={0} max={200}
                                onClick={e => e.stopPropagation()}
                                onChange={e => {
                                  const v = +e.target.value;
                                  setSegs(prev => { const n=[...prev]; n[i]={...n[i], gapAfter: v}; return n; });
                                }}
                                style={{ width:26, height:15, fontSize:7, fontFamily:'inherit', textAlign:'center', border:`1px solid ${T.ctrlBorder}`, borderRadius:3, background:'rgba(255,255,255,0.6)', color:T.text2, padding:0, outline:'none', flexShrink:0 }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop:`1px solid ${T.border}`, flexShrink:0, maxHeight:codeOpen?'60%':40, overflow:'hidden', transition:`max-height 350ms ${EASE.out}` }}>
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
                <div style={{ padding:'10px 16px 16px', background:'rgba(0,0,0,0.02)', overflowY:'auto', maxHeight:'calc(60% - 40px)' }}>
                  <pre style={{ fontFamily:"'SF Mono','Fira Code',monospace", fontSize:10, lineHeight:1.7, color:T.text2, whiteSpace:'pre', overflowX:'auto', background:'rgba(255,255,255,0.4)', padding:12, borderRadius:8, border:`1px solid ${T.border}` }}>
                    {genCode()}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TOUR OVERLAY ── */}
      {tourStep >= 0 && tourRect && createPortal(
        (() => {
          const step = TOUR_STEPS[tourStep];
          const pad = 8;
          const tipW = 280;
          const gap = 16;
          const r = tourRect;
          let tipStyle = {};
          switch (step.pos) {
            case 'bottom': tipStyle = { top:r.bottom+pad+gap, left:Math.max(12, Math.min(window.innerWidth-tipW-12, r.left+r.width/2-tipW/2)) }; break;
            case 'top': tipStyle = { top:r.top-pad-gap, left:Math.max(12, Math.min(window.innerWidth-tipW-12, r.left+r.width/2-tipW/2)), transform:'translateY(-100%)' }; break;
            case 'right': tipStyle = { top:Math.max(12, Math.min(window.innerHeight-200, r.top+r.height/2-70)), left:r.right+pad+gap }; break;
            case 'left': tipStyle = { top:Math.max(12, Math.min(window.innerHeight-200, r.top+r.height/2-70)), left:r.left-pad-gap-tipW }; break;
          }
          return (
            <div style={{ position:'fixed', inset:0, zIndex:99999 }}>
              <div onClick={()=>setTourStep(-1)} style={{ position:'fixed', inset:0 }}/>
              <div style={{
                position:'fixed',
                top:r.top-pad, left:r.left-pad,
                width:r.width+pad*2, height:r.height+pad*2,
                borderRadius:12,
                boxShadow:'0 0 0 9999px rgba(15,23,42,0.55)',
                transition:`all 400ms ${EASE.out}`,
                pointerEvents:'none',
              }}/>
              <div style={{
                position:'fixed', ...tipStyle, width:tipW,
                background:'rgba(255,255,255,0.97)',
                backdropFilter:'blur(20px) saturate(160%)', WebkitBackdropFilter:'blur(20px) saturate(160%)',
                border:`1px solid ${T.glassBorder}`,
                borderRadius:14, padding:'16px 18px',
                boxShadow:'0 12px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
                fontFamily:sysFont,
                transition:`top 400ms ${EASE.out}, left 400ms ${EASE.out}, transform 400ms ${EASE.out}`,
                pointerEvents:'auto',
              }}>
                <div style={{ display:'flex', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:8, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:T.accent, background:T.accentSoft, padding:'3px 8px', borderRadius:5 }}>
                    {tourStep+1} / {TOUR_STEPS.length}
                  </span>
                  <div style={{ flex:1 }}/>
                  <button onClick={()=>setTourStep(-1)} style={{
                    width:20, height:20, borderRadius:5, background:'none', border:`1px solid ${T.ctrlBorder}`,
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
                    color:T.text3, fontSize:13, lineHeight:1, fontFamily:'inherit',
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background=T.accentSoft}
                    onMouseLeave={e=>e.currentTarget.style.background='none'}
                  >&times;</button>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text1, marginBottom:6, letterSpacing:'-0.01em' }}>{step.title}</div>
                <div style={{ fontSize:11, color:T.text2, lineHeight:1.65, marginBottom:16 }}>{step.desc}</div>
                <div style={{ display:'flex', gap:6, justifyContent:'space-between', alignItems:'center' }}>
                  <button onClick={()=>setTourStep(-1)} style={{
                    padding:'5px 10px', fontSize:10, fontWeight:400, fontFamily:'inherit',
                    background:'none', border:'none', cursor:'pointer', color:T.text3,
                  }}>Skip tour</button>
                  <div style={{ display:'flex', gap:6 }}>
                    {tourStep > 0 && (
                      <button onClick={()=>setTourStep(s=>s-1)} style={{
                        padding:'6px 14px', fontSize:10, fontWeight:500, fontFamily:'inherit',
                        background:'rgba(255,255,255,0.6)', border:`1px solid ${T.ctrlBorder}`,
                        borderRadius:7, cursor:'pointer', color:T.text2,
                        transition:`all 200ms ${EASE.out}`,
                      }}
                        onMouseEnter={e=>e.currentTarget.style.background=T.ctrlHover}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.6)'}
                      >Back</button>
                    )}
                    <button onClick={()=>tourStep<TOUR_STEPS.length-1?setTourStep(s=>s+1):setTourStep(-1)} style={{
                      padding:'6px 16px', fontSize:10, fontWeight:600, fontFamily:'inherit',
                      background:T.accent, border:'none',
                      borderRadius:7, cursor:'pointer', color:'#fff',
                      boxShadow:'0 2px 10px rgba(59,130,246,0.3)',
                      transition:`all 200ms ${EASE.out}`,
                    }}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 16px rgba(59,130,246,0.4)';}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 2px 10px rgba(59,130,246,0.3)';}}
                    >{tourStep<TOUR_STEPS.length-1?'Next':'Done'}</button>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:12 }}>
                  {TOUR_STEPS.map((_,i)=>(
                    <div key={i} onClick={()=>setTourStep(i)} style={{
                      width:i===tourStep?16:6, height:6, borderRadius:3,
                      background:i===tourStep?T.accent:i<tourStep?'rgba(59,130,246,0.3)':'rgba(0,0,0,0.08)',
                      cursor:'pointer',
                      transition:`all 300ms ${EASE.spring}`,
                    }}/>
                  ))}
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}

      {/* ── PRESETS MODAL ── */}
      {presetsOpen && createPortal(
        <div onClick={() => setPresetsOpen(false)} style={{
          position:'fixed', inset:0, zIndex:9998,
          background:'rgba(15,23,42,0.25)',
          backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily: sysFont,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width:660, maxWidth:'92vw', maxHeight:'82vh',
            background:'rgba(255,255,255,0.94)',
            backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px) saturate(180%)',
            border:`1px solid ${T.glassBorder}`,
            borderRadius:16,
            boxShadow:'0 24px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.06)',
            display:'flex', flexDirection:'column',
            overflow:'hidden',
          }}>
            <div style={{ display:'flex', alignItems:'center', padding:'12px 18px', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text1, flex:1 }}>Presets</span>
              <span style={{ fontSize:9, color:T.text3, marginRight:12 }}>{COMBO_PRESETS.length} templates</span>
              <button onClick={() => setPresetsOpen(false)} style={{
                width:24, height:24, borderRadius:6, background:'none', border:`1px solid ${T.ctrlBorder}`,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
                transition:`all 200ms ${EASE.out}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = T.accentSoft}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <svg width={8} height={8} viewBox="0 0 10 10" fill="none" stroke={T.text3} strokeWidth={1.5} strokeLinecap="round">
                  <line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/>
                </svg>
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                {COMBO_PRESETS.map((p, pi) => (
                  <button key={pi} onClick={() => { applyComboPreset(p); setPresetsOpen(false); }} style={{
                    padding:'14px 10px 10px', background:'rgba(255,255,255,0.55)', border:`1px solid ${T.ctrlBorder}`,
                    borderRadius:10, cursor:'pointer', fontFamily:'inherit', textAlign:'center',
                    transition:`all 200ms ${EASE.out}`,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.ctrlBorder; e.currentTarget.style.background = 'rgba(255,255,255,0.55)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ height:36, display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:6, overflow:'hidden' }}>
                      {p.segs.map((ps, si) => (
                        <span key={si} style={{
                          fontFamily:`'${ps.fontFamily}', sans-serif`,
                          fontSize: Math.min(ps.fontSize * 0.24, 16),
                          fontWeight: ps.fontWeight,
                          color: ps.color,
                          fontStyle: ps.italic ? 'italic' : 'normal',
                          textTransform: ps.textTransform || 'none',
                          letterSpacing: ps.letterSpacing || '0em',
                          lineHeight:1.1, whiteSpace:'nowrap',
                          ...(ps.badge ? { background:ps.badgeColor, padding:'1px 5px', borderRadius:3 } : {}),
                        }}>{ps.text}</span>
                      ))}
                    </div>
                    <div style={{ fontSize:9, color:T.text3, fontWeight:500, letterSpacing:'0.04em' }}>{p.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MY CREATIONS MODAL ── */}
      {createPortal(
        <div onClick={() => setCreationsOpen(false)} style={{
          position:'fixed', inset:0, zIndex:900, display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(15,23,42,0.35)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
          opacity: creationsOpen?1:0, pointerEvents: creationsOpen?'auto':'none',
          transition:`opacity 300ms ${EASE.out}`, fontFamily: sysFont,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width:540, maxHeight:'80vh', background:'rgba(255,255,255,0.97)',
            backdropFilter:'blur(24px) saturate(140%)', WebkitBackdropFilter:'blur(24px) saturate(140%)',
            borderRadius:16, boxShadow:'0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
            border:`1px solid rgba(255,255,255,0.7)`, display:'flex', flexDirection:'column', overflow:'hidden',
            transform: creationsOpen?'scale(1) translateY(0)':'scale(0.96) translateY(12px)',
            transition:`transform 400ms ${EASE.spring}`,
          }}>
            <div style={{ display:'flex', alignItems:'center', padding:'12px 18px', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:T.text1, flex:1 }}>My Creations</span>
              <div style={{ display:'flex', gap:6, marginRight:12 }}>
                <button onClick={handleExport} style={{
                  height:24, padding:'0 10px', background:'none', border:`1px solid ${T.ctrlBorder}`, borderRadius:6,
                  fontSize:9, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:T.text3,
                  cursor:'pointer', fontFamily:'inherit', transition:`all 200ms ${EASE.out}`,
                }} onMouseEnter={e => e.currentTarget.style.borderColor = T.accent} onMouseLeave={e => e.currentTarget.style.borderColor = T.ctrlBorder}
                >Export JSON</button>
                <button onClick={() => fileInputRef.current?.click()} style={{
                  height:24, padding:'0 10px', background:'none', border:`1px solid ${T.ctrlBorder}`, borderRadius:6,
                  fontSize:9, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:T.text3,
                  cursor:'pointer', fontFamily:'inherit', transition:`all 200ms ${EASE.out}`,
                }} onMouseEnter={e => e.currentTarget.style.borderColor = T.accent} onMouseLeave={e => e.currentTarget.style.borderColor = T.ctrlBorder}
                >Import JSON</button>
              </div>
              <button onClick={() => setCreationsOpen(false)} style={{
                width:24, height:24, borderRadius:6, background:'none', border:`1px solid ${T.ctrlBorder}`,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
                transition:`all 200ms ${EASE.out}`,
              }}
                onMouseEnter={e => e.currentTarget.style.background = T.accentSoft}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <svg width={8} height={8} viewBox="0 0 10 10" fill="none" stroke={T.text3} strokeWidth={1.5} strokeLinecap="round">
                  <line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/>
                </svg>
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:16 }}>
              {creations.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:T.text3 }}>
                  <div style={{ fontSize:32, marginBottom:10, opacity:0.4 }}>📂</div>
                  <div style={{ fontSize:12, fontWeight:500 }}>No saved creations yet</div>
                  <div style={{ fontSize:10, color:T.text4, marginTop:4 }}>Click "Save" in the toolbar to save your first design</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {creations.map(c => (
                    <div key={c.id} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                      background:'rgba(255,255,255,0.55)', border:`1px solid ${T.ctrlBorder}`,
                      borderRadius:10, transition:`all 200ms ${EASE.out}`, cursor:'pointer',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.ctrlBorder; e.currentTarget.style.background = 'rgba(255,255,255,0.55)'; }}
                      onClick={() => { restoreSnap(c.snap); setCreationsOpen(false); setSaveToast('Loaded!'); setTimeout(() => setSaveToast(''), 2000); }}
                    >
                      <div style={{ width:60, height:32, display:'flex', alignItems:'center', justifyContent:'center', gap:2, overflow:'hidden', flexShrink:0, borderRadius:6, background:'rgba(0,0,0,0.02)', border:`1px solid ${T.border}` }}>
                        {c.snap.segs?.slice(0, c.snap.segCount || 3).map((ps, si) => (
                          <span key={si} style={{
                            fontFamily:`'${ps.fontFamily}', sans-serif`,
                            fontSize: Math.min(ps.fontSize * 0.14, 10),
                            fontWeight:ps.fontWeight, color:ps.color,
                            fontStyle:ps.italic ? 'italic' : 'normal',
                            textTransform:ps.textTransform || 'none',
                            lineHeight:1, whiteSpace:'nowrap',
                          }}>{ps.text}</span>
                        ))}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:T.text1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                        <div style={{ fontSize:9, color:T.text4, marginTop:2 }}>{new Date(c.ts).toLocaleDateString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                      </div>
                      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          const n = prompt('Rename:', c.name);
                          if (n) { const list = await cloudRename(c.id, n.trim()); if (list) setCreations(list); }
                        }} style={{
                          width:22, height:22, borderRadius:5, background:'none', border:`1px solid ${T.ctrlBorder}`,
                          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
                        }}>
                          <svg width={9} height={9} viewBox="0 0 12 12" fill="none" stroke={T.text3} strokeWidth={1.3} strokeLinecap="round">
                            <path d="M8.5 1.5l2 2L4 10H2v-2z"/>
                          </svg>
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          const encoded = snapEncode(c.snap);
                          const url = `${window.location.origin}${window.location.pathname}#creation=${encoded}`;
                          navigator.clipboard.writeText(url).then(() => { setSaveToast('Link copied!'); setTimeout(() => setSaveToast(''), 2000); });
                        }} style={{
                          width:22, height:22, borderRadius:5, background:'none', border:`1px solid ${T.ctrlBorder}`,
                          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
                        }}>
                          {IcoShare}
                        </button>
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Delete this creation?')) { const list = await cloudDel(c.id); if (list) setCreations(list); }
                        }} style={{
                          width:22, height:22, borderRadius:5, background:'none', border:`1px solid rgba(220,38,38,0.2)`,
                          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
                        }}>
                          <svg width={9} height={9} viewBox="0 0 12 12" fill="none" stroke="#dc2626" strokeWidth={1.3} strokeLinecap="round">
                            <path d="M2 3h8M4.5 3V2a1 1 0 011-1h1a1 1 0 011 1v1M9.5 3l-.5 7a1 1 0 01-1 1h-4a1 1 0 01-1-1L2.5 3"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* hidden file input for JSON import */}
      <input ref={fileInputRef} type="file" accept=".json" style={{ display:'none' }} onChange={handleImport}/>

      {/* ── PRESENTATION MODE ── */}
      {presentMode && !demoMode && createPortal(
        <div style={{
          position:'fixed', inset:0, zIndex:9999, background:'#000',
          display:'flex', flexDirection:'column', cursor:'none',
        }}
          onClick={(e) => {
            const x = e.clientX / window.innerWidth;
            if (x > 0.3) presentNext(); else presentPrev();
          }}
        >
          {/* Slide content */}
          {PRESENT_SLIDES[presentSlide]?.type === 'cover' && (
            <div style={{
              flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between',
              padding:'64px 80px 40px', cursor:'none', userSelect:'none',
            }}>
              <div>
                <div style={{
                  fontFamily:"'Neue Haas Grotesk Display Pro','Helvetica Neue','Inter',sans-serif",
                  fontSize:14, fontWeight:400, color:'rgba(255,255,255,0.4)',
                  letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16,
                  opacity:0, animation:'pdFadeIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.05s forwards',
                }}>Editor 3</div>
                <div style={{
                  fontFamily:"'Neue Haas Grotesk Display Pro','Helvetica Neue','Inter',sans-serif", fontWeight:500,
                  fontSize:'min(12vw, 160px)', lineHeight:0.92, color:'#fff',
                  letterSpacing:'0.04em', textTransform:'uppercase',
                }}>
                  <div style={{
                    opacity:0, animation:'pdSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s forwards',
                  }}>Text</div>
                  <div style={{
                    opacity:0, animation:'pdSlideUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s forwards',
                  }}>Combination</div>
                </div>
                <div style={{
                  marginTop:32, fontFamily:"'Neue Haas Grotesk Display Pro','Helvetica Neue','Inter',sans-serif",
                  fontSize:'min(2.2vw, 28px)', fontWeight:400, color:'rgba(255,255,255,0.5)',
                  letterSpacing:'0.01em', lineHeight:1.4,
                  opacity:0, animation:'pdFadeIn 1s cubic-bezier(0.22,1,0.36,1) 0.6s forwards',
                }}>Product Strategy Deck</div>
              </div>
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'flex-end',
                borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:20,
                fontFamily:"'Neue Haas Grotesk Display Pro','Helvetica Neue','Inter',sans-serif",
                fontSize:13, color:'rgba(255,255,255,0.3)', fontWeight:400, letterSpacing:'0.04em',
                opacity:0, animation:'pdFadeIn 1s cubic-bezier(0.22,1,0.36,1) 0.9s forwards',
              }}>
                <span>Wix Design Infrastructure</span>
                <span>Content Team / Editor Team</span>
                <span>2026</span>
              </div>
            </div>
          )}

          {PRESENT_SLIDES[presentSlide]?.type === 'agenda' && (
            <div style={{
              flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end',
              padding:'48px 72px 0', cursor:'none', userSelect:'none',
              fontFamily:"'Neue Haas Grotesk Display Pro','Helvetica Neue','Inter',sans-serif",
            }}>
              <div style={{
                marginBottom:'auto', paddingTop:8,
                opacity:0, animation:'pdFadeIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s forwards',
              }}>
                <div style={{ fontSize:24, fontWeight:300, color:'rgba(255,255,255,0.85)' }}>Agenda</div>
                <div style={{ fontSize:13, fontWeight:400, color:'rgba(255,255,255,0.35)', marginTop:4, letterSpacing:'0.02em' }}>What we&apos;ll cover today</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {[
                  { num:'01', title:'User Intent', desc:'What users want to achieve with text combinations' },
                  { num:'02', title:'The Problem', desc:'Semantics, accessibility & reading order challenges' },
                  { num:'03', title:'Research', desc:'Competitive landscape and market positioning' },
                  { num:'04', title:'Our Approach', desc:'Designated component + HTML vs SVG alternatives' },
                  { num:'05', title:'The Solution', desc:'Bottom-to-top: wrapper \u2192 style \u2192 layout \u2192 effects \u2192 animation' },
                  { num:'06', title:'The Flow', desc:'End-to-end preset creation walkthrough' },
                ].map((item, i) => (
                  <div key={i} style={{
                    borderTop:'1px solid rgba(255,255,255,0.15)',
                    paddingLeft:'1.5vw', paddingBottom:9, paddingTop:10,
                    opacity:0, animation:`pdSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.07}s forwards`,
                  }}>
                    <div style={{
                      fontSize:13, fontWeight:400, color:'rgba(255,255,255,0.35)',
                      fontVariantNumeric:'tabular-nums',
                    }}>{item.num}</div>
                    <div style={{
                      fontSize:'min(5.5vw, 64px)', fontWeight:300, color:'#fff',
                      lineHeight:0.6, letterSpacing:'0.04em', paddingBottom:12, paddingLeft:'0.4em',
                    }}>{item.title}</div>
                  </div>
                ))}
              </div>
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                borderTop:'1px solid rgba(255,255,255,0.15)', padding:'14px 0',
                fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:400, letterSpacing:'0.04em',
                opacity:0, animation:'pdFadeIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.8s forwards',
              }}>
                <span>Wix Harmony</span>
                <span>Content Team / Editor Team</span>
                <span>2026</span>
              </div>
            </div>
          )}

          {PRESENT_SLIDES[presentSlide]?.type === 'content' && (() => {
            const slide = PRESENT_SLIDES[presentSlide];
            const mono = "'SF Mono','Fira Mono','Roboto Mono',monospace";
            const ease = 'cubic-bezier(0.22,1,0.36,1)';
            const demoLine = (text, delay, color='#555') => (
              <div style={{ fontSize:'clamp(11px,1.1vw,14px)', fontFamily:mono, color, whiteSpace:'pre',
                opacity:0, animation:`pdSlideRight 0.5s ${ease} ${delay}s forwards` }}>{text}</div>
            );
            const demoTag = (tag, cls, children, delay) => (
              <div style={{ opacity:0, animation:`pdScale 0.5s ${ease} ${delay}s forwards` }}>
                <span style={{ fontSize:'clamp(10px,1vw,13px)', fontFamily:mono, color:'#999' }}>&lt;{tag}{cls ? ` class="${cls}"` : ''}&gt;</span>
                {children && <div style={{ paddingLeft:'clamp(12px,1.5vw,20px)' }}>{children}</div>}
                <span style={{ fontSize:'clamp(10px,1vw,13px)', fontFamily:mono, color:'#999' }}>&lt;/{tag}&gt;</span>
              </div>
            );
            const demoPyramidRow = (label, w, color, delay) => (
              <div style={{ display:'flex', alignItems:'center', gap:12, opacity:0, animation:`pdSlideRight 0.6s ${ease} ${delay}s forwards` }}>
                <div style={{ width:w, height:'clamp(28px,3vw,40px)', background:color, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'clamp(10px,1vw,13px)', fontWeight:600, color:'#fff', letterSpacing:'0.03em', textTransform:'uppercase' }}>{label}</div>
              </div>
            );
            const demoStyleProp = (prop, val, delay) => (
              <div style={{ display:'flex', gap:8, alignItems:'baseline', opacity:0, animation:`pdSlideRight 0.4s ${ease} ${delay}s forwards` }}>
                <span style={{ fontSize:'clamp(10px,1vw,13px)', fontFamily:mono, color:'#999' }}>{prop}:</span>
                <span style={{ fontSize:'clamp(11px,1.1vw,14px)', fontFamily:mono, color:'#333', fontWeight:600 }}>{val}</span>
              </div>
            );
            const demoBox = (label, items, delay, accent='#3b82f6') => (
              <div style={{ border:`1px solid ${accent}33`, borderRadius:8, padding:'clamp(10px,1.2vw,16px)',
                opacity:0, animation:`pdScale 0.5s ${ease} ${delay}s forwards` }}>
                <div style={{ fontSize:'clamp(9px,0.9vw,11px)', fontWeight:700, color:accent, textTransform:'uppercase',
                  letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
                {items.map((t,i) => <div key={i} style={{ fontSize:'clamp(10px,1vw,13px)', color:'#555', lineHeight:1.6 }}>{t}</div>)}
              </div>
            );

            const renderDemo = () => {
              switch(slide.demo) {

                case 'definition': return (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'clamp(8px,1vw,16px)', height:'100%' }}>
                    <div style={{ fontSize:'clamp(36px,5vw,72px)', fontWeight:700, color:'#18181b', textTransform:'uppercase', letterSpacing:'0.04em', lineHeight:0.95,
                      opacity:0, animation:`pdScale 0.8s ${ease} 0.4s forwards` }}>SALE</div>
                    <div style={{ fontSize:'clamp(14px,1.8vw,24px)', fontWeight:300, color:'#71717a', fontStyle:'italic', letterSpacing:'0.02em',
                      opacity:0, animation:`pdFadeIn 0.8s ${ease} 0.7s forwards` }}>New Collection</div>
                    <div style={{ fontSize:'clamp(9px,0.8vw,11px)', fontWeight:600, color:'#a1a1aa', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:4,
                      opacity:0, animation:`pdFadeIn 0.6s ${ease} 1s forwards` }}>EST. 2024</div>
                  </div>
                );

                case 'audience': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'clamp(12px,1.5vw,20px)', justifyContent:'center', height:'100%' }}>
                    {[{icon:'\u2605',label:'DIY Users',sub:'No design background'},{icon:'\u25A0',label:'Small Business',sub:'Need fast, polished results'},{icon:'\u2726',label:'Creative Pros',sub:'Want expressive typography'}].map((u,i) => (
                      <div key={i} style={{ display:'flex', gap:12, alignItems:'center', opacity:0, animation:`pdSlideRight 0.5s ${ease} ${0.4+i*0.15}s forwards` }}>
                        <div style={{ fontSize:'clamp(20px,2.5vw,32px)' }}>{u.icon}</div>
                        <div>
                          <div style={{ fontSize:'clamp(12px,1.2vw,16px)', fontWeight:600, color:'#333' }}>{u.label}</div>
                          <div style={{ fontSize:'clamp(10px,1vw,13px)', color:'#888' }}>{u.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );

                case 'seo': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'clamp(8px,1vw,14px)', justifyContent:'center', height:'100%' }}>
                    {['<h1>SALE</h1>','<h2>New Collection</h2>','<h3>Shop Now</h3>'].map((t,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, opacity:0, animation:`pdSlideRight 0.5s ${ease} ${0.3+i*0.2}s forwards` }}>
                        <div style={{ fontSize:'clamp(10px,1vw,13px)', fontFamily:mono, color:'#ef4444', background:'#fef2f2', padding:'4px 8px', borderRadius:4 }}>{t}</div>
                        <div style={{ fontSize:14, color:'#ef4444', opacity:0, animation:`pdFadeIn 0.3s ${ease} ${0.8+i*0.2}s forwards` }}>{'\u2717'}</div>
                      </div>
                    ))}
                    <div style={{ marginTop:4, fontSize:'clamp(9px,0.9vw,11px)', color:'#ef4444', fontWeight:500,
                      opacity:0, animation:`pdFadeIn 0.6s ${ease} 1.2s forwards` }}>3 separate headings {'\u2014'} no semantic relationship</div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:'clamp(8px,1vw,14px)', padding:'clamp(8px,1vw,14px)',
                      background:'#fef2f2', borderRadius:8, border:'1px solid #fca5a5',
                      opacity:0, animation:`pdScale 0.5s ${ease} 1.5s forwards` }}>
                      <div style={{ fontSize:'clamp(16px,2vw,24px)' }}>{'\u26D4'}</div>
                      <div>
                        <div style={{ fontSize:'clamp(11px,1.1vw,14px)', fontWeight:700, color:'#dc2626' }}>BLOCKED</div>
                        <div style={{ fontSize:'clamp(9px,0.85vw,11px)', color:'#888' }}>Accessibility review required before release</div>
                      </div>
                    </div>
                  </div>
                );

                case 'blocker': return (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, height:'100%' }}>
                    <div style={{ width:'clamp(48px,5vw,64px)', height:'clamp(48px,5vw,64px)', borderRadius:'50%', background:'#fef2f2', border:'2px solid #fca5a5',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(20px,2.5vw,32px)',
                      opacity:0, animation:`pdScale 0.6s ${ease} 0.3s forwards` }}>{'\u26D4'}</div>
                    <div style={{ textAlign:'center', opacity:0, animation:`pdFadeIn 0.6s ${ease} 0.6s forwards` }}>
                      <div style={{ fontSize:'clamp(13px,1.3vw,18px)', fontWeight:600, color:'#dc2626' }}>BLOCKED</div>
                      <div style={{ fontSize:'clamp(10px,1vw,13px)', color:'#888', marginTop:4 }}>Accessibility review required</div>
                    </div>
                  </div>
                );

                case 'competitors': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'clamp(10px,1.2vw,16px)', justifyContent:'center', height:'100%' }}>
                    {[{name:'Canva',desc:'Grouped text presets',color:'#7c3aed'},{name:'Adobe Express',desc:'Styled composition library',color:'#e11d48'},{name:'Figma Sites',desc:'Text styling differentiator',color:'#333'}].map((c,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, opacity:0, animation:`pdSlideRight 0.5s ${ease} ${0.4+i*0.15}s forwards` }}>
                        <div style={{ width:'clamp(8px,0.8vw,12px)', height:'clamp(8px,0.8vw,12px)', borderRadius:'50%', background:c.color, flexShrink:0 }} />
                        <div>
                          <div style={{ fontSize:'clamp(12px,1.2vw,16px)', fontWeight:600, color:'#333' }}>{c.name}</div>
                          <div style={{ fontSize:'clamp(10px,1vw,13px)', color:'#888' }}>{c.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );

                case 'value': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'clamp(10px,1.2vw,16px)', justifyContent:'center', height:'100%' }}>
                    {[{n:'#1',label:'Most requested visual element'},{n:'30+',label:'Preset templates at launch'},{n:'\u221E',label:'Custom compositions possible'}].map((s,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'baseline', gap:12, opacity:0, animation:`pdSlideRight 0.5s ${ease} ${0.4+i*0.2}s forwards` }}>
                        <div style={{ fontSize:'clamp(20px,2.5vw,36px)', fontWeight:700, color:'#3b82f6', fontVariantNumeric:'tabular-nums', minWidth:'clamp(36px,4vw,56px)' }}>{s.n}</div>
                        <div style={{ fontSize:'clamp(11px,1.1vw,15px)', color:'#555' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                );

                case 'custom': return (
                  <div style={{ display:'flex', gap:'clamp(12px,1.5vw,24px)', height:'100%', alignItems:'center' }}>
                    <div style={{ flex:1, background:'#fff', borderRadius:8, border:'1px solid #e5e7eb', padding:'clamp(10px,1.2vw,16px)',
                      opacity:0, animation:`pdSlideRight 0.5s ${ease} 0.4s forwards` }}>
                      <div style={{ fontSize:'clamp(9px,0.8vw,11px)', fontWeight:700, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Panel</div>
                      {['Segment 1: SALE','Segment 2: New Collection','Segment 3: Shop Now'].map((s,i) => (
                        <div key={i} style={{ fontSize:'clamp(10px,1vw,13px)', color:'#555', padding:'4px 0', borderBottom:'1px solid #f3f4f6' }}>{s}</div>
                      ))}
                    </div>
                    <div style={{ fontSize:'clamp(16px,2vw,24px)', color:'#ccc', opacity:0, animation:`pdFadeIn 0.4s ${ease} 0.7s forwards` }}>{'\u2192'}</div>
                    <div style={{ flex:1, background:'#18181b', borderRadius:8, padding:'clamp(10px,1.2vw,16px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                      opacity:0, animation:`pdScale 0.5s ${ease} 0.8s forwards` }}>
                      <div style={{ fontSize:'clamp(9px,0.8vw,11px)', fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Canvas</div>
                      <div style={{ fontSize:'clamp(18px,2vw,28px)', fontWeight:700, color:'#fff' }}>SALE</div>
                      <div style={{ fontSize:'clamp(10px,1vw,14px)', fontWeight:300, color:'rgba(255,255,255,0.6)', fontStyle:'italic' }}>New Collection</div>
                      <div style={{ fontSize:'clamp(8px,0.8vw,11px)', fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Shop Now</div>
                    </div>
                  </div>
                );

                case 'html': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:4, justifyContent:'center', height:'100%', fontFamily:mono }}>
                    {demoLine('<h1 class="tc-wrapper">', 0.3, '#16a34a')}
                    {demoLine('  <span style="font-size:80px">SALE</span>', 0.5, '#333')}
                    {demoLine('  <span style="font-style:italic">New Collection</span>', 0.7, '#333')}
                    {demoLine('  <span style="font-size:12px">SHOP NOW</span>', 0.9, '#333')}
                    {demoLine('</h1>', 1.1, '#16a34a')}
                    <div style={{ marginTop:12, display:'flex', gap:6, opacity:0, animation:`pdFadeIn 0.5s ${ease} 1.4s forwards` }}>
                      <span style={{ fontSize:'clamp(9px,0.8vw,11px)', background:'#dcfce7', color:'#16a34a', padding:'2px 6px', borderRadius:3, fontWeight:600 }}>{'\u2713'} SEO</span>
                      <span style={{ fontSize:'clamp(9px,0.8vw,11px)', background:'#dcfce7', color:'#16a34a', padding:'2px 6px', borderRadius:3, fontWeight:600 }}>{'\u2713'} A11y</span>
                      <span style={{ fontSize:'clamp(9px,0.8vw,11px)', background:'#dcfce7', color:'#16a34a', padding:'2px 6px', borderRadius:3, fontWeight:600 }}>{'\u2713'} Selection</span>
                    </div>
                  </div>
                );

                case 'svg': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:4, justifyContent:'center', height:'100%', fontFamily:mono }}>
                    {demoLine('<h1 class="sr-only">SALE New Collection</h1>', 0.3, '#7c3aed')}
                    {demoLine('', 0.4)}
                    {demoLine('<svg aria-hidden="true" viewBox="...">', 0.5, '#3b82f6')}
                    {demoLine('  <text x="0" y="80" fill="url(#grad)">SALE</text>', 0.7, '#333')}
                    {demoLine('  <text x="0" y="120">New Collection</text>', 0.9, '#333')}
                    {demoLine('</svg>', 1.1, '#3b82f6')}
                    <div style={{ marginTop:12, display:'flex', gap:6, opacity:0, animation:`pdFadeIn 0.5s ${ease} 1.4s forwards` }}>
                      <span style={{ fontSize:'clamp(9px,0.8vw,11px)', background:'#ede9fe', color:'#7c3aed', padding:'2px 6px', borderRadius:3, fontWeight:600 }}>{'\u2713'} Gradients</span>
                      <span style={{ fontSize:'clamp(9px,0.8vw,11px)', background:'#ede9fe', color:'#7c3aed', padding:'2px 6px', borderRadius:3, fontWeight:600 }}>{'\u2713'} Stroke</span>
                      <span style={{ fontSize:'clamp(9px,0.8vw,11px)', background:'#ede9fe', color:'#7c3aed', padding:'2px 6px', borderRadius:3, fontWeight:600 }}>{'\u2713'} Filters</span>
                    </div>
                  </div>
                );

                case 'compare': return (
                  <div style={{ display:'flex', gap:'clamp(8px,1vw,16px)', height:'100%', alignItems:'center' }}>
                    {[
                      { title:'HTML Mode', color:'#16a34a', pros:['Direct SEO','Native a11y','Text selection','Simple structure'], cons:['No gradients','Limited positioning'] },
                      { title:'SVG Mode', color:'#7c3aed', pros:['Gradients & fills','Pixel-perfect','SVG filters','Native stroke'], cons:['No text selection','More complex'] },
                    ].map((m,mi) => (
                      <div key={mi} style={{ flex:1, borderRadius:8, border:`1px solid ${m.color}22`, padding:'clamp(8px,1vw,14px)',
                        opacity:0, animation:`pdScale 0.5s ${ease} ${0.3+mi*0.2}s forwards` }}>
                        <div style={{ fontSize:'clamp(11px,1.1vw,14px)', fontWeight:700, color:m.color, marginBottom:8 }}>{m.title}</div>
                        {m.pros.map((p,i) => <div key={i} style={{ fontSize:'clamp(9px,0.9vw,12px)', color:'#555', lineHeight:1.7 }}>{'\u2713'} {p}</div>)}
                        {m.cons.map((c,i) => <div key={i} style={{ fontSize:'clamp(9px,0.9vw,12px)', color:'#bbb', lineHeight:1.7 }}>{'\u2717'} {c}</div>)}
                      </div>
                    ))}
                  </div>
                );

                case 'screenreader': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, justifyContent:'center', height:'100%' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, opacity:0, animation:`pdFadeIn 0.4s ${ease} 0.3s forwards` }}>
                      <div style={{ fontSize:'clamp(9px,0.8vw,11px)', fontWeight:700, color:'#333', textTransform:'uppercase', letterSpacing:'0.06em' }}>VoiceOver Output</div>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', animation:'pdPulse 1.5s ease infinite' }} />
                    </div>
                    {['heading level 1:','SALE, New Collection, Shop Now'].map((t,i) => (
                      <div key={i} style={{ background:'#18181b', borderRadius:6, padding:'6px 10px',
                        fontSize:'clamp(11px,1.1vw,14px)', fontFamily:mono, color:i===0?'#a5f3fc':'#fff',
                        opacity:0, animation:`pdSlideRight 0.5s ${ease} ${0.5+i*0.3}s forwards` }}>{t}</div>
                    ))}
                    <div style={{ fontSize:'clamp(9px,0.9vw,12px)', color:'#22c55e', fontWeight:500, marginTop:4,
                      opacity:0, animation:`pdFadeIn 0.5s ${ease} 1.2s forwards` }}>{'\u2713'} One continuous reading {'\u00b7'} Correct DOM order</div>
                  </div>
                );

                case 'pyramid': {
                  const layers = [
                    { n:1, label:'Wrapper', color:'#3730a3' },
                    { n:2, label:'Text Style', color:'#4f46e5' },
                    { n:3, label:'Layout', color:'#6366f1' },
                    { n:4, label:'Effects', color:'#818cf8' },
                    { n:5, label:'Animation', color:'#a78bfa' },
                  ];
                  return (
                    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', height:'100%', gap:'clamp(10px,1.2vw,16px)' }}>
                      <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                        {layers.map((l,i) => (
                          <div key={i} style={{ flex:1, display:'flex', alignItems:'center', opacity:0, animation:`pdFadeIn 0.5s ${ease} ${0.3+i*0.2}s forwards` }}>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', position:'relative', zIndex:2 }}>
                              <div style={{ width:'clamp(28px,3vw,40px)', height:'clamp(28px,3vw,40px)', borderRadius:'50%', background:l.color,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:'clamp(11px,1.2vw,15px)', fontWeight:700, color:'#fff',
                                boxShadow:`0 0 0 3px #F0F0F0, 0 0 0 5px ${l.color}40` }}>
                                {l.n}
                              </div>
                              <div style={{ fontSize:'clamp(8px,0.75vw,10px)', fontWeight:600, color:l.color, marginTop:6,
                                textAlign:'center', whiteSpace:'nowrap', letterSpacing:'0.02em' }}>{l.label}</div>
                            </div>
                            {i < layers.length - 1 && (
                              <div style={{ flex:1, height:2, background:`linear-gradient(90deg, ${l.color}, ${layers[i+1].color})`,
                                marginTop: -18,
                                opacity:0, animation:`pdSlideRight 0.4s ${ease} ${0.5+i*0.2}s forwards` }} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', opacity:0, animation:`pdFadeIn 0.5s ${ease} 1.6s forwards` }}>
                        <span style={{ fontSize:'clamp(8px,0.7vw,10px)', color:'#3730a3', fontWeight:600 }}>{'\u2190'} Most Critical</span>
                        <span style={{ fontSize:'clamp(8px,0.7vw,10px)', color:'#a78bfa' }}>Nice to Have {'\u2192'}</span>
                      </div>
                    </div>
                  );
                }

                case 'wrapper': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, justifyContent:'center', height:'100%' }}>
                    <div style={{ border:'2px solid #3730a3', borderRadius:8, padding:'clamp(10px,1.2vw,16px)',
                      opacity:0, animation:`pdScale 0.6s ${ease} 0.3s forwards` }}>
                      <div style={{ fontSize:'clamp(9px,0.8vw,11px)', fontWeight:700, color:'#3730a3', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>&lt;h1&gt; wrapper</div>
                      {['SALE','New Collection','Shop Now'].map((t,i) => (
                        <div key={i} style={{ background:'#eef2ff', borderRadius:4, padding:'4px 8px', marginBottom:4,
                          fontSize:'clamp(10px,1vw,14px)', color:'#3730a3',
                          opacity:0, animation:`pdSlideRight 0.4s ${ease} ${0.6+i*0.2}s forwards` }}>&lt;span&gt; {t}</div>
                      ))}
                    </div>
                    <div style={{ textAlign:'center', fontSize:'clamp(9px,0.9vw,12px)', color:'#16a34a', fontWeight:600,
                      opacity:0, animation:`pdFadeIn 0.5s ${ease} 1.3s forwards` }}>Single semantic unit {'\u2713'}</div>
                  </div>
                );

                case 'style': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'clamp(6px,0.8vw,10px)', justifyContent:'center', height:'100%' }}>
                    <div style={{ fontSize:'clamp(28px,3.5vw,48px)', fontWeight:700, color:'#18181b', letterSpacing:'0.04em',
                      opacity:0, animation:`pdScale 0.6s ${ease} 0.3s forwards` }}>SALE</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      {demoStyleProp('font-family', 'Bebas Neue', 0.5)}
                      {demoStyleProp('font-size', '80px', 0.6)}
                      {demoStyleProp('font-weight', '700', 0.7)}
                      {demoStyleProp('letter-spacing', '0.04em', 0.8)}
                      {demoStyleProp('line-height', '0.95', 0.9)}
                      {demoStyleProp('color', '#18181b', 1.0)}
                    </div>
                  </div>
                );

                case 'layout': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'clamp(12px,1.5vw,20px)', justifyContent:'center', height:'100%' }}>
                    <div style={{ display:'flex', gap:8, opacity:0, animation:`pdSlideRight 0.5s ${ease} 0.3s forwards` }}>
                      {['SALE','Collection'].map((t,i) => (
                        <div key={i} style={{ background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:4, padding:'4px 8px',
                          fontSize:'clamp(11px,1.1vw,15px)', fontWeight:600, color:'#4f46e5' }}>{t}</div>
                      ))}
                      <span style={{ fontSize:'clamp(9px,0.8vw,11px)', color:'#999', alignSelf:'center', marginLeft:4 }}>direction: row</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8, opacity:0, animation:`pdSlideRight 0.5s ${ease} 0.6s forwards` }}>
                      {['SALE','Collection'].map((t,i) => (
                        <div key={i} style={{ background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:4, padding:'4px 8px', width:'fit-content',
                          fontSize:'clamp(11px,1.1vw,15px)', fontWeight:600, color:'#4f46e5' }}>{t}</div>
                      ))}
                      <span style={{ fontSize:'clamp(9px,0.8vw,11px)', color:'#999' }}>direction: column \u00b7 gap: 8px \u00b7 align: start</span>
                    </div>
                  </div>
                );

                case 'effects': return (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(8px,1vw,14px)', alignContent:'center', height:'100%' }}>
                    {[
                      {label:'Outline', style:{WebkitTextStroke:'2px #333', color:'transparent'}},
                      {label:'Hard Shadow', style:{textShadow:'3px 3px 0 rgba(0,0,0,0.8)', color:'#fff'}},
                      {label:'Neon Glow', style:{textShadow:'0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 40px #3b82f6', color:'#fff'}},
                      {label:'3D Extrude', style:{textShadow:'1px 1px 0 #666,2px 2px 0 #555,3px 3px 0 #444,4px 4px 0 #333', color:'#fff'}},
                    ].map((fx,i) => (
                      <div key={i} style={{ background:'#18181b', borderRadius:6, padding:'clamp(8px,1vw,14px)', textAlign:'center',
                        opacity:0, animation:`pdScale 0.5s ${ease} ${0.3+i*0.15}s forwards` }}>
                        <div style={{ fontSize:'clamp(18px,2.2vw,30px)', fontWeight:700, ...fx.style }}>Aa</div>
                        <div style={{ fontSize:'clamp(8px,0.8vw,10px)', color:'rgba(255,255,255,0.4)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{fx.label}</div>
                      </div>
                    ))}
                  </div>
                );

                case 'animation': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'clamp(8px,1vw,14px)', justifyContent:'center', height:'100%' }}>
                    {[
                      {label:'Fade Up', anim:'pdSlideUp'},
                      {label:'Scale', anim:'pdScale'},
                      {label:'Slide Right', anim:'pdSlideRight'},
                    ].map((a,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, opacity:0, animation:`${a.anim} 0.8s ${ease} ${0.4+i*0.3}s forwards` }}>
                        <div style={{ fontSize:'clamp(18px,2.2vw,28px)', fontWeight:700, color:'#333' }}>Hello</div>
                        <div style={{ fontSize:'clamp(9px,0.8vw,11px)', color:'#999', fontFamily:mono }}>{a.label}</div>
                      </div>
                    ))}
                    <div style={{ fontSize:'clamp(9px,0.9vw,12px)', color:'#888', marginTop:4,
                      opacity:0, animation:`pdFadeIn 0.5s ${ease} 1.4s forwards` }}>+ blur, flip, slide, fade down/left/right</div>
                  </div>
                );

                case 'flow-preset': return (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'clamp(6px,0.8vw,10px)', alignContent:'center', height:'100%' }}>
                    {['Script+Sans','Bold+Script','Sticker Pop','Neon Glow','Win Win','CTA Badge','Vintage','3D Extrude','Minimal'].map((name,i) => (
                      <div key={i} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:6, padding:'clamp(6px,0.8vw,10px)', textAlign:'center',
                        fontSize:'clamp(8px,0.8vw,11px)', color:'#555',
                        opacity:0, animation:`pdScale 0.4s ${ease} ${0.2+i*0.08}s forwards`,
                        ...(i===0?{border:'2px solid #3b82f6', background:'#eff6ff'}:{}) }}>{name}</div>
                    ))}
                  </div>
                );

                case 'flow-edit': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, justifyContent:'center', height:'100%' }}>
                    {['Segment 1','Segment 2','Segment 3'].map((s,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8,
                        opacity:0, animation:`pdSlideRight 0.4s ${ease} ${0.3+i*0.15}s forwards` }}>
                        <div style={{ width:'clamp(14px,1.5vw,20px)', height:'clamp(14px,1.5vw,20px)', background:'#e5e7eb', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'clamp(8px,0.8vw,10px)', color:'#999', cursor:'grab' }}>{'\u2630'}</div>
                        <div style={{ flex:1, background:'#fff', border:'1px solid #e5e7eb', borderRadius:4, padding:'4px 8px',
                          fontSize:'clamp(10px,1vw,13px)', color:'#333' }}>{['SALE','New Collection','Shop Now'][i]}</div>
                        <div style={{ fontSize:'clamp(8px,0.8vw,10px)', color:'#999', fontFamily:mono }}>#{i+1}</div>
                      </div>
                    ))}
                    <div style={{ fontSize:'clamp(9px,0.9vw,11px)', color:'#3b82f6', fontWeight:500, marginTop:4,
                      opacity:0, animation:`pdFadeIn 0.5s ${ease} 0.9s forwards` }}>Drag to reorder \u00b7 DOM order updates live</div>
                  </div>
                );

                case 'flow-style': return (
                  <div style={{ display:'flex', gap:'clamp(12px,1.5vw,24px)', height:'100%', alignItems:'center' }}>
                    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, opacity:0, animation:`pdSlideRight 0.5s ${ease} 0.3s forwards` }}>
                      {[{l:'Font',v:'Bebas Neue'},{l:'Size',v:'80px'},{l:'Weight',v:'700'},{l:'Color',v:'#18181b'},{l:'Tracking',v:'0.04em'}].map((f,i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'clamp(9px,0.9vw,12px)', padding:'2px 0', borderBottom:'1px solid #f3f4f6' }}>
                          <span style={{ color:'#999' }}>{f.l}</span>
                          <span style={{ color:'#333', fontWeight:500, fontFamily:mono }}>{f.v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ flex:1, background:'#18181b', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(12px,1.5vw,20px)',
                      opacity:0, animation:`pdScale 0.5s ${ease} 0.6s forwards` }}>
                      <div style={{ fontSize:'clamp(24px,3vw,40px)', fontWeight:700, color:'#fff', letterSpacing:'0.04em' }}>SALE</div>
                    </div>
                  </div>
                );

                case 'flow-effects': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'clamp(8px,1vw,14px)', justifyContent:'center', height:'100%' }}>
                    <div style={{ display:'flex', gap:'clamp(6px,0.8vw,10px)', flexWrap:'wrap', opacity:0, animation:`pdFadeIn 0.5s ${ease} 0.3s forwards` }}>
                      {['Outline','Shadow','Neon','Retro','Badge','Twist'].map((e,i) => (
                        <div key={i} style={{ fontSize:'clamp(9px,0.8vw,11px)', padding:'3px 8px', borderRadius:4,
                          background: i===2?'#3b82f6':'#f3f4f6', color: i===2?'#fff':'#666', fontWeight:500 }}>{e}</div>
                      ))}
                    </div>
                    <div style={{ background:'#18181b', borderRadius:8, padding:'clamp(16px,2vw,24px)', textAlign:'center',
                      opacity:0, animation:`pdScale 0.6s ${ease} 0.5s forwards` }}>
                      <div style={{ fontSize:'clamp(24px,3vw,40px)', fontWeight:700, color:'#fff',
                        textShadow:'0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 40px #3b82f6' }}>SALE</div>
                    </div>
                    <div style={{ fontSize:'clamp(9px,0.9vw,12px)', color:'#888',
                      opacity:0, animation:`pdFadeIn 0.5s ${ease} 0.9s forwards` }}>Set animation: fadeUp \u00b7 500ms \u00b7 150ms stagger \u00b7 spring easing</div>
                  </div>
                );

                case 'flow-publish': return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'clamp(8px,1vw,14px)', justifyContent:'center', height:'100%' }}>
                    {[
                      {icon:'\u2713', label:'Semantic tag: h1', color:'#16a34a'},
                      {icon:'\u2713', label:'Contrast ratio: 12.4:1', color:'#16a34a'},
                      {icon:'\u2713', label:'Screen reader: passing', color:'#16a34a'},
                      {icon:'\u2713', label:'WCAG AA compliant', color:'#16a34a'},
                    ].map((c,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8,
                        opacity:0, animation:`pdSlideRight 0.4s ${ease} ${0.3+i*0.15}s forwards` }}>
                        <div style={{ width:'clamp(16px,1.5vw,20px)', height:'clamp(16px,1.5vw,20px)', borderRadius:'50%', background:`${c.color}15`, color:c.color,
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(9px,0.9vw,12px)', fontWeight:700 }}>{c.icon}</div>
                        <div style={{ fontSize:'clamp(11px,1.1vw,14px)', color:'#333' }}>{c.label}</div>
                      </div>
                    ))}
                    <div style={{ marginTop:4, background:'#f8fafc', borderRadius:6, padding:'6px 10px',
                      fontSize:'clamp(9px,0.9vw,12px)', fontFamily:mono, color:'#666',
                      opacity:0, animation:`pdFadeIn 0.5s ${ease} 1s forwards` }}>Code copied to clipboard {'\u2713'}</div>
                  </div>
                );

                default: return (
                  <div style={{ width:'100%', height:'100%', border:'1px solid rgba(0,0,0,0.06)', borderRadius:8 }} />
                );
              }
            };

            return (
              <div style={{
                flex:1, display:'flex', flexDirection:'column',
                padding:'24px 32px 32px', cursor:'none', userSelect:'none',
                fontFamily:"'Neue Haas Grotesk Display Pro','Helvetica Neue','Inter',sans-serif",
                background:'#F0F0F0',
              }}>
                <div style={{
                  fontSize:13, fontWeight:400, color:'rgba(51,51,51,0.4)',
                  paddingBottom:12, fontVariantNumeric:'tabular-nums',
                  opacity:0, animation:`pdFadeIn 0.5s ${ease} 0.05s forwards`,
                }}>{slide.chapterNum}</div>
                <div style={{
                  flex:1, display:'flex', flexDirection:'column',
                  border:'1px solid rgba(0,0,0,0.1)', borderRadius:12,
                  padding:'clamp(24px, 3vw, 48px)',
                }}>
                  <div style={{
                    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                    marginBottom:'clamp(16px, 2vw, 32px)',
                  }}>
                    <div style={{
                      fontSize:'clamp(28px, 4vw, 56px)', fontWeight:300, color:'#333',
                      letterSpacing:'0.02em', lineHeight:1,
                      opacity:0, animation:`pdSlideUp 0.7s ${ease} 0.15s forwards`,
                    }}>{slide.section}</div>
                    <div style={{
                      fontSize:'clamp(11px, 1.2vw, 15px)', fontWeight:400, color:'rgba(51,51,51,0.45)',
                      letterSpacing:'0.03em', whiteSpace:'nowrap', paddingTop:'0.4em',
                      opacity:0, animation:`pdFadeIn 0.6s ${ease} 0.4s forwards`,
                    }}>{slide.chapterTitle}</div>
                  </div>
                  <div style={{ flex:1, display:'flex', gap:'clamp(20px, 2.5vw, 40px)' }}>
                    <div style={{ flex:'0 0 28%', display:'flex', alignItems:'flex-start' }}>
                      <div style={{
                        fontSize:'clamp(14px, 1.5vw, 20px)', fontWeight:400, color:'#333',
                        lineHeight:1.55, letterSpacing:'0.005em',
                        opacity:0, animation:`pdFadeIn 0.8s ${ease} 0.3s forwards`,
                      }}>{slide.body}</div>
                    </div>
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {['style','layout','effects','animation','wrapper','custom','html','svg','screenreader',
                        'flow-preset','flow-edit','flow-style','flow-effects','flow-publish'].includes(slide.demo) ? (
                        <div style={{ width:'100%', height:'100%', borderRadius:10, overflow:'hidden', border:'1px solid rgba(0,0,0,0.08)',
                          opacity:0, animation:`pdScale 0.6s ${ease} 0.4s forwards` }}>
                          <iframe
                            src={`${window.location.origin}${window.location.pathname}?demo=${slide.demo}`}
                            style={{ width:'100%', height:'100%', border:'none', borderRadius:10 }}
                            title={`Demo: ${slide.demo}`}
                          />
                        </div>
                      ) : (
                        <div style={{ width:'100%', height:'100%', maxWidth:'clamp(240px, 30vw, 480px)',
                          opacity:0, animation:`pdFadeIn 0.6s ${ease} 0.4s forwards` }}>
                          {renderDemo()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    borderTop:'1px solid rgba(0,0,0,0.1)', paddingTop:14,
                    fontSize:12, color:'rgba(51,51,51,0.35)', fontWeight:400, letterSpacing:'0.04em',
                    opacity:0, animation:`pdFadeIn 0.8s ${ease} 0.8s forwards`,
                  }}>
                    <span>Wix Harmony</span>
                    <span>Content Team / Editor Team</span>
                    <span>2026</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {PRESENT_SLIDES[presentSlide]?.type === 'chapter' && (() => {
            const slide = PRESENT_SLIDES[presentSlide];
            return (
              <div style={{
                flex:1, display:'flex', flexDirection:'column',
                padding:'24px 32px 32px', cursor:'none', userSelect:'none',
                fontFamily:"'Neue Haas Grotesk Display Pro','Helvetica Neue','Inter',sans-serif",
              }}>
                <div style={{
                  fontSize:13, fontWeight:400, color:'rgba(255,255,255,0.35)',
                  paddingBottom:12, fontVariantNumeric:'tabular-nums',
                  opacity:0, animation:'pdFadeIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s forwards',
                }}>{slide.num}</div>
                <div style={{
                  flex:1, display:'flex', flexDirection:'column',
                  border:'1px solid rgba(255,255,255,0.12)', borderRadius:12,
                  padding:'clamp(24px, 3vw, 48px)',
                  position:'relative',
                }}>
                  <div style={{
                    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                  }}>
                    <div style={{
                      fontSize:'clamp(28px, 4vw, 56px)', fontWeight:300, color:'#fff',
                      letterSpacing:'0.02em', lineHeight:1,
                      opacity:0, animation:'pdSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s forwards',
                    }}>{slide.title}</div>
                    <div style={{
                      fontSize:'clamp(11px, 1.2vw, 15px)', fontWeight:400, color:'rgba(255,255,255,0.4)',
                      letterSpacing:'0.03em', whiteSpace:'nowrap', paddingTop:'0.4em',
                      opacity:0, animation:'pdFadeIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.4s forwards',
                    }}>{slide.title}</div>
                  </div>
                  <div style={{
                    flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <div style={{
                      fontSize:'clamp(16px, 2vw, 26px)', fontWeight:400, color:'rgba(255,255,255,0.85)',
                      lineHeight:1.5, textAlign:'center', maxWidth:'60%', letterSpacing:'0.005em',
                      opacity:0, animation:'pdFadeIn 1s cubic-bezier(0.22,1,0.36,1) 0.5s forwards',
                    }}>{slide.summary}</div>
                  </div>
                  <div style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:14,
                    fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:400, letterSpacing:'0.04em',
                    opacity:0, animation:'pdFadeIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.8s forwards',
                  }}>
                    <span>Wix Harmony</span>
                    <span>Content Team / Editor Team</span>
                    <span>2026</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Navigation footer */}
          <div style={{
            position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)',
            display:'flex', gap:6, alignItems:'center', cursor:'default',
            opacity:0, animation:'pdFadeIn 0.6s ease 1.2s forwards',
          }} onClick={e => e.stopPropagation()}>
            {PRESENT_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setPresentSlide(i)} style={{
                width: presentSlide === i ? 24 : 6, height:6, borderRadius:3,
                background: presentSlide === i ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                border:'none', cursor:'pointer', padding:0,
                transition:`all 400ms ${EASE.spring}`,
              }}/>
            ))}
          </div>

          {/* ESC hint */}
          <button onClick={(e) => { e.stopPropagation(); presentExit(); }} style={{
            position:'absolute', top:16, right:16,
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:8, padding:'6px 12px', color:'rgba(255,255,255,0.3)',
            fontSize:10, fontWeight:500, letterSpacing:'0.06em', cursor:'pointer',
            fontFamily:"'Neue Haas Grotesk Display Pro','Helvetica Neue',sans-serif",
            opacity:0, animation:'pdFadeIn 0.6s ease 1.5s forwards',
            transition:`all 200ms ${EASE.out}`,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >ESC to exit</button>
        </div>,
        document.body
      )}

      {/* ── TOAST ── */}
      <div style={{
        position:'fixed', bottom:20, right:20,
        background:'rgba(15,23,42,0.88)',
        backdropFilter:'blur(16px) saturate(120%)', WebkitBackdropFilter:'blur(16px) saturate(120%)',
        color:'#fff', borderRadius:12, padding:'9px 18px',
        fontSize:12, fontWeight:500, letterSpacing:'0.01em',
        boxShadow:'0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        opacity:(toast||saveToast)?1:0, transform:(toast||saveToast)?'none':'translateY(8px) scale(0.96)',
        transition:`all 300ms ${EASE.spring}`, pointerEvents:'none', zIndex:999,
      }}>{saveToast || 'Copied to clipboard'}</div>

    </div>
  );
}

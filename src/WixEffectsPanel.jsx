import React, { useState, useRef, useCallback } from 'react';
import { effects } from './effects/index.jsx';
import { domNodeToPngBlob, downloadBlob } from './utils/exportPng.js';
import { exportAllAsZip } from './utils/exportZip.js';

const T = {
  glass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.55)',
  blur: 'blur(20px) saturate(180%)',
  shadow: '0 4px 24px rgba(0,0,0,0.045), 0 1px 3px rgba(0,0,0,0.02)',
  inner: 'inset 0 1px 0 rgba(255,255,255,0.55)',
  text1: '#0f172a',
  text2: '#334155',
  text3: '#94a3b8',
  text4: '#64748b',
  border: 'rgba(0,0,0,0.05)',
  accent: '#3b82f6',
  accentSoft: 'rgba(59,130,246,0.08)',
  ctrl: 'rgba(255,255,255,0.60)',
  ctrlBorder: 'rgba(0,0,0,0.07)',
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SIZES = [512, 1024, 2048, 4096];

const checker = {
  background: `
    linear-gradient(45deg, #f3f4f6 25%, transparent 25%) 0 0/16px 16px,
    linear-gradient(-45deg, #f3f4f6 25%, transparent 25%) 0 8px/16px 16px,
    linear-gradient(45deg, transparent 75%, #f3f4f6 75%) 8px -8px/16px 16px,
    linear-gradient(-45deg, transparent 75%, #f3f4f6 75%) -8px 0/16px 16px,
    #fff`,
};

export default function WixEffectsPanel() {
  const [text, setText] = useState('');
  const [width, setWidth] = useState(1024);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef(null);

  const findExportNode = (id) => rootRef.current?.querySelector(`[data-effect-id="${id}"]`);
  const displayText = (effect) => text.trim() || effect.defaultText || effect.name;

  const downloadOne = useCallback(async (effect) => {
    const el = findExportNode(effect.id);
    if (!el) return;
    setBusy(true);
    try {
      const blob = await domNodeToPngBlob(el, width);
      downloadBlob(blob, `${effect.id}-${slugify(displayText(effect))}.png`);
    } finally {
      setBusy(false);
    }
  }, [width, text]);

  const downloadAll = useCallback(async () => {
    setBusy(true);
    try {
      const entries = effects
        .map((e) => ({ name: e.id, el: findExportNode(e.id) }))
        .filter((e) => e.el);
      await exportAllAsZip(entries, width, `text-effects-${slugify(text || 'presets')}`);
    } finally {
      setBusy(false);
    }
  }, [width, text]);

  return (
    <div ref={rootRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', flexShrink: 0,
        background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
        borderBottom: `1px solid ${T.border}`, margin: '0 12px', borderRadius: '12px 12px 0 0',
        marginTop: 0,
      }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Custom text (empty = preset default)…"
          style={{
            flex: 1, minWidth: 180, height: 32, padding: '0 12px', fontSize: 12,
            border: `1px solid ${T.ctrlBorder}`, borderRadius: 8, background: T.ctrl,
            outline: 'none', fontFamily: 'inherit', color: T.text1,
          }}
        />
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: T.text3, whiteSpace: 'nowrap' }}>
          Export
          <select
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            style={{
              height: 32, padding: '0 8px', fontSize: 11, borderRadius: 8,
              border: `1px solid ${T.ctrlBorder}`, background: T.ctrl, fontFamily: 'inherit',
            }}
          >
            {SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
          </select>
        </label>
        <button
          type="button"
          onClick={downloadAll}
          disabled={busy}
          style={{
            height: 32, padding: '0 14px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
            background: busy ? T.text3 : T.accent, color: '#fff', border: 'none', borderRadius: 8,
            cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
            transition: `all 200ms ${EASE}`,
          }}
        >
          {busy ? 'Exporting…' : 'Download All (ZIP)'}
        </button>
      </div>

      <div style={{
        flex: 1, overflow: 'auto', padding: 12,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gridAutoRows: 'min-content',
        alignContent: 'start',
        gap: 10,
      }}>
        {effects.map((effect) => {
          const Comp = effect.Component;
          const label = displayText(effect);
          return (
            <div key={effect.id} style={{
              background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
              border: `1px solid ${T.glassBorder}`, borderRadius: 12,
              boxShadow: `${T.shadow}, ${T.inner}`, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ ...checker, padding: '24px 16px', minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                <Comp text={label} idPrefix={effect.id} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderTop: `1px solid ${T.border}`,
              }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.text4 }}>
                  {effect.name}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => downloadOne(effect)}
                  style={{
                    height: 26, padding: '0 10px', fontSize: 10, fontWeight: 500, fontFamily: 'inherit',
                    background: T.ctrl, color: T.text2, border: `1px solid ${T.ctrlBorder}`,
                    borderRadius: 6, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
                  }}
                >
                  PNG
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function slugify(s) {
  return String(s || 'text').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'text';
}

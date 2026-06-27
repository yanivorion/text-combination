import React from 'react';
import { presets } from './wix-presets.js';
import './wix-effects.css';

function fontStyle(preset, overrides = {}) {
  const fontFamily = overrides.fontFamily ?? preset.fontFamily;
  const fontSize = overrides.fontSize ?? preset.fontSize;
  const fontStyleVal = overrides.fontStyle ?? preset.fontStyle;
  const fontWeight = overrides.fontWeight ?? preset.fontWeight;
  const textTransform = overrides.textTransform ?? preset.textTransform;
  return {
    fontFamily,
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    fontStyle: fontStyleVal,
    fontWeight,
    textTransform,
    letterSpacing: overrides.letterSpacing ?? '0em',
    lineHeight: 1.2,
    ...preset.vars,
  };
}

function OutlineOut({ text, preset, overrides }) {
  const style = fontStyle(preset, overrides);
  const italic = (overrides.fontStyle ?? preset.fontStyle) === 'italic';
  return (
    <span
      className={`wfx-oo-unit${italic ? ' wfx-oo--italic' : ''}`}
      data-text={text}
      style={style}
    >
      <span className="wfx-oo-text">{text}</span>
    </span>
  );
}

function NeonSign({ text, preset, overrides }) {
  return (
    <div className="wfx">
      <span className="wfx-neon" style={fontStyle(preset, overrides)}>{text}</span>
    </div>
  );
}

function Glass({ text, preset, overrides }) {
  const style = fontStyle(preset, overrides);
  return (
    <div className="wfx">
      <span className="wfx-glass-unit" data-text={text} style={style}>
        <span className="wfx-glass-text">{text}</span>
      </span>
    </div>
  );
}

function Sticker({ text, preset, overrides }) {
  const style = fontStyle(preset, overrides);
  return (
    <div className="wfx">
      <span className="wfx-sticker-unit" data-text={text} style={style}>
        <span className="wfx-sticker-text">{text}</span>
      </span>
    </div>
  );
}

function Shook({ text, preset, overrides }) {
  const style = fontStyle(preset, overrides);
  const count = Number(preset.vars['--layer-count'] || 5);
  const layers = ['wfx-shook-l1', 'wfx-shook-l2', 'wfx-shook-l3', 'wfx-shook-l4'].slice(0, Math.max(0, count - 1));

  return (
    <div className="wfx">
      <span className="wfx-shook-unit" style={style}>
        <span className="wfx-shook-text">{text}</span>
        {layers.map((cls) => (
          <span key={cls} className={`wfx-shook-layer ${cls}`} data-text={text} aria-hidden="true" />
        ))}
      </span>
    </div>
  );
}

function LetterPress({ text, preset, overrides }) {
  const style = fontStyle(preset, overrides);
  return (
    <div className="wfx">
      <span className="wfx-lp-unit" data-text={text} style={style}>
        <span className="wfx-lp-text">{text}</span>
      </span>
    </div>
  );
}

function Glitch({ text, preset, overrides }) {
  const style = fontStyle(preset, overrides);
  return (
    <div className="wfx">
      <span className="wfx-glitch-unit" data-text={text} style={style}>
        <span className="wfx-glitch-text">{text}</span>
      </span>
    </div>
  );
}

function Striped({ text, preset, overrides }) {
  return (
    <div className="wfx">
      <span className="wfx-striped" style={fontStyle(preset, overrides)}>{text}</span>
    </div>
  );
}

function Retro({ text, preset, overrides }) {
  const style = fontStyle(preset, overrides);
  const count = Number(preset.vars['--layer-count'] || 4);
  return (
    <div className="wfx">
      <span className="wfx-retro-unit" style={style}>
        <span className="wfx-retro-text">{text}</span>
        {count > 1 && <span className="wfx-retro-layer wfx-retro-l1" aria-hidden="true">{text}</span>}
        {count > 2 && <span className="wfx-retro-layer wfx-retro-l2" aria-hidden="true">{text}</span>}
        {count > 3 && <span className="wfx-retro-layer wfx-retro-l3" aria-hidden="true">{text}</span>}
      </span>
    </div>
  );
}

function Noisy({ text, preset, overrides }) {
  return (
    <div className="wfx">
      <span className="wfx-noisy" style={fontStyle(preset, overrides)}>{text}</span>
    </div>
  );
}

function ThreeD({ text, preset, overrides }) {
  return (
    <div className="wfx">
      <span className="wfx-3d" style={fontStyle(preset, overrides)}>{text}</span>
    </div>
  );
}

function Matrix({ text, preset, overrides }) {
  const style = fontStyle(preset, overrides);
  return (
    <div className="wfx">
      <span className="wfx-matrix-unit" data-text={text} style={style}>
        <span className="wfx-matrix-text">{text}</span>
      </span>
    </div>
  );
}

function Bauhaus({ text, preset, overrides }) {
  const style = fontStyle(preset, overrides);
  return (
    <div className="wfx">
      <span className="wfx-bauhaus-unit" data-text={text} style={style}>
        <span className="wfx-bauhaus-text">{text}</span>
      </span>
    </div>
  );
}

const RENDERERS = {
  'outline-out': OutlineOut,
  'neon-sign': NeonSign,
  glass: Glass,
  sticker: Sticker,
  shook: Shook,
  'letter-press': LetterPress,
  glitch: Glitch,
  striped: Striped,
  retro: Retro,
  noisy: Noisy,
  '3d': ThreeD,
  matrix: Matrix,
  bauhaus: Bauhaus,
};

export function wixSegOverrides(seg) {
  if (!seg) return {};
  const preset = seg.wixPreset ? presets.find((p) => p.id === seg.wixPreset) : null;
  return {
    fontFamily: preset?.fontFamily ?? `'${seg.fontFamily}'`,
    fontSize: seg.fontSize,
    fontWeight: seg.fontWeight,
    fontStyle: seg.italic ? 'italic' : 'normal',
    textTransform: seg.textTransform,
    letterSpacing: seg.letterSpacing,
  };
}

export function wixPresetSegFields(preset) {
  const ff = preset.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  const panelText = preset.panelText || preset.defaultText;
  const effectColor = preset.vars?.['--text-effects-color-1'] || preset.vars?.['--text-color'];
  return {
    wixPreset: preset.id,
    effect: 'none',
    text: panelText,
    fontFamily: ff,
    fontSize: preset.fontSize,
    fontWeight: String(preset.fontWeight),
    italic: preset.fontStyle === 'italic',
    textTransform: preset.textTransform,
    ...(effectColor ? { color: effectColor } : {}),
  };
}

export function WixEffect({ presetId, text, overrides = {} }) {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) return null;
  const Renderer = RENDERERS[preset.type];
  const displayText = text ?? preset.defaultText;
  return <Renderer text={displayText} preset={preset} overrides={overrides} />;
}

export const effects = presets.map((p) => ({
  id: p.id,
  name: p.name,
  defaultText: p.defaultText,
  Component: ({ text, idPrefix }) => (
    <div data-effect-id={idPrefix || p.id}>
      <WixEffect presetId={p.id} text={text} />
    </div>
  ),
}));

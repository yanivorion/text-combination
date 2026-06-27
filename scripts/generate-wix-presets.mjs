/**
 * Generates src/effects/wix-presets.js from Wix odeditor textEffectsConfig.ts
 * Source: wix-private/odeditor-packages/.../textEffectsPanel/textEffectsConfig.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] || join(__dirname, 'wix-textEffectsConfig.ts');
const OUT = join(__dirname, '../src/effects/wix-presets.js');
const THUMB_BASE =
  'https://static.parastorage.com/services/santa-resources/dist/editor/interchangePanel/textEffect/v2';

const TYPE_MAP = {
  'wixEditorElements.TextEffectsOutlineOut': 'outline-out',
  'wixEditorElements.TextEffectsNeonSign': 'neon-sign',
  'wixEditorElements.TextEffectsGlass': 'glass',
  'wixEditorElements.TextEffectsSticker': 'sticker',
  'wixEditorElements.TextEffectsShook': 'shook',
  'wixEditorElements.TextEffectsLetterPress': 'letter-press',
  'wixEditorElements.TextEffectsGlitch': 'glitch',
  'wixEditorElements.TextEffectsStriped': 'striped',
  'wixEditorElements.TextEffectsRetro': 'retro',
  'wixEditorElements.TextEffectsNoisy': 'noisy',
  'wixEditorElements.TextEffectsBauhaus': 'bauhaus',
  'wixEditorElements.TextEffectsMatrix': 'matrix',
  'wixEditorElements.TextEffects3d': '3d',
};

const PANEL_TEXT = {
  'outline-out-galaxy': 'Galaxy',
  'neon-sign-remix': 'REMIX',
  'glass-astro': 'ASTRO',
  'shook-beyond': 'BEYOND',
  'sticker-fluffy': 'FLUFFY',
  'glitch-squish': 'SQUISH',
  'glass-glaze': 'GLAZE',
  'sticker-night': 'NIGHT',
  'letterpress-change': 'CHANGE',
};

const FONT_SIZE = {
  'outline-out-galaxy': 120,
  'outline-out-signal': 120,
  'outline-out-jolt': 120,
  'outline-out-dreamy': 120,
  'outline-out-outline': 120,
  'outline-out-hyper': 120,
  'press-start-2p': 40,
  gaude: 50,
  'kelly slab': 60,
  'bodoni-moda': 65,
  'bodoni-w01-poster': 65,
  'tusker-grotesk-ultra-condensed': 72,
  'p22-posada': 72,
  unifrakturmaguntia: 72,
  'climate-crisis': 70,
  modak: 80,
  avatar: 90,
  feonie: 90,
};

function stripPx(v) {
  if (typeof v === 'string' && v.endsWith('px')) return v.slice(0, -2);
  return v;
}

function parseSpx(v) {
  if (typeof v === 'string' && v.endsWith('spx')) return v.slice(0, -3);
  return v;
}

function glassShadowBlur(v) {
  const m = String(v).match(/glass-shadow_blur:(\d+)/);
  return m ? m[1] : v;
}

function mapVars(effectType, raw) {
  const vars = {};
  for (const [key, value] of Object.entries(raw)) {
    const prefixed = `--${key}`;
    switch (effectType) {
      case 'glass':
        if (key === 'stroke') vars['--border-color'] = value;
        else if (key === 'stroke-width') vars['--border-width'] = stripPx(value);
        else if (key === 'shadow-blur') vars['--shadow-blur'] = glassShadowBlur(value);
        else if (key === 'text-color') vars['--text-color'] = value;
        else if (key === 'shadow-color') vars['--shadow-color'] = value;
        else vars[prefixed] = value;
        break;
      case 'sticker':
        if (key === 'stroke') vars['--outer-stroke-color'] = value;
        else if (key === 'stroke-width') vars['--outer-stroke'] = stripPx(value);
        else if (key === 'fill') {
          vars['--bg-solid'] = value;
          vars['--text-effects-color-5'] = value;
        } else if (key === 'fill-opacity') vars['--bg-opacity'] = value;
        else vars[prefixed] = value;
        break;
      case 'shook':
        if (key === 'stroke') vars['--text-effects-outline-color'] = value;
        else if (key === 'stroke-width') vars['--outline-thickness'] = stripPx(value);
        else vars[prefixed] = value;
        break;
      case 'letter-press':
        if (key === 'fill') {
          vars['--text-effects-color-1'] = value;
          vars['--text-effects-color-2'] = value;
        } else if (key === 'fill-opacity') vars['--text-effects-opacity-color-1'] = value;
        else vars[prefixed] = value;
        break;
      case '3d':
        if (key === 'text-fill') vars['--fill-color'] = value;
        else if (key === 'text-fill-opacity') vars['--fill-opacity'] = value;
        else if (key === 'stroke-color') vars['--text-stroke-color'] = value;
        else if (key === 'stroke-opacity') vars['--text-stroke-opacity'] = value;
        else if (key === 'stroke-width') vars['--text-stroke'] = stripPx(value);
        else vars[prefixed] = value;
        break;
      case 'striped':
        if (key === 'stripe-size') vars['--stripe-size'] = parseSpx(value);
        else vars[prefixed] = value;
        break;
      case 'noisy':
        if (key === 'squiggly-level') vars['--squiggly-level'] = value;
        else vars[prefixed] = value;
        break;
      default:
        vars[prefixed] = value;
    }
  }

  if (effectType === 'sticker') {
    vars['--text-stroke'] = vars['--text-stroke'] ?? '0';
    vars['--shadow-opacity'] = vars['--shadow-opacity'] ?? '1';
  }

  return vars;
}

function parseThumbnail(ts, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`'${escaped}':\\s*\\{[\\s\\S]*?getTextEffectAssetUrl\\('([^']+)'\\)`);
  const m = ts.match(re);
  const file = m?.[1] ?? `${id}.png`;
  return `${THUMB_BASE}/${file}`;
}

function parsePresets(ts) {
  const presets = [];
  const blockRe = /'([^']+)':\s*\{[\s\S]*?componentType:\s*'([^']+)'[\s\S]*?friendlyName:\s*'([^']+)'[\s\S]*?cssCustomProperties:\s*\{([\s\S]*?)\}[\s\S]*?cssProperties:\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = blockRe.exec(ts)) !== null) {
    const [, id, componentType, friendlyName, customBlock, cssBlock] = m;
    const effectType = TYPE_MAP[componentType];
    if (!effectType) {
      console.warn(`Unknown component type: ${componentType} (${id})`);
      continue;
    }

    const cssCustomProperties = {};
    for (const line of customBlock.split('\n')) {
      const kv =
        line.match(/'([^']+)':\s*'([^']*)'/) ||
        line.match(/^\s*([a-z][\w-]*):\s*'([^']*)'/);
      if (kv) cssCustomProperties[kv[1]] = kv[2];
    }

    const cssProperties = {};
    for (const line of cssBlock.split('\n')) {
      const kv = line.match(/(\w+):\s*'([^']*)'/);
      if (kv) cssProperties[kv[1]] = kv[2];
    }

    const fontFamily = cssProperties.fontFamily || 'sans-serif';
    const fontSize = FONT_SIZE[id] ?? FONT_SIZE[fontFamily] ?? 80;
    const fontWeight = cssProperties.fontWeight === 'normal' ? 400 : Number(cssProperties.fontWeight) || 400;

    presets.push({
      id,
      name: friendlyName,
      defaultText: friendlyName,
      panelText: PANEL_TEXT[id] || friendlyName,
      thumbnailUrl: parseThumbnail(ts, id),
      type: effectType,
      fontFamily: `${fontFamily}`,
      fontSize,
      fontStyle: cssProperties.fontStyle || 'normal',
      fontWeight,
      textTransform: cssProperties.textTransform || 'none',
      textAlign: cssProperties.textAlign || 'center',
      vars: mapVars(effectType, cssCustomProperties),
    });
  }
  return presets;
}

function emit(presets) {
  const lines = [
    '// Auto-generated from Wix textEffectsConfig.ts — run: npm run wix-presets:build',
    '// Source: wix-private/odeditor-packages/.../textEffectsPanel/textEffectsConfig.ts',
    '',
    'export const presets = ' + JSON.stringify(presets, null, 2) + ';',
    '',
  ];
  return lines.join('\n');
}

const ts = readFileSync(SRC, 'utf8');
const presets = parsePresets(ts);
writeFileSync(OUT, emit(presets));
console.log(`Wrote ${presets.length} presets to ${OUT}`);

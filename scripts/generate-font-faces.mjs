#!/usr/bin/env node
/**
 * Scans public/fonts2 and generates:
 *  - public/fonts/wix-fonts.css   (Wix editor family aliases)
 *  - public/fonts/fonts2-catalog.css (all @font-face entries)
 *  - src/generated/font-families.json (for font picker)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FONTS2 = path.join(ROOT, 'public', 'fonts2');
const FONTS_LOCAL = path.join(ROOT, 'public', 'fonts');
const OUT_WIX = path.join(ROOT, 'public', 'fonts', 'wix-fonts.css');
const OUT_CATALOG = path.join(ROOT, 'public', 'fonts', 'fonts2-catalog.css');
const OUT_JSON = path.join(ROOT, 'src', 'generated', 'font-families.json');

const EXT_FORMAT = {
  '.otf': 'opentype',
  '.ttf': 'truetype',
  '.woff': 'woff',
  '.woff2': 'woff2',
};

/** Wix text-effects family → relative path inside fonts2 */
const WIX_ALIASES = [
  { family: 'marzo-w00-regular', file: 'Editor Fonts/not chosen/Marzo.otf', weight: 400, style: 'normal' },
  { family: 'brandon-grot-w01-light', file: 'Editor Fonts/Chosen/Brandon_light.otf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'enfonix', file: 'FONTS UPLOAD FOR WWW/All/Enfonix.otf', weight: 400, style: 'normal' },
  { family: 'feonie', file: 'FONTS UPLOAD FOR WWW/All/feonie.otf', weight: 400, style: 'normal' },
  { family: 'ogg', file: 'FONTS UPLOAD FOR WWW/All/Ogg 1.otf', weight: 400, style: 'normal' },
  { family: 'ogg', file: 'FONTS UPLOAD FOR WWW/All/Ogg 2.otf', weight: 700, style: 'italic' },
  { family: 'gaude', file: 'FONTS UPLOAD FOR WWW/All/Gaude.otf', weight: 400, style: 'normal' },
  { family: 'vag-rounded-next', file: 'FONTS UPLOAD FOR WWW/All/VAG Rounded Next.otf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'oktah-round', file: 'FONTS UPLOAD FOR WWW/All/Oktah Round 1.otf', weight: 400, style: 'normal' },
  { family: 'oktah-round', file: 'FONTS UPLOAD FOR WWW/All/Oktah Round 2.otf', weight: 700, style: 'italic' },
  { family: 'benzin', file: 'FONTS UPLOAD FOR WWW/All/Benzin 1.ttf', weight: 400, style: 'normal' },
  { family: 'benzin', file: 'FONTS UPLOAD FOR WWW/All/Benzin 2.ttf', weight: 700, style: 'normal' },
  { family: 'dancingscript-regular', file: 'FONTS UPLOAD FOR WWW/All/DancingScript-Regular.ttf', weight: 400, style: 'normal' },
  { family: 'climate-crisis', file: 'Final Wixel fonts/ClimateCrisis-Regular.ttf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'fahkwang', file: 'Final Wixel fonts/Fahkwang-Regular.ttf', weight: 400, style: 'normal' },
  { family: 'fahkwang', file: 'Final Wixel fonts/Fahkwang-Bold.ttf', weight: 700, style: 'normal' },
  { family: 'syne-extrabold', file: 'Final Wixel fonts/Syne-ExtraBold.ttf', weight: 800, style: 'normal' },
  { family: 'modak', file: 'Final Wixel fonts/Modak-Regular.ttf', weight: 400, style: 'normal' },
  { family: 'press-start-2p', file: 'Final Wixel fonts/PressStart2P-Regular.ttf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'orbitron', file: 'Final Wixel fonts/Orbitron-Regular.ttf', weight: 400, style: 'normal' },
  { family: 'orbitron', file: 'Final Wixel fonts/Orbitron-Bold.ttf', weight: 700, style: 'normal' },
  { family: 'tusker-grotesk-ultra-condensed', file: 'FONTS UPLOAD FOR WWW/All/Tusker Grotesk Ultra Condensed 1.otf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'winner-college', file: 'FONTS UPLOAD FOR WWW/All/Winner College.otf', weight: 400, style: 'normal' },
  { family: 'wix-madefor-text-v2', file: 'Final Wixel fonts/WixMadeforText-Regular.ttf', weight: 400, style: 'normal' },
  { family: 'wix-madefor-text-v2', file: 'Final Wixel fonts/WixMadeforText-Italic.ttf', weight: 400, style: 'italic' },
  { family: 'wix-madefor-text-v2', file: 'Final Wixel fonts/WixMadeforText-SemiBold.ttf', weight: 600, style: 'normal' },
  { family: 'wix-madefor-text-v2', file: 'Final Wixel fonts/WixMadeforText-SemiBoldItalic.ttf', weight: 600, style: 'italic' },
  { family: 'bodoni-moda', file: 'Final Wixel fonts/BodoniModa_9pt-Regular.ttf', weight: 400, style: 'normal' },
  { family: 'bodoni-w01-poster', file: 'Final Wixel fonts/BodoniStd-Poster.otf', weight: 400, style: 'normal' },
  { family: 'kelly slab', file: 'FONTS UPLOAD FOR WWW/All/KellySlab-Regular.ttf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'holy-river', file: 'FONTS UPLOAD FOR WWW/All/Holy River.otf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'digital', file: 'FONTS UPLOAD FOR WWW/All/Digital.otf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'monoton', file: 'Final Wixel fonts/Monoton-Regular.ttf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'pirata-one', file: 'Final Wixel fonts/PirataOne-Regular.ttf', weight: 400, style: 'normal' },
  { family: 'suez one', file: 'Final Wixel fonts/SuezOne-Regular.ttf', weight: 400, style: 'normal' },
  { family: 'unifrakturmaguntia', file: 'Final Wixel fonts/UnifrakturMaguntia-Regular.ttf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'bandito-script', file: 'FONTS UPLOAD FOR WWW/All/Bandito Script.otf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'ca-smut', file: 'FONTS UPLOAD FOR WWW/All/CA Smut.otf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'eschaton', file: 'FONTS UPLOAD FOR WWW/All/Eschaton 1.otf', weight: 400, style: 'normal' },
  { family: 'midnight-terror', file: 'FONTS UPLOAD FOR WWW/All/Midnight Terror.otf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'p22-posada', file: 'FONTS UPLOAD FOR WWW/All/P22 Posada.otf', weight: 400, styles: ['normal', 'italic'] },
  { family: 'zing-rust', file: 'FONTS UPLOAD FOR WWW/All/Zing Rust.otf', weight: 400, style: 'normal' },
  { family: 'neue-haas-grotesk-display-pro', file: 'FONTS UPLOAD FOR WWW/All/Neue Haas Grotesk Display Pro 1.ttf', weight: 400, style: 'normal' },
  { family: 'neue-haas-grotesk-display-pro', file: 'FONTS UPLOAD FOR WWW/All/Neue Haas Grotesk Display Pro 2.ttf', weight: 400, style: 'italic' },
  { family: 'neue-haas-grotesk-display-pro', file: 'FONTS UPLOAD FOR WWW/All/Neue Haas Grotesk Display Pro 3.ttf', weight: 500, style: 'normal' },
  { family: 'neue-haas-grotesk-display-pro', file: 'FONTS UPLOAD FOR WWW/All/Neue Haas Grotesk Display Pro 4.ttf', weight: 500, style: 'italic' },
  { family: 'neue-haas-grotesk-display-pro', file: 'FONTS UPLOAD FOR WWW/All/Neue Haas Grotesk Display Pro 5.ttf', weight: 700, style: 'normal' },
  { family: 'neue-haas-grotesk-display-pro', file: 'FONTS UPLOAD FOR WWW/All/Neue Haas Grotesk Display Pro 6.ttf', weight: 700, style: 'italic' },
  {
    family: 'avatar',
    file: 'avatar/avatar.latin.woff2',
    fallbacks: ['avatar/avatar.latin.ttf'],
    weight: 400,
    style: 'normal',
    root: 'local',
  },
];

function cssUrl(relPath, root = 'fonts2') {
  const segments = relPath.split('/').map((s) => encodeURIComponent(s));
  if (root === 'local') return `url("${segments.join('/')}")`;
  return `url("../fonts2/${segments.join('/')}")`;
}

function formatOf(file) {
  return EXT_FORMAT[path.extname(file).toLowerCase()] || 'opentype';
}

function inferMeta(basename) {
  const lower = basename.toLowerCase();
  let weight = 400;
  let style = 'normal';
  if (/\bblack\b/.test(lower)) weight = 900;
  else if (/\b(extrabold|extra-bold|ultrabold)\b/.test(lower)) weight = 800;
  else if (/\bbold\b/.test(lower) && !/\bsemibold\b/.test(lower)) weight = 700;
  else if (/\b(semibold|demibold)\b/.test(lower)) weight = 600;
  else if (/\bmedium\b/.test(lower)) weight = 500;
  else if (/\b(light|thin|extralight)\b/.test(lower)) weight = 300;
  if (/\b(italic|oblique)\b/.test(lower)) style = 'italic';
  return { weight, style };
}

function displayFamily(basename) {
  const noExt = basename.replace(/\.[^.]+$/, '');
  const cleaned = noExt
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/_/g, ' ')
    .trim();
  return cleaned;
}

function walkFonts(dir, base = '') {
  const entries = [];
  if (!fs.existsSync(dir)) return entries;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      entries.push(...walkFonts(full, rel));
    } else if (EXT_FORMAT[path.extname(name).toLowerCase()]) {
      entries.push({ rel, basename: name });
    }
  }
  return entries;
}

function faceBlock({ family, rel, weight, style, format, root = 'fonts2', fallbacks = [] }) {
  const sources = [{ rel, format }];
  for (const fb of fallbacks) sources.push(fb);
  const src = sources
    .map(({ rel: r, format: f }) => `${cssUrl(r, root)} format(${JSON.stringify(f)})`)
    .join(',\n       ');
  return `@font-face {
  font-family: ${JSON.stringify(family)};
  font-style: ${style};
  font-weight: ${weight};
  src: ${src};
  font-display: swap;
}`;
}

function resolveFile(rel, root = 'fonts2') {
  const base = root === 'local' ? FONTS_LOCAL : FONTS2;
  const full = path.join(base, rel);
  return fs.existsSync(full) ? rel : null;
}

function generateWixCss() {
  const blocks = [
    '/* Wix editor font aliases — generated by scripts/generate-font-faces.mjs */',
    '/* Source: public/fonts2 (Fonts 2 collection) */',
    '',
  ];
  const seen = new Set();

  for (const entry of WIX_ALIASES) {
    const root = entry.root || 'fonts2';
    const rel = resolveFile(entry.file, root);
    if (!rel) {
      console.warn(`[wix] missing: ${entry.file}`);
      continue;
    }
    const format = formatOf(rel);
    const fallbacks = (entry.fallbacks || [])
      .map((fb) => {
        const fbRel = resolveFile(fb, root);
        return fbRel ? { rel: fbRel, format: formatOf(fbRel) } : null;
      })
      .filter(Boolean);
    const styles = entry.styles || [entry.style || 'normal'];
    for (const style of styles) {
      const key = `${entry.family}|${style}|${entry.weight ?? 400}|${rel}`;
      if (seen.has(key)) continue;
      seen.add(key);
      blocks.push(faceBlock({
        family: entry.family,
        rel,
        weight: entry.weight ?? 400,
        style,
        format,
        root,
        fallbacks,
      }));
      blocks.push('');
    }
  }
  return blocks.join('\n');
}

function generateCatalogCss(files) {
  const byBasename = new Map();
  for (const f of files) {
    const key = f.basename.toLowerCase();
    const prev = byBasename.get(key);
    if (!prev || f.rel.length < prev.rel.length) byBasename.set(key, f);
  }

  const unique = [...byBasename.values()].sort((a, b) => a.rel.localeCompare(b.rel));
  const blocks = [
    '/* Full Fonts 2 catalog — generated by scripts/generate-font-faces.mjs */',
    `/* ${unique.length} font files */`,
    '',
  ];

  for (const { rel, basename } of unique) {
    const family = displayFamily(basename);
    const { weight, style } = inferMeta(basename);
    blocks.push(faceBlock({
      family,
      rel,
      weight,
      style,
      format: formatOf(basename),
    }));
    blocks.push('');
  }
  return { css: blocks.join('\n'), families: unique.map((f) => displayFamily(f.basename)) };
}

function main() {
  if (!fs.existsSync(FONTS2)) {
    console.error(`fonts2 not found at ${FONTS2}`);
    console.error('Symlink your Fonts 2 folder to public/fonts2');
    process.exit(1);
  }

  const files = walkFonts(FONTS2);
  const wixCss = generateWixCss();
  const { css: catalogCss, families } = generateCatalogCss(files);

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_WIX, wixCss);
  fs.writeFileSync(OUT_CATALOG, catalogCss);

  const wixFamilies = [...new Set(WIX_ALIASES.map((a) => a.family))].sort();
  const uniqueFamilies = [...new Set(families)].sort((a, b) => a.localeCompare(b));
  fs.writeFileSync(OUT_JSON, JSON.stringify({
    wix: wixFamilies,
    catalog: uniqueFamilies,
    count: uniqueFamilies.length,
    generatedAt: new Date().toISOString(),
  }, null, 2));

  console.log(`Wrote ${OUT_WIX}`);
  console.log(`Wrote ${OUT_CATALOG} (${uniqueFamilies.length} families)`);
  console.log(`Wrote ${OUT_JSON}`);
}

main();

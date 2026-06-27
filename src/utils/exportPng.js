import { cloneNode } from 'html-to-image/es/clone-node.js';
import { embedWebFonts } from 'html-to-image/es/embed-webfonts.js';

const BASE_EXPORT_PAD = 100;

function resolveExportPad(cloned) {
  const inner = cloned.querySelector('[class*="wfx"]') || cloned;
  const fontSize = parseFloat(getComputedStyle(inner).fontSize) || 80;
  if (cloned.querySelector('.wfx-neon, .wfx-matrix-unit')) {
    return Math.ceil(fontSize * 2.5);
  }
  if (cloned.querySelector('.wfx-glass-root, .wfx-oo-unit')) {
    return Math.ceil(fontSize * 1.4);
  }
  return Math.max(BASE_EXPORT_PAD, Math.ceil(fontSize * 1.2));
}
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Merge all SVG filter defs into one <defs> on the export SVG root (required for rasterization). */
function collectFilterDefs() {
  const defs = document.createElementNS(SVG_NS, 'defs');
  const seen = new Set();
  document.querySelectorAll('body > svg defs > *, #root > svg defs > *').forEach((child) => {
    const id = child.getAttribute?.('id');
    if (id) {
      if (seen.has(id)) return;
      seen.add(id);
    }
    defs.appendChild(child.cloneNode(true));
  });
  return defs;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => img.decode().then(() => resolve(img)).catch(reject);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob failed'))), 'image/png');
  });
}

/**
 * Rasterize a prepared clone via SVG foreignObject with filters in <defs>.
 * html-to-image's default path omits filter defs from the outer SVG, breaking glass/outline effects.
 */
async function rasterizeClone(cloned, targetWidth) {
  const exportPad = resolveExportPad(cloned);
  cloned.style.padding = `${exportPad}px`;

  const measureHost = document.createElement('div');
  measureHost.style.cssText = 'position:fixed;left:-50000px;top:0;visibility:hidden;';
  measureHost.appendChild(cloned);
  document.body.appendChild(measureHost);

  try {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const width = Math.ceil(cloned.scrollWidth);
    const height = Math.ceil(cloned.scrollHeight);
    const contentWidth = Math.max(width - exportPad * 2, 1);
    const pixelRatio = Math.max(1, targetWidth / contentWidth);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.appendChild(collectFilterDefs());

    const foreignObject = document.createElementNS(SVG_NS, 'foreignObject');
    foreignObject.setAttribute('width', '100%');
    foreignObject.setAttribute('height', '100%');
    foreignObject.appendChild(cloned);
    svg.appendChild(foreignObject);

    const xml = new XMLSerializer().serializeToString(svg);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    const img = await loadImage(dataUrl);

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * pixelRatio);
    canvas.height = Math.ceil(height * pixelRatio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.drawImage(img, 0, 0);

    return canvasToBlob(canvas);
  } finally {
    measureHost.remove();
  }
}

/** DOM node -> transparent PNG Blob at target width (preserves CSS layers + SVG filters). */
export async function domNodeToPngBlob(node, targetWidth) {
  if (!node) throw new Error('domNodeToPngBlob: missing node');

  await document.fonts.ready;

  const cloned = await cloneNode(node, { cacheBust: true }, true);
  await embedWebFonts(cloned, { cacheBust: true });

  cloned.style.cssText = [
    'white-space:nowrap',
    'width:max-content',
    'max-width:none',
    'background:transparent',
    'box-sizing:border-box',
    'margin:0',
    'transform:none',
    'overflow:visible',
  ].join(';');

  return rasterizeClone(cloned, targetWidth);
}

/** @deprecated Use domNodeToPngBlob — kept for compatibility */
export async function svgNodeToPngBlob(svgEl, targetWidth) {
  const wrap = svgEl?.closest('[data-effect-id]') || svgEl?.parentElement;
  if (wrap) return domNodeToPngBlob(wrap, targetWidth);
  throw new Error('svgNodeToPngBlob: no export wrapper found');
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

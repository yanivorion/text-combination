import JSZip from 'jszip';
import { domNodeToPngBlob, downloadBlob } from './exportPng.js';

export async function exportAllAsZip(entries, targetWidth, baseName = 'text-effects') {
  const zip = new JSZip();
  for (const { name, el } of entries) {
    if (!el) continue;
    const blob = await domNodeToPngBlob(el, targetWidth);
    zip.file(`${slug(name)}.png`, blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `${baseName}.zip`);
}

function slug(s) {
  return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

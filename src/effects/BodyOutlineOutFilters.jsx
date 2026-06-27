import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { OutlineOutFilters } from './OutlineOutFilters.jsx';

/** Mount outline-out SVG filters on document.body (matches Wix useUniqueSvg). */
export function BodyOutlineOutFilters() {
  const [root, setRoot] = useState(null);

  useEffect(() => {
    setRoot(document.body);
  }, []);

  if (!root) return null;

  return createPortal(
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
      }}
    >
      <defs>
        <OutlineOutFilters />
      </defs>
    </svg>,
    root,
  );
}

import React from 'react';

export function SvgFilters() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <defs>
        {/* Glass bevel (ASTRO, Bouncy, etc.) */}
        <filter id="wfx-lightA3" x="-25%" y="-35%" width="150%" height="170%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.35" result="blur" />
          <feSpecularLighting
            in="blur"
            surfaceScale="5"
            specularConstant="1.1"
            specularExponent="18"
            lightingColor="#cccccc"
            result="spec"
          >
            <fePointLight x="-35" y="-55" z="160" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specMask" />
          <feComposite in="SourceGraphic" in2="specMask" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
        </filter>

        {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28].map((scale) => (
          <filter key={scale} id={`noisy_squiggly:${scale}`} colorInterpolationFilters="sRGB">
            <feTurbulence baseFrequency="0.08" numOctaves="13" result="noise" seed="0" />
            <feDisplacementMap in2="noise" in="SourceGraphic" scale={scale} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

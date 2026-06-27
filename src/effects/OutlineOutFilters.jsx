import React from 'react';

/** Ported from Wix TextEffectsOutlineOut/viewer/TextEffectsOutlineOut.tsx */
const AZIMUTHS = [0, 45, 90, 135, 180, 225, 270, 315, 360];
const BLEND_MODES = ['multiply', 'normal'];

function LightA3({ azimuth }) {
  return (
    <filter id={`outline-out-lightA3_azimuth:${azimuth}`} colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="B" />
      <feSpecularLighting in="B" specularExponent="128" result="S" lightingColor="#ffffff">
        <feDistantLight azimuth={azimuth} elevation="72" />
      </feSpecularLighting>
      <feComposite in="S" in2="SourceAlpha" operator="in" result="L" />
      <feComposite in="SourceGraphic" in2="L" operator="arithmetic" k2="1" k3="1" />
    </filter>
  );
}

function DarkGlass({ mode }) {
  return (
    <filter
      id={`outline-out-dark-glass_blend-mode:${mode}`}
      colorInterpolationFilters="linearRGB"
      x="-80%"
      y="-80%"
      width="260%"
      height="260%"
    >
      <feBlend result="A" mode="screen" in2="SourceGraphic" />
      <feGaussianBlur stdDeviation="2" result="B" />
      <feComposite operator="xor" in="B" in2="A" result="C" />
      <feComposite result="fC" in="C" operator="xor" in2="C" />
      <feGaussianBlur result="B" stdDeviation="3" in="fC" />
      <feSpecularLighting
        result="S"
        specularExponent="55"
        specularConstant="1.5"
        surfaceScale="6"
        in="B"
        lightingColor="#ffffff"
      >
        <fePointLight z="20000" y="-8000" x="-5000" />
      </feSpecularLighting>
      <feComposite in="B" k3="1" k2="1.5" operator="arithmetic" in2="SourceGraphic" result="C" />
      <feComposite in="S" operator="atop" in2="C" result="C" />
      <feBlend mode={mode} in2="C" />
    </filter>
  );
}

export function OutlineOutFilters() {
  return (
    <>
      {AZIMUTHS.map((azimuth) => (
        <LightA3 key={azimuth} azimuth={azimuth} />
      ))}
      {BLEND_MODES.map((mode) => (
        <DarkGlass key={mode} mode={mode} />
      ))}
    </>
  );
}

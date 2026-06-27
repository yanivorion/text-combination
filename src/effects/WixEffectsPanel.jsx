import React, { useState } from 'react';
import { presets } from './wix-presets.js';
import { WixEffect } from './WixEffect.jsx';
import './wix-effects-panel.css';

function TilePreview({ preset }) {
  const [useFallback, setUseFallback] = useState(false);

  if (!useFallback && preset.thumbnailUrl) {
    return (
      <img
        src={preset.thumbnailUrl}
        alt={preset.name}
        loading="lazy"
        decoding="async"
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <div className="wix-fx-tile-fallback">
      <div className="wix-fx-tile-preview">
        <WixEffect presetId={preset.id} text={preset.defaultText} />
      </div>
    </div>
  );
}

export function WixEffectsPanel({ selectedId, onSelect }) {
  return (
    <div className="wix-fx-panel" role="listbox" aria-label="Text effects">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          role="option"
          aria-selected={selectedId === preset.id}
          aria-label={preset.name}
          title={preset.name}
          className={`wix-fx-tile${selectedId === preset.id ? ' is-selected' : ''}`}
          onClick={() => onSelect(preset)}
        >
          <TilePreview preset={preset} />
        </button>
      ))}
    </div>
  );
}

import React from 'react';

export interface MosaicSettings {
  outputWidth: number;
  tileSize: number;
  tintOpacity: number;
}

interface MosaicControlsProps {
  settings: MosaicSettings;
  onSettingsChange: (settings: MosaicSettings) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
}

export const MosaicControls: React.FC<MosaicControlsProps> = ({
  settings,
  onSettingsChange,
  onGenerate,
  isGenerating,
  canGenerate
}) => {
  return (
    <div className="controls-panel">
      <h3>Mosaic Settings</h3>
      
      <div className="control-group">
        <label>
          Output Width: <span className="value">{settings.outputWidth}px</span>
        </label>
        <input
          type="range"
          min="600"
          max="2000"
          step="50"
          value={settings.outputWidth}
          onChange={(e) => onSettingsChange({ ...settings, outputWidth: Number(e.target.value) })}
          disabled={isGenerating}
        />
        <div className="range-labels">
          <span>600px</span>
          <span>2000px</span>
        </div>
      </div>

      <div className="control-group">
        <label>
          Tile Size: <span className="value">{settings.tileSize}px</span>
        </label>
        <input
          type="range"
          min="8"
          max="64"
          step="4"
          value={settings.tileSize}
          onChange={(e) => onSettingsChange({ ...settings, tileSize: Number(e.target.value) })}
          disabled={isGenerating}
        />
        <div className="range-labels">
          <span>8px (more detail)</span>
          <span>64px (larger tiles)</span>
        </div>
      </div>

      <div className="control-group">
        <label>
          Color Tint Overlay: <span className="value">{Math.round(settings.tintOpacity * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="0.6"
          step="0.05"
          value={settings.tintOpacity}
          onChange={(e) => onSettingsChange({ ...settings, tintOpacity: Number(e.target.value) })}
          disabled={isGenerating}
        />
        <div className="range-labels">
          <span>0% (pure tiles)</span>
          <span>60% (color matched)</span>
        </div>
        <p className="hint">Adds color overlay to better match goal image</p>
      </div>

      <button
        className="generate-btn"
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Mosaic'}
      </button>
    </div>
  );
};

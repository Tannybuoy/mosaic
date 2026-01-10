import React, { useState } from 'react';
import { EasingType } from '../utils/easing';

export interface GifSettings {
  width: number;
  duration: number;
  fps: number;
  startZoom: number;
  easing: EasingType;
}

interface GifExporterProps {
  settings: GifSettings;
  onSettingsChange: (settings: GifSettings) => void;
  onExport: () => void;
  isExporting: boolean;
  canExport: boolean;
  gifBlob: Blob | null;
  renderProgress: { current: number; total: number } | null;
  encodeProgress: number | null;
}

export const GifExporter: React.FC<GifExporterProps> = ({
  settings,
  onSettingsChange,
  onExport,
  isExporting,
  canExport,
  gifBlob,
  renderProgress,
  encodeProgress
}) => {
  const [gifUrl, setGifUrl] = useState<string | null>(null);

  // Create download URL when gif is ready
  React.useEffect(() => {
    if (gifBlob) {
      const url = URL.createObjectURL(gifBlob);
      setGifUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [gifBlob]);

  const handleDownload = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = 'mosaic-zoomout.gif';
    a.click();
  };

  const frameCount = Math.round(settings.duration * settings.fps);

  return (
    <div className="gif-section">
      <h3>Animation Settings</h3>

      <div className="settings-grid">
        <div className="control-group">
          <label>
            GIF Width: <span className="value">{settings.width}px</span>
          </label>
          <div className="button-group">
            {[400, 600, 800].map(width => (
              <button
                key={width}
                className={`option-btn ${settings.width === width ? 'active' : ''}`}
                onClick={() => onSettingsChange({ ...settings, width })}
                disabled={isExporting}
              >
                {width}px
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>
            Duration: <span className="value">{settings.duration}s</span>
          </label>
          <input
            type="range"
            min="2"
            max="8"
            step="0.5"
            value={settings.duration}
            onChange={(e) => onSettingsChange({ ...settings, duration: Number(e.target.value) })}
            disabled={isExporting}
          />
          <div className="range-labels">
            <span>2s</span>
            <span>8s</span>
          </div>
        </div>

        <div className="control-group">
          <label>
            FPS: <span className="value">{settings.fps}</span>
          </label>
          <input
            type="range"
            min="10"
            max="30"
            step="5"
            value={settings.fps}
            onChange={(e) => onSettingsChange({ ...settings, fps: Number(e.target.value) })}
            disabled={isExporting}
          />
          <div className="range-labels">
            <span>10 (smaller file)</span>
            <span>30 (smoother)</span>
          </div>
        </div>

        <div className="control-group">
          <label>
            Start Zoom: <span className="value">{settings.startZoom}x</span>
          </label>
          <input
            type="range"
            min="6"
            max="20"
            step="1"
            value={settings.startZoom}
            onChange={(e) => onSettingsChange({ ...settings, startZoom: Number(e.target.value) })}
            disabled={isExporting}
          />
          <div className="range-labels">
            <span>6x (wider view)</span>
            <span>20x (tile detail)</span>
          </div>
        </div>

        <div className="control-group">
          <label>Easing</label>
          <div className="button-group">
            {(['linear', 'easeOutCubic', 'easeInCubic', 'easeInOutCubic'] as EasingType[]).map(easing => (
              <button
                key={easing}
                className={`option-btn ${settings.easing === easing ? 'active' : ''}`}
                onClick={() => onSettingsChange({ ...settings, easing })}
                disabled={isExporting}
              >
                {easing.replace('ease', '').replace(/([A-Z])/g, ' $1').trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="export-info">
        <p className="info-text">
          📊 Will generate <strong>{frameCount} frames</strong>
        </p>
      </div>

      {isExporting && (
        <div className="progress-section">
          {renderProgress && (
            <div className="progress-bar">
              <div className="progress-label">
                Rendering Frames: {renderProgress.current} / {renderProgress.total}
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${(renderProgress.current / renderProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          {encodeProgress !== null && (
            <div className="progress-bar">
              <div className="progress-label">
                Encoding GIF: {encodeProgress}%
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill encoding"
                  style={{ width: `${encodeProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <button
        className="export-btn"
        onClick={onExport}
        disabled={!canExport || isExporting}
      >
        {isExporting ? 'Exporting...' : 'Export GIF'}
      </button>

      {gifBlob && gifUrl && (
        <div className="gif-result">
          <h4>Preview</h4>
          <div className="gif-preview">
            <img src={gifUrl} alt="Generated GIF" />
          </div>
          <button className="download-btn" onClick={handleDownload}>
            ⬇️ Download GIF
          </button>
        </div>
      )}
    </div>
  );
};

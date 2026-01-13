import { useState, useCallback } from 'react';
import { UploadPanel } from './components/UploadPanel';
import { MosaicControls, MosaicSettings } from './components/MosaicControls';
import { MosaicCanvas } from './components/MosaicCanvas';
import { GifExporter, GifSettings } from './components/GifExporter';
import { loadImageFromFile } from './utils/imageLoad';
import { preprocessTiles, generateMosaic, TileData } from './utils/mosaic';
import { generateGif } from './utils/gif';
import { EASING_OPTIONS } from './utils/easing';
import './App.css';

function App() {
  // Upload state
  const [goalImage, setGoalImage] = useState<File | null>(null);
  const [tilePhotos, setTilePhotos] = useState<File[]>([]);

  // Mosaic state
  const [mosaicSettings, setMosaicSettings] = useState<MosaicSettings>({
    outputWidth: 1200,
    tileSize: 16,
    tintOpacity: 0.2
  });
  const [mosaicCanvas, setMosaicCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setPreprocessedTiles] = useState<TileData[] | null>(null);

  // GIF state
  const [gifSettings, setGifSettings] = useState<GifSettings>({
    width: 600,
    duration: 4,
    fps: 20,
    startZoom: 12,
    easing: 'easeOutCubic'
  });
  const [focusPoint, setFocusPoint] = useState({ x: 0.5, y: 0.5 });
  const [isExporting, setIsExporting] = useState(false);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [renderProgress, setRenderProgress] = useState<{ current: number; total: number } | null>(null);
  const [encodeProgress, setEncodeProgress] = useState<number | null>(null);

  const canGenerate = !!(goalImage && tilePhotos.length >= 1 && tilePhotos.length <= 10);
  const canExport = mosaicCanvas !== null;

  const handleGenerateMosaic = useCallback(async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setMosaicCanvas(null);
    setGifBlob(null);

    try {
      // Load goal image
      const goalData = await loadImageFromFile(goalImage);

      // Load and preprocess tile photos
      const tilesData = await Promise.all(tilePhotos.map(loadImageFromFile));
      const tiles = await preprocessTiles(
        tilesData.map((data, i) => ({ ...data, file: tilePhotos[i] })),
        mosaicSettings.tileSize
      );
      setPreprocessedTiles(tiles);

      // Generate mosaic
      const result = await generateMosaic(
        goalData.bitmap || goalData.img,
        tiles,
        mosaicSettings
      );

      setMosaicCanvas(result.canvas);
      
      // Reset focus point to center
      setFocusPoint({ x: 0.5, y: 0.5 });
    } catch (error) {
      console.error('Mosaic generation failed:', error);
      alert(`Failed to generate mosaic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, [goalImage, tilePhotos, mosaicSettings, canGenerate]);

  const handleExportGif = useCallback(async () => {
    if (!mosaicCanvas) return;

    setIsExporting(true);
    setGifBlob(null);
    setRenderProgress(null);
    setEncodeProgress(null);

    try {
      const blob = await generateGif(
        mosaicCanvas,
        {
          ...gifSettings,
          easing: EASING_OPTIONS[gifSettings.easing],
          focusPoint
        },
        (current, total) => setRenderProgress({ current, total }),
        (percent) => setEncodeProgress(percent)
      );

      setGifBlob(blob);
      setRenderProgress(null);
      setEncodeProgress(null);
    } catch (error) {
      console.error('GIF export failed:', error);
      alert(`Failed to export GIF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }, [mosaicCanvas, gifSettings, focusPoint]);

  const handleReset = () => {
    if (confirm('Reset everything and start over?')) {
      setGoalImage(null);
      setTilePhotos([]);
      setMosaicCanvas(null);
      setGifBlob(null);
      setPreprocessedTiles(null);
      setFocusPoint({ x: 0.5, y: 0.5 });
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="logo">🎨</span>
          Tanya's Mosaic Animator
        </h1>
        <p className="tagline">Create stunning photo mosaic images and animations of your travel pictures</p>
      </header>

      <div className="app-content">
        <div className="left-panel">
          <UploadPanel
            goalImage={goalImage}
            tilePhotos={tilePhotos}
            onGoalImageChange={setGoalImage}
            onTilePhotosChange={setTilePhotos}
          />

          <MosaicControls
            settings={mosaicSettings}
            onSettingsChange={setMosaicSettings}
            onGenerate={handleGenerateMosaic}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
          />

          {mosaicCanvas && (
            <GifExporter
              settings={gifSettings}
              onSettingsChange={setGifSettings}
              onExport={handleExportGif}
              isExporting={isExporting}
              canExport={canExport}
              gifBlob={gifBlob}
              renderProgress={renderProgress}
              encodeProgress={encodeProgress}
            />
          )}

          {(mosaicCanvas || gifBlob) && (
            <button className="reset-btn" onClick={handleReset}>
              🔄 Reset & Start Over
            </button>
          )}
        </div>

        <div className="right-panel">
          <MosaicCanvas
            canvas={mosaicCanvas}
            onFocusPointChange={(x, y) => setFocusPoint({ x, y })}
            focusPoint={focusPoint}
          />
        </div>
      </div>

      <footer className="app-footer">
        <p>
          💡 <strong>Tips:</strong> Use 8-16px tiles for detailed mosaics. 
          Higher FPS = smoother animation but larger file size. 
          Tint overlay helps match colors better.
        </p>
      </footer>
    </div>
  );
}

export default App;

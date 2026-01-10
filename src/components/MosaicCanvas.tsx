import React, { useRef, useEffect, useState } from 'react';

interface MosaicCanvasProps {
  canvas: HTMLCanvasElement | null;
  onFocusPointChange: (x: number, y: number) => void;
  focusPoint: { x: number; y: number };
}

export const MosaicCanvas: React.FC<MosaicCanvasProps> = ({
  canvas,
  onFocusPointChange,
  focusPoint
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleDownload = () => {
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mosaic.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // Update display canvas when mosaic changes
  useEffect(() => {
    if (canvas && displayCanvasRef.current) {
      const displayCtx = displayCanvasRef.current.getContext('2d');
      if (displayCtx) {
        displayCanvasRef.current.width = canvas.width;
        displayCanvasRef.current.height = canvas.height;
        displayCtx.drawImage(canvas, 0, 0);
      }
    }
  }, [canvas]);

  // Update zoom preview
  useEffect(() => {
    if (!canvas || !zoomCanvasRef.current || !mousePos) return;

    const zoomCanvas = zoomCanvasRef.current;
    const zoomCtx = zoomCanvas.getContext('2d');
    if (!zoomCtx) return;

    const zoomLevel = 4;
    const zoomSize = 100;
    
    zoomCanvas.width = zoomSize;
    zoomCanvas.height = zoomSize;

    // Calculate source region
    const sourceSize = zoomSize / zoomLevel;
    const sx = mousePos.x - sourceSize / 2;
    const sy = mousePos.y - sourceSize / 2;

    zoomCtx.clearRect(0, 0, zoomSize, zoomSize);
    zoomCtx.drawImage(
      canvas,
      sx, sy, sourceSize, sourceSize,
      0, 0, zoomSize, zoomSize
    );

    // Draw crosshair
    zoomCtx.strokeStyle = '#ff0080';
    zoomCtx.lineWidth = 2;
    zoomCtx.beginPath();
    zoomCtx.moveTo(zoomSize / 2, 0);
    zoomCtx.lineTo(zoomSize / 2, zoomSize);
    zoomCtx.moveTo(0, zoomSize / 2);
    zoomCtx.lineTo(zoomSize, zoomSize / 2);
    zoomCtx.stroke();
  }, [canvas, mousePos]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas || !displayCanvasRef.current) return;

    const rect = displayCanvasRef.current.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Convert to normalized coordinates
    const normalizedX = x / canvas.width;
    const normalizedY = y / canvas.height;

    onFocusPointChange(normalizedX, normalizedY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas || !displayCanvasRef.current) return;

    const rect = displayCanvasRef.current.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  if (!canvas) {
    return (
      <div className="mosaic-placeholder">
        <div className="placeholder-content">
          <div className="placeholder-icon">🎨</div>
          <p>Your mosaic will appear here</p>
          <span className="hint">Upload images and click "Generate Mosaic"</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mosaic-container" ref={containerRef}>
      <div className="canvas-wrapper">
        <canvas
          ref={displayCanvasRef}
          className="mosaic-canvas"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {focusPoint && (
          <div
            className="focus-marker"
            style={{
              left: `${focusPoint.x * 100}%`,
              top: `${focusPoint.y * 100}%`
            }}
          />
        )}
      </div>
      
      {mousePos && (
        <div className="zoom-preview">
          <canvas ref={zoomCanvasRef} />
          <span className="zoom-label">Tile Detail (4x zoom)</span>
        </div>
      )}

      <div className="canvas-hint">
        <span>💡 Click on the mosaic to set animation start point</span>
      </div>

      <button className="download-btn" onClick={handleDownload}>
        Download Mosaic (PNG)
      </button>
    </div>
  );
};

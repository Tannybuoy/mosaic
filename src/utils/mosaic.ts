/**
 * Photo mosaic generation algorithm
 * Converts a goal image into a mosaic using provided tile photos
 */

import { getAverageColor, getRegionAverageColor, findClosestColor, RGB, rgbToString } from './color';
import { imageToCanvas } from './imageLoad';

export interface TileData {
  canvas: HTMLCanvasElement;
  averageColor: RGB;
  originalFile: File;
}

export interface MosaicConfig {
  outputWidth: number;
  tileSize: number;
  tintOpacity: number;
}

export interface MosaicResult {
  canvas: HTMLCanvasElement;
  gridWidth: number;
  gridHeight: number;
  actualWidth: number;
  actualHeight: number;
}

/**
 * Preprocess tile photos into square tiles with average colors
 */
export async function preprocessTiles(
  images: Array<{ img: HTMLImageElement | ImageBitmap; bitmap?: ImageBitmap }>,
  tileSize: number,
  onProgress?: (current: number, total: number) => void
): Promise<TileData[]> {
  const tiles: TileData[] = [];

  for (let i = 0; i < images.length; i++) {
    const { img, bitmap } = images[i];
    const source = bitmap || img;

    // Create square tile using cover crop (center crop)
    const size = Math.min(source.width, source.height);
    const sx = (source.width - size) / 2;
    const sy = (source.height - size) / 2;

    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = tileSize;
    tileCanvas.height = tileSize;
    const ctx = tileCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to get tile canvas context');

    // Draw cropped square scaled to tile size
    ctx.drawImage(source, sx, sy, size, size, 0, 0, tileSize, tileSize);

    // Calculate average color
    const imageData = ctx.getImageData(0, 0, tileSize, tileSize);
    const averageColor = getAverageColor(imageData);

    tiles.push({
      canvas: tileCanvas,
      averageColor,
      originalFile: (images as any)[i].file // Store reference if needed
    });

    if (onProgress) {
      onProgress(i + 1, images.length);
    }
  }

  return tiles;
}

/**
 * Generate mosaic from goal image and preprocessed tiles
 */
export async function generateMosaic(
  goalImage: HTMLImageElement | ImageBitmap,
  tiles: TileData[],
  config: MosaicConfig,
  onProgress?: (current: number, total: number) => void
): Promise<MosaicResult> {
  const { outputWidth, tileSize, tintOpacity } = config;

  // Calculate output dimensions maintaining aspect ratio
  const aspectRatio = goalImage.height / goalImage.width;
  const outputHeight = Math.round(outputWidth * aspectRatio);

  // Calculate grid dimensions
  const gridWidth = Math.floor(outputWidth / tileSize);
  const gridHeight = Math.floor(outputHeight / tileSize);
  const actualWidth = gridWidth * tileSize;
  const actualHeight = gridHeight * tileSize;

  // Create scaled goal image canvas
  const goalCanvas = imageToCanvas(goalImage, actualWidth, actualHeight);
  const goalCtx = goalCanvas.getContext('2d', { willReadFrequently: true });
  if (!goalCtx) throw new Error('Failed to get goal canvas context');

  // Create mosaic canvas
  const mosaicCanvas = document.createElement('canvas');
  mosaicCanvas.width = actualWidth;
  mosaicCanvas.height = actualHeight;
  const mosaicCtx = mosaicCanvas.getContext('2d');
  if (!mosaicCtx) throw new Error('Failed to get mosaic canvas context');

  // Extract tile average colors for matching
  const tileColors = tiles.map(t => t.averageColor);

  // Process in chunks to keep UI responsive
  const totalCells = gridWidth * gridHeight;
  const chunkSize = 100; // Process 100 cells at a time
  let processedCells = 0;

  for (let startCell = 0; startCell < totalCells; startCell += chunkSize) {
    // Yield to browser
    await new Promise(resolve => setTimeout(resolve, 0));

    const endCell = Math.min(startCell + chunkSize, totalCells);

    for (let cellIndex = startCell; cellIndex < endCell; cellIndex++) {
      const gridX = cellIndex % gridWidth;
      const gridY = Math.floor(cellIndex / gridWidth);
      const x = gridX * tileSize;
      const y = gridY * tileSize;

      // Get average color of this region in goal image
      const regionColor = getRegionAverageColor(goalCtx, x, y, tileSize, tileSize);

      // Find best matching tile
      const bestTileIndex = findClosestColor(regionColor, tileColors);
      const tile = tiles[bestTileIndex];

      // Draw tile
      mosaicCtx.drawImage(tile.canvas, x, y, tileSize, tileSize);

      // Apply tint overlay if enabled
      if (tintOpacity > 0) {
        mosaicCtx.globalAlpha = tintOpacity;
        mosaicCtx.fillStyle = rgbToString(regionColor);
        mosaicCtx.fillRect(x, y, tileSize, tileSize);
        mosaicCtx.globalAlpha = 1;
      }

      processedCells++;
    }

    if (onProgress) {
      onProgress(processedCells, totalCells);
    }
  }

  return {
    canvas: mosaicCanvas,
    gridWidth,
    gridHeight,
    actualWidth,
    actualHeight
  };
}

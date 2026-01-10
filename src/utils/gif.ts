/**
 * GIF encoding using gif.js loaded from CDN
 * This avoids npm package issues by loading directly in the browser
 */

import { EasingFunction } from './easing';

// Type definition for gif.js loaded from CDN
declare global {
  interface Window {
    GIF: any;
  }
}

// Cache for the worker blob URL
let workerBlobUrl: string | null = null;

/**
 * Fetch worker script and create a blob URL (bypasses CORS)
 */
async function getWorkerBlobUrl(): Promise<string> {
  if (workerBlobUrl) return workerBlobUrl;

  const response = await fetch('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js');
  const workerCode = await response.text();
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  workerBlobUrl = URL.createObjectURL(blob);
  return workerBlobUrl;
}

export interface GifConfig {
  width: number;
  height: number;
  duration: number;
  fps: number;
  startZoom: number;
  easing: EasingFunction;
  focusPoint: { x: number; y: number }; // Normalized 0-1
}

export interface FrameRenderResult {
  frames: HTMLCanvasElement[];
  frameDelay: number;
}

/**
 * Load gif.js from CDN if not already loaded
 */
async function ensureGifJsLoaded(): Promise<void> {
  if (window.GIF) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load gif.js'));
    document.head.appendChild(script);
  });
}

/**
 * Render zoom-out animation frames from mosaic canvas
 */
export async function renderZoomFrames(
  mosaicCanvas: HTMLCanvasElement,
  config: GifConfig,
  onProgress?: (current: number, total: number) => void
): Promise<FrameRenderResult> {
  const { width, height, duration, fps, startZoom, easing, focusPoint } = config;

  const frameCount = Math.round(duration * fps);
  const frameDelay = Math.round(1000 / fps);
  const frames: HTMLCanvasElement[] = [];

  // Calculate focus point in mosaic coordinates
  const focusX = focusPoint.x * mosaicCanvas.width;
  const focusY = focusPoint.y * mosaicCanvas.height;

  for (let i = 0; i < frameCount; i++) {
    // Progress from 0 to 1
    const t = i / (frameCount - 1);
    
    // Apply easing
    const easedT = easing(t);
    
    // Interpolate zoom level (startZoom -> 1.0)
    const currentZoom = startZoom + (1 - startZoom) * easedT;
    
    // Calculate crop rectangle dimensions
    const cropWidth = width / currentZoom;
    const cropHeight = height / currentZoom;
    
    // Center crop on focus point
    let cropX = focusX - cropWidth / 2;
    let cropY = focusY - cropHeight / 2;
    
    // Clamp to mosaic bounds
    cropX = Math.max(0, Math.min(cropX, mosaicCanvas.width - cropWidth));
    cropY = Math.max(0, Math.min(cropY, mosaicCanvas.height - cropHeight));
    
    // Create frame canvas
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = width;
    frameCanvas.height = height;
    const frameCtx = frameCanvas.getContext('2d');
    if (!frameCtx) throw new Error('Failed to get frame canvas context');
    
    // Draw cropped and scaled region
    frameCtx.drawImage(
      mosaicCanvas,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, width, height
    );
    
    frames.push(frameCanvas);

    if (onProgress && i % 5 === 0) {
      onProgress(i + 1, frameCount);
    }

    // Yield to browser occasionally
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  if (onProgress) {
    onProgress(frameCount, frameCount);
  }

  return { frames, frameDelay };
}

/**
 * Encode frames to GIF using gif.js from CDN (no workers to avoid CORS)
 */
export async function encodeGif(
  frames: HTMLCanvasElement[],
  frameDelay: number,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  // Ensure gif.js is loaded and get worker blob URL
  const [, workerUrl] = await Promise.all([
    ensureGifJsLoaded(),
    getWorkerBlobUrl()
  ]);

  return new Promise((resolve, reject) => {
    const gif = new window.GIF({
      workers: 2,
      workerScript: workerUrl,
      quality: 10,
      width: frames[0].width,
      height: frames[0].height
    });

    // Progress handler
    gif.on('progress', (p: number) => {
      if (onProgress) {
        onProgress(Math.round(p * 100));
      }
    });

    // Finished handler
    gif.on('finished', (blob: Blob) => {
      resolve(blob);
    });

    // Error handler
    gif.on('abort', () => {
      reject(new Error('GIF encoding aborted'));
    });

    // Add all frames
    frames.forEach(canvas => {
      gif.addFrame(canvas, { delay: frameDelay });
    });

    // Start encoding
    gif.render();
  });
}

/**
 * Generate complete GIF from mosaic
 */
export async function generateGif(
  mosaicCanvas: HTMLCanvasElement,
  config: GifConfig,
  onRenderProgress?: (current: number, total: number) => void,
  onEncodeProgress?: (percent: number) => void
): Promise<Blob> {
  // Step 1: Render frames
  const { frames, frameDelay } = await renderZoomFrames(
    mosaicCanvas,
    config,
    onRenderProgress
  );

  // Step 2: Encode to GIF
  const blob = await encodeGif(frames, frameDelay, onEncodeProgress);

  return blob;
}

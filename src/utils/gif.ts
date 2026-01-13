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
  if (!response.ok) {
    throw new Error(`Failed to fetch worker script: ${response.status}`);
  }
  const workerCode = await response.text();
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  workerBlobUrl = URL.createObjectURL(blob);
  console.log('Worker blob URL created:', workerBlobUrl);
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

const MAX_GIF_SIZE = 16 * 1024 * 1024; // 16MB

/**
 * Encode frames to GIF using gif.js from CDN
 */
export async function encodeGif(
  frames: HTMLCanvasElement[],
  frameDelay: number,
  onProgress?: (percent: number) => void,
  quality: number = 10
): Promise<Blob> {
  // Ensure gif.js is loaded and get worker blob URL
  const [, workerUrl] = await Promise.all([
    ensureGifJsLoaded(),
    getWorkerBlobUrl()
  ]);

  return new Promise((resolve, reject) => {
    console.log('Creating GIF encoder with worker URL:', workerUrl, 'quality:', quality);

    const gif = new window.GIF({
      workers: 2,
      workerScript: workerUrl,
      quality,
      width: frames[0].width,
      height: frames[0].height,
      debug: true
    });

    // Progress handler
    gif.on('progress', (p: number) => {
      console.log('GIF progress:', p);
      if (onProgress) {
        onProgress(Math.round(p * 100));
      }
    });

    // Finished handler
    gif.on('finished', (blob: Blob) => {
      console.log('GIF finished, blob size:', blob.size);
      resolve(blob);
    });

    // Error handler
    gif.on('abort', () => {
      reject(new Error('GIF encoding aborted'));
    });

    // Add all frames with copy: true to ensure data is captured
    console.log('Adding', frames.length, 'frames');
    frames.forEach((canvas) => {
      gif.addFrame(canvas, { delay: frameDelay, copy: true });
    });

    // Start encoding
    console.log('Starting GIF render...');
    gif.render();
  });
}

/**
 * Scale down frames to reduce file size
 */
function scaleFrames(frames: HTMLCanvasElement[], scale: number): HTMLCanvasElement[] {
  return frames.map(frame => {
    const scaled = document.createElement('canvas');
    scaled.width = Math.round(frame.width * scale);
    scaled.height = Math.round(frame.height * scale);
    const ctx = scaled.getContext('2d');
    if (ctx) {
      ctx.drawImage(frame, 0, 0, scaled.width, scaled.height);
    }
    return scaled;
  });
}

/**
 * Skip frames to reduce file size
 */
function reduceFrames(frames: HTMLCanvasElement[], keepEvery: number): HTMLCanvasElement[] {
  return frames.filter((_, i) => i % keepEvery === 0);
}

/**
 * Generate complete GIF from mosaic with automatic size limiting
 */
export async function generateGif(
  mosaicCanvas: HTMLCanvasElement,
  config: Omit<GifConfig, 'height'>,
  onRenderProgress?: (current: number, total: number) => void,
  onEncodeProgress?: (percent: number) => void
): Promise<Blob> {
  // Calculate height from mosaic aspect ratio
  const aspectRatio = mosaicCanvas.height / mosaicCanvas.width;
  const height = Math.round(config.width * aspectRatio);

  const fullConfig: GifConfig = {
    ...config,
    height
  };

  // Step 1: Render frames
  let { frames, frameDelay } = await renderZoomFrames(
    mosaicCanvas,
    fullConfig,
    onRenderProgress
  );

  // Step 2: Encode with automatic size reduction if needed
  const attempts = [
    { quality: 10, scale: 1, skipFrames: 1 },      // Original settings
    { quality: 20, scale: 1, skipFrames: 1 },      // Lower quality
    { quality: 20, scale: 0.75, skipFrames: 1 },   // Smaller dimensions
    { quality: 20, scale: 0.75, skipFrames: 2 },   // Skip every other frame
    { quality: 30, scale: 0.5, skipFrames: 2 },    // Aggressive reduction
  ];

  for (let i = 0; i < attempts.length; i++) {
    const { quality, scale, skipFrames } = attempts[i];

    let processedFrames = frames;
    let processedDelay = frameDelay;

    if (skipFrames > 1) {
      processedFrames = reduceFrames(processedFrames, skipFrames);
      processedDelay = frameDelay * skipFrames;
    }

    if (scale < 1) {
      processedFrames = scaleFrames(processedFrames, scale);
    }

    console.log(`Attempt ${i + 1}: quality=${quality}, scale=${scale}, skipFrames=${skipFrames}, frameCount=${processedFrames.length}`);

    const blob = await encodeGif(processedFrames, processedDelay, onEncodeProgress, quality);

    if (blob.size <= MAX_GIF_SIZE) {
      console.log(`GIF size OK: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      return blob;
    }

    console.log(`GIF too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB, trying smaller settings...`);
  }

  // Return the last attempt even if still too large
  const lastAttempt = attempts[attempts.length - 1];
  let processedFrames = reduceFrames(frames, lastAttempt.skipFrames);
  processedFrames = scaleFrames(processedFrames, lastAttempt.scale);
  return encodeGif(processedFrames, frameDelay * lastAttempt.skipFrames, onEncodeProgress, lastAttempt.quality);
}

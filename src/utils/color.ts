/**
 * Color processing utilities for mosaic generation
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Calculate average RGB color from ImageData
 */
export function getAverageColor(imageData: ImageData): RGB {
  let r = 0, g = 0, b = 0;
  const pixels = imageData.data.length / 4;

  for (let i = 0; i < imageData.data.length; i += 4) {
    r += imageData.data[i];
    g += imageData.data[i + 1];
    b += imageData.data[i + 2];
  }

  return {
    r: Math.round(r / pixels),
    g: Math.round(g / pixels),
    b: Math.round(b / pixels)
  };
}

/**
 * Calculate average color from a canvas region
 */
export function getRegionAverageColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): RGB {
  const imageData = ctx.getImageData(x, y, width, height);
  return getAverageColor(imageData);
}

/**
 * Euclidean distance between two RGB colors
 */
export function colorDistance(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Find the closest matching color from a palette
 */
export function findClosestColor(target: RGB, palette: RGB[]): number {
  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < palette.length; i++) {
    const distance = colorDistance(target, palette[i]);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Convert RGB to CSS string
 */
export function rgbToString(color: RGB): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

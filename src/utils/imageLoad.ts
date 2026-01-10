/**
 * Safe image loading utilities with modern browser optimization
 */

export interface LoadedImage {
  img: HTMLImageElement;
  bitmap?: ImageBitmap;
  width: number;
  height: number;
}

/**
 * Load an image from a File with optional ImageBitmap optimization
 */
export async function loadImageFromFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);

      // Try to create ImageBitmap for faster rendering
      let bitmap: ImageBitmap | undefined;
      if ('createImageBitmap' in window) {
        try {
          bitmap = await createImageBitmap(img);
        } catch (e) {
          // Fallback to regular image if bitmap fails
          console.warn('ImageBitmap creation failed, using HTMLImageElement', e);
        }
      }

      resolve({
        img,
        bitmap,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = url;
  });
}

/**
 * Validate file type
 */
export function isValidImageFile(file: File): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
}

/**
 * Create a canvas from an image source
 */
export function imageToCanvas(source: HTMLImageElement | ImageBitmap, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

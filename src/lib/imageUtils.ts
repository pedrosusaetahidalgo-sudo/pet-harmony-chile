/**
 * Image compression, validation, and utility helpers.
 *
 * All compression uses the native Canvas API (no external lib).
 * Output format: WebP when supported, JPEG fallback.
 */

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  format: 'webp' | 'jpeg';
  originalSize: number;
  compressedSize: number;
}

export interface CompressOptions {
  /** Maximum width/height in pixels. Image is scaled proportionally. */
  maxDimension: number;
  /** Initial quality (0-1). Default 0.82 */
  quality?: number;
  /** Max file size in bytes. If exceeded, quality is reduced iteratively. */
  maxBytes?: number;
}

const AVATAR_OPTIONS: CompressOptions = { maxDimension: 512, quality: 0.82, maxBytes: 200_000 };
const PET_PHOTO_OPTIONS: CompressOptions = { maxDimension: 1200, quality: 0.82, maxBytes: 500_000 };
const FEED_IMAGE_OPTIONS: CompressOptions = {
  maxDimension: 1600,
  quality: 0.82,
  maxBytes: 600_000,
};

export const IMAGE_PRESETS = {
  avatar: AVATAR_OPTIONS,
  pet: PET_PHOTO_OPTIONS,
  feed: FEED_IMAGE_OPTIONS,
} as const;

/** Minimum dimensions for each image type */
export const MIN_DIMENSIONS = {
  avatar: { width: 200, height: 200 },
  pet: { width: 300, height: 300 },
  feed: { width: 400, height: 300 },
} as const;

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validate file type and size before any processing.
 * Returns an error string or null if valid.
 */
export function validateImageFile(file: File, maxSize: number = MAX_UPLOAD_SIZE): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Solo se aceptan imagenes JPG, PNG o WebP';
  }
  if (file.size > maxSize) {
    const mb = Math.round(maxSize / 1024 / 1024);
    return `La imagen no puede pesar mas de ${mb} MB`;
  }
  return null;
}

/**
 * Load a File into an HTMLImageElement and return its natural dimensions.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

/**
 * Check if the browser can encode WebP via Canvas.
 * Result is cached after first call.
 */
let webpSupported: boolean | null = null;
function supportsWebP(): boolean {
  if (webpSupported !== null) return webpSupported;
  try {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    webpSupported = c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupported = false;
  }
  return webpSupported;
}

/**
 * Compress and resize an image file.
 *
 * 1. Validates dimensions against minimums (if provided).
 * 2. Scales to maxDimension (proportional).
 * 3. Encodes as WebP (fallback JPEG).
 * 4. Iteratively reduces quality if result exceeds maxBytes.
 */
export async function compressImage(
  file: File,
  options: CompressOptions,
  minDims?: { width: number; height: number }
): Promise<CompressedImage> {
  const img = await loadImage(file);

  // Validate minimum dimensions
  if (minDims) {
    if (img.naturalWidth < minDims.width || img.naturalHeight < minDims.height) {
      throw new Error(`La foto debe tener al menos ${minDims.width}x${minDims.height} pixeles`);
    }
  }

  const { maxDimension, maxBytes } = options;
  const quality = options.quality ?? 0.82;

  // Calculate scaled dimensions (proportional)
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (w > maxDimension || h > maxDimension) {
    const ratio = Math.min(maxDimension / w, maxDimension / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  // Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no soportado');
  ctx.drawImage(img, 0, 0, w, h);

  // Choose format
  const useWebP = supportsWebP();
  const mime = useWebP ? 'image/webp' : 'image/jpeg';
  const format = useWebP ? 'webp' : 'jpeg';

  // Encode with iterative quality reduction
  const encode = (q: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Error al comprimir imagen'))),
        mime,
        q
      );
    });

  let blob = await encode(quality);

  // If maxBytes is set and the blob is too large, reduce quality iteratively
  if (maxBytes) {
    const reductions = [0.75, 0.65, 0.55];
    for (const q of reductions) {
      if (blob.size <= maxBytes) break;
      blob = await encode(q);
    }
  }

  return {
    blob,
    width: w,
    height: h,
    format,
    originalSize: file.size,
    compressedSize: blob.size,
  };
}

/**
 * Convert a compressed blob to a File object suitable for Supabase upload.
 */
export function compressedToFile(compressed: CompressedImage, baseName: string): File {
  const ext = compressed.format === 'webp' ? 'webp' : 'jpg';
  return new File([compressed.blob], `${baseName}.${ext}`, {
    type: compressed.format === 'webp' ? 'image/webp' : 'image/jpeg',
  });
}

/**
 * Create a data URL preview from a File (for immediate UI display).
 */
export function fileToPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * videoFrameExtractor.ts — Helpers para extraer frames de un video y medir
 * calidad (sharpness via Laplacian variance).
 *
 * Usado por PawShieldEnrollment: graba 3 seg con MediaRecorder, extrae 3
 * frames a t=0.5s, 1.5s, 2.5s, mide calidad, descarta los borrosos antes
 * de subir a Petify (ahorra costo + falla rapido si la captura es mala).
 *
 * Funciones:
 *   - extractFramesAtTimes(blob, times[]): extrae frames a tiempos especificos.
 *   - measureSharpness(image): retorna varianza Laplaciana (mayor = mas nitido).
 *   - frameToJpeg(canvas, quality): comprime canvas a JPEG base64.
 */

export interface ExtractedFrame {
  /** Tiempo (segundos) del frame en el video. */
  time: number;
  /** Canvas con el frame renderizado. */
  canvas: HTMLCanvasElement;
  /** Sharpness score (Laplacian variance). >100 es bueno, <50 es borroso. */
  sharpness: number;
}

/**
 * Extrae frames de un video Blob a tiempos especificos.
 * Maneja webm, mp4, y cualquier formato que el browser pueda decodificar.
 */
export async function extractFramesAtTimes(
  videoBlob: Blob,
  times: number[],
  maxWidth = 1280
): Promise<ExtractedFrame[]> {
  const url = URL.createObjectURL(videoBlob);
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    // Esperar a que el metadata cargue (necesario para seek).
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('video metadata load failed'));
    });

    const aspectRatio = video.videoWidth / video.videoHeight;
    const targetWidth = Math.min(video.videoWidth, maxWidth);
    const targetHeight = Math.round(targetWidth / aspectRatio);

    const frames: ExtractedFrame[] = [];

    for (const time of times) {
      // Clampear al rango del video.
      const t = Math.min(time, video.duration - 0.01);
      video.currentTime = t;

      // Esperar al seek + frame ready.
      await new Promise<void>((resolve, reject) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked, { once: true });
        setTimeout(() => reject(new Error(`seek timeout at t=${t}`)), 5000);
      });

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas 2d context not available');
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

      const sharpness = measureSharpness(ctx, targetWidth, targetHeight);
      frames.push({ time: t, canvas, sharpness });
    }

    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Calcula varianza Laplaciana — proxy de sharpness.
 *
 * Algoritmo: aplica filtro Laplaciano (3x3 kernel) en escala de grises y
 * calcula la varianza del resultado. Imagenes nitidas tienen alta varianza
 * (bordes definidos), borrosas tienen baja (todo similar).
 *
 * Thresholds empiricos:
 *   - >150: muy nitida
 *   - 80-150: aceptable
 *   - <80: borrosa
 *
 * Sample subset por performance (no analiza todos los pixels).
 */
export function measureSharpness(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sampleStep = 4
): number {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Convertir a grayscale (luminance = 0.299R + 0.587G + 0.114B).
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Filtro Laplaciano 3x3 con kernel:
  //   [ 0  1  0]
  //   [ 1 -4  1]
  //   [ 0  1  0]
  // Sample step: salta pixels para ir mas rapido.
  const laplacianValues: number[] = [];
  for (let y = 1; y < height - 1; y += sampleStep) {
    for (let x = 1; x < width - 1; x += sampleStep) {
      const center = gray[y * width + x];
      const top = gray[(y - 1) * width + x];
      const bottom = gray[(y + 1) * width + x];
      const left = gray[y * width + x - 1];
      const right = gray[y * width + x + 1];
      const lap = top + bottom + left + right - 4 * center;
      laplacianValues.push(lap);
    }
  }

  // Varianza.
  const mean = laplacianValues.reduce((a, b) => a + b, 0) / laplacianValues.length;
  const variance =
    laplacianValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / laplacianValues.length;

  return variance;
}

/**
 * Convierte un canvas a base64 JPEG.
 * Usar quality entre 0.7 y 0.85 para Paw Shield (Petify acepta hasta ~85% bien
 * y reduce el upload size ~3x vs PNG).
 */
export function frameToJpegBase64(canvas: HTMLCanvasElement, quality = 0.85): string {
  // toDataURL retorna "data:image/jpeg;base64,/9j/...". Strip header.
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return dataUrl.split(',')[1];
}

/**
 * Threshold de sharpness para considerar un frame "bueno".
 * Elegido empiricamente — ajustar tras feedback real de usuarios.
 */
export const SHARPNESS_THRESHOLD = 60;

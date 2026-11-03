/** Pixel operations shared by the image tools. All work in the browser, on RGBA data. */

export const MAX_SIDE = 8192;
/** Browsers refuse canvases much bigger than this. */
export const MAX_PIXELS = 50_000_000;

type Canvas2D = CanvasRenderingContext2D;

const context = (canvas: HTMLCanvasElement): Canvas2D => {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas non disponibile in questo browser.");
  return ctx;
};

/**
 * Resample to width × height. Big changes are done in steps of at most 2×, which keeps far
 * more detail than a single jump (a single drawImage skips pixels when shrinking a lot).
 */
export function resample(source: HTMLImageElement | HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  let current: CanvasImageSource = source;
  let w = srcW;
  let h = srcH;
  const target = { w: Math.max(1, Math.round(width)), h: Math.max(1, Math.round(height)) };
  for (;;) {
    const nextW = target.w > w ? Math.min(target.w, w * 2) : Math.max(target.w, Math.ceil(w / 2));
    const nextH = target.h > h ? Math.min(target.h, h * 2) : Math.max(target.h, Math.ceil(h / 2));
    const canvas = document.createElement("canvas");
    canvas.width = nextW;
    canvas.height = nextH;
    const ctx = context(canvas);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(current, 0, 0, nextW, nextH);
    current = canvas;
    w = nextW;
    h = nextH;
    if (w === target.w && h === target.h) return canvas;
  }
}

export const readPixels = (canvas: HTMLCanvasElement) => context(canvas).getImageData(0, 0, canvas.width, canvas.height);

export const writePixels = (canvas: HTMLCanvasElement, image: ImageData) => context(canvas).putImageData(image, 0, 0);

export interface Adjustments {
  /** -100 to 100 */
  brightness: number;
  /** -100 to 100 */
  contrast: number;
  /** -100 to 100 */
  saturation: number;
}

/** Brightness, contrast and saturation in one pass over the pixels (works in every browser, unlike ctx.filter). */
export function adjust(image: { data: Uint8ClampedArray }, { brightness, contrast, saturation }: Adjustments): void {
  if (!brightness && !contrast && !saturation) return;
  const data = image.data;
  const c = (259 * (contrast * 2.55 + 255)) / (255 * (259 - contrast * 2.55));
  const s = 1 + saturation / 100;
  const b = brightness * 2.55;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    for (let k = 0; k < 3; k++) {
      let v = luma + (data[i + k] - luma) * s;
      v = c * (v - 128) + 128 + b;
      data[i + k] = v; // Uint8ClampedArray clamps to 0..255
    }
  }
}

/** Unsharp mask: adds back the difference from a 3×3 blur. amount 0 leaves the image unchanged. */
export function sharpen(image: ImageData, amount: number): void {
  if (amount <= 0) return;
  const { width, height, data } = image;
  const source = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      for (let k = 0; k < 3; k++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const px = Math.min(width - 1, Math.max(0, x + dx));
            const py = Math.min(height - 1, Math.max(0, y + dy));
            sum += source[(py * width + px) * 4 + k];
          }
        }
        data[i + k] = source[i + k] + amount * (source[i + k] - sum / 9);
      }
    }
  }
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

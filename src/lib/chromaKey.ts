/** Color-based background removal on raw RGBA pixels. */

export type Rgb = [number, number, number];

export interface KeyOptions {
  key: Rgb;
  /** 0–100: how far (as % of the maximum RGB distance) a pixel can be from the key color and still count as background. */
  tolerance: number;
  /** 0–10: width of the soft edge between background and subject. */
  feather: number;
  /** true: only background connected to the image border is removed; false: every pixel close to the key color. */
  contiguous: boolean;
}

const MAX_DISTANCE = Math.sqrt(255 * 255 * 3);

/** Average color of the four image corners (3×3 patches). */
export function averageCorners(img: ImageData): Rgb {
  const { width, height, data } = img;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (const [cx, cy] of [[0, 0], [width - 3, 0], [0, height - 3], [width - 3, height - 3]]) {
    for (let y = Math.max(cy, 0); y < Math.min(cy + 3, height); y++) {
      for (let x = Math.max(cx, 0); x < Math.min(cx + 3, width); x++) {
        const i = (y * width + x) * 4;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }
  }
  return count ? [Math.round(r / count), Math.round(g / count), Math.round(b / count)] : [255, 255, 255];
}

/** Returns one alpha value (0–255) per pixel. */
export function computeAlpha(img: ImageData, { key, tolerance, feather, contiguous }: KeyOptions): Uint8ClampedArray {
  const { width, height, data } = img;
  const n = width * height;
  const threshold = (tolerance / 100) * MAX_DISTANCE;
  const soft = feather * 6;

  const dist = new Float32Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const dr = data[i] - key[0];
    const dg = data[i + 1] - key[1];
    const db = data[i + 2] - key[2];
    dist[p] = Math.sqrt(dr * dr + dg * dg + db * db);
  }

  const isBackground = new Uint8Array(n);
  if (contiguous) {
    const queue = new Int32Array(n);
    let head = 0;
    let tail = 0;
    const push = (p: number) => {
      if (!isBackground[p] && dist[p] <= threshold) {
        isBackground[p] = 1;
        queue[tail++] = p;
      }
    };
    for (let x = 0; x < width; x++) {
      push(x);
      push((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
      push(y * width);
      push(y * width + width - 1);
    }
    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      if (x > 0) push(p - 1);
      if (x < width - 1) push(p + 1);
      if (p >= width) push(p - width);
      if (p < n - width) push(p + width);
    }
  } else {
    for (let p = 0; p < n; p++) if (dist[p] <= threshold) isBackground[p] = 1;
  }

  const touchesBackground = (p: number) => {
    const x = p % width;
    return (x > 0 && isBackground[p - 1] === 1) || (x < width - 1 && isBackground[p + 1] === 1) || (p >= width && isBackground[p - width] === 1) || (p < n - width && isBackground[p + width] === 1);
  };

  const alpha = new Uint8ClampedArray(n);
  for (let p = 0; p < n; p++) {
    const srcAlpha = data[p * 4 + 3];
    if (isBackground[p]) {
      alpha[p] = 0;
    } else if (soft > 0 && dist[p] < threshold + soft && (!contiguous || touchesBackground(p))) {
      alpha[p] = Math.round(((dist[p] - threshold) / soft) * srcAlpha);
    } else {
      alpha[p] = srcAlpha;
    }
  }
  return alpha;
}

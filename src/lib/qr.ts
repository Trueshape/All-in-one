import qrcode from "qrcode-generator";

// The encoder defaults to Latin-1: force UTF-8 so accents and emoji survive.
qrcode.stringToBytes = (s: string) => Array.from(new TextEncoder().encode(s));

export type QrLevel = "L" | "M" | "Q" | "H";

/** Empty modules around the code, as the QR standard asks. */
export const QUIET_ZONE = 4;

const escapeWifi = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");

/** The text a phone reads as "join this network"; empty until the network has a name. */
export function wifiPayload(ssid: string, password: string, security: string): string {
  if (!ssid) return "";
  return `WIFI:T:${security};S:${escapeWifi(ssid)};${security === "nopass" ? "" : `P:${escapeWifi(password)};`};`;
}

/** The dark/light grid of the code. Throws when `data` does not fit at this correction level. */
export function buildMatrix(data: string, level: QrLevel): boolean[][] {
  const qr = qrcode(0, level);
  qr.addData(data);
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

export const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast ratio between two #rrggbb colours, from 1 (same) to 21 (black on white). */
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

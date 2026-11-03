export type ShapeId = "square" | "rectangle" | "triangle" | "cube" | "box" | "cylinder" | "sphere";

export interface ShapeField {
  key: string;
  label: string;
  placeholder: string;
}

export interface ShapeInfo {
  id: ShapeId;
  name: string;
  fields: ShapeField[];
  /** Two-dimensional shapes have a perimeter and an area; solids have a surface and a volume. */
  dimensions: 2 | 3;
  formula: string;
}

export const SHAPES: ShapeInfo[] = [
  { id: "square", name: "Quadrato", dimensions: 2, fields: [{ key: "a", label: "Lato (l)", placeholder: "Es. 4" }], formula: "P = 4·l · A = l²" },
  { id: "rectangle", name: "Rettangolo", dimensions: 2, fields: [{ key: "a", label: "Base (b)", placeholder: "Es. 6" }, { key: "b", label: "Altezza (h)", placeholder: "Es. 4" }], formula: "P = 2·(b+h) · A = b·h" },
  { id: "triangle", name: "Triangolo", dimensions: 2, fields: [{ key: "a", label: "Lato a", placeholder: "Es. 3" }, { key: "b", label: "Lato b", placeholder: "Es. 4" }, { key: "c", label: "Lato c", placeholder: "Es. 5" }], formula: "P = a+b+c · A = √(s(s−a)(s−b)(s−c)), s = P/2" },
  { id: "cube", name: "Cubo", dimensions: 3, fields: [{ key: "a", label: "Lato (l)", placeholder: "Es. 3" }], formula: "S = 6·l² · V = l³" },
  { id: "box", name: "Parallelepipedo", dimensions: 3, fields: [{ key: "a", label: "Lunghezza (a)", placeholder: "Es. 4" }, { key: "b", label: "Larghezza (b)", placeholder: "Es. 3" }, { key: "c", label: "Altezza (c)", placeholder: "Es. 2" }], formula: "S = 2·(ab+bc+ca) · V = a·b·c" },
  { id: "cylinder", name: "Cilindro", dimensions: 3, fields: [{ key: "r", label: "Raggio (r)", placeholder: "Es. 2" }, { key: "h", label: "Altezza (h)", placeholder: "Es. 5" }], formula: "S = 2πr(r+h) · V = πr²h" },
  { id: "sphere", name: "Sfera", dimensions: 3, fields: [{ key: "r", label: "Raggio (r)", placeholder: "Es. 3" }], formula: "S = 4πr² · V = 4/3·πr³" },
];

export interface GeometryResult {
  /** Perimeter (2D shapes only). */
  perimeter?: number;
  /** Area for 2D shapes, total surface for solids. */
  area: number;
  /** Volume (solids only). */
  volume?: number;
  /** Set when the sides cannot form the shape, e.g. a triangle with sides 1, 2, 10. */
  error?: string;
}

/** Shape measures from its fields, which must all be positive numbers. */
export function measure(id: ShapeId, v: Record<string, number>): GeometryResult {
  switch (id) {
    case "square":
      return { perimeter: 4 * v.a, area: v.a * v.a };
    case "rectangle":
      return { perimeter: 2 * (v.a + v.b), area: v.a * v.b };
    case "triangle": {
      const { a, b, c } = v;
      if (a + b <= c || a + c <= b || b + c <= a) return { area: NaN, error: "Con questi lati non si forma un triangolo: la somma di due lati deve superare il terzo." };
      const s = (a + b + c) / 2;
      return { perimeter: a + b + c, area: Math.sqrt(s * (s - a) * (s - b) * (s - c)) };
    }
    case "cube":
      return { area: 6 * v.a * v.a, volume: v.a ** 3 };
    case "box":
      return { area: 2 * (v.a * v.b + v.b * v.c + v.c * v.a), volume: v.a * v.b * v.c };
    case "cylinder":
      return { area: 2 * Math.PI * v.r * (v.r + v.h), volume: Math.PI * v.r * v.r * v.h };
    case "sphere":
      return { area: 4 * Math.PI * v.r * v.r, volume: (4 / 3) * Math.PI * v.r ** 3 };
  }
}

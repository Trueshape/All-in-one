export type System = "decimal" | "binary";

/** Power of the base for each unit: KB = 1000 (decimal) or 1024 (binary, shown as KiB). */
export const UNITS = [
  { id: "bit", power: null },
  { id: "B", power: 0 },
  { id: "KB", power: 1 },
  { id: "MB", power: 2 },
  { id: "GB", power: 3 },
  { id: "TB", power: 4 },
  { id: "PB", power: 5 },
] as const;

export type UnitId = (typeof UNITS)[number]["id"];

/** Label for a unit in the chosen system: "MB" or "MiB". */
export const unitLabel = (id: UnitId, system: System) => (system === "binary" && id.length === 2 && id.endsWith("B") && id !== "B" ? `${id[0]}iB` : id);

const factor = (id: UnitId, system: System) => {
  const unit = UNITS.find((u) => u.id === id)!;
  if (unit.power === null) return 1 / 8;
  return (system === "binary" ? 1024 : 1000) ** unit.power;
};

export const toBytes = (value: number, id: UnitId, system: System) => value * factor(id, system);
export const fromBytes = (bytes: number, id: UnitId, system: System) => bytes / factor(id, system);

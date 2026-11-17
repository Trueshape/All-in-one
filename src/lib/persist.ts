import { useEffect, useState } from "react";

const PREFIX = "tool:";
/** Keys of the fields that are on screen now: a reset forgets exactly these. */
const mounted = new Set<string>();

/** Forgets the remembered values of the tool that is open, so that it starts again from its defaults. */
export function clearPersisted() {
  for (const key of mounted) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // storage unavailable: nothing was remembered
    }
  }
}

/** The saved value when it has the same type as `initial`, otherwise `initial`. Pure, so it can be tested. */
export function parseSaved<T>(raw: string | null, initial: T): T {
  if (raw === null) return initial;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === typeof initial ? (parsed as T) : initial;
  } catch {
    return initial;
  }
}

/** Like useState, but the value is remembered in this browser between visits. Without storage it behaves like useState. */
export function usePersisted<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      return parseSaved(localStorage.getItem(PREFIX + key), initial);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // storage unavailable: the value only lasts for this visit
    }
  }, [key, value]);
  useEffect(() => {
    mounted.add(key);
    return () => void mounted.delete(key);
  }, [key]);
  return [value, setValue];
}

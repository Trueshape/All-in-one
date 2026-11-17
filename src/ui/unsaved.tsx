import { createContext, useContext, useEffect, useId, useState } from "react";

/** Fired by `download()` when a file is saved: the work in progress is then safe. */
export const SAVED_EVENT = "tool-saved";

/** The app asks every tool whether it holds work that a change of page would lose. */
export const UnsavedContext = createContext<{ mark: (key: string, dirty: boolean) => void }>({ mark: () => {} });

/** Tells the app that this tool holds work that is lost if the page changes. */
export function useUnsavedFlag(dirty: boolean) {
  const { mark } = useContext(UnsavedContext);
  const key = useId();
  useEffect(() => {
    mark(key, dirty);
    return () => mark(key, false);
  }, [mark, key, dirty]);
}

/**
 * For a tool with a file open: the work counts as unsaved once something in the tool was touched after the file was opened,
 * until a file is downloaded. Opening a file and closing it right away loses nothing, so that is not a warning.
 */
export function useUnsaved(open: boolean) {
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setTouched(false);
    setSaved(false);
    if (!open) return;
    const touch = (e: Event) => {
      if (!(e.target as HTMLElement | null)?.closest?.("[data-tool-body]")) return;
      setTouched(true);
      setSaved(false);
    };
    const done = () => setSaved(true);
    const events = ["input", "change", "pointerdown"];
    events.forEach((name) => document.addEventListener(name, touch, true));
    window.addEventListener(SAVED_EVENT, done);
    return () => {
      events.forEach((name) => document.removeEventListener(name, touch, true));
      window.removeEventListener(SAVED_EVENT, done);
    };
  }, [open]);
  useUnsavedFlag(open && touched && !saved);
}

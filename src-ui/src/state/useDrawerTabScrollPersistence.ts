import { useEffect, useRef, type RefObject } from "react";

function readSavedScrollTop(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return 0;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeSavedScrollTop(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(Math.max(0, Math.round(value))));
  } catch {
    // ignore storage write errors
  }
}

export function useDrawerTabScrollPersistence<T extends HTMLElement = HTMLDivElement>(
  storageKey: string
): RefObject<T | null> {
  const rootRef = useRef<T | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const scrollHost = root.closest(".drawer-tab-body");
    if (!(scrollHost instanceof HTMLElement)) {
      return;
    }

    const restoreId = window.requestAnimationFrame(() => {
      scrollHost.scrollTop = readSavedScrollTop(storageKey);
    });

    const onScroll = () => writeSavedScrollTop(storageKey, scrollHost.scrollTop);
    scrollHost.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(restoreId);
      writeSavedScrollTop(storageKey, scrollHost.scrollTop);
      scrollHost.removeEventListener("scroll", onScroll);
    };
  }, [storageKey]);

  return rootRef;
}

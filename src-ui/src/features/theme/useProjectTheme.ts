import { useEffect, useId, useMemo, useRef, useState } from "react";

import { BUNDLED_THEMES } from "./library";
import { normalizeThemeTokens, type ThemeRecord, type ThemeState, type ThemeTokens } from "./types";

const THEME_STATE_KEY = "manifold.project-theme.v1";
const THEME_STATE_SYNC_EVENT = "manifold:project-theme-sync";

type ThemeStateSyncDetail = {
  projectPath: string;
  state: ThemeState;
  sourceId: string;
  history?: ThemeState[];
  future?: ThemeState[];
};

function themeStateKey(projectPath: string): string {
  return `${THEME_STATE_KEY}:${projectPath}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneTheme(
  theme: ThemeRecord,
  id: string,
  name: string,
  source: ThemeRecord["source"]
): ThemeRecord {
  const stamp = nowIso();
  return {
    ...theme,
    id,
    name,
    source,
    createdAt: stamp,
    updatedAt: stamp,
    tokens: normalizeThemeTokens(theme.tokens),
  };
}

function coerceState(raw: unknown): ThemeState {
  const input = (raw as Partial<ThemeState>) ?? {};
  const existingThemes = Array.isArray(input.themes) ? input.themes : [];
  const merged = [
    ...BUNDLED_THEMES.map((theme) => ({
      ...theme,
      tokens: normalizeThemeTokens(theme.tokens),
    })),
  ];
  existingThemes.forEach((theme) => {
    if (!theme || typeof theme !== "object") {
      return;
    }
    const typed = theme as ThemeRecord;
    const bundledIndex = merged.findIndex(
      (entry) => entry.id === typed.id && entry.source === "bundled"
    );
    if (bundledIndex >= 0) {
      return;
    }
    merged.push({ ...typed, tokens: normalizeThemeTokens(typed.tokens) });
  });

  const defaultActive = merged[0]?.id ?? "";
  const requestedActive =
    typeof input.activeThemeId === "string" ? input.activeThemeId : defaultActive;
  const activeThemeId = merged.some((theme) => theme.id === requestedActive)
    ? requestedActive
    : defaultActive;

  return {
    schemaVersion: 1,
    activeThemeId,
    themes: merged,
    snapshots: Array.isArray(input.snapshots) ? input.snapshots : [],
  };
}

function readThemeState(projectPath: string | undefined): ThemeState {
  const defaults = coerceState(undefined);
  if (!projectPath) {
    return defaults;
  }
  try {
    const raw = window.localStorage.getItem(themeStateKey(projectPath));
    if (!raw) {
      return defaults;
    }
    return coerceState(JSON.parse(raw));
  } catch {
    return defaults;
  }
}

function writeThemeState(projectPath: string, state: ThemeState): void {
  window.localStorage.setItem(themeStateKey(projectPath), JSON.stringify(state));
}

export type ThemeApplyMode = "merge" | "replace";

export function useProjectTheme(projectPath: string | undefined): {
  hasProject: boolean;
  state: ThemeState;
  activeTheme: ThemeRecord | null;
  canUndo: boolean;
  canRedo: boolean;
  setActiveTheme: (themeId: string) => void;
  applyTheme: (themeId: string, mode: ThemeApplyMode) => void;
  restoreLastSnapshot: () => void;
  updateActiveThemeTokens: (updater: (prev: ThemeTokens) => ThemeTokens) => void;
  duplicateTheme: (themeId: string) => void;
  undo: () => void;
  redo: () => void;
} {
  const [state, setState] = useState<ThemeState>(() => readThemeState(projectPath));
  const [history, setHistory] = useState<ThemeState[]>([]);
  const [future, setFuture] = useState<ThemeState[]>([]);
  const stateRef = useRef<ThemeState>(state);
  const historyRef = useRef<ThemeState[]>(history);
  const futureRef = useRef<ThemeState[]>(future);
  const hookId = useId();
  const sourceIdRef = useRef(`theme-hook-${hookId}`);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    futureRef.current = future;
  }, [future]);

  useEffect(() => {
    const next = readThemeState(projectPath);
    stateRef.current = next;
    historyRef.current = [];
    futureRef.current = [];
    queueMicrotask(() => {
      setState(next);
      setHistory([]);
      setFuture([]);
    });
  }, [projectPath]);

  useEffect(() => {
    if (!projectPath) {
      return;
    }
    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<ThemeStateSyncDetail>).detail;
      if (!detail) {
        return;
      }
      if (detail.projectPath !== projectPath) {
        return;
      }
      if (detail.sourceId === sourceIdRef.current) {
        return;
      }
      stateRef.current = detail.state;
      historyRef.current = detail.history ?? [];
      futureRef.current = detail.future ?? [];
      setState(detail.state);
      setHistory(detail.history ?? []);
      setFuture(detail.future ?? []);
    };
    window.addEventListener(THEME_STATE_SYNC_EVENT, onSync);
    return () => window.removeEventListener(THEME_STATE_SYNC_EVENT, onSync);
  }, [projectPath]);

  const hasProject = Boolean(projectPath);

  const publishState = (next: ThemeState, nextHistory: ThemeState[], nextFuture: ThemeState[]) => {
    if (projectPath) {
      writeThemeState(projectPath, next);
      window.dispatchEvent(
        new CustomEvent<ThemeStateSyncDetail>(THEME_STATE_SYNC_EVENT, {
          detail: {
            projectPath,
            state: next,
            sourceId: sourceIdRef.current,
            history: nextHistory,
            future: nextFuture,
          },
        })
      );
    }
    setState(next);
    setHistory(nextHistory);
    setFuture(nextFuture);
  };

  const updateState = (
    updater: (prev: ThemeState) => ThemeState,
    options?: { recordHistory?: boolean }
  ) => {
    const base = stateRef.current;
    const next = coerceState(updater(base));
    const shouldRecordHistory = options?.recordHistory !== false;
    const nextHistory = shouldRecordHistory ? [...historyRef.current, base] : historyRef.current;
    const nextFuture = shouldRecordHistory ? [] : futureRef.current;
    stateRef.current = next;
    historyRef.current = nextHistory;
    futureRef.current = nextFuture;
    publishState(next, nextHistory, nextFuture);
  };

  const activeTheme = useMemo(
    () => state.themes.find((theme) => theme.id === state.activeThemeId) ?? null,
    [state.activeThemeId, state.themes]
  );

  const setActiveTheme = (themeId: string) => {
    updateState((prev) => ({ ...prev, activeThemeId: themeId }));
  };

  const applyTheme = (themeId: string, mode: ThemeApplyMode) => {
    updateState((prev) => {
      const current = prev.themes.find((theme) => theme.id === prev.activeThemeId);
      const snapshots = current
        ? [
            {
              id: `snapshot-${Date.now()}-${mode}`,
              createdAt: nowIso(),
              theme: cloneTheme(current, current.id, current.name, current.source),
            },
            ...prev.snapshots,
          ].slice(0, 30)
        : prev.snapshots;
      return {
        ...prev,
        activeThemeId: themeId,
        snapshots,
      };
    });
  };

  const restoreLastSnapshot = () => {
    updateState((prev) => {
      const snapshot = prev.snapshots[0];
      if (!snapshot) {
        return prev;
      }
      const restored = cloneTheme(
        snapshot.theme,
        `theme-restored-${Date.now()}`,
        `${snapshot.theme.name} (Restored)`,
        "user"
      );
      return {
        ...prev,
        activeThemeId: restored.id,
        themes: [...prev.themes, restored],
        snapshots: prev.snapshots.slice(1),
      };
    });
  };

  const updateActiveThemeTokens = (updater: (prev: ThemeTokens) => ThemeTokens) => {
    updateState((prev) => {
      const current = prev.themes.find((theme) => theme.id === prev.activeThemeId);
      if (!current) {
        return prev;
      }

      let targetId = current.id;
      let themes = prev.themes;

      if (current.source === "bundled") {
        const cloneId = `theme-user-${Date.now()}`;
        const cloned = cloneTheme(current, cloneId, `${current.name} (Custom)`, "user");
        themes = [...prev.themes, cloned];
        targetId = cloneId;
      }

      const nextThemes = themes.map((theme) =>
        theme.id === targetId
          ? {
              ...theme,
              updatedAt: nowIso(),
              tokens: normalizeThemeTokens(updater({ ...theme.tokens })),
            }
          : theme
      );

      return {
        ...prev,
        activeThemeId: targetId,
        themes: nextThemes,
      };
    });
  };

  const duplicateTheme = (themeId: string) => {
    updateState((prev) => {
      const source = prev.themes.find((theme) => theme.id === themeId);
      if (!source) {
        return prev;
      }
      const copy = cloneTheme(source, `theme-user-${Date.now()}`, `${source.name} (Copy)`, "user");
      return {
        ...prev,
        themes: [...prev.themes, copy],
        activeThemeId: copy.id,
      };
    });
  };

  return {
    hasProject,
    state,
    activeTheme,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    setActiveTheme,
    applyTheme,
    restoreLastSnapshot,
    updateActiveThemeTokens,
    duplicateTheme,
    undo: () => {
      const historyItems = historyRef.current;
      if (historyItems.length === 0) {
        return;
      }
      const previous = historyItems[historyItems.length - 1];
      const nextHistory = historyItems.slice(0, -1);
      const nextFuture = [stateRef.current, ...futureRef.current];
      stateRef.current = previous;
      historyRef.current = nextHistory;
      futureRef.current = nextFuture;
      publishState(previous, nextHistory, nextFuture);
    },
    redo: () => {
      const futureItems = futureRef.current;
      if (futureItems.length === 0) {
        return;
      }
      const [next, ...rest] = futureItems;
      const nextHistory = [...historyRef.current, stateRef.current];
      stateRef.current = next;
      historyRef.current = nextHistory;
      futureRef.current = rest;
      publishState(next, nextHistory, rest);
    },
  };
}

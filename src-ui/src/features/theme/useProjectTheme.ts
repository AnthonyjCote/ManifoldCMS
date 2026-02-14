import { useEffect, useMemo, useState } from "react";

import { BUNDLED_THEMES } from "./library";
import { normalizeThemeTokens, type ThemeRecord, type ThemeState, type ThemeTokens } from "./types";

const THEME_STATE_KEY = "manifold.project-theme.v1";

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
  setActiveTheme: (themeId: string) => void;
  applyTheme: (themeId: string, mode: ThemeApplyMode) => void;
  restoreLastSnapshot: () => void;
  updateActiveThemeTokens: (updater: (prev: ThemeTokens) => ThemeTokens) => void;
  duplicateTheme: (themeId: string) => void;
} {
  const [state, setState] = useState<ThemeState>(() => readThemeState(projectPath));

  useEffect(() => {
    setState(readThemeState(projectPath));
  }, [projectPath]);

  const hasProject = Boolean(projectPath);

  const updateState = (updater: (prev: ThemeState) => ThemeState) => {
    setState((prev) => {
      const next = coerceState(updater(prev));
      if (projectPath) {
        writeThemeState(projectPath, next);
      }
      return next;
    });
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
    setActiveTheme,
    applyTheme,
    restoreLastSnapshot,
    updateActiveThemeTokens,
    duplicateTheme,
  };
}

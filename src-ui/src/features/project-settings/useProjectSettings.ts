import { useEffect, useMemo, useState } from "react";

export type ProjectSettings = {
  breakpoints: {
    mobileMax: number;
    tabletMax: number;
    desktopMax: number;
  };
  preview: {
    mobileWidth: number;
    tabletWidth: number;
    desktopWidth: number;
    wideWidth: number;
  };
};

const PROJECT_SETTINGS_KEY = "manifold.project-settings.v1";

const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  breakpoints: {
    mobileMax: 767,
    tabletMax: 1199,
    desktopMax: 1919,
  },
  preview: {
    mobileWidth: 420,
    tabletWidth: 880,
    desktopWidth: 1920,
    wideWidth: 2880,
  },
};

function settingsKey(projectPath: string): string {
  return `${PROJECT_SETTINGS_KEY}:${projectPath}`;
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function coerceProjectSettings(raw: unknown): ProjectSettings {
  const input = (raw as Partial<ProjectSettings>) ?? {};
  const mobileMax = toPositiveInt(
    input.breakpoints?.mobileMax,
    DEFAULT_PROJECT_SETTINGS.breakpoints.mobileMax
  );
  const tabletMax = toPositiveInt(
    input.breakpoints?.tabletMax,
    DEFAULT_PROJECT_SETTINGS.breakpoints.tabletMax
  );
  const desktopMax = toPositiveInt(
    input.breakpoints?.desktopMax,
    DEFAULT_PROJECT_SETTINGS.breakpoints.desktopMax
  );
  const safeMobileMax = Math.min(mobileMax, tabletMax - 1, desktopMax - 2);
  const safeTabletMax = Math.max(Math.min(tabletMax, desktopMax - 1), safeMobileMax + 1);
  const safeDesktopMax = Math.max(desktopMax, safeTabletMax + 1);

  return {
    breakpoints: {
      mobileMax: safeMobileMax,
      tabletMax: safeTabletMax,
      desktopMax: safeDesktopMax,
    },
    preview: {
      mobileWidth: toPositiveInt(
        input.preview?.mobileWidth,
        DEFAULT_PROJECT_SETTINGS.preview.mobileWidth
      ),
      tabletWidth: toPositiveInt(
        input.preview?.tabletWidth,
        DEFAULT_PROJECT_SETTINGS.preview.tabletWidth
      ),
      desktopWidth: toPositiveInt(
        input.preview?.desktopWidth,
        DEFAULT_PROJECT_SETTINGS.preview.desktopWidth
      ),
      wideWidth: toPositiveInt(
        input.preview?.wideWidth,
        DEFAULT_PROJECT_SETTINGS.preview.wideWidth
      ),
    },
  };
}

function readProjectSettings(projectPath: string | undefined): ProjectSettings {
  if (!projectPath) {
    return DEFAULT_PROJECT_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(settingsKey(projectPath));
    if (!raw) {
      return DEFAULT_PROJECT_SETTINGS;
    }
    return coerceProjectSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_PROJECT_SETTINGS;
  }
}

function writeProjectSettings(projectPath: string, settings: ProjectSettings): void {
  window.localStorage.setItem(settingsKey(projectPath), JSON.stringify(settings));
}

export function useProjectSettings(projectPath: string | undefined): {
  settings: ProjectSettings;
  updateSettings: (updater: (prev: ProjectSettings) => ProjectSettings) => void;
  resetSettings: () => void;
  hasProject: boolean;
} {
  const [settings, setSettings] = useState<ProjectSettings>(() => readProjectSettings(projectPath));

  useEffect(() => {
    setSettings(readProjectSettings(projectPath));
  }, [projectPath]);

  const updateSettings = (updater: (prev: ProjectSettings) => ProjectSettings) => {
    setSettings((prev) => {
      const next = coerceProjectSettings(updater(prev));
      if (projectPath) {
        writeProjectSettings(projectPath, next);
      }
      return next;
    });
  };

  const resetSettings = () => {
    const next = DEFAULT_PROJECT_SETTINGS;
    if (projectPath) {
      writeProjectSettings(projectPath, next);
    }
    setSettings(next);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    hasProject: useMemo(() => Boolean(projectPath), [projectPath]),
  };
}

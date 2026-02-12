import { useEffect, useState } from "react";

import type { ViewMode } from "../types/ui";

const VIEW_MODE_KEY = "manifold.ui.view-mode";
const VIEW_MODE_EVENT = "manifold:view-mode";

const DEFAULT_VIEW: ViewMode = "home";

function readInitialMode(): ViewMode {
  const raw = window.localStorage.getItem(VIEW_MODE_KEY);
  if (
    raw === "home" ||
    raw === "builder" ||
    raw === "content" ||
    raw === "theme" ||
    raw === "assets" ||
    raw === "blocks_library" ||
    raw === "export_wizard" ||
    raw === "publish" ||
    raw === "project_settings" ||
    raw === "settings"
  ) {
    return raw;
  }
  return DEFAULT_VIEW;
}

export function useViewModeStore(): {
  viewMode: ViewMode;
  setViewMode: (next: ViewMode) => void;
} {
  const [viewMode, setViewMode] = useState<ViewMode>(() => readInitialMode());

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    const onViewModeEvent = () => {
      setViewMode(readInitialMode());
    };
    window.addEventListener(VIEW_MODE_EVENT, onViewModeEvent);
    return () => window.removeEventListener(VIEW_MODE_EVENT, onViewModeEvent);
  }, []);

  return {
    viewMode,
    setViewMode: (next) => {
      setViewMode(next);
      window.localStorage.setItem(VIEW_MODE_KEY, next);
      window.dispatchEvent(new Event(VIEW_MODE_EVENT));
    },
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";

import { coerceStateAgainstConfig, createInitialPerViewLayoutState } from "../lib/layoutState";
import type { DrawerTarget, PerViewLayoutState, ViewLayoutConfig, ViewMode } from "../types/ui";

const STORAGE_KEY = "manifold.ui.layout.v1";

type LayoutStateMap = Partial<Record<ViewMode, PerViewLayoutState>>;

function readPersistedState(): LayoutStateMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as LayoutStateMap;
  } catch {
    return {};
  }
}

export function useLayoutStateStore(input: { viewMode: ViewMode; config: ViewLayoutConfig }): {
  state: PerViewLayoutState;
  setLeftPaneWidth: (width: number) => void;
  setRightPinned: (next: boolean) => void;
  setBottomPinned: (next: boolean) => void;
  setRightOpen: (next: boolean) => void;
  setBottomOpen: (next: boolean) => void;
  setActiveRightTabId: (tabId: string) => void;
  setActiveBottomTabId: (tabId: string) => void;
  setPrimaryDrawer: (next: DrawerTarget) => void;
} {
  const [layoutMap, setLayoutMap] = useState<LayoutStateMap>(() => readPersistedState());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutMap));
  }, [layoutMap]);

  const ensureState = useMemo<PerViewLayoutState>(() => {
    const existing = layoutMap[input.viewMode];
    if (!existing) {
      return createInitialPerViewLayoutState(input.config);
    }
    return coerceStateAgainstConfig(input.config, existing);
  }, [input.config, input.viewMode, layoutMap]);

  const updateState = useCallback(
    (updater: (prev: PerViewLayoutState) => PerViewLayoutState) => {
      setLayoutMap((prev) => {
        const current = prev[input.viewMode] ?? createInitialPerViewLayoutState(input.config);
        return {
          ...prev,
          [input.viewMode]: coerceStateAgainstConfig(input.config, updater(current)),
        };
      });
    },
    [input.config, input.viewMode]
  );

  return {
    state: ensureState,
    setLeftPaneWidth: (width) => updateState((prev) => ({ ...prev, leftPaneWidth: width })),
    setRightPinned: (next) =>
      updateState((prev) => ({
        ...prev,
        rightDrawer: { ...prev.rightDrawer, pinned: next, open: next || prev.rightDrawer.open },
      })),
    setBottomPinned: (next) =>
      updateState((prev) => ({
        ...prev,
        bottomDrawer: { ...prev.bottomDrawer, pinned: next, open: next || prev.bottomDrawer.open },
      })),
    setRightOpen: (next) =>
      updateState((prev) => ({ ...prev, rightDrawer: { ...prev.rightDrawer, open: next } })),
    setBottomOpen: (next) =>
      updateState((prev) => ({ ...prev, bottomDrawer: { ...prev.bottomDrawer, open: next } })),
    setActiveRightTabId: (tabId) => updateState((prev) => ({ ...prev, activeRightTabId: tabId })),
    setActiveBottomTabId: (tabId) => updateState((prev) => ({ ...prev, activeBottomTabId: tabId })),
    setPrimaryDrawer: (next) => updateState((prev) => ({ ...prev, primaryDrawer: next })),
  };
}

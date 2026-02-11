import type { PerViewLayoutState, ViewLayoutConfig } from "../types/ui";

export function createInitialPerViewLayoutState(config: ViewLayoutConfig): PerViewLayoutState {
  return {
    leftPaneWidth: config.leftPaneDefaultWidth,
    rightDrawer: { ...config.rightDrawerDefault },
    bottomDrawer: { ...config.bottomDrawerDefault },
    activeRightTabId: config.rightDrawerTabs[0]?.id ?? null,
    activeBottomTabId: config.bottomDrawerTabs[0]?.id ?? null,
    primaryDrawer: config.defaultPrimaryDrawer,
  };
}

export function coerceStateAgainstConfig(
  config: ViewLayoutConfig,
  raw: PerViewLayoutState
): PerViewLayoutState {
  return {
    leftPaneWidth: raw.leftPaneWidth,
    rightDrawer: config.hasRightDrawer
      ? raw.rightDrawer
      : { ...config.rightDrawerDefault, pinned: false, open: false },
    bottomDrawer: config.hasBottomDrawer
      ? raw.bottomDrawer
      : { ...config.bottomDrawerDefault, pinned: false, open: false },
    activeRightTabId: config.hasRightDrawer ? raw.activeRightTabId : null,
    activeBottomTabId: config.hasBottomDrawer ? raw.activeBottomTabId : null,
    primaryDrawer: raw.primaryDrawer,
  };
}

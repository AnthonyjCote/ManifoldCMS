import type { ReactNode } from "react";

export type ViewMode =
  | "home"
  | "builder"
  | "content"
  | "theme"
  | "assets"
  | "blocks_library"
  | "export_wizard"
  | "publish"
  | "project_settings"
  | "settings";

export type DrawerTarget = "right" | "bottom";

export type TabDef = {
  id: string;
  label: string;
  render: () => ReactNode;
};

export type ViewLayoutConfig = {
  hasLeftPane: boolean;
  hasRightDrawer: boolean;
  hasBottomDrawer: boolean;
  leftPaneDefaultWidth: number;
  rightDrawerTabs: TabDef[];
  bottomDrawerTabs: TabDef[];
  rightDrawerDefault: { pinned: boolean; open: boolean };
  bottomDrawerDefault: { pinned: boolean; open: boolean };
  defaultPrimaryDrawer: DrawerTarget;
};

export type ViewDefinition = {
  id: ViewMode;
  label: string;
  icon: string;
  component: () => ReactNode;
  leftPane?: () => ReactNode;
  layout: ViewLayoutConfig;
};

export type DrawerState = {
  pinned: boolean;
  open: boolean;
};

export type PerViewLayoutState = {
  leftPaneWidth: number;
  rightDrawer: DrawerState;
  bottomDrawer: DrawerState;
  activeRightTabId: string | null;
  activeBottomTabId: string | null;
  primaryDrawer: DrawerTarget;
};

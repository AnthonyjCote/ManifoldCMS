import type { ViewDefinition, ViewMode } from "../types/ui";
import { AssetsView } from "./assets/AssetsView";
import { BlocksLibraryView } from "./blocks-library/BlocksLibraryView";
import { BuilderView } from "./builder/BuilderView";
import { AgentTab } from "./builder/tabs/AgentTab";
import { BlocksTab } from "./builder/tabs/BlocksTab";
import { ExportLogTab } from "./builder/tabs/ExportLogTab";
import { InspectorTab } from "./builder/tabs/InspectorTab";
import { LintTab } from "./builder/tabs/LintTab";
import { PageSeoTab } from "./builder/tabs/PageSeoTab";
import { PublishLogTab } from "./builder/tabs/PublishLogTab";
import { StyleTab } from "./builder/tabs/StyleTab";
import { ValidationTab } from "./builder/tabs/ValidationTab";
import { ContentView } from "./content/ContentView";
import { ExportWizardView } from "./export-wizard/ExportWizardView";
import { HomeView } from "./home/HomeView";
import { PublishView } from "./publish/PublishView";
import { SettingsView } from "./settings/SettingsView";
import { ThemeView } from "./theme/ThemeView";

function contentTree() {
  return <div className="left-pane-placeholder">Content tree</div>;
}

function assetsTree() {
  return <div className="left-pane-placeholder">Asset folders</div>;
}

function blocksTree() {
  return <div className="left-pane-placeholder">Block categories</div>;
}

export const VIEW_ORDER: ViewMode[] = [
  "home",
  "builder",
  "content",
  "theme",
  "assets",
  "blocks_library",
  "export_wizard",
  "publish",
  "settings",
];

export const VIEW_DEFINITIONS: Record<ViewMode, ViewDefinition> = {
  home: {
    id: "home",
    label: "Home",
    icon: "HM",
    component: HomeView,
    layout: {
      hasLeftPane: false,
      hasRightDrawer: false,
      hasBottomDrawer: false,
      leftPaneDefaultWidth: 280,
      rightDrawerTabs: [],
      bottomDrawerTabs: [],
      rightDrawerDefault: { pinned: false, open: false },
      bottomDrawerDefault: { pinned: false, open: false },
      defaultPrimaryDrawer: "right",
    },
  },
  builder: {
    id: "builder",
    label: "Builder",
    icon: "BD",
    component: BuilderView,
    layout: {
      hasLeftPane: false,
      hasRightDrawer: true,
      hasBottomDrawer: true,
      leftPaneDefaultWidth: 280,
      rightDrawerTabs: [
        {
          id: "blocks",
          label: "Blocks",
          render: () => <BlocksTab />,
        },
        {
          id: "content",
          label: "Content",
          render: () => <InspectorTab />,
        },
        {
          id: "style",
          label: "Style",
          render: () => <StyleTab />,
        },
        {
          id: "agent",
          label: "AI Agent",
          render: () => <AgentTab />,
        },
        {
          id: "page_meta",
          label: "Page Meta",
          render: () => <PageSeoTab />,
        },
      ],
      bottomDrawerTabs: [
        {
          id: "validation",
          label: "Validation",
          render: () => <ValidationTab />,
        },
        {
          id: "lint",
          label: "Lint",
          render: () => <LintTab />,
        },
        {
          id: "export_log",
          label: "Export Log",
          render: () => <ExportLogTab />,
        },
        {
          id: "publish_log",
          label: "Publish Log",
          render: () => <PublishLogTab />,
        },
      ],
      rightDrawerDefault: { pinned: true, open: true },
      bottomDrawerDefault: { pinned: false, open: false },
      defaultPrimaryDrawer: "right",
    },
  },
  content: {
    id: "content",
    label: "Content",
    icon: "CT",
    component: ContentView,
    leftPane: contentTree,
    layout: {
      hasLeftPane: true,
      hasRightDrawer: false,
      hasBottomDrawer: false,
      leftPaneDefaultWidth: 280,
      rightDrawerTabs: [],
      bottomDrawerTabs: [],
      rightDrawerDefault: { pinned: false, open: false },
      bottomDrawerDefault: { pinned: false, open: false },
      defaultPrimaryDrawer: "right",
    },
  },
  theme: {
    id: "theme",
    label: "Theme",
    icon: "TH",
    component: ThemeView,
    layout: {
      hasLeftPane: false,
      hasRightDrawer: false,
      hasBottomDrawer: false,
      leftPaneDefaultWidth: 280,
      rightDrawerTabs: [],
      bottomDrawerTabs: [],
      rightDrawerDefault: { pinned: false, open: false },
      bottomDrawerDefault: { pinned: false, open: false },
      defaultPrimaryDrawer: "right",
    },
  },
  assets: {
    id: "assets",
    label: "Assets",
    icon: "AS",
    component: AssetsView,
    leftPane: assetsTree,
    layout: {
      hasLeftPane: true,
      hasRightDrawer: false,
      hasBottomDrawer: false,
      leftPaneDefaultWidth: 280,
      rightDrawerTabs: [],
      bottomDrawerTabs: [],
      rightDrawerDefault: { pinned: false, open: false },
      bottomDrawerDefault: { pinned: false, open: false },
      defaultPrimaryDrawer: "right",
    },
  },
  blocks_library: {
    id: "blocks_library",
    label: "Blocks",
    icon: "BL",
    component: BlocksLibraryView,
    leftPane: blocksTree,
    layout: {
      hasLeftPane: true,
      hasRightDrawer: false,
      hasBottomDrawer: false,
      leftPaneDefaultWidth: 280,
      rightDrawerTabs: [],
      bottomDrawerTabs: [],
      rightDrawerDefault: { pinned: false, open: false },
      bottomDrawerDefault: { pinned: false, open: false },
      defaultPrimaryDrawer: "right",
    },
  },
  export_wizard: {
    id: "export_wizard",
    label: "Export",
    icon: "EX",
    component: ExportWizardView,
    layout: {
      hasLeftPane: false,
      hasRightDrawer: false,
      hasBottomDrawer: true,
      leftPaneDefaultWidth: 280,
      rightDrawerTabs: [],
      bottomDrawerTabs: [
        {
          id: "export_log",
          label: "Export Log",
          render: () => <div className="drawer-panel">Export logs</div>,
        },
      ],
      rightDrawerDefault: { pinned: false, open: false },
      bottomDrawerDefault: { pinned: true, open: true },
      defaultPrimaryDrawer: "bottom",
    },
  },
  publish: {
    id: "publish",
    label: "Publish",
    icon: "PB",
    component: PublishView,
    layout: {
      hasLeftPane: false,
      hasRightDrawer: false,
      hasBottomDrawer: true,
      leftPaneDefaultWidth: 280,
      rightDrawerTabs: [],
      bottomDrawerTabs: [
        {
          id: "publish_log",
          label: "Publish Log",
          render: () => <div className="drawer-panel">Publish logs</div>,
        },
        {
          id: "diagnostics",
          label: "Diagnostics",
          render: () => <div className="drawer-panel">Diagnostics</div>,
        },
      ],
      rightDrawerDefault: { pinned: false, open: false },
      bottomDrawerDefault: { pinned: true, open: true },
      defaultPrimaryDrawer: "bottom",
    },
  },
  settings: {
    id: "settings",
    label: "Settings",
    icon: "ST",
    component: SettingsView,
    layout: {
      hasLeftPane: false,
      hasRightDrawer: false,
      hasBottomDrawer: false,
      leftPaneDefaultWidth: 280,
      rightDrawerTabs: [],
      bottomDrawerTabs: [],
      rightDrawerDefault: { pinned: false, open: false },
      bottomDrawerDefault: { pinned: false, open: false },
      defaultPrimaryDrawer: "right",
    },
  },
};

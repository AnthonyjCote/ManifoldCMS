import { useEffect } from "react";

import { BuilderProvider } from "../features/builder/builder-store";
import { FOCUS_BLOCKS_TAB_EVENT, FOCUS_INSPECTOR_EVENT } from "../features/builder/events";
import { BUILDER_STYLE_JUMP_EVENT } from "../features/builder/style-jump-service";
import { useActiveProjectSession } from "../features/project-launcher/session";
import { BUILDER_THEME_TOKEN_JUMP_EVENT } from "../features/theme/theme-jump-service";
import { ShellFrame } from "../shell/ShellFrame";
import { useLayoutStateStore } from "../state/useLayoutStateStore";
import { useViewModeStore } from "../state/useViewModeStore";
import type { ViewMode } from "../types/ui";
import { VIEW_DEFINITIONS, VIEW_ORDER } from "../views/registry";
import "./app.css";

function rotateView(current: ViewMode, direction: "next" | "previous"): ViewMode {
  const currentIndex = VIEW_ORDER.indexOf(current);
  if (currentIndex < 0) {
    return VIEW_ORDER[0];
  }

  const offset = direction === "next" ? 1 : -1;
  const nextIndex = (currentIndex + offset + VIEW_ORDER.length) % VIEW_ORDER.length;
  return VIEW_ORDER[nextIndex];
}

function cycleTab(
  currentTabId: string | null,
  tabIds: string[],
  direction: "next" | "previous"
): string | null {
  if (tabIds.length === 0) {
    return null;
  }

  const index = currentTabId ? tabIds.indexOf(currentTabId) : 0;
  const start = index < 0 ? 0 : index;
  const offset = direction === "next" ? 1 : -1;
  const next = (start + offset + tabIds.length) % tabIds.length;
  return tabIds[next];
}

export function AppRoot() {
  const projectSession = useActiveProjectSession();
  const { viewMode, setViewMode } = useViewModeStore();
  const definition = VIEW_DEFINITIONS[viewMode];

  const layoutState = useLayoutStateStore({
    viewMode,
    config: definition.layout,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "\\") {
        if (definition.layout.hasRightDrawer) {
          event.preventDefault();
          layoutState.setRightOpen(!layoutState.state.rightDrawer.open);
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        if (definition.layout.hasBottomDrawer) {
          event.preventDefault();
          layoutState.setBottomOpen(!layoutState.state.bottomDrawer.open);
        }
      }

      if (event.altKey && event.key === "ArrowDown") {
        event.preventDefault();
        setViewMode(rotateView(viewMode, "next"));
      }

      if (event.altKey && event.key === "ArrowUp") {
        event.preventDefault();
        setViewMode(rotateView(viewMode, "previous"));
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "]") {
        const tabIds = definition.layout.rightDrawerTabs.map((tab) => tab.id);
        const next = cycleTab(layoutState.state.activeRightTabId, tabIds, "next");
        if (next) {
          event.preventDefault();
          layoutState.setActiveRightTabId(next);
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "[") {
        const tabIds = definition.layout.rightDrawerTabs.map((tab) => tab.id);
        const next = cycleTab(layoutState.state.activeRightTabId, tabIds, "previous");
        if (next) {
          event.preventDefault();
          layoutState.setActiveRightTabId(next);
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.altKey && event.key === "]") {
        const tabIds = definition.layout.bottomDrawerTabs.map((tab) => tab.id);
        const next = cycleTab(layoutState.state.activeBottomTabId, tabIds, "next");
        if (next) {
          event.preventDefault();
          layoutState.setActiveBottomTabId(next);
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.altKey && event.key === "[") {
        const tabIds = definition.layout.bottomDrawerTabs.map((tab) => tab.id);
        const next = cycleTab(layoutState.state.activeBottomTabId, tabIds, "previous");
        if (next) {
          event.preventDefault();
          layoutState.setActiveBottomTabId(next);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [definition, layoutState, setViewMode, viewMode]);

  useEffect(() => {
    const onFocusInspector = () => {
      if (viewMode !== "builder") {
        return;
      }
      layoutState.setRightOpen(true);
    };
    window.addEventListener(FOCUS_INSPECTOR_EVENT, onFocusInspector);
    return () => window.removeEventListener(FOCUS_INSPECTOR_EVENT, onFocusInspector);
  }, [layoutState, viewMode]);

  useEffect(() => {
    const onFocusBlocksTab = () => {
      if (viewMode !== "builder") {
        return;
      }
      layoutState.setRightOpen(true);
      layoutState.setRightPinned(true);
      layoutState.setActiveRightTabId("blocks");
    };
    window.addEventListener(FOCUS_BLOCKS_TAB_EVENT, onFocusBlocksTab);
    return () => window.removeEventListener(FOCUS_BLOCKS_TAB_EVENT, onFocusBlocksTab);
  }, [layoutState, viewMode]);

  useEffect(() => {
    const onStyleJump = () => {
      if (viewMode !== "builder") {
        return;
      }
      layoutState.setRightOpen(true);
      layoutState.setRightPinned(true);
      layoutState.setActiveRightTabId("style");
    };
    window.addEventListener(BUILDER_STYLE_JUMP_EVENT, onStyleJump);
    return () => window.removeEventListener(BUILDER_STYLE_JUMP_EVENT, onStyleJump);
  }, [layoutState, viewMode]);

  useEffect(() => {
    const onThemeTokenJump = () => {
      if (viewMode !== "builder") {
        return;
      }
      layoutState.setRightOpen(true);
      layoutState.setRightPinned(true);
      layoutState.setActiveRightTabId("theme_tokens");
    };
    window.addEventListener(BUILDER_THEME_TOKEN_JUMP_EVENT, onThemeTokenJump);
    return () => window.removeEventListener(BUILDER_THEME_TOKEN_JUMP_EVENT, onThemeTokenJump);
  }, [layoutState, viewMode]);

  return (
    <BuilderProvider
      projectPath={projectSession?.project.path}
      projectName={projectSession?.project.name}
      projectSiteUrl={projectSession?.project.siteUrl}
    >
      <ShellFrame
        viewMode={viewMode}
        setViewMode={setViewMode}
        viewDefinition={definition}
        leftPaneWidth={layoutState.state.leftPaneWidth}
        setLeftPaneWidth={layoutState.setLeftPaneWidth}
        rightPinned={layoutState.state.rightDrawer.pinned}
        setRightPinned={layoutState.setRightPinned}
        bottomPinned={layoutState.state.bottomDrawer.pinned}
        setBottomPinned={layoutState.setBottomPinned}
        rightOpen={layoutState.state.rightDrawer.open}
        setRightOpen={layoutState.setRightOpen}
        bottomOpen={layoutState.state.bottomDrawer.open}
        setBottomOpen={layoutState.setBottomOpen}
        activeRightTabId={layoutState.state.activeRightTabId}
        setActiveRightTabId={layoutState.setActiveRightTabId}
        activeBottomTabId={layoutState.state.activeBottomTabId}
        setActiveBottomTabId={layoutState.setActiveBottomTabId}
        primaryDrawer={layoutState.state.primaryDrawer}
        setPrimaryDrawer={layoutState.setPrimaryDrawer}
      />
    </BuilderProvider>
  );
}

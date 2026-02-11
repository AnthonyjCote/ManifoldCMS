import { useEffect, useMemo, useRef } from "react";

import type { ViewDefinition, ViewMode } from "../types/ui";
import { BottomDrawer } from "./BottomDrawer";
import { GlobalRail } from "./GlobalRail";
import { OptionalLeftPane } from "./OptionalLeftPane";
import { RightDrawer } from "./RightDrawer";
import { ViewRouter } from "./ViewRouter";

type ShellFrameProps = {
  viewMode: ViewMode;
  setViewMode: (next: ViewMode) => void;
  viewDefinition: ViewDefinition;
  leftPaneWidth: number;
  setLeftPaneWidth: (width: number) => void;
  rightPinned: boolean;
  setRightPinned: (next: boolean) => void;
  bottomPinned: boolean;
  setBottomPinned: (next: boolean) => void;
  rightOpen: boolean;
  setRightOpen: (next: boolean) => void;
  bottomOpen: boolean;
  setBottomOpen: (next: boolean) => void;
  activeRightTabId: string | null;
  setActiveRightTabId: (tabId: string) => void;
  activeBottomTabId: string | null;
  setActiveBottomTabId: (tabId: string) => void;
  primaryDrawer: "right" | "bottom";
  setPrimaryDrawer: (next: "right" | "bottom") => void;
};

export function ShellFrame(props: ShellFrameProps) {
  const sideHoverTimeout = useRef<number | null>(null);
  const bottomHoverTimeout = useRef<number | null>(null);

  const hasRight = props.viewDefinition.layout.hasRightDrawer;
  const hasBottom = props.viewDefinition.layout.hasBottomDrawer;

  const rightOpen = hasRight && props.rightOpen;
  const bottomOpen = hasBottom && props.bottomOpen;
  const rightDrawerWidth = 320;
  const bottomDrawerHeight = 220;
  const edgeTrigger = 14;

  const viewClass = useMemo(() => {
    const classes = ["shell-main", `mode-${props.viewDefinition.id}`];
    if (rightOpen) {
      classes.push("right-open");
    }
    if (bottomOpen) {
      classes.push("bottom-open");
    }
    if (rightOpen && bottomOpen) {
      classes.push(props.primaryDrawer === "right" ? "primary-right" : "primary-bottom");
    }
    return classes.join(" ");
  }, [bottomOpen, props.primaryDrawer, props.viewDefinition.id, rightOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!props.rightPinned && rightOpen) {
          props.setRightOpen(false);
        }
        if (!props.bottomPinned && bottomOpen) {
          props.setBottomOpen(false);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bottomOpen, props, rightOpen]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (hasRight && !props.rightPinned) {
        const nearRightEdge = event.clientX >= window.innerWidth - edgeTrigger;
        const insideRightPanel = rightOpen && event.clientX >= window.innerWidth - rightDrawerWidth;

        if (nearRightEdge || insideRightPanel) {
          if (sideHoverTimeout.current) {
            window.clearTimeout(sideHoverTimeout.current);
            sideHoverTimeout.current = null;
          }
          props.setRightOpen(true);
        } else if (sideHoverTimeout.current === null) {
          sideHoverTimeout.current = window.setTimeout(() => {
            props.setRightOpen(false);
            sideHoverTimeout.current = null;
          }, 140);
        }
      }

      if (hasBottom && !props.bottomPinned) {
        const nearBottomEdge = event.clientY >= window.innerHeight - edgeTrigger;
        const insideBottomPanel =
          bottomOpen && event.clientY >= window.innerHeight - bottomDrawerHeight;

        if (nearBottomEdge || insideBottomPanel) {
          if (bottomHoverTimeout.current) {
            window.clearTimeout(bottomHoverTimeout.current);
            bottomHoverTimeout.current = null;
          }
          props.setBottomOpen(true);
        } else if (bottomHoverTimeout.current === null) {
          bottomHoverTimeout.current = window.setTimeout(() => {
            props.setBottomOpen(false);
            bottomHoverTimeout.current = null;
          }, 140);
        }
      }
    };

    const onMouseLeaveViewport = () => {
      if (hasRight && !props.rightPinned) {
        props.setRightOpen(false);
      }
      if (hasBottom && !props.bottomPinned) {
        props.setBottomOpen(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeaveViewport);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeaveViewport);
    };
  }, [
    bottomOpen,
    hasBottom,
    hasRight,
    props,
    rightOpen,
    bottomDrawerHeight,
    rightDrawerWidth,
    edgeTrigger,
  ]);

  return (
    <div className="shell-root">
      <GlobalRail viewMode={props.viewMode} setViewMode={props.setViewMode} />
      <div className={viewClass}>
        <div className="main-region">
          <OptionalLeftPane
            enabled={props.viewDefinition.layout.hasLeftPane}
            width={props.leftPaneWidth}
            setWidth={props.setLeftPaneWidth}
            content={props.viewDefinition.leftPane}
          />
          <main
            className={`view-region view-region-${props.viewDefinition.id}`}
            aria-label="Main content"
          >
            <ViewRouter viewDefinition={props.viewDefinition} />
          </main>
        </div>

        <RightDrawer
          title={props.viewDefinition.label}
          enabled={hasRight}
          pinned={props.rightPinned}
          open={rightOpen}
          tabs={props.viewDefinition.layout.rightDrawerTabs}
          activeTabId={props.activeRightTabId}
          setActiveTabId={props.setActiveRightTabId}
          onHoverChange={(hovering) => {
            if (sideHoverTimeout.current) {
              window.clearTimeout(sideHoverTimeout.current);
            }
            if (props.rightPinned) {
              props.setRightOpen(true);
              return;
            }
            if (hovering) {
              props.setRightOpen(true);
              return;
            }
            sideHoverTimeout.current = window.setTimeout(() => props.setRightOpen(false), 120);
          }}
          onTogglePinned={() => props.setRightPinned(!props.rightPinned)}
          primaryDrawer={props.primaryDrawer}
          setPrimaryDrawer={props.setPrimaryDrawer}
        />

        <BottomDrawer
          title={props.viewDefinition.label}
          enabled={hasBottom}
          pinned={props.bottomPinned}
          open={bottomOpen}
          tabs={props.viewDefinition.layout.bottomDrawerTabs}
          activeTabId={props.activeBottomTabId}
          setActiveTabId={props.setActiveBottomTabId}
          onHoverChange={(hovering) => {
            if (bottomHoverTimeout.current) {
              window.clearTimeout(bottomHoverTimeout.current);
            }
            if (props.bottomPinned) {
              props.setBottomOpen(true);
              return;
            }
            if (hovering) {
              props.setBottomOpen(true);
              return;
            }
            bottomHoverTimeout.current = window.setTimeout(() => props.setBottomOpen(false), 120);
          }}
          onTogglePinned={() => props.setBottomPinned(!props.bottomPinned)}
          primaryDrawer={props.primaryDrawer}
          setPrimaryDrawer={props.setPrimaryDrawer}
        />
      </div>
    </div>
  );
}

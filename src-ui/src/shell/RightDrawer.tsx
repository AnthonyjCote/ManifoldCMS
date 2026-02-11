import type { DrawerTarget, TabDef } from "../types/ui";
import { DrawerTabHost } from "./DrawerTabHost";

type RightDrawerProps = {
  title: string;
  enabled: boolean;
  pinned: boolean;
  open: boolean;
  tabs: TabDef[];
  activeTabId: string | null;
  setActiveTabId: (id: string) => void;
  onHoverChange: (next: boolean) => void;
  onTogglePinned: () => void;
  primaryDrawer: DrawerTarget;
  setPrimaryDrawer: (next: DrawerTarget) => void;
};

export function RightDrawer(props: RightDrawerProps) {
  if (!props.enabled) {
    return null;
  }

  return (
    <aside
      className={`right-drawer-shell${props.open ? " open" : ""}${props.pinned ? " pinned" : ""}`}
      onMouseEnter={() => props.onHoverChange(true)}
      onMouseLeave={() => props.onHoverChange(false)}
    >
      <div className="right-drawer-trigger" />
      <div className="right-drawer">
        <header className="drawer-header">
          <h2>{props.title}</h2>
          <div className="drawer-header-actions">
            <button
              className={`drawer-action${props.primaryDrawer === "right" ? " active" : ""}`}
              onClick={() => props.setPrimaryDrawer("right")}
              title="Set as primary drawer"
            >
              ★
            </button>
            <button className="drawer-action" onClick={props.onTogglePinned} title="Pin drawer">
              {props.pinned ? "Unpin" : "Pin"}
            </button>
          </div>
        </header>
        <DrawerTabHost
          tabs={props.tabs}
          activeTabId={props.activeTabId}
          setActiveTabId={props.setActiveTabId}
          iconTabs
        />
      </div>
    </aside>
  );
}

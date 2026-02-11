import type { DrawerTarget, TabDef } from "../types/ui";
import { DrawerTabHost } from "./DrawerTabHost";

type BottomDrawerProps = {
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

export function BottomDrawer(props: BottomDrawerProps) {
  if (!props.enabled) {
    return null;
  }

  return (
    <aside
      className={`bottom-drawer-shell${props.open ? " open" : ""}${props.pinned ? " pinned" : ""}`}
      onMouseEnter={() => props.onHoverChange(true)}
      onMouseLeave={() => props.onHoverChange(false)}
    >
      <div className="bottom-drawer-trigger" />
      <div className="bottom-drawer">
        <header className="drawer-header">
          <h2>{props.title}</h2>
          <div className="drawer-header-actions">
            <button
              className={`drawer-action${props.primaryDrawer === "bottom" ? " active" : ""}`}
              onClick={() => props.setPrimaryDrawer("bottom")}
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
        />
      </div>
    </aside>
  );
}

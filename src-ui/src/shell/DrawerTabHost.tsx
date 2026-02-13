import type { TabDef } from "../types/ui";

type DrawerTabHostProps = {
  tabs: TabDef[];
  activeTabId: string | null;
  setActiveTabId: (tabId: string) => void;
  iconTabs?: boolean;
};

function tabIcon(tabId: string) {
  switch (tabId) {
    case "blocks":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
        </svg>
      );
    case "content":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "style":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 3 8l9 5 9-5-9-5zM3 16l9 5 9-5" />
        </svg>
      );
    case "theme_tokens":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 3 8l9 5 9-5-9-5zM6 14v4l6 3 6-3v-4" />
        </svg>
      );
    case "agent":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <path d="M9 12h6M12 9v6M9 4h6" />
        </svg>
      );
    case "page_meta":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4h14v16H5zM8 8h8M8 12h6M8 16h4" />
        </svg>
      );
    case "validation":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12l4 4 10-10" />
        </svg>
      );
    case "lint":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      );
    case "export_log":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12M8 11l4 4 4-4M5 21h14" />
        </svg>
      );
    case "publish_log":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21V9M8 13l4-4 4 4M5 3h14" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="6" />
        </svg>
      );
  }
}

export function DrawerTabHost({
  tabs,
  activeTabId,
  setActiveTabId,
  iconTabs = false,
}: DrawerTabHostProps) {
  if (tabs.length === 0) {
    return <div className="drawer-empty">No panel content for this view.</div>;
  }

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  return (
    <div className="drawer-tab-host">
      <div className="drawer-tab-list" role="tablist" aria-label="Drawer tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeTab.id}
            className={`drawer-tab${iconTabs ? " icon" : ""}${tab.id === activeTab.id ? " active" : ""}`}
            onClick={() => setActiveTabId(tab.id)}
            aria-label={tab.label}
            title={tab.label}
          >
            {iconTabs ? (
              <>
                {tabIcon(tab.id)}
                <span className="icon-tooltip">{tab.label}</span>
              </>
            ) : (
              tab.label
            )}
          </button>
        ))}
      </div>
      <div className="drawer-tab-body">{activeTab.render()}</div>
    </div>
  );
}

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
          <path d="m14.5 6.5 3 3M6 18l3.5-.8 8-8a1.6 1.6 0 0 0 0-2.3l-1.4-1.4a1.6 1.6 0 0 0-2.3 0l-8 8L5 17z" />
          <path d="M4.5 19.5h5" />
        </svg>
      );
    case "theme_tokens":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4a8 8 0 1 0 8 8c0-1.7-1.4-2.8-3-2.8h-1.5c-.9 0-1.5-.7-1.5-1.5 0-.4.2-.8.5-1.1l1.1-1.1A8 8 0 0 0 12 4Z" />
          <circle cx="8.5" cy="11" r="1" />
          <circle cx="10.5" cy="8.2" r="1" />
        </svg>
      );
    case "agent":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <text
            x="12"
            y="16.5"
            textAnchor="middle"
            fontSize="12.5"
            fontWeight="700"
            fill="currentColor"
            stroke="none"
            letterSpacing="0.5"
          >
            AI
          </text>
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
            data-tab-id={tab.id}
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

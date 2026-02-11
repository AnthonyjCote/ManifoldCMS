import type { ViewMode } from "../types/ui";
import { VIEW_DEFINITIONS, VIEW_ORDER } from "../views/registry";

type GlobalRailProps = {
  viewMode: ViewMode;
  setViewMode: (next: ViewMode) => void;
};

function RailIcon({ mode }: { mode: ViewMode }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": true } as const;

  switch (mode) {
    case "home":
      return (
        <svg {...common}>
          <path d="M12 4 4 10v10h6v-6h4v6h6V10l-8-6Z" fill="currentColor" />
        </svg>
      );
    case "builder":
      return (
        <svg {...common}>
          <path
            d="M4 6h16v12H4zM7 9h4v2H7zm0 4h7v2H7zm9-4h1v6h-1z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "content":
      return (
        <svg {...common}>
          <path
            d="M6 5h12v3H6zM6 10h12v3H6zM6 15h8v3H6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "theme":
      return (
        <svg {...common}>
          <path
            d="M12 4a8 8 0 1 0 8 8c0-1.7-1.4-2.8-3-2.8h-1.5c-.9 0-1.5-.7-1.5-1.5 0-.4.2-.8.5-1.1l1.1-1.1A8 8 0 0 0 12 4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="11" r="1" fill="currentColor" />
          <circle cx="10.5" cy="8.2" r="1" fill="currentColor" />
        </svg>
      );
    case "assets":
      return (
        <svg {...common}>
          <path
            d="M4 6h7l2 2h7v10H4z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="13" r="1.2" fill="currentColor" />
          <path d="m8 16 2-2 2 2 2-1.8 2 1.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "blocks_library":
      return (
        <svg {...common}>
          <path
            d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "export_wizard":
      return (
        <svg {...common}>
          <path
            d="M6 5h12v14H6zM9 9h6M9 12h6M9 15h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path d="m14 3 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "publish":
      return (
        <svg {...common}>
          <path
            d="M12 4v10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="m8 10 4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect
            x="5"
            y="16"
            width="14"
            height="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path
            d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="m19 12-1.7.6-.4 1.1 1 1.5-1.7 1.7-1.5-1-.9.4-.6 1.7h-2.4l-.6-1.7-.9-.4-1.5 1-1.7-1.7 1-1.5-.4-.9L5 12v-2.4l1.7-.6.4-.9-1-1.5 1.7-1.7 1.5 1 .9-.4.6-1.7h2.4l.6 1.7.9.4 1.5-1 1.7 1.7-1 1.5.4.9 1.7.6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function GlobalRail({ viewMode, setViewMode }: GlobalRailProps) {
  const settingsMode: ViewMode = "settings";
  const mainModes = VIEW_ORDER.filter((mode) => mode !== settingsMode);

  return (
    <nav className="global-rail" aria-label="Primary">
      <div className="global-rail-group">
        {mainModes.map((mode) => {
          const def = VIEW_DEFINITIONS[mode];
          const active = viewMode === mode;
          return (
            <button
              key={mode}
              type="button"
              className={`rail-item${active ? " active" : ""}`}
              aria-label={def.label}
              aria-current={active ? "page" : undefined}
              onClick={() => setViewMode(mode)}
            >
              <RailIcon mode={mode} />
              <span className="rail-tooltip" role="tooltip">
                {def.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="global-rail-group bottom">
        <button
          type="button"
          className={`rail-item${viewMode === settingsMode ? " active" : ""}`}
          aria-label={VIEW_DEFINITIONS[settingsMode].label}
          aria-current={viewMode === settingsMode ? "page" : undefined}
          onClick={() => setViewMode(settingsMode)}
        >
          <RailIcon mode={settingsMode} />
          <span className="rail-tooltip" role="tooltip">
            {VIEW_DEFINITIONS[settingsMode].label}
          </span>
        </button>
      </div>
    </nav>
  );
}

import { useMemo, useState } from "react";

import type { ThemeTokens } from "../types";
import { THEME_TOKEN_GROUPS } from "./theme-token-groups";

type ThemeTokenEditorProps = {
  tokens: ThemeTokens;
  onChange: (key: keyof ThemeTokens, value: string) => void;
  storageKeyPrefix: string;
  searchEnabled?: boolean;
};

const COLLAPSE_KEY = "manifold.theme-editor.collapsed";

function readCollapsed(prefix: string): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(`${COLLAPSE_KEY}:${prefix}`);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCollapsed(prefix: string, state: Record<string, boolean>) {
  try {
    window.localStorage.setItem(`${COLLAPSE_KEY}:${prefix}`, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function ThemeTokenEditor({
  tokens,
  onChange,
  storageKeyPrefix,
  searchEnabled = true,
}: ThemeTokenEditorProps) {
  const [query, setQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() =>
    readCollapsed(storageKeyPrefix)
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return THEME_TOKEN_GROUPS.map((group) => {
      const fields = q
        ? group.fields.filter(
            (field) => field.label.toLowerCase().includes(q) || field.key.toLowerCase().includes(q)
          )
        : group.fields;
      return {
        ...group,
        fields,
      };
    }).filter((group) => group.fields.length > 0);
  }, [query]);

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      writeCollapsed(storageKeyPrefix, next);
      return next;
    });
  };

  return (
    <div className="drawer-stack style-tab-root theme-tab-root">
      {searchEnabled ? (
        <section className="inspector-card-item style-tab-topbar">
          <label className="inspector-field compact">
            <span className="style-tab-topbar-label">Find theme token</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search color, text, button..."
              className="compact-input"
            />
          </label>
        </section>
      ) : null}

      <div className="drawer-accordion-list">
        {groups.map((group) => {
          const collapsed = collapsedGroups[group.id] ?? true;
          return (
            <section key={group.id} className="drawer-accordion-section">
              <button
                type="button"
                className="drawer-accordion-toggle"
                aria-expanded={!collapsed}
                onClick={() => toggleGroup(group.id)}
              >
                <h4>{group.label}</h4>
                <span>{collapsed ? "+" : "−"}</span>
              </button>
              {!collapsed ? (
                <div className="drawer-accordion-content">
                  <div className="inspector-card-grid">
                    {group.fields.map((field) => (
                      <label key={field.key} className="inspector-field compact">
                        <span>{field.label}</span>
                        <div className="style-color-row">
                          <button
                            type="button"
                            className="style-color-swatch-btn"
                            style={{ background: tokens[field.key] }}
                            aria-hidden="true"
                            tabIndex={-1}
                          >
                            <span className="style-color-swatch-inner" />
                          </button>
                          <input
                            className="compact-input"
                            value={tokens[field.key]}
                            onChange={(event) => onChange(field.key, event.target.value)}
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";

import {
  BUILDER_THEME_TOKEN_JUMP_EVENT,
  consumePendingThemeTokenJump,
  type ThemeTokenJumpRequest,
} from "../theme-jump-service";
import type { ThemeTokens } from "../types";
import { useColorPickerToggle } from "../../ui/useColorPickerToggle";
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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  const [pendingJump, setPendingJump] = useState<ThemeTokenJumpRequest | null>(() =>
    consumePendingThemeTokenJump()
  );
  const [pulsedTokenKey, setPulsedTokenKey] = useState<keyof ThemeTokens | null>(null);
  const { openColorFieldId, onColorInputBlur, toggleColorField } = useColorPickerToggle();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() =>
    readCollapsed(storageKeyPrefix)
  );
  const tokenGroupByKey = useMemo(() => {
    const out: Partial<Record<keyof ThemeTokens, string>> = {};
    THEME_TOKEN_GROUPS.forEach((group) => {
      group.fields.forEach((field) => {
        out[field.key] = group.id;
      });
    });
    return out;
  }, []);

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

  useEffect(() => {
    const onThemeTokenJump = (event: Event) => {
      const detail = (event as CustomEvent<ThemeTokenJumpRequest>).detail;
      if (!detail?.tokenKey) {
        return;
      }
      setPendingJump(detail);
    };
    window.addEventListener(BUILDER_THEME_TOKEN_JUMP_EVENT, onThemeTokenJump);
    return () => window.removeEventListener(BUILDER_THEME_TOKEN_JUMP_EVENT, onThemeTokenJump);
  }, []);

  useEffect(() => {
    if (!pendingJump) {
      return;
    }
    const targetGroup = tokenGroupByKey[pendingJump.tokenKey];
    if (targetGroup) {
      queueMicrotask(() => {
        setCollapsedGroups((prev) => {
          if (prev[targetGroup] === false) {
            return prev;
          }
          const next = { ...prev, [targetGroup]: false };
          writeCollapsed(storageKeyPrefix, next);
          return next;
        });
      });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const node = document.querySelector<HTMLElement>(
          `[data-theme-token-key="${pendingJump.tokenKey}"]`
        );
        if (node) {
          const scrollHost = rootRef.current?.closest(".drawer-tab-body");
          if (scrollHost instanceof HTMLElement) {
            const hostRect = scrollHost.getBoundingClientRect();
            const fieldRect = node.getBoundingClientRect();
            const delta =
              fieldRect.top - hostRect.top - scrollHost.clientHeight / 2 + fieldRect.height / 2;
            scrollHost.scrollTo({
              top: scrollHost.scrollTop + delta,
              behavior: "smooth",
            });
          } else {
            node.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setPulsedTokenKey(pendingJump.tokenKey);
          if (pulseTimeoutRef.current !== null) {
            window.clearTimeout(pulseTimeoutRef.current);
          }
          pulseTimeoutRef.current = window.setTimeout(() => {
            setPulsedTokenKey((prev) => (prev === pendingJump.tokenKey ? null : prev));
            pulseTimeoutRef.current = null;
          }, 1000);
        }
        setPendingJump((current) => (current === pendingJump ? null : current));
      });
    });
  }, [pendingJump, storageKeyPrefix, tokenGroupByKey]);

  useEffect(
    () => () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    },
    []
  );

  return (
    <div ref={rootRef} className="drawer-stack style-tab-root theme-tab-root">
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
                    {group.fields.map((field, index) => {
                      const showSectionHeading =
                        Boolean(field.section) &&
                        (index === 0 || group.fields[index - 1]?.section !== field.section);
                      return (
                        <div key={field.key} className="theme-token-field-wrap">
                          {showSectionHeading ? (
                            <div className="theme-token-subheading">{field.section}</div>
                          ) : null}
                          <label
                            className={`inspector-field compact${
                              pulsedTokenKey === field.key ? " theme-token-pulse" : ""
                            }`}
                            data-theme-token-key={field.key}
                          >
                            <span>{field.label}</span>
                            {field.kind === "color" ? (
                              <div className="style-color-row">
                                <button
                                  type="button"
                                  className={`style-color-swatch-btn${
                                    openColorFieldId === `theme:${String(field.key)}` ? " open" : ""
                                  }`}
                                  style={{ background: tokens[field.key] }}
                                  onClick={(event) => {
                                    const row = event.currentTarget.closest(".style-color-row");
                                    const input =
                                      row?.querySelector<HTMLInputElement>(
                                        ".style-color-native-input"
                                      ) ?? null;
                                    toggleColorField(`theme:${String(field.key)}`, input);
                                  }}
                                  aria-label={`Toggle ${field.label} color picker`}
                                  title={`Toggle ${field.label} color picker`}
                                >
                                  <span className="style-color-swatch-inner" />
                                </button>
                                <input
                                  type="color"
                                  value={tokens[field.key]}
                                  onBlur={() => onColorInputBlur(`theme:${String(field.key)}`)}
                                  onChange={(event) => onChange(field.key, event.target.value)}
                                  className="style-color-native-input"
                                  tabIndex={-1}
                                  aria-hidden="true"
                                />
                                <input
                                  className="compact-input"
                                  value={tokens[field.key]}
                                  onChange={(event) => onChange(field.key, event.target.value)}
                                />
                              </div>
                            ) : field.kind === "select" ? (
                              <select
                                className="compact-input"
                                value={tokens[field.key]}
                                onChange={(event) => onChange(field.key, event.target.value)}
                              >
                                {((field.options ?? []).includes(tokens[field.key])
                                  ? (field.options ?? [])
                                  : [tokens[field.key], ...(field.options ?? [])]
                                ).map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className="compact-input"
                                value={tokens[field.key]}
                                onChange={(event) => onChange(field.key, event.target.value)}
                              />
                            )}
                          </label>
                        </div>
                      );
                    })}
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

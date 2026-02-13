import { useEffect, useMemo, useRef, useState } from "react";

import { buildPreviewTreeForBlock } from "../../../features/builder/catalog";
import {
  PRIMITIVE_EXCLUDED_STYLE_KEYS,
  PRIMITIVE_STYLE_KEYS,
  SECTION_STYLE_KEYS,
  STYLE_CATEGORY_BY_KEY,
  type StyleCategory,
} from "../../../features/builder/style-field-config";
import { buildStyleFieldId } from "../../../features/builder/style-field-id";
import { requestStyleJump } from "../../../features/builder/style-jump-service";
import {
  getExplicitPrimitiveStyleValue,
  getExplicitSectionStyleValue,
} from "../../../features/builder/style-scopes";
import {
  VIEWPORT_MENU_ORDER,
  VIEWPORT_SCOPE_LABELS,
  buildViewportMenuMetaLabels,
} from "../../../features/builder/viewport-menu";
import type {
  BlockInstance,
  PrimitiveNode,
  PrimitiveStyleKey,
  PrimitiveType,
  StyleStateKey,
} from "../../../features/builder/types";
import type { ProjectSettings } from "../../../features/project-settings/useProjectSettings";
import type { BuilderViewport } from "../../../features/builder/style-scopes";

type PrimitiveEntry = {
  path: string;
  label: string;
  type: PrimitiveType;
  order: number;
};

type AuditRow = {
  id: string;
  blockId: string;
  primitivePath: string | null;
  targetType: "section" | "primitive";
  targetLabel: string;
  primitiveType: PrimitiveType | null;
  order: number;
  viewport: BuilderViewport;
  state: StyleStateKey;
  fieldKey: string;
  category: StyleCategory;
  value: string;
};

const CATEGORY_FILTERS: StyleCategory[] = [
  "Layout",
  "Spacing",
  "Border",
  "Background",
  "Typography",
  "Effects",
  "Transform",
];

function walkPrimitives(nodes: PrimitiveNode[], pathPrefix = ""): PrimitiveEntry[] {
  const out: PrimitiveEntry[] = [];
  let order = 0;
  const walk = (list: PrimitiveNode[], prefix: string) => {
    list.forEach((node, index) => {
      const path = prefix ? `${prefix}.${index}` : String(index);
      out.push({
        path,
        label: `${node.type} ${index + 1}`,
        type: node.type,
        order,
      });
      order += 1;
      if (node.children && node.children.length > 0) {
        walk(node.children, path);
      }
    });
  };
  walk(nodes, pathPrefix);
  return out;
}

function formatFieldLabel(fieldKey: string): string {
  return fieldKey.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (entry) => entry.toUpperCase());
}

function buildAuditRows(block: BlockInstance): AuditRow[] {
  const rows: AuditRow[] = [];
  const primitiveEntries = walkPrimitives(buildPreviewTreeForBlock(block));
  const stateOrder: StyleStateKey[] = ["default", "hover"];

  for (const viewport of VIEWPORT_MENU_ORDER) {
    for (const state of stateOrder) {
      for (const key of SECTION_STYLE_KEYS) {
        const value = getExplicitSectionStyleValue(block.styleOverrides, key, viewport, state);
        if (!value.trim()) {
          continue;
        }
        const category = STYLE_CATEGORY_BY_KEY[key];
        const id = buildStyleFieldId({
          blockId: block.id,
          primitivePath: null,
          viewport,
          state,
          fieldKey: key,
        });
        rows.push({
          id,
          blockId: block.id,
          primitivePath: null,
          targetType: "section",
          targetLabel: "Section",
          primitiveType: null,
          order: -1,
          viewport,
          state,
          fieldKey: key,
          category,
          value,
        });
      }

      for (const primitive of primitiveEntries) {
        for (const key of PRIMITIVE_STYLE_KEYS) {
          const value = getExplicitPrimitiveStyleValue(
            block.styleOverrides,
            primitive.path,
            key,
            viewport,
            state
          );
          if (!value.trim()) {
            continue;
          }
          const category = STYLE_CATEGORY_BY_KEY[key];
          const id = buildStyleFieldId({
            blockId: block.id,
            primitivePath: primitive.path,
            viewport,
            state,
            fieldKey: key,
          });
          rows.push({
            id,
            blockId: block.id,
            primitivePath: primitive.path,
            targetType: "primitive",
            targetLabel: primitive.label,
            primitiveType: primitive.type,
            order: primitive.order,
            viewport,
            state,
            fieldKey: key as PrimitiveStyleKey,
            category,
            value,
          });
        }
      }
    }
  }

  return rows.sort((a, b) => {
    if (a.targetType !== b.targetType) {
      return a.targetType === "section" ? -1 : 1;
    }
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    if (a.fieldKey !== b.fieldKey) {
      return a.fieldKey.localeCompare(b.fieldKey);
    }
    if (a.state !== b.state) {
      return a.state.localeCompare(b.state);
    }
    return 0;
  });
}

type SectionStyleAuditModalProps = {
  open: boolean;
  block: BlockInstance | null;
  settings: ProjectSettings;
  onClose: () => void;
};

export function SectionStyleAuditModal({
  open,
  block,
  settings,
  onClose,
}: SectionStyleAuditModalProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Set<StyleCategory>>(
    () => new Set(CATEGORY_FILTERS)
  );
  const [targetFilter, setTargetFilter] = useState<Set<AuditRow["targetType"]>>(
    () => new Set(["section", "primitive"])
  );
  const [includeHover, setIncludeHover] = useState(true);

  const viewportMeta = useMemo(
    () => buildViewportMenuMetaLabels(settings.breakpoints),
    [settings.breakpoints]
  );

  const rows = useMemo(() => {
    if (!open || !block) {
      return [];
    }
    return buildAuditRows(block);
  }, [block, open]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (!categoryFilter.has(row.category)) {
          return false;
        }
        if (!targetFilter.has(row.targetType)) {
          return false;
        }
        if (!includeHover && row.state === "hover") {
          return false;
        }
        return true;
      }),
    [categoryFilter, includeHover, rows, targetFilter]
  );

  const groupedRowsByViewport = useMemo(() => {
    const grouped = new Map<
      BuilderViewport,
      Array<{ key: string; label: string; rows: AuditRow[] }>
    >();
    VIEWPORT_MENU_ORDER.forEach((viewport) => grouped.set(viewport, []));
    filteredRows.forEach((row) => {
      const list = grouped.get(row.viewport);
      if (!list) {
        return;
      }
      const key =
        row.targetType === "section"
          ? `section:${row.blockId}`
          : `primitive:${row.primitivePath ?? "unknown"}`;
      const existing = list.find((entry) => entry.key === key);
      if (existing) {
        existing.rows.push(row);
      } else {
        list.push({ key, label: row.targetLabel, rows: [row] });
      }
    });
    return grouped;
  }, [filteredRows]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!filterOpen) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!filterPopoverRef.current) {
        return;
      }
      if (filterPopoverRef.current.contains(event.target as Node)) {
        return;
      }
      setFilterOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown, true);
    return () => window.removeEventListener("mousedown", onPointerDown, true);
  }, [filterOpen]);

  if (!open || !block) {
    return null;
  }

  const clearFilters = () => {
    setCategoryFilter(new Set(CATEGORY_FILTERS));
    setTargetFilter(new Set(["section", "primitive"]));
    setIncludeHover(true);
  };

  return (
    <div className="audit-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="audit-modal"
        role="dialog"
        aria-label="Section style audit"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="audit-modal-header">
          <div className="audit-modal-title-wrap">
            <h3>Section Style Audit</h3>
            <p>
              {block.type.replace(/_/g, " ")} · {filteredRows.length} explicit edits
            </p>
          </div>
          <div className="audit-modal-actions">
            <div className="builder-popover-anchor audit-filter-anchor">
              <div ref={filterPopoverRef}>
                <button
                  className="style-tab-filter-indicator status-tone-all"
                  type="button"
                  onClick={() => setFilterOpen((prev) => !prev)}
                  aria-expanded={filterOpen}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 6h16l-6 7v5l-4 2v-7z" />
                  </svg>
                  Filters
                  <span className="caret">▾</span>
                </button>
                {filterOpen ? (
                  <div
                    className="builder-popover audit-filter-popover"
                    role="menu"
                    aria-label="Audit filters"
                  >
                    <div className="popover-title">Categories</div>
                    <div className="audit-filter-grid">
                      {CATEGORY_FILTERS.map((category) => (
                        <label key={category} className="audit-filter-check">
                          <input
                            type="checkbox"
                            checked={categoryFilter.has(category)}
                            onChange={() =>
                              setCategoryFilter((prev) => {
                                const next = new Set(prev);
                                if (next.has(category)) {
                                  next.delete(category);
                                } else {
                                  next.add(category);
                                }
                                return next;
                              })
                            }
                          />
                          <span>{category}</span>
                        </label>
                      ))}
                    </div>
                    <div className="popover-title">Targets</div>
                    <div className="audit-filter-grid">
                      {(["section", "primitive"] as const).map((target) => (
                        <label key={target} className="audit-filter-check">
                          <input
                            type="checkbox"
                            checked={targetFilter.has(target)}
                            onChange={() =>
                              setTargetFilter((prev) => {
                                const next = new Set(prev);
                                if (next.has(target)) {
                                  next.delete(target);
                                } else {
                                  next.add(target);
                                }
                                return next;
                              })
                            }
                          />
                          <span>{target === "section" ? "Section" : "Primitive"}</span>
                        </label>
                      ))}
                      <label className="audit-filter-check">
                        <input
                          type="checkbox"
                          checked={includeHover}
                          onChange={(event) => setIncludeHover(event.target.checked)}
                        />
                        <span>Hover state</span>
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <button className="style-mode-action" type="button" onClick={clearFilters}>
              Clear filters
            </button>
            <button className="style-mode-action" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        <div className="audit-columns">
          {VIEWPORT_MENU_ORDER.map((viewport) => {
            const rowsForViewport = filteredRows.filter((row) => row.viewport === viewport);
            return (
              <section key={viewport} className="audit-column">
                <header className="audit-column-header">
                  <h4>{VIEWPORT_SCOPE_LABELS[viewport]}</h4>
                  <small>{viewportMeta[viewport]}</small>
                  <span>{rowsForViewport.length} edits</span>
                </header>
                <div className="audit-column-body">
                  {rowsForViewport.length === 0 ? (
                    <div className="drawer-panel">No matching edits.</div>
                  ) : (
                    (groupedRowsByViewport.get(viewport) ?? []).map((group) => {
                      const collapseKey = `${viewport}:${group.key}`;
                      const isCollapsed = collapsedGroups[collapseKey] ?? false;
                      return (
                        <section key={group.key} className="audit-target-group">
                          <button
                            type="button"
                            className="drawer-accordion-toggle audit-target-toggle"
                            aria-expanded={!isCollapsed}
                            onClick={() =>
                              setCollapsedGroups((prev) => ({
                                ...prev,
                                [collapseKey]: !isCollapsed,
                              }))
                            }
                          >
                            <h4>{group.label}</h4>
                            <span>{isCollapsed ? "+" : "−"}</span>
                          </button>
                          <div className={`audit-target-rows${isCollapsed ? " collapsed" : ""}`}>
                            {group.rows.map((row) => {
                              const unavailable =
                                row.targetType === "primitive" &&
                                row.primitiveType !== null &&
                                PRIMITIVE_EXCLUDED_STYLE_KEYS[row.primitiveType]?.includes(
                                  row.fieldKey as PrimitiveStyleKey
                                );
                              return (
                                <button
                                  key={row.id}
                                  type="button"
                                  className={`audit-row${unavailable ? " unavailable" : ""}`}
                                  onClick={() => {
                                    if (unavailable) {
                                      return;
                                    }
                                    requestStyleJump({
                                      blockId: row.blockId,
                                      primitivePath: row.primitivePath,
                                      viewport: row.viewport,
                                      state: row.state,
                                      fieldKey: row.fieldKey,
                                      category: row.category,
                                    });
                                  }}
                                  disabled={unavailable}
                                  aria-disabled={unavailable}
                                  title={
                                    unavailable
                                      ? "Field not available for this primitive type in Style tab."
                                      : "Jump to style field"
                                  }
                                >
                                  <div className="audit-row-head">
                                    <span>{formatFieldLabel(row.fieldKey)}</span>
                                    <small>{row.state === "hover" ? "Hover" : "Default"}</small>
                                  </div>
                                  <div className="audit-row-meta">
                                    <span>{row.category}</span>
                                    {unavailable ? <small>Unavailable</small> : null}
                                  </div>
                                  <code>{row.value}</code>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}

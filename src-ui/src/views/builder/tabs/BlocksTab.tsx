import { useEffect, useMemo, useRef, useState } from "react";

import { groupedBlockCatalog } from "../../../features/builder/catalog";
import { useBuilderStore } from "../../../features/builder/builder-store";
import {
  FOCUS_BLOCKS_TAB_EVENT,
  type FocusBlocksTabRequest,
} from "../../../features/builder/events";
import {
  BUILDER_POINTER_DRAG_END_EVENT,
  BUILDER_POINTER_DRAG_MOVE_EVENT,
  beginPointerCatalogDrag,
  type BuilderPointerDragDetail,
} from "../../../features/builder/dnd";
import { useDrawerTabScrollPersistence } from "../../../state/useDrawerTabScrollPersistence";

const BLOCKS_TAB_GROUPS_KEY = "manifold.builder.blocks-tab.open-groups";

function readBlocksTabGroupState(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(BLOCKS_TAB_GROUPS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function BlocksTab() {
  const builder = useBuilderStore();
  const scrollRootRef = useDrawerTabScrollPersistence("manifold.builder.drawer-scroll.blocks");
  const [query, setQuery] = useState("");
  const [draggingBlockType, setDraggingBlockType] = useState<string | null>(null);
  const [guidedBlockType, setGuidedBlockType] = useState<string | null>(null);
  const blockCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const groups = groupedBlockCatalog();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    readBlocksTabGroupState()
  );

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return groups;
    }
    return groups
      .map((group) => ({
        category: group.category,
        blocks: group.blocks.filter((block) => {
          const haystack = `${block.label} ${block.description} ${block.category}`.toLowerCase();
          return haystack.includes(needle);
        }),
      }))
      .filter((group) => group.blocks.length > 0);
  }, [groups, query]);

  useEffect(() => {
    const onPointerDragMove = (event: Event) => {
      const detail = (event as CustomEvent<BuilderPointerDragDetail>).detail;
      if (!detail) {
        return;
      }
      if (detail.payload.kind === "catalog") {
        setDraggingBlockType(detail.payload.blockType);
      } else {
        setDraggingBlockType(null);
      }
    };
    const onPointerDragEnd = () => {
      setDraggingBlockType(null);
    };
    window.addEventListener(BUILDER_POINTER_DRAG_MOVE_EVENT, onPointerDragMove);
    window.addEventListener(BUILDER_POINTER_DRAG_END_EVENT, onPointerDragEnd);
    return () => {
      window.removeEventListener(BUILDER_POINTER_DRAG_MOVE_EVENT, onPointerDragMove);
      window.removeEventListener(BUILDER_POINTER_DRAG_END_EVENT, onPointerDragEnd);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(BLOCKS_TAB_GROUPS_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  useEffect(() => {
    if (!guidedBlockType) {
      return;
    }
    const card = blockCardRefs.current[guidedBlockType];
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [guidedBlockType]);

  useEffect(() => {
    let timeoutId: number | null = null;
    const onFocusBlocksTab = (event: Event) => {
      const detail = (event as CustomEvent<FocusBlocksTabRequest>).detail;
      const blockType = detail?.blockType ?? "hero";
      setQuery("");
      const containingGroup = groups.find((group) =>
        group.blocks.some((block) => block.id === blockType)
      );
      if (containingGroup) {
        setOpenGroups((prev) => ({ ...prev, [containingGroup.category]: true }));
      }
      setGuidedBlockType(blockType);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        setGuidedBlockType((prev) => (prev === blockType ? null : prev));
      }, 3200);
    };
    window.addEventListener(FOCUS_BLOCKS_TAB_EVENT, onFocusBlocksTab);
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener(FOCUS_BLOCKS_TAB_EVENT, onFocusBlocksTab);
    };
  }, [groups]);

  return (
    <div ref={scrollRootRef} className="drawer-stack block-tab-root">
      <section className="inspector-card-item style-tab-topbar block-tab-topbar">
        <label className="inspector-field compact block-catalog-search">
          <span className="style-tab-topbar-label">Find block</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search blocks..."
            aria-label="Search blocks"
          />
        </label>
      </section>

      <div className="block-catalog-groups style-group-list drawer-accordion-list">
        {filteredGroups.length === 0 ? (
          <div className="drawer-panel">No blocks match this search.</div>
        ) : (
          filteredGroups.map((group) => {
            const isOpen = openGroups[group.category] ?? false;
            return (
              <section
                key={group.category}
                className="block-catalog-group style-group-card drawer-accordion-section"
              >
                <button
                  className="block-catalog-group-toggle drawer-accordion-toggle"
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.category]: !isOpen }))}
                  aria-expanded={isOpen}
                >
                  <span>{group.category}</span>
                  <span>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen ? (
                  <div className="block-catalog-grid drawer-accordion-content">
                    {group.blocks.map((block) => (
                      <div
                        key={block.id}
                        ref={(node) => {
                          blockCardRefs.current[block.id] = node;
                        }}
                        className={`block-catalog-card${draggingBlockType === block.id ? " dragging" : ""}${
                          guidedBlockType === block.id ? " guided" : ""
                        }`}
                        role="button"
                        tabIndex={0}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          builder.selectPrimitivePath(null);
                          builder.selectBlock(null);
                          if (guidedBlockType === block.id) {
                            setGuidedBlockType(null);
                          }
                          beginPointerCatalogDrag(block.id, {
                            clientX: event.clientX,
                            clientY: event.clientY,
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                          }
                        }}
                        title={`Drag ${block.label} into the preview`}
                      >
                        <span className="block-thumb" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                        <span className="block-card-title">{block.label}</span>
                        <span className="block-card-description">{block.description}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}

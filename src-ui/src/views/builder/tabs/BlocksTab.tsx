import { useMemo, useState } from "react";

import { groupedBlockCatalog } from "../../../features/builder/catalog";
import { beginPointerCatalogDrag } from "../../../features/builder/dnd";

export function BlocksTab() {
  const [query, setQuery] = useState("");
  const groups = groupedBlockCatalog();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Hero: true,
    Features: true,
    Conversion: true,
    Content: true,
  });

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

  return (
    <div className="drawer-stack">
      <div className="drawer-inline-controls block-catalog-search">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search blocks..."
          aria-label="Search blocks"
        />
      </div>

      <div className="block-catalog-groups">
        {filteredGroups.length === 0 ? (
          <div className="drawer-panel">No blocks match this search.</div>
        ) : (
          filteredGroups.map((group) => {
            const isOpen = openGroups[group.category] ?? true;
            return (
              <section key={group.category} className="block-catalog-group">
                <button
                  className="block-catalog-group-toggle"
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.category]: !isOpen }))}
                  aria-expanded={isOpen}
                >
                  <span>{group.category}</span>
                  <span>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen ? (
                  <div className="block-catalog-grid">
                    {group.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="block-catalog-card"
                        role="button"
                        tabIndex={0}
                        onPointerDown={(event) => {
                          event.preventDefault();
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

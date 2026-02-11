import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  BUILDER_POINTER_DRAG_DROP_EVENT,
  BUILDER_POINTER_DRAG_END_EVENT,
  BUILDER_POINTER_DRAG_MOVE_EVENT,
  type BuilderPointerDragDetail,
  beginPointerCanvasDrag,
  clearBuilderDragPayload,
  readBuilderDragPayload,
} from "../../features/builder/dnd";
import { useBuilderStore } from "../../features/builder/builder-store";
import { useActiveProjectSession } from "../../features/project-launcher/session";
import { PreviewBlock } from "./components/PreviewBlock";

type IconButtonProps = {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  disabled?: boolean;
  tone?: "default" | "danger";
  active?: boolean;
};

function IconButton(props: IconButtonProps) {
  return (
    <button
      className={`builder-icon-btn${props.tone === "danger" ? " danger" : ""}${props.active ? " active" : ""}`}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props.label}
    >
      {props.icon}
      <span className="icon-tooltip">{props.label}</span>
    </button>
  );
}

function previewModeIcon(mode: "mobile" | "tablet" | "desktop") {
  if (mode === "mobile") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="8" y="3.5" width="8" height="17" rx="2.2" />
        <path d="M11 17h2" />
      </svg>
    );
  }
  if (mode === "tablet") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="6" y="3.5" width="12" height="17" rx="2.4" />
        <path d="M11 17.5h2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="11" rx="2" />
      <path d="M9 19h6M12 16.5V19" />
    </svg>
  );
}

export function BuilderView() {
  const builder = useBuilderStore();
  const projectSession = useActiveProjectSession();
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [hoveredPrimitivePath, setHoveredPrimitivePath] = useState<string | null>(null);
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [activePopover, setActivePopover] = useState<"page" | "device" | "route" | null>(null);
  const [routeDraft, setRouteDraft] = useState(builder.selectedPage.route);
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageError, setNewPageError] = useState<string | null>(null);
  const previewPageRef = useRef<HTMLDivElement | null>(null);
  const pagePopoverRef = useRef<HTMLDivElement | null>(null);
  const devicePopoverRef = useRef<HTMLDivElement | null>(null);
  const routePopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onWindowPointerDown = (event: MouseEvent) => {
      if (!activePopover) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        pagePopoverRef.current?.contains(target) ||
        devicePopoverRef.current?.contains(target) ||
        routePopoverRef.current?.contains(target)
      ) {
        return;
      }
      setActivePopover(null);
    };

    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePopover(null);
        setNewPageModalOpen(false);
      }
    };

    window.addEventListener("mousedown", onWindowPointerDown);
    window.addEventListener("keydown", onWindowKeyDown);
    return () => {
      window.removeEventListener("mousedown", onWindowPointerDown);
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, [activePopover]);

  const applyRouteDraft = () => {
    const trimmed = routeDraft.trim();
    builder.renameRoute(trimmed.length > 0 ? trimmed : "/");
    setActivePopover(null);
  };

  const onRouteInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      applyRouteDraft();
    }
  };

  const normalizeSlug = (input: string): string => {
    const cleaned = input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_/ ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/\/+/g, "/")
      .replace(/-+/g, "-");
    const withoutPrefix = cleaned.replace(/^\/+/, "");
    const withPrefix = `/${withoutPrefix}`;
    return withPrefix.length === 1 ? "/new-page" : withPrefix;
  };

  const createNewPageFromModal = () => {
    const title = newPageTitle.trim();
    const slug = normalizeSlug(newPageSlug);
    if (!title) {
      setNewPageError("Page title is required.");
      return;
    }
    if (builder.state.pages.some((page) => page.route === slug)) {
      setNewPageError(`Slug ${slug} is already used.`);
      return;
    }
    builder.createPage(slug, title);
    setNewPageModalOpen(false);
    setNewPageTitle("");
    setNewPageSlug("");
    setNewPageError(null);
  };

  const browserAddress = (() => {
    const base = projectSession?.project.siteUrl?.trim() ?? "https://example.com";
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const route = builder.selectedPage.route.startsWith("/")
      ? builder.selectedPage.route
      : `/${builder.selectedPage.route}`;
    if (route === "/") {
      return normalizedBase;
    }
    return `${normalizedBase}${route}`;
  })();

  const resolveDropIndex = (event: DragEvent<HTMLDivElement>): number => {
    const shells = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(".canvas-block-shell")
    );
    if (shells.length === 0) {
      return 0;
    }
    const pointerY = event.clientY;
    for (let index = 0; index < shells.length; index += 1) {
      const rect = shells[index].getBoundingClientRect();
      if (pointerY < rect.top + rect.height / 2) {
        return index;
      }
    }
    return shells.length;
  };

  const resolveDropIndexFromContainer = (container: HTMLElement, pointerY: number): number => {
    const shells = Array.from(container.querySelectorAll<HTMLElement>(".canvas-block-shell"));
    if (shells.length === 0) {
      return 0;
    }
    for (let index = 0; index < shells.length; index += 1) {
      const rect = shells[index].getBoundingClientRect();
      if (pointerY < rect.top + rect.height / 2) {
        return index;
      }
    }
    return shells.length;
  };

  const applyDrop = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    const payload = readBuilderDragPayload(event.dataTransfer);
    if (!payload) {
      setDropIndex(null);
      clearBuilderDragPayload();
      return;
    }
    if (payload.kind === "catalog") {
      builder.insertBlock(payload.blockType, index);
    } else {
      builder.moveBlockToIndex(payload.blockId, index);
    }
    setDropIndex(null);
    clearBuilderDragPayload();
  };

  useEffect(() => {
    const onWindowDragOver = (event: globalThis.DragEvent) => {
      const payload = readBuilderDragPayload(event.dataTransfer);
      if (!payload) {
        return;
      }
      const container = previewPageRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!isInside) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const nextIndex = resolveDropIndexFromContainer(container, event.clientY);
      setDropIndex(nextIndex);
    };

    const onWindowDrop = (event: globalThis.DragEvent) => {
      const payload = readBuilderDragPayload(event.dataTransfer);
      if (!payload) {
        return;
      }
      const container = previewPageRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!isInside) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const nextIndex = resolveDropIndexFromContainer(container, event.clientY);
      if (payload.kind === "catalog") {
        builder.insertBlock(payload.blockType, nextIndex);
      } else {
        builder.moveBlockToIndex(payload.blockId, nextIndex);
      }
      setDropIndex(null);
      clearBuilderDragPayload();
    };

    const onPointerDragMove = (event: Event) => {
      const detail = (event as CustomEvent<BuilderPointerDragDetail>).detail;
      if (!detail) {
        return;
      }
      const container = previewPageRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const isInside =
        detail.clientX >= rect.left &&
        detail.clientX <= rect.right &&
        detail.clientY >= rect.top &&
        detail.clientY <= rect.bottom;
      if (!isInside) {
        setDropIndex(null);
        return;
      }
      const nextIndex = resolveDropIndexFromContainer(container, detail.clientY);
      setDropIndex(nextIndex);
    };

    const onPointerDragDrop = (event: Event) => {
      const detail = (event as CustomEvent<BuilderPointerDragDetail>).detail;
      if (!detail) {
        return;
      }
      const container = previewPageRef.current;
      if (!container) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const isInside =
        detail.clientX >= rect.left &&
        detail.clientX <= rect.right &&
        detail.clientY >= rect.top &&
        detail.clientY <= rect.bottom;
      if (!isInside) {
        setDropIndex(null);
        return;
      }
      const nextIndex = resolveDropIndexFromContainer(container, detail.clientY);
      if (detail.payload.kind === "catalog") {
        builder.insertBlock(detail.payload.blockType, nextIndex);
      } else {
        builder.moveBlockToIndex(detail.payload.blockId, nextIndex);
      }
      setDropIndex(null);
    };

    const onWindowDragEnd = () => {
      setDropIndex(null);
      clearBuilderDragPayload();
    };

    window.addEventListener("dragover", onWindowDragOver, true);
    window.addEventListener("drop", onWindowDrop, true);
    window.addEventListener("dragend", onWindowDragEnd, true);
    window.addEventListener(BUILDER_POINTER_DRAG_MOVE_EVENT, onPointerDragMove);
    window.addEventListener(BUILDER_POINTER_DRAG_DROP_EVENT, onPointerDragDrop);
    window.addEventListener(BUILDER_POINTER_DRAG_END_EVENT, onWindowDragEnd);
    return () => {
      window.removeEventListener("dragover", onWindowDragOver, true);
      window.removeEventListener("drop", onWindowDrop, true);
      window.removeEventListener("dragend", onWindowDragEnd, true);
      window.removeEventListener(BUILDER_POINTER_DRAG_MOVE_EVENT, onPointerDragMove);
      window.removeEventListener(BUILDER_POINTER_DRAG_DROP_EVENT, onPointerDragDrop);
      window.removeEventListener(BUILDER_POINTER_DRAG_END_EVENT, onWindowDragEnd);
    };
  }, [builder]);

  const handlePreviewDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setDropIndex(resolveDropIndex(event));
  };

  const handlePreviewDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const resolvedIndex = resolveDropIndex(event);
    applyDrop(event, resolvedIndex);
  };

  return (
    <section className="view-shell builder-view">
      <header className="builder-top-rail" role="toolbar" aria-label="Builder controls">
        <div className="builder-rail-group">
          <div className="builder-popover-anchor" ref={pagePopoverRef}>
            <IconButton
              label="Select Page"
              active={activePopover === "page"}
              onClick={() => setActivePopover((prev) => (prev === "page" ? null : "page"))}
              icon={
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 5h16v14H4zM8 9h8M8 13h6" />
                </svg>
              }
            />
            {activePopover === "page" ? (
              <div className="builder-popover align-start">
                <div className="popover-title">Pages</div>
                <div className="popover-option-list">
                  {builder.state.pages.map((page) => (
                    <button
                      key={page.id}
                      className={`popover-option${page.id === builder.state.selectedPageId ? " active" : ""}`}
                      onClick={() => {
                        builder.setSelectedPageId(page.id);
                        setActivePopover(null);
                      }}
                    >
                      <span>{page.title}</span>
                      <small>{page.route}</small>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="builder-popover-anchor" ref={devicePopoverRef}>
            <IconButton
              label="Preview Mode"
              active={activePopover === "device"}
              onClick={() => setActivePopover((prev) => (prev === "device" ? null : "device"))}
              icon={previewModeIcon(device)}
            />
            {activePopover === "device" ? (
              <div className="builder-popover align-start">
                <div className="popover-title">Preview mode</div>
                <div className="popover-option-list">
                  {(["mobile", "tablet", "desktop"] as const).map((mode) => (
                    <button
                      key={mode}
                      className={`popover-option single-line${mode === device ? " active" : ""}`}
                      onClick={() => {
                        setDevice(mode);
                        setActivePopover(null);
                      }}
                    >
                      <span className="capitalize">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="builder-rail-group compact">
          <div className="builder-popover-anchor" ref={routePopoverRef}>
            <IconButton
              label="Edit Route"
              active={activePopover === "route"}
              onClick={() => {
                setRouteDraft(builder.selectedPage.route);
                setActivePopover((prev) => (prev === "route" ? null : "route"));
              }}
              icon={
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 12h7l2-3 2 6 2-3h5" />
                </svg>
              }
            />
            {activePopover === "route" ? (
              <div className="builder-popover route-popover">
                <label className="popover-field">
                  <span>Route</span>
                  <input
                    value={routeDraft}
                    onChange={(event) => setRouteDraft(event.target.value)}
                    onKeyDown={onRouteInputKeyDown}
                    autoFocus
                    placeholder="/route"
                  />
                </label>
                <div className="popover-actions">
                  <button className="secondary-btn" onClick={() => setActivePopover(null)}>
                    Cancel
                  </button>
                  <button className="primary-btn" onClick={applyRouteDraft}>
                    Apply
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <IconButton
            label="New Page"
            onClick={() => {
              setNewPageTitle("");
              setNewPageSlug("");
              setNewPageError(null);
              setNewPageModalOpen(true);
            }}
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          />
          <IconButton
            label="Duplicate Page"
            onClick={() => builder.duplicatePage()}
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="9" y="9" width="10" height="10" rx="2" />
                <rect x="5" y="5" width="10" height="10" rx="2" />
              </svg>
            }
          />
          <IconButton
            label="Delete Page"
            tone="danger"
            onClick={() => builder.deletePage()}
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" />
              </svg>
            }
          />
          <IconButton
            label="Undo"
            onClick={() => builder.undo()}
            disabled={!builder.canUndo}
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 7H4v5M4 12a8 8 0 1 0 2.4-5.7L4 7" />
              </svg>
            }
          />
          <IconButton
            label="Redo"
            onClick={() => builder.redo()}
            disabled={!builder.canRedo}
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 7h5v5M20 12a8 8 0 1 1-2.4-5.7L20 7" />
              </svg>
            }
          />
          <IconButton
            label="Save"
            onClick={() => builder.markSaved()}
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 5h12l2 2v12H5zM8 5v6h8V5M9 19h6" />
              </svg>
            }
          />
          <span className={`status-pill${builder.state.dirty ? " warning" : ""}`}>
            {builder.state.dirty ? "Unsaved changes" : "Saved"}
          </span>
        </div>
      </header>

      <div className="builder-canvas">
        <div className="canvas-stack">
          <div className={`site-preview-viewport device-${device}`}>
            <div className="site-preview-browser">
              <div className="browser-chrome">
                <div className="browser-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="browser-address">{browserAddress}</div>
              </div>

              <div
                ref={previewPageRef}
                className="site-preview-page"
                onDragOver={handlePreviewDragOver}
                onDragOverCapture={handlePreviewDragOver}
                onDragLeave={(event) => {
                  const nextTarget = event.relatedTarget;
                  if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
                    return;
                  }
                  setDropIndex(null);
                }}
                onDropCapture={handlePreviewDrop}
              >
                {builder.selectedPage.blocks.map((block, index) => (
                  <div key={block.id} className="canvas-block-shell">
                    <div
                      className={`canvas-insert-indicator${dropIndex === index ? " active" : ""}`}
                    />

                    <div
                      className={`site-block-shell${builder.state.selectedBlockId === block.id ? " selected" : ""}${hoveredBlockId === block.id ? " hovered" : ""}${block.visibility === "hidden" ? " hidden" : ""}`}
                      onMouseEnter={() => setHoveredBlockId(block.id)}
                      onMouseLeave={() => {
                        setHoveredBlockId((prev) => (prev === block.id ? null : prev));
                        setHoveredPrimitivePath(null);
                      }}
                      onClick={() => {
                        builder.selectBlock(block.id);
                        builder.selectPrimitivePath(null);
                      }}
                    >
                      {builder.state.selectedBlockId === block.id ? (
                        <button
                          className="site-block-drag-handle"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            beginPointerCanvasDrag(block.id, {
                              clientX: event.clientX,
                              clientY: event.clientY,
                            });
                          }}
                          aria-label="Reorder section"
                          title="Drag to reorder section"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M8 6h8M8 12h8M8 18h8" />
                          </svg>
                        </button>
                      ) : null}
                      <div className="site-block-render">
                        <PreviewBlock
                          block={block}
                          editable={builder.state.selectedBlockId === block.id}
                          onInlineCommit={(fieldKey, value) =>
                            builder.setBlockFieldForBlock(block.id, fieldKey, value)
                          }
                          selectedPrimitivePath={
                            builder.state.selectedBlockId === block.id
                              ? builder.state.selectedPrimitivePath
                              : null
                          }
                          hoveredPrimitivePath={
                            hoveredBlockId === block.id ? hoveredPrimitivePath : null
                          }
                          onHoverPrimitive={(path) => setHoveredPrimitivePath(path)}
                          onSelectPrimitive={(path) => {
                            builder.selectBlock(block.id);
                            builder.selectPrimitivePath(path);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div
                  className={`canvas-insert-indicator final${dropIndex === builder.selectedPage.blocks.length ? " active" : ""}`}
                />

                {builder.selectedPage.blocks.length === 0 ? (
                  <div
                    className={`site-preview-empty${dropIndex === builder.selectedPage.blocks.length ? " active" : ""}`}
                    onDragOver={handlePreviewDragOver}
                    onDrop={handlePreviewDrop}
                  >
                    Drag a block from the right drawer to start building this page.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {newPageModalOpen ? (
        <div className="modal-scrim" role="presentation">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-page-title"
          >
            <h2 id="new-page-title">Create New Page</h2>
            <label className="popover-field">
              <span>Page title</span>
              <input
                value={newPageTitle}
                onChange={(event) => {
                  const nextTitle = event.target.value;
                  setNewPageTitle(nextTitle);
                  if (!newPageSlug.trim()) {
                    setNewPageSlug(nextTitle.toLowerCase().replace(/\s+/g, "-"));
                  }
                }}
                autoFocus
                placeholder="About"
              />
            </label>
            <label className="popover-field">
              <span>Slug</span>
              <div className="slug-input-wrap">
                <span className="slug-prefix">/</span>
                <input
                  value={newPageSlug.replace(/^\/+/, "")}
                  onChange={(event) => setNewPageSlug(event.target.value.replace(/^\/+/, ""))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      createNewPageFromModal();
                    }
                  }}
                  placeholder="about"
                />
              </div>
            </label>
            {newPageError ? <p className="modal-error">{newPageError}</p> : null}
            <div className="popover-actions">
              <button className="secondary-btn" onClick={() => setNewPageModalOpen(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={createNewPageFromModal}>
                Create Page
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
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
import { blockDefinitionById } from "../../features/builder/catalog";
import { useBuilderStore } from "../../features/builder/builder-store";
import {
  decodePrimitiveTarget,
  encodePrimitiveTarget,
} from "../../features/builder/primitive-target";
import {
  editScopeFromViewport,
  getSectionStyleValue,
  type BuilderViewport,
} from "../../features/builder/style-scopes";
import {
  buildViewportMenuMetaLabels,
  VIEWPORT_MENU_ORDER,
  VIEWPORT_SCOPE_LABELS,
} from "../../features/builder/viewport-menu";
import { useActiveProjectSession } from "../../features/project-launcher/session";
import { useProjectSettings } from "../../features/project-settings/useProjectSettings";
import { useBuilderInteractionModeStore } from "../../state/useBuilderInteractionModeStore";
import { useBuilderStylePreviewStateStore } from "../../state/useBuilderStylePreviewStateStore";
import { useBuilderViewportStore } from "../../state/useBuilderViewportStore";
import { PreviewBlock } from "./components/PreviewBlock";

type IconButtonProps = {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  disabled?: boolean;
  tone?: "default" | "danger";
  active?: boolean;
  className?: string;
};

function IconButton(props: IconButtonProps) {
  return (
    <button
      className={`builder-icon-btn${props.tone === "danger" ? " danger" : ""}${props.active ? " active" : ""}${props.className ? ` ${props.className}` : ""}`}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props.label}
    >
      {props.icon}
      <span className="icon-tooltip">{props.label}</span>
    </button>
  );
}

function previewModeIcon(mode: BuilderViewport) {
  if (mode === "default") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="11" rx="2" />
        <path d="M9 19h6M12 16.5V19" />
        <path d="M17.5 8.5h2M18.5 7.5v2" />
      </svg>
    );
  }
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
  if (mode === "wide") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.5" y="5.5" width="19" height="11" rx="2" />
        <path d="M8 19h8M12 16.5V19" />
        <path d="M18.5 8.5h2M19.5 7.5v2" />
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

function viewportToneClass(mode: BuilderViewport) {
  return `viewport-tone-${mode}`;
}

type SectionStyleKey =
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft";

type SectionSpacingHandle = {
  id: string;
  key: SectionStyleKey;
  label: string;
  kind: "margin" | "padding";
  side: "top" | "right" | "bottom" | "left";
  axis: "x" | "y";
  deltaSign: 1 | -1;
};

const SECTION_SPACING_HANDLES: SectionSpacingHandle[] = [
  {
    id: "section-margin-top",
    key: "marginTop",
    label: "Section margin top",
    kind: "margin",
    side: "top",
    axis: "y",
    deltaSign: 1,
  },
  {
    id: "section-margin-right",
    key: "marginRight",
    label: "Section margin right",
    kind: "margin",
    side: "right",
    axis: "x",
    deltaSign: -1,
  },
  {
    id: "section-margin-bottom",
    key: "marginBottom",
    label: "Section margin bottom",
    kind: "margin",
    side: "bottom",
    axis: "y",
    deltaSign: 1,
  },
  {
    id: "section-margin-left",
    key: "marginLeft",
    label: "Section margin left",
    kind: "margin",
    side: "left",
    axis: "x",
    deltaSign: 1,
  },
  {
    id: "section-padding-top",
    key: "paddingTop",
    label: "Section padding top",
    kind: "padding",
    side: "top",
    axis: "y",
    deltaSign: 1,
  },
  {
    id: "section-padding-right",
    key: "paddingRight",
    label: "Section padding right",
    kind: "padding",
    side: "right",
    axis: "x",
    deltaSign: -1,
  },
  {
    id: "section-padding-bottom",
    key: "paddingBottom",
    label: "Section padding bottom",
    kind: "padding",
    side: "bottom",
    axis: "y",
    deltaSign: 1,
  },
  {
    id: "section-padding-left",
    key: "paddingLeft",
    label: "Section padding left",
    kind: "padding",
    side: "left",
    axis: "x",
    deltaSign: 1,
  },
];

function parsePxValue(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampNonNegativePx(value: number): number {
  return Math.max(0, Math.round(value));
}

function roundPx(value: number): number {
  return Math.round(value);
}

function normalizeSectionSpacingByKey(key: SectionStyleKey, value: number): number {
  if (
    key === "marginTop" ||
    key === "marginRight" ||
    key === "marginBottom" ||
    key === "marginLeft"
  ) {
    return roundPx(value);
  }
  if (
    key === "paddingTop" ||
    key === "paddingRight" ||
    key === "paddingBottom" ||
    key === "paddingLeft"
  ) {
    return clampNonNegativePx(value);
  }
  return roundPx(value);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

type BuilderBlock = ReturnType<typeof useBuilderStore>["selectedPage"]["blocks"][number];

function sectionSpacingFromOverrides(block: BuilderBlock, scope: BuilderViewport) {
  return {
    marginTop: parsePxValue(getSectionStyleValue(block.styleOverrides, "marginTop", scope)),
    marginRight: parsePxValue(getSectionStyleValue(block.styleOverrides, "marginRight", scope)),
    marginBottom: parsePxValue(getSectionStyleValue(block.styleOverrides, "marginBottom", scope)),
    marginLeft: parsePxValue(getSectionStyleValue(block.styleOverrides, "marginLeft", scope)),
    paddingTop: parsePxValue(getSectionStyleValue(block.styleOverrides, "paddingTop", scope)),
    paddingRight: parsePxValue(getSectionStyleValue(block.styleOverrides, "paddingRight", scope)),
    paddingBottom: parsePxValue(getSectionStyleValue(block.styleOverrides, "paddingBottom", scope)),
    paddingLeft: parsePxValue(getSectionStyleValue(block.styleOverrides, "paddingLeft", scope)),
  };
}

export function BuilderView() {
  const builder = useBuilderStore();
  const projectSession = useActiveProjectSession();
  const projectSettings = useProjectSettings(projectSession?.project.path);
  const viewport = useBuilderViewportStore();
  const interaction = useBuilderInteractionModeStore();
  const stylePreviewState = useBuilderStylePreviewStateStore();
  const interactionMode = interaction.mode;
  const [previewRunId, setPreviewRunId] = useState(0);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [hoveredPrimitivePath, setHoveredPrimitivePath] = useState<string | null>(null);
  const [previewHoverBlockId, setPreviewHoverBlockId] = useState<string | null>(null);
  const [previewHoverPrimitiveTarget, setPreviewHoverPrimitiveTarget] = useState<string | null>(
    null
  );
  const device = viewport.viewport;
  const [activePopover, setActivePopover] = useState<"page" | "device" | "route" | null>(null);
  const [routeDraft, setRouteDraft] = useState(builder.selectedPage.route);
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageError, setNewPageError] = useState<string | null>(null);
  const previewPageRef = useRef<HTMLDivElement | null>(null);
  const [previewBreakpoint, setPreviewBreakpoint] = useState<BuilderViewport>("default");
  const pagePopoverRef = useRef<HTMLDivElement | null>(null);
  const devicePopoverRef = useRef<HTMLDivElement | null>(null);
  const routePopoverRef = useRef<HTMLDivElement | null>(null);
  const endStyleDragSessionRef = useRef(builder.endStyleDragSession);
  const sectionSpacingDragRef = useRef<{
    handle: SectionSpacingHandle;
    startCoord: number;
    startValue: number;
    onPointerMove: (event: PointerEvent) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    onMouseMove: (event: MouseEvent) => void;
    onMouseUp: () => void;
  } | null>(null);
  const [activeSectionSpacingDrag, setActiveSectionSpacingDrag] = useState<{
    blockId: string;
    label: string;
    value: number;
  } | null>(null);
  const [activePointerDrag, setActivePointerDrag] = useState<BuilderPointerDragDetail | null>(null);

  useEffect(() => {
    endStyleDragSessionRef.current = builder.endStyleDragSession;
  }, [builder.endStyleDragSession]);

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
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }
      if (event.altKey) {
        return;
      }
      const hasCommandModifier = event.metaKey || event.ctrlKey;
      if (!hasCommandModifier) {
        return;
      }
      const key = event.key.toLowerCase();
      const isUndo = key === "z" && !event.shiftKey;
      const isRedo = (key === "z" && event.shiftKey) || key === "y";
      if (!isUndo && !isRedo) {
        return;
      }
      event.preventDefault();
      if (isUndo) {
        builder.undo();
      } else {
        builder.redo();
      }
    };

    window.addEventListener("mousedown", onWindowPointerDown);
    window.addEventListener("keydown", onWindowKeyDown);
    return () => {
      window.removeEventListener("mousedown", onWindowPointerDown);
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, [activePopover, builder]);

  useEffect(() => {
    return () => {
      if (!sectionSpacingDragRef.current) {
        return;
      }
      document.removeEventListener(
        "pointermove",
        sectionSpacingDragRef.current.onPointerMove,
        true
      );
      document.removeEventListener("pointerup", sectionSpacingDragRef.current.onPointerUp, true);
      document.removeEventListener(
        "pointercancel",
        sectionSpacingDragRef.current.onPointerCancel,
        true
      );
      document.removeEventListener("mousemove", sectionSpacingDragRef.current.onMouseMove, true);
      document.removeEventListener("mouseup", sectionSpacingDragRef.current.onMouseUp, true);
      sectionSpacingDragRef.current = null;
      endStyleDragSessionRef.current();
    };
  }, []);

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

  const previewDeviceWidthCap =
    device === "default"
      ? null
      : device === "mobile"
        ? projectSettings.settings.preview.mobileWidth
        : device === "tablet"
          ? projectSettings.settings.preview.tabletWidth
          : device === "desktop"
            ? projectSettings.settings.preview.desktopWidth
            : projectSettings.settings.preview.wideWidth;
  const editScope = editScopeFromViewport(device);
  const viewportMetaLabels = buildViewportMenuMetaLabels(projectSettings.settings.breakpoints);
  const mobileMaxBreakpoint = projectSettings.settings.breakpoints.mobileMax;
  const tabletMaxBreakpoint = projectSettings.settings.breakpoints.tabletMax;
  const desktopMaxBreakpoint = projectSettings.settings.breakpoints.desktopMax;
  const retinaMinBreakpoint = projectSettings.settings.breakpoints.retinaMin;

  useEffect(() => {
    const node = previewPageRef.current;
    if (!node) {
      return;
    }

    const updateBreakpoint = () => {
      const width = node.clientWidth;
      if (width <= mobileMaxBreakpoint) {
        setPreviewBreakpoint("mobile");
        return;
      }
      if (width <= tabletMaxBreakpoint) {
        setPreviewBreakpoint("tablet");
        return;
      }
      if (width <= desktopMaxBreakpoint) {
        setPreviewBreakpoint("desktop");
        return;
      }
      if (width >= retinaMinBreakpoint) {
        setPreviewBreakpoint("wide");
        return;
      }
      setPreviewBreakpoint("default");
    };

    const observer = new ResizeObserver(updateBreakpoint);
    observer.observe(node);
    updateBreakpoint();
    return () => observer.disconnect();
  }, [
    mobileMaxBreakpoint,
    tabletMaxBreakpoint,
    desktopMaxBreakpoint,
    retinaMinBreakpoint,
    device,
    previewDeviceWidthCap,
  ]);

  const draggedCatalogBlock =
    activePointerDrag?.payload.kind === "catalog"
      ? blockDefinitionById(activePointerDrag.payload.blockType)
      : undefined;
  const isCatalogDragActive = Boolean(draggedCatalogBlock);
  const isCatalogDragOverPreview = isCatalogDragActive && dropIndex !== null;

  const readSectionSpacing = (key: SectionStyleKey, shell: HTMLElement): number => {
    const section = shell.querySelector<HTMLElement>(".site-block");
    if (!section) {
      return 0;
    }
    const computed = window.getComputedStyle(section);
    if (key === "marginTop") {
      return parsePxValue(computed.marginTop);
    }
    if (key === "marginRight") {
      return parsePxValue(computed.marginRight);
    }
    if (key === "marginBottom") {
      return parsePxValue(computed.marginBottom);
    }
    if (key === "marginLeft") {
      return parsePxValue(computed.marginLeft);
    }
    if (key === "paddingTop") {
      return parsePxValue(computed.paddingTop);
    }
    if (key === "paddingRight") {
      return parsePxValue(computed.paddingRight);
    }
    if (key === "paddingBottom") {
      return parsePxValue(computed.paddingBottom);
    }
    return parsePxValue(computed.paddingLeft);
  };

  const startSectionSpacingDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    block: (typeof builder.selectedPage.blocks)[number],
    handle: SectionSpacingHandle
  ) => {
    const shell = event.currentTarget.closest(".site-block-shell");
    if (!(shell instanceof HTMLElement)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    builder.beginStyleDragSession();

    const startCoord = handle.axis === "y" ? event.clientY : event.clientX;
    const startValue = readSectionSpacing(handle.key, shell);
    setActiveSectionSpacingDrag({
      blockId: block.id,
      label: handle.label,
      value: startValue,
    });

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentCoord = handle.axis === "y" ? moveEvent.clientY : moveEvent.clientX;
      const delta = (currentCoord - startCoord) * handle.deltaSign;
      const nextValue = normalizeSectionSpacingByKey(handle.key, startValue + delta);
      builder.setBlockStyleForBlock(block.id, handle.key, `${nextValue}px`, editScope);
      setActiveSectionSpacingDrag({
        blockId: block.id,
        label: handle.label,
        value: nextValue,
      });
    };

    const cleanup = () => {
      if (!sectionSpacingDragRef.current) {
        return;
      }
      document.removeEventListener(
        "pointermove",
        sectionSpacingDragRef.current.onPointerMove,
        true
      );
      document.removeEventListener("pointerup", sectionSpacingDragRef.current.onPointerUp, true);
      document.removeEventListener(
        "pointercancel",
        sectionSpacingDragRef.current.onPointerCancel,
        true
      );
      document.removeEventListener("mousemove", sectionSpacingDragRef.current.onMouseMove, true);
      document.removeEventListener("mouseup", sectionSpacingDragRef.current.onMouseUp, true);
      sectionSpacingDragRef.current = null;
      setActiveSectionSpacingDrag(null);
      builder.endStyleDragSession();
    };
    const onPointerUp = cleanup;
    const onPointerCancel = cleanup;
    const onMouseMove = (moveEvent: MouseEvent) => {
      onPointerMove(moveEvent as unknown as PointerEvent);
    };
    const onMouseUp = cleanup;

    if (sectionSpacingDragRef.current) {
      document.removeEventListener(
        "pointermove",
        sectionSpacingDragRef.current.onPointerMove,
        true
      );
      document.removeEventListener("pointerup", sectionSpacingDragRef.current.onPointerUp, true);
      document.removeEventListener(
        "pointercancel",
        sectionSpacingDragRef.current.onPointerCancel,
        true
      );
      document.removeEventListener("mousemove", sectionSpacingDragRef.current.onMouseMove, true);
      document.removeEventListener("mouseup", sectionSpacingDragRef.current.onMouseUp, true);
      builder.endStyleDragSession();
    }

    sectionSpacingDragRef.current = {
      handle,
      startCoord,
      startValue,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onMouseMove,
      onMouseUp,
    };
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerCancel, true);
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
  };

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
      setActivePointerDrag(detail);
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
      setActivePointerDrag(detail);
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
      setActivePointerDrag(null);
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
    if (interactionMode !== "edit") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setDropIndex(resolveDropIndex(event));
  };

  const handlePreviewDrop = (event: DragEvent<HTMLDivElement>) => {
    if (interactionMode !== "edit") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const resolvedIndex = resolveDropIndex(event);
    applyDrop(event, resolvedIndex);
  };

  const replayPreviewLoad = () => {
    if (previewPageRef.current) {
      previewPageRef.current.scrollTop = 0;
      previewPageRef.current.scrollLeft = 0;
    }
    setPreviewRunId((prev) => prev + 1);
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
              label="Viewport size"
              active={activePopover === "device"}
              className={viewportToneClass(device)}
              onClick={() => setActivePopover((prev) => (prev === "device" ? null : "device"))}
              icon={previewModeIcon(device)}
            />
            {activePopover === "device" ? (
              <div className="builder-popover align-start">
                <div className="popover-title">Viewport size</div>
                <div className="popover-option-list">
                  {VIEWPORT_MENU_ORDER.map((mode) => (
                    <button
                      key={mode}
                      className={`popover-option viewport-option ${viewportToneClass(mode)}${
                        mode === device ? " active" : ""
                      }`}
                      onClick={() => {
                        viewport.setViewport(mode);
                        setActivePopover(null);
                      }}
                    >
                      <span>{VIEWPORT_SCOPE_LABELS[mode]}</span>
                      <small>{viewportMetaLabels[mode]}</small>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <IconButton
            label={
              interactionMode === "edit"
                ? "Edit mode (click to switch to Preview)"
                : "Preview mode (click to switch to Edit)"
            }
            active={interactionMode === "preview"}
            className={
              interactionMode === "edit"
                ? "builder-mode-toggle edit-mode"
                : "builder-mode-toggle preview-mode"
            }
            onClick={() => {
              interaction.setMode(interactionMode === "edit" ? "preview" : "edit");
              setActivePopover(null);
              if (interactionMode === "edit") {
                builder.selectBlock(null);
                builder.selectPrimitivePath(null);
              }
            }}
            icon={
              interactionMode === "edit" ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                  <path d="m12 6 4 4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )
            }
          />
          <IconButton
            label="Replay page load"
            onClick={replayPreviewLoad}
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 12a8 8 0 1 1-2.4-5.7L20 8" />
                <path d="M20 4v4h-4" />
              </svg>
            }
          />
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
            <div
              className="site-preview-browser"
              style={
                previewDeviceWidthCap
                  ? {
                      width: `min(100%, ${previewDeviceWidthCap}px)`,
                      marginInline: "auto",
                    }
                  : undefined
              }
            >
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
                className={`site-preview-page breakpoint-${previewBreakpoint}${isCatalogDragActive ? " catalog-dragging" : ""}${isCatalogDragOverPreview ? " catalog-drag-over" : ""}`}
                onDragOver={interactionMode === "edit" ? handlePreviewDragOver : undefined}
                onDragOverCapture={interactionMode === "edit" ? handlePreviewDragOver : undefined}
                onDragLeave={(event) => {
                  if (interactionMode !== "edit") {
                    return;
                  }
                  const nextTarget = event.relatedTarget;
                  if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
                    return;
                  }
                  setDropIndex(null);
                }}
                onDropCapture={interactionMode === "edit" ? handlePreviewDrop : undefined}
              >
                {interactionMode === "edit" && isCatalogDragActive ? (
                  <div className="site-preview-drop-hint-layer">
                    <div
                      className={`site-preview-drop-hint${isCatalogDragOverPreview ? " active" : ""}`}
                    >
                      <span className="dot" />
                      {isCatalogDragOverPreview
                        ? `Release to add ${draggedCatalogBlock?.label ?? "block"}`
                        : `Drag ${draggedCatalogBlock?.label ?? "block"} into the canvas`}
                    </div>
                  </div>
                ) : null}
                {builder.selectedPage.blocks.map((block, index) => {
                  const sectionGuide = sectionSpacingFromOverrides(block, previewBreakpoint);
                  const hasPrimitiveSelectionInBlock = builder.state.selectedPrimitivePaths.some(
                    (target) => decodePrimitiveTarget(target).blockId === block.id
                  );
                  const hoverPrimitivePathsForBlock = stylePreviewState.state.hoverPrimitiveTargets
                    .map((target) => decodePrimitiveTarget(target))
                    .filter((target) => target.blockId === block.id)
                    .map((target) => target.primitivePath);
                  return (
                    <div key={block.id} className="canvas-block-shell">
                      <div
                        className={`canvas-insert-indicator${dropIndex === index ? " active" : ""}`}
                      />

                      <div
                        className={`site-block-shell${interactionMode === "edit" && builder.state.selectedBlockIds.includes(block.id) ? " selected" : ""}${interactionMode === "edit" && hoveredBlockId === block.id ? " hovered" : ""}${block.visibility === "hidden" ? " hidden" : ""}`}
                        onMouseEnter={() => {
                          setHoveredBlockId(block.id);
                          if (interactionMode === "preview") {
                            setPreviewHoverBlockId(block.id);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredBlockId((prev) => (prev === block.id ? null : prev));
                          setHoveredPrimitivePath(null);
                          setPreviewHoverBlockId((prev) => (prev === block.id ? null : prev));
                          setPreviewHoverPrimitiveTarget((prev) => {
                            if (!prev) {
                              return null;
                            }
                            const decoded = decodePrimitiveTarget(prev);
                            return decoded.blockId === block.id ? null : prev;
                          });
                        }}
                        onClick={(event) => {
                          if (interactionMode !== "edit") {
                            return;
                          }
                          builder.selectBlock(block.id, { multi: event.shiftKey });
                          builder.selectPrimitivePath(null);
                        }}
                      >
                        {interactionMode === "edit" &&
                        builder.state.selectedBlockId === block.id &&
                        !hasPrimitiveSelectionInBlock ? (
                          <>
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
                            <div className="site-block-spacing-controls">
                              <div className="site-block-spacing-guide baseline" />
                              <div
                                className="site-block-spacing-guide margin"
                                style={{
                                  top: `${-sectionGuide.marginTop}px`,
                                  right: `${-sectionGuide.marginRight}px`,
                                  bottom: `${-sectionGuide.marginBottom}px`,
                                  left: `${-sectionGuide.marginLeft}px`,
                                }}
                              />
                              <div
                                className="site-block-spacing-guide padding"
                                style={{
                                  top: `${sectionGuide.paddingTop}px`,
                                  right: `${sectionGuide.paddingRight}px`,
                                  bottom: `${sectionGuide.paddingBottom}px`,
                                  left: `${sectionGuide.paddingLeft}px`,
                                }}
                              />
                              {SECTION_SPACING_HANDLES.map((handle) => (
                                <button
                                  key={`${block.id}-${handle.id}`}
                                  className={`site-block-spacing-handle ${handle.kind} ${handle.side}`}
                                  onPointerDown={(event) =>
                                    startSectionSpacingDrag(event, block, handle)
                                  }
                                  title={handle.label}
                                  aria-label={handle.label}
                                  type="button"
                                />
                              ))}
                              {activeSectionSpacingDrag?.blockId === block.id ? (
                                <div className="site-block-spacing-readout">
                                  {activeSectionSpacingDrag.label}: {activeSectionSpacingDrag.value}
                                  px
                                </div>
                              ) : null}
                            </div>
                          </>
                        ) : null}
                        <div className="site-block-render">
                          <PreviewBlock
                            key={`${block.id}-${previewRunId}`}
                            block={block}
                            previewScope={previewBreakpoint}
                            hoverEnabled={interactionMode === "preview"}
                            sectionStyleState={
                              interactionMode === "preview"
                                ? previewHoverBlockId === block.id
                                  ? "hover"
                                  : "default"
                                : stylePreviewState.state.hoverSectionBlockIds.includes(block.id)
                                  ? "hover"
                                  : "default"
                            }
                            hoverPrimitivePaths={
                              interactionMode === "preview"
                                ? (() => {
                                    if (!previewHoverPrimitiveTarget) {
                                      return [];
                                    }
                                    const decoded = decodePrimitiveTarget(
                                      previewHoverPrimitiveTarget
                                    );
                                    return decoded.blockId === block.id
                                      ? [decoded.primitivePath]
                                      : [];
                                  })()
                                : hoverPrimitivePathsForBlock
                            }
                            editable={
                              interactionMode === "edit" &&
                              builder.state.selectedBlockId === block.id
                            }
                            selectionEnabled={interactionMode === "edit"}
                            onInlineCommit={(fieldKey, value) =>
                              builder.setBlockFieldForBlock(block.id, fieldKey, value)
                            }
                            selectedPrimitivePaths={builder.state.selectedPrimitivePaths
                              .map((target) => decodePrimitiveTarget(target))
                              .filter((target) => target.blockId === block.id)
                              .map((target) => target.primitivePath)}
                            hoveredPrimitivePath={
                              hoveredBlockId === block.id ? hoveredPrimitivePath : null
                            }
                            onHoverPrimitive={(path) => {
                              setHoveredPrimitivePath(path);
                              if (interactionMode === "preview") {
                                setPreviewHoverBlockId(block.id);
                                setPreviewHoverPrimitiveTarget(
                                  path ? encodePrimitiveTarget(block.id, path) : null
                                );
                              }
                            }}
                            onSelectPrimitive={(path, _type, multi) => {
                              builder.selectPrimitiveTarget(block.id, path, { multi });
                            }}
                            onPrimitiveStyleSet={(path, key, value) =>
                              builder.setPrimitiveStyleForTargets(
                                [encodePrimitiveTarget(block.id, path)],
                                key,
                                value,
                                editScope
                              )
                            }
                            onStyleDragSessionStart={() => builder.beginStyleDragSession()}
                            onStyleDragSessionEnd={() => builder.endStyleDragSession()}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div
                  className={`canvas-insert-indicator final${dropIndex === builder.selectedPage.blocks.length ? " active" : ""}`}
                />

                {interactionMode === "edit" && builder.selectedPage.blocks.length === 0 ? (
                  <div
                    className={`site-preview-empty${dropIndex === builder.selectedPage.blocks.length ? " active" : ""}`}
                    onDragOver={handlePreviewDragOver}
                    onDrop={handlePreviewDrop}
                  >
                    <div className="site-preview-empty-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M4 6h16v4H4zM7 14h10M12 11v10" />
                      </svg>
                    </div>
                    <div className="site-preview-empty-title">Start building this page</div>
                    <div className="site-preview-empty-copy">
                      Drag a block card from the Blocks drawer and drop it anywhere in this canvas.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      {draggedCatalogBlock && activePointerDrag ? (
        <div
          className="builder-drag-ghost"
          style={{
            left: `${activePointerDrag.clientX + 14}px`,
            top: `${activePointerDrag.clientY + 14}px`,
          }}
          aria-hidden="true"
        >
          <span className="builder-drag-ghost-plus">+</span>
          <span className="builder-drag-ghost-thumb">
            <span />
            <span />
            <span />
          </span>
          <span className="builder-drag-ghost-meta">
            <strong>{draggedCatalogBlock.label}</strong>
            <small>{draggedCatalogBlock.category}</small>
          </span>
        </div>
      ) : null}

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

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, type ReactNode, useState } from "react";

import { BLOCK_CATALOG } from "./catalog";
import { FOCUS_INSPECTOR_EVENT } from "./events";
import { loadBuilderProject, saveBuilderProject, type BuilderProjectDoc } from "./persistence";
import type { BlockType, BuilderPage, BuilderState } from "./types";

type BuilderContextValue = {
  state: BuilderState;
  selectedPage: BuilderPage;
  selectedBlock: BuilderPage["blocks"][number] | null;
  canUndo: boolean;
  canRedo: boolean;
  setSelectedPageId: (pageId: string) => void;
  createPage: (route: string, title: string) => void;
  duplicatePage: () => void;
  renameRoute: (nextRoute: string) => void;
  deletePage: () => void;
  selectBlock: (blockId: string | null) => void;
  selectPrimitivePath: (path: string | null, options?: { multi?: boolean }) => void;
  addBlock: (type: BlockType) => void;
  insertBlock: (type: BlockType, index: number) => void;
  moveBlock: (direction: "up" | "down") => void;
  moveBlockToIndex: (blockId: string, targetIndex: number) => void;
  removeBlock: () => void;
  setBlockField: (key: string, value: string | number) => void;
  setBlockFieldForBlock: (blockId: string, key: string, value: string | number) => void;
  setBlockVisibility: (visibility: "visible" | "hidden") => void;
  setBlockVariant: (variant: string) => void;
  setBlockStyle: (
    key:
      | "marginTop"
      | "marginRight"
      | "marginBottom"
      | "marginLeft"
      | "paddingTop"
      | "paddingRight"
      | "paddingBottom"
      | "paddingLeft"
      | "borderWidth"
      | "borderStyle"
      | "borderColor"
      | "borderRadius"
      | "backgroundColor"
      | "backgroundImage"
      | "textColor"
      | "fontSize"
      | "translateX"
      | "translateY",
    value: string
  ) => void;
  setPrimitiveStyle: (
    primitivePath: string,
    key:
      | "marginTop"
      | "marginRight"
      | "marginBottom"
      | "marginLeft"
      | "paddingTop"
      | "paddingRight"
      | "paddingBottom"
      | "paddingLeft"
      | "borderWidth"
      | "borderStyle"
      | "borderColor"
      | "borderRadius"
      | "backgroundColor"
      | "textColor"
      | "fontSize"
      | "fontWeight"
      | "lineHeight"
      | "textAlign"
      | "width"
      | "height"
      | "translateX"
      | "translateY",
    value: string
  ) => void;
  setPrimitiveStyleForPaths: (
    primitivePaths: string[],
    key:
      | "marginTop"
      | "marginRight"
      | "marginBottom"
      | "marginLeft"
      | "paddingTop"
      | "paddingRight"
      | "paddingBottom"
      | "paddingLeft"
      | "borderWidth"
      | "borderStyle"
      | "borderColor"
      | "borderRadius"
      | "backgroundColor"
      | "textColor"
      | "fontSize"
      | "fontWeight"
      | "lineHeight"
      | "textAlign"
      | "width"
      | "height"
      | "translateX"
      | "translateY",
    value: string
  ) => void;
  setPageSeo: (key: "title" | "description", value: string) => void;
  beginStyleDragSession: () => void;
  endStyleDragSession: () => void;
  markSaved: () => void;
  undo: () => void;
  redo: () => void;
};

const BuilderContext = createContext<BuilderContextValue | null>(null);

function buildDefaultState(): BuilderState {
  return {
    pages: [
      {
        id: "page-home",
        title: "Home",
        route: "/",
        seo: { title: "Home", description: "" },
        blocks: [],
      },
    ],
    selectedPageId: "page-home",
    selectedBlockId: null,
    selectedPrimitivePaths: [],
    dirty: false,
    lastSavedAt: new Date().toISOString(),
    routeValidationError: null,
  };
}

function stateFromDocument(document: BuilderProjectDoc): BuilderState {
  const pages = document.pages.length > 0 ? document.pages : buildDefaultState().pages;
  const selectedPageId = pages.some((page) => page.id === document.selectedPageId)
    ? document.selectedPageId
    : pages[0].id;
  return {
    pages,
    selectedPageId,
    selectedBlockId: null,
    selectedPrimitivePaths: [],
    dirty: false,
    lastSavedAt: new Date().toISOString(),
    routeValidationError: null,
  };
}

function documentFromState(
  state: BuilderState,
  projectName: string | undefined,
  projectSiteUrl: string | undefined
): BuilderProjectDoc {
  const idMap = new Map<string, string>();
  const used = new Set<string>();
  const pages = state.pages.map((page) => {
    const base = slugIdFromRoute(page.route);
    let next = base;
    let counter = 2;
    while (used.has(next)) {
      next = `${base}-${counter}`;
      counter += 1;
    }
    used.add(next);
    idMap.set(page.id, next);
    return { ...page, id: next };
  });
  const rootPageId = pages[0]?.id ?? "home";
  const selectedPageId = idMap.get(state.selectedPageId) ?? rootPageId;
  return {
    site: {
      siteName: projectName?.trim() || "Untitled Site",
      baseUrl: projectSiteUrl?.trim() || "https://example.com",
    },
    sitemap: {
      pageOrder: pages.map((page) => page.id),
      rootPageId,
    },
    pages,
    selectedPageId,
  };
}

function isRouteCollision(
  state: BuilderState,
  route: string,
  ignorePageId: string | null
): boolean {
  return state.pages.some((page) => page.route === route && page.id !== ignorePageId);
}

function nextBlockId(): string {
  return `block-${Math.random().toString(36).slice(2, 10)}`;
}

function slugIdFromRoute(route: string): string {
  const trimmed = route.trim();
  if (!trimmed || trimmed === "/") {
    return "home";
  }
  const slug = trimmed
    .replace(/^\/+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, "-")
    .replace(/_+/g, "-")
    .replace(/\/+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "home";
}

function uniquePageIdFromRoute(route: string, pages: BuilderPage[], ignorePageId?: string): string {
  const base = slugIdFromRoute(route);
  const existing = new Set(pages.filter((page) => page.id !== ignorePageId).map((page) => page.id));
  if (!existing.has(base)) {
    return base;
  }
  let counter = 2;
  let next = `${base}-${counter}`;
  while (existing.has(next)) {
    counter += 1;
    next = `${base}-${counter}`;
  }
  return next;
}

function applyMutation(
  state: BuilderState,
  fn: (draft: BuilderState) => BuilderState
): BuilderState {
  const updated = fn(state);
  return {
    ...updated,
    dirty: true,
  };
}

function createBlock(type: BlockType) {
  const definition = BLOCK_CATALOG.find((entry) => entry.id === type);
  if (!definition) {
    return null;
  }
  return {
    id: nextBlockId(),
    type,
    props: Object.fromEntries(definition.fields.map((field) => [field.key, ""])),
    visibility: "visible" as const,
    styleOverrides: { variant: "default" },
  };
}

function applyInlineFieldUpdate(
  props: Record<string, string | number>,
  fieldKey: string,
  value: string | number
): Record<string, string | number> {
  const nextValue = typeof value === "number" ? String(value) : value;

  if (fieldKey.startsWith("@line:")) {
    const [, propKey, indexRaw] = fieldKey.split(":");
    const lineIndex = Number.parseInt(indexRaw ?? "", 10);
    if (!propKey || Number.isNaN(lineIndex)) {
      return { ...props, [fieldKey]: value };
    }
    const existingRaw = typeof props[propKey] === "string" ? (props[propKey] as string) : "";
    const lines = existingRaw
      .split("\n")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    while (lines.length <= lineIndex) {
      lines.push("");
    }
    lines[lineIndex] = nextValue;
    return { ...props, [propKey]: lines.join("\n") };
  }

  if (fieldKey.startsWith("@split:")) {
    const [, propKey, rowRaw, partRaw] = fieldKey.split(":");
    const rowIndex = Number.parseInt(rowRaw ?? "", 10);
    const partIndex = Number.parseInt(partRaw ?? "", 10);
    if (!propKey || Number.isNaN(rowIndex) || Number.isNaN(partIndex)) {
      return { ...props, [fieldKey]: value };
    }
    const existingRaw = typeof props[propKey] === "string" ? (props[propKey] as string) : "";
    const rows = existingRaw
      .split("\n")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => entry.split("|").map((part) => part.trim()));
    while (rows.length <= rowIndex) {
      rows.push([]);
    }
    while (rows[rowIndex].length <= partIndex) {
      rows[rowIndex].push("");
    }
    rows[rowIndex][partIndex] = nextValue;
    return {
      ...props,
      [propKey]: rows.map((parts) => parts.map((part) => part.trim()).join("|")).join("\n"),
    };
  }

  return { ...props, [fieldKey]: value };
}

export function BuilderProvider({
  children,
  projectPath,
  projectName,
  projectSiteUrl,
}: {
  children: ReactNode;
  projectPath?: string;
  projectName?: string;
  projectSiteUrl?: string;
}) {
  const [history, setHistory] = useState<BuilderState[]>([]);
  const [future, setFuture] = useState<BuilderState[]>([]);
  const [state, setState] = useState<BuilderState>(buildDefaultState());
  const stateRef = useRef<BuilderState>(state);
  const historyRef = useRef<BuilderState[]>(history);
  const futureRef = useRef<BuilderState[]>(future);
  const pendingSaveRef = useRef<number | null>(null);
  const lastStructurePersistRef = useRef<string>("");
  const hydratedProjectPathRef = useRef<string | null>(null);
  const styleDragSessionRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    futureRef.current = future;
  }, [future]);

  const selectedPage =
    state.pages.find((page) => page.id === state.selectedPageId) ??
    state.pages[0] ??
    buildDefaultState().pages[0];
  const selectedBlock =
    selectedPage.blocks.find((block) => block.id === state.selectedBlockId) ?? null;

  const commit = (mutate: (draft: BuilderState) => BuilderState) => {
    setState((prev) => {
      const nextHistory = [...historyRef.current, prev];
      const nextState = applyMutation(prev, mutate);
      historyRef.current = nextHistory;
      futureRef.current = [];
      setHistory(nextHistory);
      setFuture([]);
      stateRef.current = nextState;
      return nextState;
    });
  };

  const commitWithoutHistory = (mutate: (draft: BuilderState) => BuilderState) => {
    setState((prev) => {
      const nextState = applyMutation(prev, mutate);
      stateRef.current = nextState;
      return nextState;
    });
  };

  useEffect(() => {
    if (!projectPath) {
      hydratedProjectPathRef.current = null;
      return;
    }

    hydratedProjectPathRef.current = null;
    let cancelled = false;
    loadBuilderProject(projectPath)
      .then((document) => {
        if (cancelled) {
          return;
        }
        const hydratedState = stateFromDocument(document);
        setHistory([]);
        setFuture([]);
        setState(hydratedState);
        historyRef.current = [];
        futureRef.current = [];
        stateRef.current = hydratedState;
        hydratedProjectPathRef.current = projectPath;
      })
      .catch((error) => {
        console.error("Failed to load builder project", error);
        if (cancelled) {
          return;
        }
        const fallbackState = buildDefaultState();
        setHistory([]);
        setFuture([]);
        setState(fallbackState);
        historyRef.current = [];
        futureRef.current = [];
        stateRef.current = fallbackState;
        hydratedProjectPathRef.current = projectPath;
      });

    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  useEffect(() => {
    if (!projectPath || hydratedProjectPathRef.current !== projectPath || !state.dirty) {
      return;
    }
    if (pendingSaveRef.current) {
      window.clearTimeout(pendingSaveRef.current);
    }
    pendingSaveRef.current = window.setTimeout(() => {
      const document = documentFromState(state, projectName, projectSiteUrl);
      saveBuilderProject({ projectPath, document })
        .then(() => {
          setState((prev) => ({
            ...prev,
            dirty: false,
            lastSavedAt: new Date().toISOString(),
          }));
        })
        .catch((error) => {
          console.error("Autosave failed", error);
        });
    }, 350);

    return () => {
      if (pendingSaveRef.current) {
        window.clearTimeout(pendingSaveRef.current);
        pendingSaveRef.current = null;
      }
    };
  }, [projectName, projectPath, projectSiteUrl, state]);

  useEffect(() => {
    if (!projectPath || hydratedProjectPathRef.current !== projectPath) {
      return;
    }

    const structureKey = `${state.selectedPageId}|${state.pages
      .map((page) => `${page.id}:${page.route}:${page.title}`)
      .join("|")}`;
    if (lastStructurePersistRef.current === structureKey) {
      return;
    }
    lastStructurePersistRef.current = structureKey;

    const document = documentFromState(state, projectName, projectSiteUrl);
    saveBuilderProject({ projectPath, document }).catch((error) => {
      console.error("Structure save failed", error);
    });
  }, [projectName, projectPath, projectSiteUrl, state.pages, state.selectedPageId, state]);

  const value: BuilderContextValue = {
    state,
    selectedPage,
    selectedBlock,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    setSelectedPageId: (pageId) => {
      setState((prev) => ({
        ...prev,
        selectedPageId: pageId,
        selectedBlockId: null,
        selectedPrimitivePaths: [],
      }));
    },
    createPage: (route, title) => {
      const cleanedRoute = route.startsWith("/") ? route : `/${route}`;
      if (isRouteCollision(state, cleanedRoute, null)) {
        setState((prev) => ({
          ...prev,
          routeValidationError: `Route ${cleanedRoute} is already used.`,
        }));
        return;
      }

      commit((prev) => {
        const nextPage = {
          id: uniquePageIdFromRoute(cleanedRoute, prev.pages),
          title,
          route: cleanedRoute,
          seo: { title, description: "" },
          blocks: [],
        };
        return {
          ...prev,
          pages: [...prev.pages, nextPage],
          selectedPageId: nextPage.id,
          selectedBlockId: null,
          selectedPrimitivePaths: [],
          routeValidationError: null,
        };
      });
    },
    duplicatePage: () => {
      commit((prev) => {
        const page = prev.pages.find((item) => item.id === prev.selectedPageId);
        if (!page) {
          return prev;
        }
        const duplicated = {
          ...page,
          title: `${page.title} Copy`,
          route: `${page.route}-copy`,
          id: uniquePageIdFromRoute(`${page.route}-copy`, prev.pages),
          blocks: page.blocks.map((block) => ({ ...block, id: nextBlockId() })),
        };
        return {
          ...prev,
          pages: [...prev.pages, duplicated],
          selectedPageId: duplicated.id,
          selectedBlockId: null,
          selectedPrimitivePaths: [],
        };
      });
    },
    renameRoute: (nextRoute) => {
      const cleanedRoute = nextRoute.startsWith("/") ? nextRoute : `/${nextRoute}`;
      if (isRouteCollision(state, cleanedRoute, state.selectedPageId)) {
        setState((prev) => ({
          ...prev,
          routeValidationError: `Route ${cleanedRoute} is already used.`,
        }));
        return;
      }
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((page) =>
          page.id === prev.selectedPageId
            ? {
                ...page,
                route: cleanedRoute,
                id: uniquePageIdFromRoute(cleanedRoute, prev.pages, prev.selectedPageId),
              }
            : page
        ),
        selectedPageId: uniquePageIdFromRoute(cleanedRoute, prev.pages, prev.selectedPageId),
        routeValidationError: null,
      }));
    },
    deletePage: () => {
      if (state.pages.length <= 1) {
        return;
      }
      commit((prev) => {
        const remaining = prev.pages.filter((page) => page.id !== prev.selectedPageId);
        return {
          ...prev,
          pages: remaining,
          selectedPageId: remaining[0]?.id ?? prev.selectedPageId,
          selectedBlockId: null,
          selectedPrimitivePaths: [],
        };
      });
    },
    selectBlock: (blockId) => {
      setState((prev) => ({
        ...prev,
        selectedBlockId: blockId,
        selectedPrimitivePaths:
          !blockId || prev.selectedBlockId !== blockId ? [] : prev.selectedPrimitivePaths,
      }));
      if (blockId) {
        window.dispatchEvent(new CustomEvent(FOCUS_INSPECTOR_EVENT));
      }
    },
    selectPrimitivePath: (path, options) => {
      setState((prev) => {
        if (!path) {
          return { ...prev, selectedPrimitivePaths: [] };
        }
        if (options?.multi) {
          const exists = prev.selectedPrimitivePaths.includes(path);
          return {
            ...prev,
            selectedPrimitivePaths: exists
              ? prev.selectedPrimitivePaths.filter((entry) => entry !== path)
              : [...prev.selectedPrimitivePaths, path],
          };
        }
        return { ...prev, selectedPrimitivePaths: [path] };
      });
    },
    addBlock: (type) => {
      const newBlock = createBlock(type);
      if (!newBlock) {
        return;
      }
      commit((prev) => {
        return {
          ...prev,
          pages: prev.pages.map((page) =>
            page.id === prev.selectedPageId ? { ...page, blocks: [...page.blocks, newBlock] } : page
          ),
          selectedBlockId: newBlock.id,
          selectedPrimitivePaths: [],
        };
      });
    },
    insertBlock: (type, index) => {
      const newBlock = createBlock(type);
      if (!newBlock) {
        return;
      }
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => {
          if (page.id !== prev.selectedPageId) {
            return page;
          }
          const clampedIndex = Math.max(0, Math.min(index, page.blocks.length));
          const blocks = [...page.blocks];
          blocks.splice(clampedIndex, 0, newBlock);
          return { ...page, blocks };
        }),
        selectedBlockId: newBlock.id,
        selectedPrimitivePaths: [],
      }));
    },
    moveBlock: (direction) => {
      if (!state.selectedBlockId) {
        return;
      }
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => {
          if (page.id !== prev.selectedPageId) {
            return page;
          }
          const index = page.blocks.findIndex((block) => block.id === prev.selectedBlockId);
          if (index < 0) {
            return page;
          }
          const target = direction === "up" ? index - 1 : index + 1;
          if (target < 0 || target >= page.blocks.length) {
            return page;
          }
          const blocks = [...page.blocks];
          const [moved] = blocks.splice(index, 1);
          blocks.splice(target, 0, moved);
          return { ...page, blocks };
        }),
      }));
    },
    moveBlockToIndex: (blockId, targetIndex) => {
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => {
          if (page.id !== prev.selectedPageId) {
            return page;
          }
          const fromIndex = page.blocks.findIndex((block) => block.id === blockId);
          if (fromIndex < 0) {
            return page;
          }
          const blocks = [...page.blocks];
          const [moved] = blocks.splice(fromIndex, 1);
          const adjustedTarget = targetIndex > fromIndex ? targetIndex - 1 : targetIndex;
          const clampedTarget = Math.max(0, Math.min(adjustedTarget, blocks.length));
          blocks.splice(clampedTarget, 0, moved);
          return { ...page, blocks };
        }),
        selectedBlockId: blockId,
        selectedPrimitivePaths: [],
      }));
    },
    removeBlock: () => {
      if (!state.selectedBlockId) {
        return;
      }
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((page) =>
          page.id === prev.selectedPageId
            ? {
                ...page,
                blocks: page.blocks.filter((block) => block.id !== prev.selectedBlockId),
              }
            : page
        ),
        selectedBlockId: null,
        selectedPrimitivePaths: [],
      }));
    },
    setBlockField: (key, value) => {
      if (!state.selectedBlockId) {
        return;
      }
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((page) =>
          page.id === prev.selectedPageId
            ? {
                ...page,
                blocks: page.blocks.map((block) =>
                  block.id === prev.selectedBlockId
                    ? { ...block, props: { ...block.props, [key]: value } }
                    : block
                ),
              }
            : page
        ),
      }));
    },
    setBlockFieldForBlock: (blockId, key, value) => {
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((page) =>
          page.id === prev.selectedPageId
            ? {
                ...page,
                blocks: page.blocks.map((block) =>
                  block.id === blockId
                    ? { ...block, props: applyInlineFieldUpdate(block.props, key, value) }
                    : block
                ),
              }
            : page
        ),
        selectedBlockId: blockId,
      }));
    },
    setBlockVisibility: (visibility) => {
      if (!state.selectedBlockId) {
        return;
      }
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((page) =>
          page.id === prev.selectedPageId
            ? {
                ...page,
                blocks: page.blocks.map((block) =>
                  block.id === prev.selectedBlockId ? { ...block, visibility } : block
                ),
              }
            : page
        ),
      }));
    },
    setBlockVariant: (variant) => {
      if (!state.selectedBlockId) {
        return;
      }
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((page) =>
          page.id === prev.selectedPageId
            ? {
                ...page,
                blocks: page.blocks.map((block) =>
                  block.id === prev.selectedBlockId
                    ? { ...block, styleOverrides: { ...block.styleOverrides, variant } }
                    : block
                ),
              }
            : page
        ),
      }));
    },
    setBlockStyle: (key, value) => {
      if (!state.selectedBlockId) {
        return;
      }
      const applyStyle = (prev: BuilderState) => ({
        ...prev,
        pages: prev.pages.map((page) =>
          page.id === prev.selectedPageId
            ? {
                ...page,
                blocks: page.blocks.map((block) => {
                  if (block.id !== prev.selectedBlockId) {
                    return block;
                  }
                  const styleOverrides = { ...block.styleOverrides };
                  if (!value.trim()) {
                    delete styleOverrides[key];
                  } else {
                    styleOverrides[key] = value;
                  }
                  return { ...block, styleOverrides };
                }),
              }
            : page
        ),
      });
      if (styleDragSessionRef.current) {
        commitWithoutHistory(applyStyle);
      } else {
        commit(applyStyle);
      }
    },
    setPrimitiveStyle: (primitivePath, key, value) => {
      if (!state.selectedBlockId) {
        return;
      }
      const applyStyle = (prev: BuilderState) => ({
        ...prev,
        pages: prev.pages.map((page) =>
          page.id === prev.selectedPageId
            ? {
                ...page,
                blocks: page.blocks.map((block) => {
                  if (block.id !== prev.selectedBlockId) {
                    return block;
                  }
                  const primitiveStyles = { ...(block.styleOverrides.primitiveStyles ?? {}) };
                  const current = { ...(primitiveStyles[primitivePath] ?? {}) };
                  if (!value.trim()) {
                    delete current[key];
                  } else {
                    current[key] = value;
                  }
                  if (Object.keys(current).length === 0) {
                    delete primitiveStyles[primitivePath];
                  } else {
                    primitiveStyles[primitivePath] = current;
                  }
                  return {
                    ...block,
                    styleOverrides: {
                      ...block.styleOverrides,
                      primitiveStyles:
                        Object.keys(primitiveStyles).length > 0 ? primitiveStyles : undefined,
                    },
                  };
                }),
              }
            : page
        ),
      });
      if (styleDragSessionRef.current) {
        commitWithoutHistory(applyStyle);
      } else {
        commit(applyStyle);
      }
    },
    setPrimitiveStyleForPaths: (primitivePaths, key, value) => {
      if (!state.selectedBlockId || primitivePaths.length === 0) {
        return;
      }
      const applyStyle = (prev: BuilderState) => ({
        ...prev,
        pages: prev.pages.map((page) =>
          page.id === prev.selectedPageId
            ? {
                ...page,
                blocks: page.blocks.map((block) => {
                  if (block.id !== prev.selectedBlockId) {
                    return block;
                  }
                  const primitiveStyles = { ...(block.styleOverrides.primitiveStyles ?? {}) };
                  primitivePaths.forEach((primitivePath) => {
                    const current = { ...(primitiveStyles[primitivePath] ?? {}) };
                    if (!value.trim()) {
                      delete current[key];
                    } else {
                      current[key] = value;
                    }
                    if (Object.keys(current).length === 0) {
                      delete primitiveStyles[primitivePath];
                    } else {
                      primitiveStyles[primitivePath] = current;
                    }
                  });
                  return {
                    ...block,
                    styleOverrides: {
                      ...block.styleOverrides,
                      primitiveStyles:
                        Object.keys(primitiveStyles).length > 0 ? primitiveStyles : undefined,
                    },
                  };
                }),
              }
            : page
        ),
      });
      if (styleDragSessionRef.current) {
        commitWithoutHistory(applyStyle);
      } else {
        commit(applyStyle);
      }
    },
    setPageSeo: (key, value) => {
      commit((prev) => ({
        ...prev,
        pages: prev.pages.map((page) =>
          page.id === prev.selectedPageId ? { ...page, seo: { ...page.seo, [key]: value } } : page
        ),
      }));
    },
    beginStyleDragSession: () => {
      if (styleDragSessionRef.current) {
        return;
      }
      const snapshot = stateRef.current;
      const nextHistory = [...historyRef.current, snapshot];
      historyRef.current = nextHistory;
      futureRef.current = [];
      setHistory(nextHistory);
      setFuture([]);
      styleDragSessionRef.current = true;
    },
    endStyleDragSession: () => {
      styleDragSessionRef.current = false;
    },
    markSaved: () => {
      if (!projectPath) {
        setState((prev) => ({ ...prev, dirty: false, lastSavedAt: new Date().toISOString() }));
        return;
      }
      const document = documentFromState(state, projectName, projectSiteUrl);
      saveBuilderProject({ projectPath, document })
        .then(() => {
          setState((prev) => ({
            ...prev,
            dirty: false,
            lastSavedAt: new Date().toISOString(),
          }));
        })
        .catch((error) => {
          console.error("Manual save failed", error);
        });
    },
    undo: () => {
      const historyItems = historyRef.current;
      if (historyItems.length === 0) {
        return;
      }
      const previous = historyItems[historyItems.length - 1];
      const nextHistory = historyItems.slice(0, -1);
      const nextFuture = [stateRef.current, ...futureRef.current];
      historyRef.current = nextHistory;
      futureRef.current = nextFuture;
      stateRef.current = previous;
      setHistory(nextHistory);
      setFuture(nextFuture);
      setState(previous);
    },
    redo: () => {
      const futureItems = futureRef.current;
      if (futureItems.length === 0) {
        return;
      }
      const [next, ...rest] = futureItems;
      const nextHistory = [...historyRef.current, stateRef.current];
      historyRef.current = nextHistory;
      futureRef.current = rest;
      stateRef.current = next;
      setHistory(nextHistory);
      setFuture(rest);
      setState(next);
    },
  };

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilderStore(): BuilderContextValue {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilderStore must be used within BuilderProvider");
  }
  return context;
}

import { useEffect, useState } from "react";

export type BuilderStylePreviewState = {
  hoverSectionBlockIds: string[];
  hoverPrimitiveTargets: string[];
};

const BUILDER_STYLE_PREVIEW_STATE_KEY = "manifold.builder.style-preview-state";
const BUILDER_STYLE_PREVIEW_STATE_EVENT = "manifold:builder-style-preview-state";

function normalizeState(input: unknown): BuilderStylePreviewState {
  if (!input || typeof input !== "object") {
    return { hoverSectionBlockIds: [], hoverPrimitiveTargets: [] };
  }
  const objectInput = input as {
    hoverSectionBlockIds?: unknown;
    hoverPrimitiveTargets?: unknown;
  };
  const hoverSectionBlockIds = Array.isArray(objectInput.hoverSectionBlockIds)
    ? objectInput.hoverSectionBlockIds.filter((entry): entry is string => typeof entry === "string")
    : [];
  const hoverPrimitiveTargets = Array.isArray(objectInput.hoverPrimitiveTargets)
    ? objectInput.hoverPrimitiveTargets.filter((entry): entry is string => typeof entry === "string")
    : [];
  return {
    hoverSectionBlockIds,
    hoverPrimitiveTargets,
  };
}

function readInitialState(): BuilderStylePreviewState {
  try {
    const raw = window.localStorage.getItem(BUILDER_STYLE_PREVIEW_STATE_KEY);
    if (!raw) {
      return { hoverSectionBlockIds: [], hoverPrimitiveTargets: [] };
    }
    return normalizeState(JSON.parse(raw));
  } catch {
    return { hoverSectionBlockIds: [], hoverPrimitiveTargets: [] };
  }
}

function sameState(a: BuilderStylePreviewState, b: BuilderStylePreviewState): boolean {
  if (a.hoverSectionBlockIds.length !== b.hoverSectionBlockIds.length) {
    return false;
  }
  if (a.hoverPrimitiveTargets.length !== b.hoverPrimitiveTargets.length) {
    return false;
  }
  return (
    a.hoverSectionBlockIds.every((entry, index) => entry === b.hoverSectionBlockIds[index]) &&
    a.hoverPrimitiveTargets.every((entry, index) => entry === b.hoverPrimitiveTargets[index])
  );
}

export function useBuilderStylePreviewStateStore(): {
  state: BuilderStylePreviewState;
  setState: (next: BuilderStylePreviewState) => void;
  clear: () => void;
} {
  const [state, setStateValue] = useState<BuilderStylePreviewState>(() => readInitialState());

  useEffect(() => {
    window.localStorage.setItem(BUILDER_STYLE_PREVIEW_STATE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const onStateEvent = () => {
      setStateValue(readInitialState());
    };
    window.addEventListener(BUILDER_STYLE_PREVIEW_STATE_EVENT, onStateEvent);
    return () => window.removeEventListener(BUILDER_STYLE_PREVIEW_STATE_EVENT, onStateEvent);
  }, []);

  return {
    state,
    setState: (next) => {
      const normalized = normalizeState(next);
      if (sameState(state, normalized)) {
        return;
      }
      setStateValue(normalized);
      window.localStorage.setItem(BUILDER_STYLE_PREVIEW_STATE_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new Event(BUILDER_STYLE_PREVIEW_STATE_EVENT));
    },
    clear: () => {
      const empty: BuilderStylePreviewState = {
        hoverSectionBlockIds: [],
        hoverPrimitiveTargets: [],
      };
      if (sameState(state, empty)) {
        return;
      }
      setStateValue(empty);
      window.localStorage.setItem(BUILDER_STYLE_PREVIEW_STATE_KEY, JSON.stringify(empty));
      window.dispatchEvent(new Event(BUILDER_STYLE_PREVIEW_STATE_EVENT));
    },
  };
}

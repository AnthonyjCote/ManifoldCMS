import { useEffect, useState } from "react";

import type { BuilderViewport } from "../features/builder/style-scopes";

const BUILDER_VIEWPORT_KEY = "manifold.builder.viewport";
const BUILDER_VIEWPORT_EVENT = "manifold:builder-viewport";

function readInitialViewport(): BuilderViewport {
  const raw = window.localStorage.getItem(BUILDER_VIEWPORT_KEY);
  if (
    raw === "default" ||
    raw === "mobile" ||
    raw === "tablet" ||
    raw === "desktop" ||
    raw === "wide"
  ) {
    return raw;
  }
  return "default";
}

export function useBuilderViewportStore(): {
  viewport: BuilderViewport;
  setViewport: (next: BuilderViewport) => void;
} {
  const [viewport, setViewportState] = useState<BuilderViewport>(() => readInitialViewport());

  useEffect(() => {
    window.localStorage.setItem(BUILDER_VIEWPORT_KEY, viewport);
  }, [viewport]);

  useEffect(() => {
    const onViewportEvent = () => {
      setViewportState(readInitialViewport());
    };
    window.addEventListener(BUILDER_VIEWPORT_EVENT, onViewportEvent);
    return () => window.removeEventListener(BUILDER_VIEWPORT_EVENT, onViewportEvent);
  }, []);

  return {
    viewport,
    setViewport: (next) => {
      setViewportState(next);
      window.localStorage.setItem(BUILDER_VIEWPORT_KEY, next);
      window.dispatchEvent(new Event(BUILDER_VIEWPORT_EVENT));
    },
  };
}

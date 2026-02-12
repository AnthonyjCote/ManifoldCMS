import { useEffect, useState } from "react";

export type BuilderInteractionMode = "edit" | "preview";

const BUILDER_INTERACTION_MODE_KEY = "manifold.builder.interaction-mode";
const BUILDER_INTERACTION_MODE_EVENT = "manifold:builder-interaction-mode";

function readInitialInteractionMode(): BuilderInteractionMode {
  const raw = window.localStorage.getItem(BUILDER_INTERACTION_MODE_KEY);
  if (raw === "edit" || raw === "preview") {
    return raw;
  }
  return "edit";
}

export function useBuilderInteractionModeStore(): {
  mode: BuilderInteractionMode;
  setMode: (next: BuilderInteractionMode) => void;
} {
  const [mode, setModeState] = useState<BuilderInteractionMode>(() => readInitialInteractionMode());

  useEffect(() => {
    window.localStorage.setItem(BUILDER_INTERACTION_MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    const onModeEvent = () => {
      setModeState(readInitialInteractionMode());
    };
    window.addEventListener(BUILDER_INTERACTION_MODE_EVENT, onModeEvent);
    return () => window.removeEventListener(BUILDER_INTERACTION_MODE_EVENT, onModeEvent);
  }, []);

  return {
    mode,
    setMode: (next) => {
      setModeState(next);
      window.localStorage.setItem(BUILDER_INTERACTION_MODE_KEY, next);
      window.dispatchEvent(new Event(BUILDER_INTERACTION_MODE_EVENT));
    },
  };
}

import type {
  BlockInstance,
  NonDefaultStyleStateKey,
  PrimitiveStyleKey,
  PrimitiveStyleValues,
  ResponsiveStyleValues,
  ResponsiveStateStyleValues,
  SectionStyleKey,
  SectionStyleValues,
  StyleStateKey,
  StyleViewportKey,
} from "./types";

export type BuilderViewport = "default" | "mobile" | "tablet" | "desktop" | "wide";
export type StyleValueOrigin = {
  viewport: StyleViewportKey;
  state: StyleStateKey;
};

export function editScopeFromViewport(viewport: BuilderViewport): StyleViewportKey {
  return viewport;
}

function resolvedScopeOrder(scope: BuilderViewport): StyleViewportKey[] {
  if (scope === "default") {
    return ["default"];
  }
  return ["default", scope];
}

function hasExplicitValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function resolveSectionStyleOrigin(
  overrides: BlockInstance["styleOverrides"],
  key: SectionStyleKey,
  scope: BuilderViewport,
  state: StyleStateKey = "default"
): StyleValueOrigin | null {
  if (state !== "default") {
    const order = resolvedScopeOrder(scope);
    for (let index = 0; index < order.length; index += 1) {
      const viewport = order[index];
      const explicit = overrides.stateViewportStyles?.[viewport]?.[state]?.[key];
      if (hasExplicitValue(explicit)) {
        return { viewport, state };
      }
    }
  }

  const scopedOrder = resolvedScopeOrder(scope);
  let origin: StyleValueOrigin | null = hasExplicitValue(overrides[key])
    ? { viewport: "default", state: "default" }
    : null;
  scopedOrder.forEach((viewport) => {
    if (viewport === "default") {
      return;
    }
    const explicit = overrides.viewportStyles?.[viewport]?.[key];
    if (hasExplicitValue(explicit)) {
      origin = { viewport, state: "default" };
    }
  });
  return origin;
}

export function resolvePrimitiveStyleOrigin(
  overrides: BlockInstance["styleOverrides"],
  primitivePath: string,
  key: PrimitiveStyleKey,
  scope: BuilderViewport,
  state: StyleStateKey = "default"
): StyleValueOrigin | null {
  if (state !== "default") {
    const order = resolvedScopeOrder(scope);
    for (let index = 0; index < order.length; index += 1) {
      const viewport = order[index];
      const explicit =
        overrides.primitiveStateViewportStyles?.[primitivePath]?.[viewport]?.[state]?.[key];
      if (hasExplicitValue(explicit)) {
        return { viewport, state };
      }
    }
  }

  const scopedOrder = resolvedScopeOrder(scope);
  let origin: StyleValueOrigin | null = hasExplicitValue(
    overrides.primitiveStyles?.[primitivePath]?.[key]
  )
    ? { viewport: "default", state: "default" }
    : null;
  scopedOrder.forEach((viewport) => {
    if (viewport === "default") {
      return;
    }
    const explicit = overrides.primitiveViewportStyles?.[primitivePath]?.[viewport]?.[key];
    if (hasExplicitValue(explicit)) {
      origin = { viewport, state: "default" };
    }
  });
  return origin;
}

function cleanupScopedMap<T extends Record<string, string | undefined>>(
  scoped: ResponsiveStyleValues<T> | undefined
): ResponsiveStyleValues<T> | undefined {
  if (!scoped) {
    return undefined;
  }
  const next: ResponsiveStyleValues<T> = {};
  (Object.keys(scoped) as StyleViewportKey[]).forEach((scope) => {
    const values = scoped[scope];
    if (!values) {
      return;
    }
    const filtered = Object.fromEntries(
      Object.entries(values).filter(([, value]) => Boolean(value?.trim()))
    ) as T;
    if (Object.keys(filtered).length > 0) {
      next[scope] = filtered;
    }
  });
  return Object.keys(next).length > 0 ? next : undefined;
}

export function getSectionStyleValue(
  overrides: BlockInstance["styleOverrides"],
  key: SectionStyleKey,
  scope: BuilderViewport,
  state: StyleStateKey = "default"
): string | undefined {
  if (state !== "default") {
    let stateValue: string | undefined;
    resolvedScopeOrder(scope).forEach((entry) => {
      const scopedStateValue = overrides.stateViewportStyles?.[entry]?.[state]?.[key];
      if (typeof scopedStateValue === "string" && scopedStateValue.trim().length > 0) {
        stateValue = scopedStateValue;
      }
    });
    if (typeof stateValue === "string" && stateValue.trim().length > 0) {
      return stateValue;
    }
  }
  let value: string | undefined = overrides[key];
  const scoped = overrides.viewportStyles;
  resolvedScopeOrder(scope).forEach((entry) => {
    const scopedValue = scoped?.[entry]?.[key];
    if (typeof scopedValue === "string" && scopedValue.trim().length > 0) {
      value = scopedValue;
    }
  });
  return value;
}

export function getPrimitiveStyleValue(
  overrides: BlockInstance["styleOverrides"],
  primitivePath: string,
  key: PrimitiveStyleKey,
  scope: BuilderViewport,
  state: StyleStateKey = "default"
): string | undefined {
  if (state !== "default") {
    let stateValue: string | undefined;
    resolvedScopeOrder(scope).forEach((entry) => {
      const scopedStateValue =
        overrides.primitiveStateViewportStyles?.[primitivePath]?.[entry]?.[state]?.[key];
      if (typeof scopedStateValue === "string" && scopedStateValue.trim().length > 0) {
        stateValue = scopedStateValue;
      }
    });
    if (typeof stateValue === "string" && stateValue.trim().length > 0) {
      return stateValue;
    }
  }
  let value: string | undefined = overrides.primitiveStyles?.[primitivePath]?.[key];
  const scoped = overrides.primitiveViewportStyles?.[primitivePath];
  resolvedScopeOrder(scope).forEach((entry) => {
    const scopedValue = scoped?.[entry]?.[key];
    if (typeof scopedValue === "string" && scopedValue.trim().length > 0) {
      value = scopedValue;
    }
  });
  return value;
}

export function getExplicitSectionStyleValue(
  overrides: BlockInstance["styleOverrides"],
  key: SectionStyleKey,
  scope: StyleViewportKey,
  state: StyleStateKey = "default"
): string {
  if (state !== "default") {
    return String(overrides.stateViewportStyles?.[scope]?.[state]?.[key] ?? "");
  }
  if (scope === "default") {
    return String(overrides[key] ?? "");
  }
  return String(overrides.viewportStyles?.[scope]?.[key] ?? "");
}

export function getExplicitPrimitiveStyleValue(
  overrides: BlockInstance["styleOverrides"],
  primitivePath: string,
  key: PrimitiveStyleKey,
  scope: StyleViewportKey,
  state: StyleStateKey = "default"
): string {
  if (state !== "default") {
    return String(
      overrides.primitiveStateViewportStyles?.[primitivePath]?.[scope]?.[state]?.[key] ?? ""
    );
  }
  if (scope === "default") {
    return String(overrides.primitiveStyles?.[primitivePath]?.[key] ?? "");
  }
  return String(overrides.primitiveViewportStyles?.[primitivePath]?.[scope]?.[key] ?? "");
}

export function setSectionStyleInOverrides(
  overrides: BlockInstance["styleOverrides"],
  key: SectionStyleKey,
  value: string,
  scope: StyleViewportKey,
  state: StyleStateKey = "default"
): BlockInstance["styleOverrides"] {
  if (state !== "default") {
    const nonDefaultState = state as NonDefaultStyleStateKey;
    const nextScoped = {
      ...(overrides.stateViewportStyles ?? {}),
      [scope]: {
        ...(overrides.stateViewportStyles?.[scope] ?? {}),
        [nonDefaultState]: {
          ...(overrides.stateViewportStyles?.[scope]?.[nonDefaultState] ?? {}),
          [key]: value,
        },
      },
    } as ResponsiveStateStyleValues<SectionStyleValues>;

    if (!value.trim()) {
      const stateValues = { ...(nextScoped[scope]?.[nonDefaultState] ?? {}) };
      delete stateValues[key];
      const scopeStates = { ...(nextScoped[scope] ?? {}) };
      if (Object.keys(stateValues).length === 0) {
        delete scopeStates[nonDefaultState];
      } else {
        scopeStates[nonDefaultState] = stateValues;
      }
      if (Object.keys(scopeStates).length === 0) {
        delete nextScoped[scope];
      } else {
        nextScoped[scope] = scopeStates;
      }
    }

    return {
      ...overrides,
      stateViewportStyles: Object.keys(nextScoped).length > 0 ? nextScoped : undefined,
    };
  }

  if (scope === "default") {
    const next = { ...overrides } as BlockInstance["styleOverrides"];
    if (!value.trim()) {
      delete next[key];
    } else {
      next[key] = value;
    }
    if (next.viewportStyles?.default) {
      const defaultValues = { ...next.viewportStyles.default };
      delete defaultValues[key];
      const viewportStyles = { ...next.viewportStyles };
      if (Object.keys(defaultValues).length === 0) {
        delete viewportStyles.default;
      } else {
        viewportStyles.default = defaultValues;
      }
      next.viewportStyles = cleanupScopedMap(viewportStyles);
    }
    return next;
  }

  const nextScoped = {
    ...(overrides.viewportStyles ?? {}),
    [scope]: {
      ...(overrides.viewportStyles?.[scope] ?? {}),
      [key]: value,
    },
  } as ResponsiveStyleValues<SectionStyleValues>;

  if (!value.trim()) {
    const scopeValues = { ...(nextScoped[scope] ?? {}) };
    delete scopeValues[key];
    if (Object.keys(scopeValues).length === 0) {
      delete nextScoped[scope];
    } else {
      nextScoped[scope] = scopeValues;
    }
  }

  return {
    ...overrides,
    viewportStyles: cleanupScopedMap(nextScoped),
  };
}

export function setPrimitiveStyleInOverrides(
  overrides: BlockInstance["styleOverrides"],
  primitivePath: string,
  key: PrimitiveStyleKey,
  value: string,
  scope: StyleViewportKey,
  state: StyleStateKey = "default"
): BlockInstance["styleOverrides"] {
  if (state !== "default") {
    const nonDefaultState = state as NonDefaultStyleStateKey;
    const primitiveStateViewportStyles = { ...(overrides.primitiveStateViewportStyles ?? {}) };
    const targetScopes = {
      ...(primitiveStateViewportStyles[primitivePath] ?? {}),
      [scope]: {
        ...(primitiveStateViewportStyles[primitivePath]?.[scope] ?? {}),
        [nonDefaultState]: {
          ...(primitiveStateViewportStyles[primitivePath]?.[scope]?.[nonDefaultState] ?? {}),
          [key]: value,
        },
      },
    } as ResponsiveStateStyleValues<PrimitiveStyleValues>;

    if (!value.trim()) {
      const stateValues = { ...(targetScopes[scope]?.[nonDefaultState] ?? {}) };
      delete stateValues[key];
      const scopeStates = { ...(targetScopes[scope] ?? {}) };
      if (Object.keys(stateValues).length === 0) {
        delete scopeStates[nonDefaultState];
      } else {
        scopeStates[nonDefaultState] = stateValues;
      }
      if (Object.keys(scopeStates).length === 0) {
        delete targetScopes[scope];
      } else {
        targetScopes[scope] = scopeStates;
      }
    }

    if (Object.keys(targetScopes).length === 0) {
      delete primitiveStateViewportStyles[primitivePath];
    } else {
      primitiveStateViewportStyles[primitivePath] = targetScopes;
    }

    return {
      ...overrides,
      primitiveStateViewportStyles:
        Object.keys(primitiveStateViewportStyles).length > 0
          ? primitiveStateViewportStyles
          : undefined,
    };
  }

  if (scope === "default") {
    const primitiveStyles = { ...(overrides.primitiveStyles ?? {}) };
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
    const primitiveViewportStyles = { ...(overrides.primitiveViewportStyles ?? {}) };
    const scopedDefaults = primitiveViewportStyles[primitivePath]?.default;
    if (scopedDefaults) {
      const nextDefaults = { ...scopedDefaults };
      delete nextDefaults[key];
      const nextScopes = { ...(primitiveViewportStyles[primitivePath] ?? {}) };
      if (Object.keys(nextDefaults).length === 0) {
        delete nextScopes.default;
      } else {
        nextScopes.default = nextDefaults;
      }
      const cleaned = cleanupScopedMap(nextScopes);
      if (!cleaned) {
        delete primitiveViewportStyles[primitivePath];
      } else {
        primitiveViewportStyles[primitivePath] = cleaned;
      }
    }
    return {
      ...overrides,
      primitiveStyles: Object.keys(primitiveStyles).length > 0 ? primitiveStyles : undefined,
      primitiveViewportStyles:
        Object.keys(primitiveViewportStyles).length > 0 ? primitiveViewportStyles : undefined,
    };
  }

  const primitiveViewportStyles = { ...(overrides.primitiveViewportStyles ?? {}) };
  const targetScopes = {
    ...(primitiveViewportStyles[primitivePath] ?? {}),
    [scope]: {
      ...(primitiveViewportStyles[primitivePath]?.[scope] ?? {}),
      [key]: value,
    },
  } as ResponsiveStyleValues<PrimitiveStyleValues>;

  if (!value.trim()) {
    const scopeValues = { ...(targetScopes[scope] ?? {}) };
    delete scopeValues[key];
    if (Object.keys(scopeValues).length === 0) {
      delete targetScopes[scope];
    } else {
      targetScopes[scope] = scopeValues;
    }
  }

  const cleanedTarget = cleanupScopedMap(targetScopes);
  if (!cleanedTarget) {
    delete primitiveViewportStyles[primitivePath];
  } else {
    primitiveViewportStyles[primitivePath] = cleanedTarget;
  }
  return {
    ...overrides,
    primitiveViewportStyles:
      Object.keys(primitiveViewportStyles).length > 0 ? primitiveViewportStyles : undefined,
  };
}

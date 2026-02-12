import type {
  BlockInstance,
  PrimitiveStyleKey,
  PrimitiveStyleValues,
  ResponsiveStyleValues,
  SectionStyleKey,
  SectionStyleValues,
  StyleViewportKey,
} from "./types";

export type BuilderViewport = "default" | "mobile" | "tablet" | "desktop" | "wide";

export function editScopeFromViewport(viewport: BuilderViewport): StyleViewportKey {
  return viewport;
}

function resolvedScopeOrder(scope: BuilderViewport): StyleViewportKey[] {
  if (scope === "default") {
    return ["default"];
  }
  return ["default", scope];
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
  scope: BuilderViewport
): string | undefined {
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
  scope: BuilderViewport
): string | undefined {
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
  scope: StyleViewportKey
): string {
  if (scope === "default") {
    return String(overrides[key] ?? "");
  }
  return String(overrides.viewportStyles?.[scope]?.[key] ?? "");
}

export function getExplicitPrimitiveStyleValue(
  overrides: BlockInstance["styleOverrides"],
  primitivePath: string,
  key: PrimitiveStyleKey,
  scope: StyleViewportKey
): string {
  if (scope === "default") {
    return String(overrides.primitiveStyles?.[primitivePath]?.[key] ?? "");
  }
  return String(overrides.primitiveViewportStyles?.[primitivePath]?.[scope]?.[key] ?? "");
}

export function setSectionStyleInOverrides(
  overrides: BlockInstance["styleOverrides"],
  key: SectionStyleKey,
  value: string,
  scope: StyleViewportKey
): BlockInstance["styleOverrides"] {
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
  scope: StyleViewportKey
): BlockInstance["styleOverrides"] {
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

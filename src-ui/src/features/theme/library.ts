import { normalizeThemeTokens, type ThemeRecord, type ThemeTokens } from "./types";

export type BundledThemeDefinition = {
  id: string;
  name: string;
  description: string;
  order?: number;
  tokens: Partial<ThemeTokens>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function bundled(input: BundledThemeDefinition): ThemeRecord {
  const stamp = nowIso();
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    source: "bundled",
    createdAt: stamp,
    updatedAt: stamp,
    tokens: normalizeThemeTokens(input.tokens),
  };
}

const themeModules = import.meta.glob<{ default: BundledThemeDefinition }>("./templates/*.ts", {
  eager: true,
});

const bundledDefinitions = Object.values(themeModules)
  .map((module) => module.default)
  .filter((definition): definition is BundledThemeDefinition => Boolean(definition))
  .sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.id.localeCompare(b.id);
  });

export const BUNDLED_THEMES: ThemeRecord[] = bundledDefinitions.map(bundled);

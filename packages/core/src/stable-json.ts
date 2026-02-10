import type { Json } from "./types";

function sortDeep(value: Json): Json {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }

  if (value && typeof value === "object") {
    const sortedEntries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, sortDeep(nested)] as const);

    return Object.fromEntries(sortedEntries);
  }

  return value;
}

export function stableStringify(value: Json, spacing = 2): string {
  return `${JSON.stringify(sortDeep(value), null, spacing)}\n`;
}

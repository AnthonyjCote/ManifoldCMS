import type { PrimitiveStyleKey, SectionStyleKey, StyleStateKey, StyleViewportKey } from "./types";

export type StyleFieldJumpTarget = {
  blockId: string;
  primitivePath: string | null;
};

export type StyleFieldKey = PrimitiveStyleKey | SectionStyleKey;

export type StyleFieldRef = StyleFieldJumpTarget & {
  viewport: StyleViewportKey;
  state: StyleStateKey;
  fieldKey: StyleFieldKey;
};

function enc(value: string): string {
  return encodeURIComponent(value);
}

function dec(value: string): string {
  return decodeURIComponent(value);
}

export function buildStyleFieldId(ref: StyleFieldRef): string {
  return [
    "sf",
    `b:${enc(ref.blockId)}`,
    `p:${enc(ref.primitivePath ?? "-")}`,
    `v:${ref.viewport}`,
    `s:${ref.state}`,
    `k:${enc(ref.fieldKey)}`,
  ].join("|");
}

export function parseStyleFieldId(input: string): StyleFieldRef | null {
  const parts = input.split("|");
  if (parts.length !== 6 || parts[0] !== "sf") {
    return null;
  }
  const [, blockPart, primitivePart, viewportPart, statePart, fieldPart] = parts;
  if (
    !blockPart.startsWith("b:") ||
    !primitivePart.startsWith("p:") ||
    !viewportPart.startsWith("v:") ||
    !statePart.startsWith("s:") ||
    !fieldPart.startsWith("k:")
  ) {
    return null;
  }
  const primitiveRaw = dec(primitivePart.slice(2));
  return {
    blockId: dec(blockPart.slice(2)),
    primitivePath: primitiveRaw === "-" ? null : primitiveRaw,
    viewport: viewportPart.slice(2) as StyleViewportKey,
    state: statePart.slice(2) as StyleStateKey,
    fieldKey: dec(fieldPart.slice(2)) as StyleFieldKey,
  };
}

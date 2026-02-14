import type { BlockFieldSchema, BlockInstance, PrimitiveNode } from "../types";

export function text(block: BlockInstance, key: string, fallback: string): string {
  const raw = block.props[key];
  if (typeof raw !== "string") {
    return fallback;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function lines(block: BlockInstance, key: string, fallback: string[]): string[] {
  const raw = block.props[key];
  if (typeof raw !== "string") {
    return fallback;
  }
  const parsed = raw
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return parsed.length > 0 ? parsed : fallback;
}

export function splitRows(input: string[]): string[][] {
  return input.map((row) => row.split("|").map((value) => value.trim()));
}

export function boundedCount(
  block: BlockInstance,
  key: string,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = Number.parseInt(text(block, key, String(fallback)), 10);
  if (Number.isNaN(raw)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, raw));
}

export function fieldOrLegacyLine(
  block: BlockInstance,
  fieldKey: string,
  legacyKey: string,
  legacyIndex: number,
  fallback: string
): string {
  const value = text(block, fieldKey, "");
  if (value.length > 0) {
    return value;
  }
  const legacy = lines(block, legacyKey, []);
  return legacy[legacyIndex] || fallback;
}

export function fieldOrLegacySplit(
  block: BlockInstance,
  fieldKey: string,
  legacyKey: string,
  rowIndex: number,
  partIndex: number,
  fallback: string
): string {
  const value = text(block, fieldKey, "");
  if (value.length > 0) {
    return value;
  }
  const legacyRows = splitRows(lines(block, legacyKey, []));
  return legacyRows[rowIndex]?.[partIndex] || fallback;
}

export function makeCardFields(
  countKey: string,
  countLabel: string,
  maxCards: number,
  perCard: Array<{ suffix: string; label: string; maxLength?: number }>
): BlockFieldSchema[] {
  const fields: BlockFieldSchema[] = [{ key: countKey, label: countLabel, type: "text" }];
  for (let index = 1; index <= maxCards; index += 1) {
    for (const schema of perCard) {
      fields.push({
        key: `card${index}${schema.suffix}`,
        label: `Card ${index} ${schema.label}`,
        type: "text",
        maxLength: schema.maxLength,
      });
    }
  }
  return fields;
}

export function parseCustomSectionPrimitives(raw: string): PrimitiveNode[] {
  const rows = raw
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (rows.length === 0) {
    return [];
  }
  return rows.map((row) => {
    const [type, ...rest] = row.split(":");
    const payload = rest.join(":").trim();
    const primitiveType = type.trim().toLowerCase();

    if (primitiveType === "heading") {
      return {
        type: "heading",
        props: { value: payload || "Lorem Ipsum Dolor Sit Amet", level: "h3" },
      };
    }
    if (primitiveType === "text") {
      return {
        type: "text",
        props: {
          value:
            payload ||
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
        },
      };
    }
    if (primitiveType === "image") {
      return { type: "image", props: { src: payload, alt: "Lorem ipsum image" } };
    }
    if (primitiveType === "button") {
      return { type: "button", props: { label: payload || "Lorem Ipsum", href: "#" } };
    }
    if (primitiveType === "code") {
      return { type: "code", props: { value: payload || "const lorem = 'ipsum';" } };
    }
    if (primitiveType === "video") {
      return { type: "video", props: { src: payload } };
    }
    if (primitiveType === "embed") {
      return { type: "embed", props: { value: payload || "Lorem ipsum embed placeholder." } };
    }
    if (primitiveType === "spacer") {
      return { type: "spacer", props: { size: Number(payload) || 24 } };
    }
    return { type: "text", props: { value: row } };
  });
}

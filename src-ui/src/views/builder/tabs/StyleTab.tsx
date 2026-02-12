import { useState } from "react";

import { buildPreviewTreeForBlock } from "../../../features/builder/catalog";
import { useBuilderStore } from "../../../features/builder/builder-store";
import {
  decodePrimitiveTarget,
  encodePrimitiveTarget,
} from "../../../features/builder/primitive-target";
import type { PrimitiveNode, PrimitiveType } from "../../../features/builder/types";

type BaseSectionStyleKey =
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
  | "translateX"
  | "translateY";

type SectionStyleKey = BaseSectionStyleKey | "backgroundImage";

type PrimitiveStyleKey =
  | BaseSectionStyleKey
  | "fontWeight"
  | "lineHeight"
  | "textAlign"
  | "width"
  | "height";

type AllStyleKey = SectionStyleKey | PrimitiveStyleKey;

type StyleCategory =
  | "Layout"
  | "Spacing"
  | "Border"
  | "Background"
  | "Typography"
  | "Effects"
  | "Transform";

type StyleFieldType = "text" | "color" | "select";

type MasterStyleField<K extends AllStyleKey> = {
  key: K;
  label: string;
  category: StyleCategory;
  type?: StyleFieldType;
  options?: string[];
  placeholder?: string;
};

type PrimitiveEntry = {
  path: string;
  type: PrimitiveType;
  label: string;
};

type StyleGroup<K extends AllStyleKey> = {
  category: StyleCategory;
  fields: MasterStyleField<K>[];
};

const CATEGORY_ORDER: StyleCategory[] = [
  "Layout",
  "Spacing",
  "Border",
  "Background",
  "Typography",
  "Effects",
  "Transform",
];

const MASTER_STYLE_FIELD_REGISTRY: Record<AllStyleKey, MasterStyleField<AllStyleKey>> = {
  width: {
    key: "width",
    label: "Width",
    category: "Layout",
    placeholder: "auto",
  },
  height: {
    key: "height",
    label: "Height",
    category: "Layout",
    placeholder: "auto",
  },
  marginTop: {
    key: "marginTop",
    label: "Margin Top",
    category: "Spacing",
    placeholder: "0px",
  },
  marginRight: {
    key: "marginRight",
    label: "Margin Right",
    category: "Spacing",
    placeholder: "0px",
  },
  marginBottom: {
    key: "marginBottom",
    label: "Margin Bottom",
    category: "Spacing",
    placeholder: "0px",
  },
  marginLeft: {
    key: "marginLeft",
    label: "Margin Left",
    category: "Spacing",
    placeholder: "0px",
  },
  paddingTop: {
    key: "paddingTop",
    label: "Padding Top",
    category: "Spacing",
    placeholder: "0px",
  },
  paddingRight: {
    key: "paddingRight",
    label: "Padding Right",
    category: "Spacing",
    placeholder: "0px",
  },
  paddingBottom: {
    key: "paddingBottom",
    label: "Padding Bottom",
    category: "Spacing",
    placeholder: "0px",
  },
  paddingLeft: {
    key: "paddingLeft",
    label: "Padding Left",
    category: "Spacing",
    placeholder: "0px",
  },
  borderWidth: {
    key: "borderWidth",
    label: "Border Width",
    category: "Border",
    placeholder: "1px",
  },
  borderStyle: {
    key: "borderStyle",
    label: "Border Style",
    category: "Border",
    type: "select",
    options: ["solid", "dashed", "dotted", "double", "none"],
  },
  borderColor: {
    key: "borderColor",
    label: "Border Color",
    category: "Border",
    type: "color",
    placeholder: "#dce3f2",
  },
  borderRadius: {
    key: "borderRadius",
    label: "Border Radius",
    category: "Border",
    placeholder: "12px",
  },
  backgroundColor: {
    key: "backgroundColor",
    label: "Background",
    category: "Background",
    type: "color",
    placeholder: "#ffffff",
  },
  backgroundImage: {
    key: "backgroundImage",
    label: "Background Image URL",
    category: "Background",
    placeholder: "https://...",
  },
  textColor: {
    key: "textColor",
    label: "Text Color",
    category: "Typography",
    type: "color",
    placeholder: "#11161f",
  },
  fontSize: {
    key: "fontSize",
    label: "Font Size",
    category: "Typography",
    placeholder: "16px",
  },
  fontWeight: {
    key: "fontWeight",
    label: "Font Weight",
    category: "Typography",
    placeholder: "400",
  },
  lineHeight: {
    key: "lineHeight",
    label: "Line Height",
    category: "Typography",
    placeholder: "1.5",
  },
  textAlign: {
    key: "textAlign",
    label: "Text Align",
    category: "Typography",
    type: "select",
    options: ["left", "center", "right", "justify"],
  },
  translateX: {
    key: "translateX",
    label: "Offset X",
    category: "Transform",
    placeholder: "0px",
  },
  translateY: {
    key: "translateY",
    label: "Offset Y",
    category: "Transform",
    placeholder: "0px",
  },
};

const SECTION_SUPPORTED_KEYS: SectionStyleKey[] = [
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderWidth",
  "borderStyle",
  "borderColor",
  "borderRadius",
  "backgroundColor",
  "backgroundImage",
  "textColor",
  "fontSize",
  "translateX",
  "translateY",
];

const PRIMITIVE_SUPPORTED_KEYS: PrimitiveStyleKey[] = [
  "width",
  "height",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderWidth",
  "borderStyle",
  "borderColor",
  "borderRadius",
  "backgroundColor",
  "textColor",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "textAlign",
  "translateX",
  "translateY",
];

const PRIMITIVE_EXCLUDED_KEYS: Record<PrimitiveType, PrimitiveStyleKey[]> = {
  heading: ["width", "height", "backgroundColor", "borderWidth", "borderStyle", "borderColor"],
  text: ["width", "height", "backgroundColor", "borderWidth", "borderStyle", "borderColor"],
  button: ["lineHeight", "textAlign", "width", "height"],
  image: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "backgroundColor"],
  video: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "backgroundColor"],
  embed: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "backgroundColor"],
  code: ["width", "height", "textAlign"],
  spacer: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "backgroundColor"],
  stack: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "width", "height"],
  columns: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "width", "height"],
  cards: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "width", "height"],
  details: ["width", "height", "textColor", "fontSize", "fontWeight", "lineHeight", "textAlign"],
};

function walkPrimitives(nodes: PrimitiveNode[], pathPrefix = ""): PrimitiveEntry[] {
  const out: PrimitiveEntry[] = [];
  nodes.forEach((node, index) => {
    const path = pathPrefix ? `${pathPrefix}.${index}` : String(index);
    out.push({
      path,
      type: node.type,
      label: `${node.type} ${index + 1}`,
    });
    if (node.children && node.children.length > 0) {
      out.push(...walkPrimitives(node.children, path));
    }
  });
  return out;
}

function buildStyleGroups<K extends AllStyleKey>(
  supportedKeys: K[],
  query: string,
  excludedKeys: ReadonlySet<K>
): StyleGroup<K>[] {
  const needle = query.trim().toLowerCase();
  const groups = new Map<StyleCategory, MasterStyleField<K>[]>();

  supportedKeys.forEach((key) => {
    if (excludedKeys.has(key)) {
      return;
    }
    const field = MASTER_STYLE_FIELD_REGISTRY[key] as MasterStyleField<K>;
    if (needle) {
      const haystack = `${field.label} ${field.key} ${field.category}`.toLowerCase();
      if (!haystack.includes(needle)) {
        return;
      }
    }
    const list = groups.get(field.category) ?? [];
    list.push(field);
    groups.set(field.category, list);
  });

  return CATEGORY_ORDER.map((category) => {
    const fields = groups.get(category) ?? [];
    return { category, fields };
  }).filter((group) => group.fields.length > 0);
}

function parseTranslateFromComputed(transform: string | null): { x: number; y: number } {
  if (!transform || transform === "none") {
    return { x: 0, y: 0 };
  }
  const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
  if (matrixMatch) {
    const parts = matrixMatch[1].split(",").map((part) => Number.parseFloat(part.trim()));
    if (parts.length === 6 && Number.isFinite(parts[4]) && Number.isFinite(parts[5])) {
      return { x: Math.round(parts[4]), y: Math.round(parts[5]) };
    }
  }
  const matrix3dMatch = transform.match(/matrix3d\(([^)]+)\)/);
  if (matrix3dMatch) {
    const parts = matrix3dMatch[1].split(",").map((part) => Number.parseFloat(part.trim()));
    if (parts.length === 16 && Number.isFinite(parts[12]) && Number.isFinite(parts[13])) {
      return { x: Math.round(parts[12]), y: Math.round(parts[13]) };
    }
  }
  return { x: 0, y: 0 };
}

function findBlockElement(blockId: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(".site-block[data-block-id]")).find(
      (element) => element.dataset.blockId === blockId
    ) ?? null
  );
}

function findPrimitiveElement(blockId: string, primitivePath: string): HTMLElement | null {
  const block = findBlockElement(blockId);
  if (!block) {
    return null;
  }
  return (
    Array.from(block.querySelectorAll<HTMLElement>("[data-primitive-path]")).find(
      (element) => element.dataset.primitivePath === primitivePath
    ) ?? null
  );
}

function readComputedStyleValue(
  element: HTMLElement,
  key: BaseSectionStyleKey | PrimitiveStyleKey
): string {
  const computed = window.getComputedStyle(element);
  switch (key) {
    case "marginTop":
      return computed.marginTop;
    case "marginRight":
      return computed.marginRight;
    case "marginBottom":
      return computed.marginBottom;
    case "marginLeft":
      return computed.marginLeft;
    case "paddingTop":
      return computed.paddingTop;
    case "paddingRight":
      return computed.paddingRight;
    case "paddingBottom":
      return computed.paddingBottom;
    case "paddingLeft":
      return computed.paddingLeft;
    case "borderWidth":
      return computed.borderTopWidth;
    case "borderStyle":
      return computed.borderTopStyle;
    case "borderColor":
      return computed.borderTopColor;
    case "borderRadius":
      return computed.borderRadius;
    case "backgroundColor":
      return computed.backgroundColor;
    case "textColor":
      return computed.color;
    case "fontSize":
      return computed.fontSize;
    case "fontWeight":
      return computed.fontWeight;
    case "lineHeight":
      return computed.lineHeight;
    case "textAlign":
      return computed.textAlign;
    case "width":
      return computed.width;
    case "height":
      return computed.height;
    case "translateX":
      return `${parseTranslateFromComputed(computed.transform).x}px`;
    case "translateY":
      return `${parseTranslateFromComputed(computed.transform).y}px`;
    default:
      return "";
  }
}

function renderStyleField<K extends AllStyleKey>(opts: {
  field: MasterStyleField<K>;
  value: string;
  placeholder?: string;
  setValue: (value: string) => void;
}) {
  const { field, value, setValue, placeholder } = opts;
  if (field.type === "select") {
    return (
      <select
        value={value || (field.options?.[0] ?? "")}
        onChange={(event) => setValue(event.target.value)}
      >
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "color") {
    return (
      <div className="style-color-row">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(event) => setValue(event.target.value)}
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder ?? field.placeholder}
          className="compact-input"
        />
      </div>
    );
  }
  return (
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder ?? field.placeholder}
      className="compact-input"
    />
  );
}

export function StyleTab() {
  const builder = useBuilderStore();
  const [query, setQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const block = builder.selectedBlock;

  if (!block) {
    return <div className="drawer-panel">Select a block to style.</div>;
  }

  const primitiveList = walkPrimitives(buildPreviewTreeForBlock(block));
  const selectedTargets = builder.state.selectedPrimitivePaths
    .map((target) => decodePrimitiveTarget(target))
    .filter((target) => target.blockId.length > 0);
  const selectedPaths = selectedTargets
    .filter((target) => target.blockId === block.id)
    .map((target) => target.primitivePath);
  const selectedSectionBlockIds =
    builder.state.selectedBlockIds.length > 0
      ? builder.state.selectedBlockIds
      : block
        ? [block.id]
        : [];
  const selectedSectionBlocks = selectedSectionBlockIds
    .map((blockId) => builder.selectedPage.blocks.find((entry) => entry.id === blockId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const selectedPath = selectedPaths[selectedPaths.length - 1] ?? null;
  const selectedPrimitive = selectedPath
    ? primitiveList.find((entry) => entry.path === selectedPath)
    : null;

  const primitiveStyleGroups = selectedPrimitive
    ? buildStyleGroups(
        PRIMITIVE_SUPPORTED_KEYS,
        query,
        new Set(PRIMITIVE_EXCLUDED_KEYS[selectedPrimitive.type] ?? [])
      )
    : ([] as StyleGroup<PrimitiveStyleKey>[]);

  const sectionStyleGroups = buildStyleGroups(
    SECTION_SUPPORTED_KEYS,
    query,
    new Set<SectionStyleKey>()
  );

  const currentGroups = selectedPrimitive ? primitiveStyleGroups : sectionStyleGroups;
  const collapseScope = selectedPrimitive ? `primitive:${selectedPrimitive.type}` : "section";

  return (
    <div className="drawer-stack style-tab-root">
      <section className="inspector-card-item">
        <h4>Target</h4>
        <label className="inspector-field compact">
          <span>
            Element
            {!selectedPrimitive && selectedSectionBlocks.length > 1
              ? ` (${selectedSectionBlocks.length} sections selected)`
              : ""}
          </span>
          <select
            value={selectedPrimitive?.path ?? ""}
            onChange={(event) =>
              builder.selectPrimitiveTarget(
                block.id,
                event.target.value ? event.target.value : null
              )
            }
          >
            <option value="">Section</option>
            {primitiveList.map((entry) => (
              <option key={entry.path} value={entry.path}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="inspector-card-item style-tab-search-sticky">
        <label className="inspector-field compact">
          <span>Find style field</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search margin, color, border..."
            className="compact-input"
          />
        </label>
      </section>

      {currentGroups.length === 0 ? (
        <section className="inspector-card-item">
          <h4>No fields found</h4>
          <div className="drawer-panel">Try a different search term.</div>
        </section>
      ) : (
        currentGroups.map((group) => {
          const groupKey = `${collapseScope}:${group.category}`;
          const collapsed = collapsedGroups[groupKey] ?? true;
          return (
            <section key={groupKey} className="inspector-card-item style-group-card">
              <button
                className="style-group-toggle"
                onClick={() =>
                  setCollapsedGroups((prev) => ({
                    ...prev,
                    [groupKey]: !collapsed,
                  }))
                }
                aria-expanded={!collapsed}
              >
                <h4>{group.category}</h4>
                <span>{collapsed ? "+" : "−"}</span>
              </button>

              {!collapsed ? (
                <div className="inspector-card-grid">
                  {group.fields.map((field) => {
                    if (selectedPrimitive) {
                      const primitiveSelectionTargets =
                        selectedTargets.length > 0
                          ? selectedTargets
                          : selectedPaths.map((path) => ({
                              blockId: block.id,
                              primitivePath: path,
                            }));
                      const valuesForSelection = primitiveSelectionTargets.map((target) => {
                        const targetBlock = builder.selectedPage.blocks.find(
                          (entry) => entry.id === target.blockId
                        );
                        return String(
                          targetBlock?.styleOverrides.primitiveStyles?.[target.primitivePath]?.[
                            field.key as PrimitiveStyleKey
                          ] ?? ""
                        );
                      });
                      const firstValue = valuesForSelection[0] ?? "";
                      const value = valuesForSelection.every((entry) => entry === firstValue)
                        ? firstValue
                        : "";
                      const placeholderValues = primitiveSelectionTargets.map((target) => {
                        const element = findPrimitiveElement(target.blockId, target.primitivePath);
                        if (!element) {
                          return "";
                        }
                        return readComputedStyleValue(element, field.key as PrimitiveStyleKey);
                      });
                      const placeholder =
                        placeholderValues.length > 0 &&
                        placeholderValues.every((entry) => entry === placeholderValues[0])
                          ? placeholderValues[0]
                          : "Mixed values";
                      const targetIds = primitiveSelectionTargets.map((target) =>
                        encodePrimitiveTarget(target.blockId, target.primitivePath)
                      );
                      return (
                        <label key={field.key} className="inspector-field compact">
                          <span>{field.label}</span>
                          {renderStyleField({
                            field,
                            value,
                            placeholder,
                            setValue: (next) =>
                              builder.setPrimitiveStyleForTargets(
                                targetIds,
                                field.key as PrimitiveStyleKey,
                                next
                              ),
                          })}
                        </label>
                      );
                    }

                    const sectionField = field.key as SectionStyleKey;
                    const sectionValues = selectedSectionBlocks.map((entry) =>
                      String(entry.styleOverrides[sectionField] ?? "")
                    );
                    const firstValue = sectionValues[0] ?? "";
                    const value = sectionValues.every((entry) => entry === firstValue)
                      ? firstValue
                      : "";
                    const placeholderValues = selectedSectionBlockIds.map((blockId) => {
                      const element = findBlockElement(blockId);
                      if (!element) {
                        return "";
                      }
                      if (sectionField === "backgroundImage") {
                        return window.getComputedStyle(element).backgroundImage;
                      }
                      return readComputedStyleValue(
                        element,
                        sectionField as BaseSectionStyleKey | PrimitiveStyleKey
                      );
                    });
                    const placeholder =
                      placeholderValues.length > 0 &&
                      placeholderValues.every((entry) => entry === placeholderValues[0])
                        ? placeholderValues[0]
                        : "Mixed values";
                    return (
                      <label key={field.key} className="inspector-field compact">
                        <span>{field.label}</span>
                        {renderStyleField({
                          field,
                          value,
                          placeholder,
                          setValue: (next) =>
                            builder.setBlockStyleForBlocks(
                              selectedSectionBlockIds,
                              sectionField,
                              next
                            ),
                        })}
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })
      )}
    </div>
  );
}

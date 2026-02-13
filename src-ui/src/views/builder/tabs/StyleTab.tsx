import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { buildPreviewTreeForBlock } from "../../../features/builder/catalog";
import { useBuilderStore } from "../../../features/builder/builder-store";
import {
  decodePrimitiveTarget,
  encodePrimitiveTarget,
} from "../../../features/builder/primitive-target";
import {
  editScopeFromViewport,
  getExplicitPrimitiveStyleValue,
  getExplicitSectionStyleValue,
  getPrimitiveStyleValue,
  getSectionStyleValue,
  type BuilderViewport,
} from "../../../features/builder/style-scopes";
import { useBuilderInteractionModeStore } from "../../../state/useBuilderInteractionModeStore";
import { useBuilderStylePreviewStateStore } from "../../../state/useBuilderStylePreviewStateStore";
import { useDrawerTabScrollPersistence } from "../../../state/useDrawerTabScrollPersistence";
import type { PrimitiveNode, PrimitiveType, StyleStateKey } from "../../../features/builder/types";
import { useBuilderViewportStore } from "../../../state/useBuilderViewportStore";

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

type FieldValueStatus = "edited" | "inherited" | "uninitialized";
type FieldFilterMode = "all" | FieldValueStatus;

const STYLE_TAB_COLLAPSE_KEY = "manifold.builder.style-tab.collapsed-groups";
function readCollapsedGroupState(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(STYLE_TAB_COLLAPSE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

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

const SCOPE_LABELS: Record<string, string> = {
  default: "Default",
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
  wide: "Retina/Wide",
};

const VIEWPORT_LABELS: Record<BuilderViewport, string> = {
  default: "Default (Base)",
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop / Laptop / HD",
  wide: "Retina / Wide / UHD",
};

const VIEWPORT_MENU_ORDER: BuilderViewport[] = [
  "default",
  "mobile",
  "tablet",
  "desktop",
  "wide",
];

const FIELD_FILTER_OPTIONS: Array<{
  value: FieldFilterMode;
  label: string;
}> = [
  { value: "all", label: "All fields" },
  { value: "edited", label: "Edited" },
  { value: "inherited", label: "Inherited" },
  { value: "uninitialized", label: "Uninitialized" },
];

const STYLE_STATES: Array<{
  id: Exclude<StyleStateKey, "default">;
  label: string;
  icon: ReactElement;
}> = [
  {
    id: "hover",
    label: "Hover",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 4 10 7-4 1.2L14.8 20l-2.6 1L9.4 13l-3.4 2Z" />
      </svg>
    ),
  },
];

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

function resolveFieldValueStatus(explicitValue: string, resolvedValue: string): FieldValueStatus {
  if (explicitValue.trim().length > 0) {
    return "edited";
  }
  if (resolvedValue.trim().length > 0) {
    return "inherited";
  }
  return "uninitialized";
}

function matchesFieldFilter(status: FieldValueStatus, filter: FieldFilterMode): boolean {
  return filter === "all" || filter === status;
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
  inherited?: boolean;
  setValue: (value: string) => void;
  colorFieldId?: string;
  openColorFieldId?: string | null;
  onToggleColorField?: (fieldId: string, input: HTMLInputElement | null) => void;
  onColorInputBlur?: (fieldId: string) => void;
}) {
  const {
    field,
    value,
    setValue,
    placeholder,
    inherited = false,
    colorFieldId,
    openColorFieldId,
    onToggleColorField,
    onColorInputBlur,
  } = opts;
  if (field.type === "select") {
    return (
      <select
        className={inherited ? "inherited" : undefined}
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
    const fieldId = colorFieldId ?? String(field.key);
    const isOpen = openColorFieldId === fieldId;
    return (
      <div className="style-color-row">
        <button
          type="button"
          className={`style-color-swatch-btn${isOpen ? " open" : ""}${inherited ? " inherited" : ""}`}
          style={{ backgroundColor: value || "#000000" }}
          onClick={(event) => {
            const row = event.currentTarget.closest(".style-color-row");
            const input = row?.querySelector<HTMLInputElement>(".style-color-native-input") ?? null;
            onToggleColorField?.(fieldId, input);
          }}
          aria-label={`Toggle ${field.label} color picker`}
          title={`Toggle ${field.label} color picker`}
        />
        <input
          type="color"
          value={value || "#000000"}
          onBlur={() => onColorInputBlur?.(fieldId)}
          onChange={(event) => setValue(event.target.value)}
          className="style-color-native-input"
          tabIndex={-1}
          aria-hidden="true"
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder ?? field.placeholder}
          className={`compact-input${inherited ? " inherited" : ""}`}
        />
      </div>
    );
  }
  return (
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder ?? field.placeholder}
      className={`compact-input${inherited ? " inherited" : ""}`}
    />
  );
}

export function StyleTab() {
  const builder = useBuilderStore();
  const scrollRootRef = useDrawerTabScrollPersistence("manifold.builder.drawer-scroll.style");
  const interaction = useBuilderInteractionModeStore();
  const stylePreviewState = useBuilderStylePreviewStateStore();
  const viewport = useBuilderViewportStore();
  const [query, setQuery] = useState("");
  const [scopePopoverOpen, setScopePopoverOpen] = useState(false);
  const [fieldFilterPopoverOpen, setFieldFilterPopoverOpen] = useState(false);
  const [fieldFilter, setFieldFilter] = useState<FieldFilterMode>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() =>
    readCollapsedGroupState()
  );
  const [fieldStates, setFieldStates] = useState<Record<string, StyleStateKey>>({});
  const [openColorFieldId, setOpenColorFieldId] = useState<string | null>(null);
  const scopePopoverRef = useRef<HTMLDivElement | null>(null);
  const fieldFilterPopoverRef = useRef<HTMLDivElement | null>(null);
  const editScope = editScopeFromViewport(viewport.viewport);
  const block = builder.selectedBlock;

  useEffect(() => {
    window.localStorage.setItem(STYLE_TAB_COLLAPSE_KEY, JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  useEffect(() => {
    if (!scopePopoverOpen) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!scopePopoverRef.current) {
        return;
      }
      if (scopePopoverRef.current.contains(event.target as Node)) {
        return;
      }
      setScopePopoverOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setScopePopoverOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [scopePopoverOpen]);

  useEffect(() => {
    if (!fieldFilterPopoverOpen) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!fieldFilterPopoverRef.current) {
        return;
      }
      if (fieldFilterPopoverRef.current.contains(event.target as Node)) {
        return;
      }
      setFieldFilterPopoverOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFieldFilterPopoverOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fieldFilterPopoverOpen]);

  const selectedTargets = useMemo(
    () =>
      builder.state.selectedPrimitivePaths
        .map((target) => decodePrimitiveTarget(target))
        .filter((target) => target.blockId.length > 0),
    [builder.state.selectedPrimitivePaths]
  );
  const selectedPrimitiveTargetIds = useMemo(
    () =>
      selectedTargets
        .map((target) => encodePrimitiveTarget(target.blockId, target.primitivePath))
        .sort(),
    [selectedTargets]
  );
  const primitiveSelectionScopeKey =
    selectedPrimitiveTargetIds.length > 0
      ? selectedPrimitiveTargetIds.join("|")
      : block
        ? `${block.id}:none`
        : "none";
  const selectedSectionBlockIds = useMemo(
    () =>
      builder.state.selectedBlockIds.length > 0
        ? [...builder.state.selectedBlockIds].sort()
        : block
          ? [block.id]
          : [],
    [block, builder.state.selectedBlockIds]
  );
  const sectionSelectionScopeKey =
    selectedSectionBlockIds.length > 0 ? selectedSectionBlockIds.join("|") : "none";

  const getTargetPrefix = useCallback(
    (isPrimitiveTarget: boolean): string =>
      isPrimitiveTarget
        ? `primitive:${primitiveSelectionScopeKey}`
        : `section:${sectionSelectionScopeKey}`,
    [primitiveSelectionScopeKey, sectionSelectionScopeKey]
  );

  const getFieldState = (fieldKey: string, isPrimitiveTarget: boolean): StyleStateKey => {
    const targetPrefix = getTargetPrefix(isPrimitiveTarget);
    return fieldStates[`${targetPrefix}:${fieldKey}`] ?? "default";
  };

  const toggleFieldState = (
    fieldKey: string,
    next: Exclude<StyleStateKey, "default">,
    isPrimitiveTarget: boolean
  ) => {
    const targetPrefix = getTargetPrefix(isPrimitiveTarget);
    const stateKey = `${targetPrefix}:${fieldKey}`;
    setFieldStates((prev) => ({
      ...prev,
      [stateKey]: prev[stateKey] === next ? "default" : next,
    }));
  };

  useEffect(() => {
    if (!block || interaction.mode !== "edit") {
      stylePreviewState.clear();
      return;
    }
    const primitivePrefix = getTargetPrefix(true);
    const sectionPrefix = getTargetPrefix(false);
    const primitiveHoverActive = Object.entries(fieldStates).some(
      ([key, state]) => key.startsWith(`${primitivePrefix}:`) && state === "hover"
    );
    const sectionHoverActive = Object.entries(fieldStates).some(
      ([key, state]) => key.startsWith(`${sectionPrefix}:`) && state === "hover"
    );

    const nextPreviewState = {
      hoverPrimitiveTargets: primitiveHoverActive ? selectedPrimitiveTargetIds : [],
      hoverSectionBlockIds:
        primitiveHoverActive ? [] : sectionHoverActive ? selectedSectionBlockIds : [],
    };
    stylePreviewState.setState(nextPreviewState);
  }, [
    block,
    fieldStates,
    interaction.mode,
    getTargetPrefix,
    primitiveSelectionScopeKey,
    sectionSelectionScopeKey,
    selectedPrimitiveTargetIds,
    selectedSectionBlockIds,
    stylePreviewState,
  ]);

  if (!block) {
    if (interaction.mode === "preview") {
      return (
        <div className="drawer-panel style-mode-notice">
          <span className="builder-empty-pill">
            <span className="dot" />
            Preview mode
          </span>
          <p>Style editing is disabled while preview mode is active.</p>
          <button className="style-mode-action" onClick={() => interaction.setMode("edit")}>
            Switch to Edit Mode
          </button>
        </div>
      );
    }
    return (
      <div className="drawer-panel builder-empty-notice">
        <span className="builder-empty-pill">
          <span className="dot" />
          Style
        </span>
        <p>Select a block to style.</p>
      </div>
    );
  }

  const primitiveList = walkPrimitives(buildPreviewTreeForBlock(block));
  const selectedPaths = selectedTargets
    .filter((target) => target.blockId === block.id)
    .map((target) => target.primitivePath);
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

  const onColorInputBlur = (fieldId: string) => {
    if (openColorFieldId === fieldId) {
      setOpenColorFieldId(null);
    }
  };

  const toggleColorField = (fieldId: string, input: HTMLInputElement | null) => {
    if (!input) {
      return;
    }
    if (openColorFieldId === fieldId) {
      setOpenColorFieldId(null);
      input.blur();
      return;
    }
    setOpenColorFieldId(fieldId);
    if ("showPicker" in input && typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  };

  const scopeIndicatorText = `${interaction.mode === "edit" ? "Edit" : "Preview"}: ${SCOPE_LABELS[editScope]}`;
  const fieldScopeLabelPrefix = SCOPE_LABELS[editScope];

  return (
    <div ref={scrollRootRef} className="drawer-stack style-tab-root">
      <section className="inspector-card-item style-tab-topbar">
        <label className="inspector-field compact">
          <span className="style-tab-topbar-label">Find style field</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search margin, color, border..."
            className="compact-input"
          />
        </label>
        <div className="style-tab-topbar-controls">
          <div ref={scopePopoverRef} className="style-tab-scope-control">
            <button
              type="button"
              className="style-tab-scope-indicator"
              aria-live="polite"
              aria-expanded={scopePopoverOpen}
              aria-haspopup="menu"
              onClick={() => setScopePopoverOpen((prev) => !prev)}
              title="Change viewport"
            >
              <span className="dot" />
              {scopeIndicatorText}
              <span className="caret">▾</span>
            </button>
            {scopePopoverOpen ? (
              <div className="style-tab-scope-popover" role="menu" aria-label="Select viewport">
                {VIEWPORT_MENU_ORDER.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    role="menuitemradio"
                    aria-checked={viewport.viewport === entry}
                    className={`style-tab-scope-option${
                      viewport.viewport === entry ? " active" : ""
                    }`}
                    onClick={() => {
                      viewport.setViewport(entry);
                      setScopePopoverOpen(false);
                    }}
                  >
                    <span className="label">{SCOPE_LABELS[entry]}</span>
                    <span className="meta">{VIEWPORT_LABELS[entry]}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div ref={fieldFilterPopoverRef} className="style-tab-filter-control">
            <button
              type="button"
              className="style-tab-filter-indicator"
              aria-expanded={fieldFilterPopoverOpen}
              aria-haspopup="menu"
              onClick={() => setFieldFilterPopoverOpen((prev) => !prev)}
              title="Filter style fields"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16l-6 7v5l-4 2v-7z" />
              </svg>
              {FIELD_FILTER_OPTIONS.find((entry) => entry.value === fieldFilter)?.label ??
                "All fields"}
              <span className="caret">▾</span>
            </button>
            {fieldFilterPopoverOpen ? (
              <div className="style-tab-filter-popover" role="menu" aria-label="Filter fields">
                {FIELD_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={fieldFilter === option.value}
                    className={`style-tab-filter-option${
                      fieldFilter === option.value ? " active" : ""
                    }`}
                    onClick={() => {
                      setFieldFilter(option.value);
                      setFieldFilterPopoverOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="inspector-card-item style-target-card">
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

      {currentGroups.length === 0 ? (
        <section className="inspector-card-item">
          <h4>No fields found</h4>
          <div className="drawer-panel">Try a different search term.</div>
        </section>
      ) : (
        <div className="style-group-list drawer-accordion-list">
          {currentGroups.map((group) => {
            const groupKey = `${collapseScope}:${group.category}`;
            const collapsed = collapsedGroups[groupKey] ?? true;
            const fieldRows = group.fields
              .map((field) => {
                const activeFieldState = getFieldState(String(field.key), Boolean(selectedPrimitive));
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
                    if (!targetBlock) {
                      return "";
                    }
                    return (
                      getPrimitiveStyleValue(
                        targetBlock.styleOverrides,
                        target.primitivePath,
                        field.key as PrimitiveStyleKey,
                        editScope,
                        activeFieldState
                      ) ?? ""
                    );
                  });
                  const explicitValuesForSelection = primitiveSelectionTargets.map((target) => {
                    const targetBlock = builder.selectedPage.blocks.find(
                      (entry) => entry.id === target.blockId
                    );
                    if (!targetBlock) {
                      return "";
                    }
                    return getExplicitPrimitiveStyleValue(
                      targetBlock.styleOverrides,
                      target.primitivePath,
                      field.key as PrimitiveStyleKey,
                      editScope,
                      activeFieldState
                    );
                  });
                  const firstValue = valuesForSelection[0] ?? "";
                  const value = valuesForSelection.every((entry) => entry === firstValue)
                    ? firstValue
                    : "";
                  const explicitFirst = explicitValuesForSelection[0] ?? "";
                  const explicitValue = explicitValuesForSelection.every(
                    (entry) => entry === explicitFirst
                  )
                    ? explicitFirst
                    : "";
                  const status = resolveFieldValueStatus(explicitValue, value);
                  const inherited = status === "inherited";
                  if (!matchesFieldFilter(status, fieldFilter)) {
                    return null;
                  }
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
                    <div key={field.key} className="inspector-field compact">
                      <span className="style-field-label-row">
                        <span
                          className={`style-field-status-dot ${status}`}
                          title={
                            status === "edited"
                              ? `Edited in ${SCOPE_LABELS[editScope]}`
                              : status === "inherited"
                                ? `Inherited from Default`
                                : `Uninitialized`
                          }
                          aria-hidden="true"
                        />
                        <span className="style-field-label-text">
                          <span className="style-field-scope-prefix">{fieldScopeLabelPrefix}</span>{" "}
                          {field.label}
                        </span>
                        <span className="style-field-state-chips">
                          {STYLE_STATES.map((stateOption) => (
                            <button
                              key={stateOption.id}
                              type="button"
                              aria-pressed={activeFieldState === stateOption.id}
                              className={`style-state-chip${
                                activeFieldState === stateOption.id ? " active" : ""
                              }`}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                toggleFieldState(
                                  String(field.key),
                                  stateOption.id,
                                  Boolean(selectedPrimitive)
                                );
                              }}
                              title={stateOption.label}
                              aria-label={stateOption.label}
                            >
                              {stateOption.icon}
                            </button>
                          ))}
                        </span>
                        <small
                          className={`style-scope-badge${
                            activeFieldState !== "default" ? " state-active" : ""
                          }`}
                        >
                          {activeFieldState === "default" ? SCOPE_LABELS[editScope] : "Hover"}
                        </small>
                      </span>
                      {renderStyleField({
                        field,
                        value,
                        inherited,
                        placeholder,
                        colorFieldId: `primitive:${String(field.key)}`,
                        openColorFieldId,
                        onToggleColorField: toggleColorField,
                        onColorInputBlur,
                        setValue: (next) =>
                          builder.setPrimitiveStyleForTargets(
                            targetIds,
                            field.key as PrimitiveStyleKey,
                            next,
                            editScope,
                            activeFieldState
                          ),
                      })}
                    </div>
                  );
                }

                const sectionField = field.key as SectionStyleKey;
                const sectionValues = selectedSectionBlocks.map(
                  (entry) =>
                    getSectionStyleValue(
                      entry.styleOverrides,
                      sectionField,
                      editScope,
                      activeFieldState
                    ) ?? ""
                );
                const explicitSectionValues = selectedSectionBlocks.map((entry) =>
                  getExplicitSectionStyleValue(
                    entry.styleOverrides,
                    sectionField,
                    editScope,
                    activeFieldState
                  )
                );
                const firstValue = sectionValues[0] ?? "";
                const value = sectionValues.every((entry) => entry === firstValue)
                  ? firstValue
                  : "";
                const explicitFirst = explicitSectionValues[0] ?? "";
                const explicitValue = explicitSectionValues.every((entry) => entry === explicitFirst)
                  ? explicitFirst
                  : "";
                const status = resolveFieldValueStatus(explicitValue, value);
                const inherited = status === "inherited";
                if (!matchesFieldFilter(status, fieldFilter)) {
                  return null;
                }
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
                  <div key={field.key} className="inspector-field compact">
                    <span className="style-field-label-row">
                      <span
                        className={`style-field-status-dot ${status}`}
                        title={
                          status === "edited"
                            ? `Edited in ${SCOPE_LABELS[editScope]}`
                            : status === "inherited"
                              ? `Inherited from Default`
                              : `Uninitialized`
                        }
                        aria-hidden="true"
                      />
                      <span className="style-field-label-text">
                        <span className="style-field-scope-prefix">{fieldScopeLabelPrefix}</span>{" "}
                        {field.label}
                      </span>
                      <span className="style-field-state-chips">
                        {STYLE_STATES.map((stateOption) => (
                          <button
                            key={stateOption.id}
                            type="button"
                            aria-pressed={activeFieldState === stateOption.id}
                            className={`style-state-chip${
                              activeFieldState === stateOption.id ? " active" : ""
                            }`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              toggleFieldState(
                                String(field.key),
                                stateOption.id,
                                Boolean(selectedPrimitive)
                              );
                            }}
                            title={stateOption.label}
                            aria-label={stateOption.label}
                          >
                            {stateOption.icon}
                          </button>
                        ))}
                      </span>
                      <small
                        className={`style-scope-badge${
                          activeFieldState !== "default" ? " state-active" : ""
                        }`}
                      >
                        {activeFieldState === "default" ? SCOPE_LABELS[editScope] : "Hover"}
                      </small>
                    </span>
                    {renderStyleField({
                      field,
                      value,
                      inherited,
                      placeholder,
                      colorFieldId: `section:${String(field.key)}`,
                      openColorFieldId,
                      onToggleColorField: toggleColorField,
                      onColorInputBlur,
                      setValue: (next) =>
                        builder.setBlockStyleForBlocks(
                          selectedSectionBlockIds,
                          sectionField,
                          next,
                          editScope,
                          activeFieldState
                        ),
                    })}
                  </div>
                );
              })
              .filter((entry): entry is ReactElement => entry !== null);

            if (fieldRows.length === 0) {
              return null;
            }
            return (
              <section
                key={groupKey}
                className="inspector-card-item style-group-card drawer-accordion-section"
              >
                <button
                  className="style-group-toggle drawer-accordion-toggle"
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
                  <div className="inspector-card-grid drawer-accordion-content">{fieldRows}</div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

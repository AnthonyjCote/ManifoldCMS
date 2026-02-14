import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { buildPreviewTreeForBlock } from "../../../features/builder/catalog";
import { useBuilderStore } from "../../../features/builder/builder-store";
import { PRIMITIVE_EXCLUDED_STYLE_KEYS } from "../../../features/builder/style-field-config";
import {
  decodePrimitiveTarget,
  encodePrimitiveTarget,
} from "../../../features/builder/primitive-target";
import { buildStyleFieldId } from "../../../features/builder/style-field-id";
import {
  editScopeFromViewport,
  getExplicitPrimitiveStyleValue,
  getExplicitSectionStyleValue,
  getPrimitiveStyleValue,
  getSectionStyleValue,
  resolvePrimitiveStyleOrigin,
  resolveSectionStyleOrigin,
  type BuilderViewport,
} from "../../../features/builder/style-scopes";
import {
  BUILDER_STYLE_JUMP_EVENT,
  requestStyleJump,
  type StyleJumpRequest,
} from "../../../features/builder/style-jump-service";
import {
  buildViewportMenuMetaLabels,
  VIEWPORT_MENU_ORDER,
  VIEWPORT_SCOPE_LABELS,
} from "../../../features/builder/viewport-menu";
import { useActiveProjectSession } from "../../../features/project-launcher/session";
import { useProjectSettings } from "../../../features/project-settings/useProjectSettings";
import { requestThemeTokenJump } from "../../../features/theme/theme-jump-service";
import { useProjectTheme } from "../../../features/theme/useProjectTheme";
import { useBuilderInteractionModeStore } from "../../../state/useBuilderInteractionModeStore";
import { useBuilderStylePreviewStateStore } from "../../../state/useBuilderStylePreviewStateStore";
import { useDrawerTabScrollPersistence } from "../../../state/useDrawerTabScrollPersistence";
import type {
  BlockType,
  PrimitiveNode,
  PrimitiveType,
  StyleStateKey,
} from "../../../features/builder/types";
import { useBuilderViewportStore } from "../../../state/useBuilderViewportStore";
import { useColorPickerToggle } from "../../../features/ui/useColorPickerToggle";
import type { ThemeTokens } from "../../../features/theme/types";

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
  className?: string;
};

type StyleGroup<K extends AllStyleKey> = {
  category: StyleCategory;
  fields: MasterStyleField<K>[];
};

type FieldValueStatus = "override" | "edited" | "inherited" | "theme" | "block" | "uninitialized";
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

const FIELD_FILTER_OPTIONS: Array<{
  value: FieldFilterMode;
  label: string;
}> = [
  { value: "all", label: "All fields" },
  { value: "override", label: "Override" },
  { value: "edited", label: "Edited" },
  { value: "inherited", label: "Inherited" },
  { value: "theme", label: "Theme" },
  { value: "block", label: "Block" },
  { value: "uninitialized", label: "Uninitialized" },
];

function viewportToneClass(viewport: BuilderViewport) {
  return `viewport-tone-${viewport}`;
}

function filterToneClass(filter: FieldFilterMode) {
  return `status-tone-${filter}`;
}

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

function safeCssEscape(value: string): string {
  if ("CSS" in window && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }
  return value.replace(/([^\w-])/g, "\\$1");
}

function walkPrimitives(nodes: PrimitiveNode[], pathPrefix = ""): PrimitiveEntry[] {
  const out: PrimitiveEntry[] = [];
  nodes.forEach((node, index) => {
    const path = pathPrefix ? `${pathPrefix}.${index}` : String(index);
    const className =
      typeof node.props?.className === "string" && node.props.className.trim().length > 0
        ? node.props.className.trim()
        : undefined;
    out.push({
      path,
      type: node.type,
      label: `${node.type} ${index + 1}`,
      className,
    });
    if (node.children && node.children.length > 0) {
      out.push(...walkPrimitives(node.children, path));
    }
  });
  return out;
}

function isCardLikePrimitive(primitiveType?: PrimitiveType, primitiveClassName?: string): boolean {
  if (primitiveType !== "stack" || !primitiveClassName) {
    return false;
  }
  const classNames = primitiveClassName.split(/\s+/).filter(Boolean);
  return classNames.some((entry) => entry === "feature-card" || entry === "logo-badge");
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

function resolveFieldValueStatus(opts: {
  hasExplicitCurrent: boolean;
  hasExplicitDefault: boolean;
  resolvedValue: string;
  computedValue: string;
  fieldKey: AllStyleKey;
  scope: BuilderViewport;
  themeTokens: ThemeTokens | null;
  themeSourceToken?: keyof ThemeTokens | null;
  hasThemeFallback?: boolean;
}): FieldValueStatus {
  const hasThemeSource = Boolean(opts.themeSourceToken);
  const hasThemeFallback = Boolean(opts.hasThemeFallback);
  if (
    opts.hasExplicitCurrent &&
    ((opts.scope !== "default" && opts.hasExplicitDefault) ||
      (opts.scope === "default" && (hasThemeSource || hasThemeFallback)))
  ) {
    return "override";
  }
  if (opts.hasExplicitCurrent) {
    return "edited";
  }
  if (opts.resolvedValue.trim().length > 0) {
    return "inherited";
  }
  if (opts.themeSourceToken) {
    return "theme";
  }
  if (isThemeFieldResolved(opts.fieldKey, opts.computedValue, opts.themeTokens)) {
    return "theme";
  }
  if (isBlockFieldResolved(opts.fieldKey, opts.computedValue)) {
    return "block";
  }
  return "uninitialized";
}

function normalizeRawCssValue(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeColorValue(value: string): string {
  if (typeof document === "undefined") {
    return normalizeRawCssValue(value);
  }
  const probe = document.createElement("span");
  probe.style.color = "";
  probe.style.color = value;
  const resolved = probe.style.color;
  if (!resolved) {
    return normalizeRawCssValue(value);
  }
  return normalizeRawCssValue(resolved);
}

function matchesAnyComputedValue(
  computedValue: string,
  candidates: string[],
  color = false
): boolean {
  const normalizedComputed = color
    ? normalizeColorValue(computedValue)
    : normalizeRawCssValue(computedValue);
  if (!normalizedComputed) {
    return false;
  }
  return candidates.some((candidate) => {
    const normalizedCandidate = color
      ? normalizeColorValue(candidate)
      : normalizeRawCssValue(candidate);
    return normalizedCandidate.length > 0 && normalizedCandidate === normalizedComputed;
  });
}

function isThemeFieldResolved(
  fieldKey: AllStyleKey,
  computedValue: string,
  themeTokens: ThemeTokens | null,
  blockType?: BlockType,
  primitiveType?: PrimitiveType,
  primitiveClassName?: string
): boolean {
  return (
    resolveThemeTokenSource(
      fieldKey,
      computedValue,
      themeTokens,
      blockType,
      primitiveType,
      primitiveClassName
    ) !== null
  );
}

function isBlockFieldResolved(fieldKey: AllStyleKey, computedValue: string): boolean {
  if (!computedValue.trim() || computedValue === "Mixed values") {
    return false;
  }
  const normalized = normalizeRawCssValue(computedValue);
  switch (fieldKey) {
    case "backgroundImage":
      return normalized !== "none";
    case "marginTop":
    case "marginRight":
    case "marginBottom":
    case "marginLeft":
    case "paddingTop":
    case "paddingRight":
    case "paddingBottom":
    case "paddingLeft":
    case "translateX":
    case "translateY":
    case "borderWidth":
    case "borderRadius":
    case "fontSize":
    case "fontWeight":
    case "lineHeight":
    case "width":
    case "height":
      return (
        normalized !== "0" && normalized !== "0px" && normalized !== "none" && normalized !== "auto"
      );
    case "borderStyle":
      return normalized !== "none";
    default:
      return false;
  }
}

function resolveThemeSectionBackgroundToken(blockType: BlockType): keyof ThemeTokens {
  if (blockType === "hero") {
    return "canvasBackground";
  }
  if (blockType === "faq") {
    return "mutedBackground";
  }
  if (blockType === "footer") {
    return "baseColor";
  }
  return "surfaceBackground";
}

function getThemeTokenCandidates(
  fieldKey: AllStyleKey,
  blockType?: BlockType,
  primitiveType?: PrimitiveType,
  primitiveClassName?: string
): Array<keyof ThemeTokens> {
  const isCardPrimitive = isCardLikePrimitive(primitiveType, primitiveClassName);
  switch (fieldKey) {
    case "backgroundColor": {
      const ordered: Array<keyof ThemeTokens> = [];
      if (isCardPrimitive) {
        ordered.push("cardBackground");
      }
      if (primitiveType === "button") {
        ordered.push("buttonBackground", "buttonAltBackground");
      }
      if (blockType) {
        ordered.push(resolveThemeSectionBackgroundToken(blockType));
      }
      ordered.push(
        "canvasBackground",
        "surfaceBackground",
        "mutedBackground",
        ...(isCardPrimitive ? [] : (["cardBackground"] as Array<keyof ThemeTokens>)),
        "buttonBackground",
        "buttonAltBackground",
        "buttonGhostBackground",
        "baseColor",
        "accentColor",
        "altColor"
      );
      return Array.from(new Set(ordered));
    }
    case "borderColor":
      return Array.from(
        new Set([
          ...(isCardPrimitive ? (["cardBorder"] as Array<keyof ThemeTokens>) : []),
          "cardBorder",
          "buttonPrimaryBorderColor",
          "buttonSecondaryBorderColor",
          "buttonGhostBorderColor",
          "accentColor",
          "altColor",
        ])
      );
    case "textColor":
      if (isCardPrimitive) {
        return [
          "textPrimary",
          "textSecondary",
          "headingColor",
          "linkColor",
          "buttonText",
          "buttonAltText",
        ];
      }
      if (primitiveType === "button") {
        return [
          "buttonText",
          "buttonAltText",
          "buttonGhostText",
          "textPrimary",
          "textSecondary",
          "headingColor",
          "linkColor",
        ];
      }
      if (primitiveType === "heading") {
        return [
          "headingColor",
          "textPrimary",
          "textSecondary",
          "linkColor",
          "buttonText",
          "buttonAltText",
        ];
      }
      return [
        "textPrimary",
        "textSecondary",
        "headingColor",
        "buttonText",
        "buttonAltText",
        "linkColor",
      ];
    case "fontSize":
      return ["fontSizeBody", "fontSizeH1", "fontSizeH2", "fontSizeH3"];
    case "fontWeight":
      return ["fontWeightBody", "fontWeightHeading"];
    case "lineHeight":
      return ["lineHeightBody", "lineHeightHeading"];
    case "borderWidth":
      return Array.from(
        new Set([
          ...(isCardPrimitive ? (["cardBorderWidth"] as Array<keyof ThemeTokens>) : []),
          "cardBorderWidth",
          "buttonPrimaryBorderWidth",
          "buttonSecondaryBorderWidth",
          "buttonGhostBorderWidth",
        ])
      );
    case "borderStyle":
      return Array.from(
        new Set([
          ...(isCardPrimitive ? (["cardBorderStyle"] as Array<keyof ThemeTokens>) : []),
          "cardBorderStyle",
          "buttonPrimaryBorderStyle",
          "buttonSecondaryBorderStyle",
          "buttonGhostBorderStyle",
        ])
      );
    case "borderRadius":
      return Array.from(
        new Set([
          ...(isCardPrimitive ? (["cardRadius"] as Array<keyof ThemeTokens>) : []),
          "cardRadius",
          "buttonRadius",
        ])
      );
    case "paddingLeft":
    case "paddingRight":
      return primitiveType === "button" ? ["buttonPaddingX"] : [];
    case "paddingTop":
    case "paddingBottom":
      return primitiveType === "button" ? ["buttonPaddingY"] : [];
    default:
      return [];
  }
}

function resolveThemeTokenSource(
  fieldKey: AllStyleKey,
  computedValue: string,
  themeTokens: ThemeTokens | null,
  blockType?: BlockType,
  primitiveType?: PrimitiveType,
  primitiveClassName?: string
): keyof ThemeTokens | null {
  if (!themeTokens || !computedValue.trim() || computedValue === "Mixed values") {
    return null;
  }
  const candidates = getThemeTokenCandidates(
    fieldKey,
    blockType,
    primitiveType,
    primitiveClassName
  );
  const isColorField =
    fieldKey === "backgroundColor" || fieldKey === "borderColor" || fieldKey === "textColor";
  for (const tokenKey of candidates) {
    if (matchesAnyComputedValue(computedValue, [themeTokens[tokenKey]], isColorField)) {
      return tokenKey;
    }
  }
  return null;
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
  const projectSession = useActiveProjectSession();
  const theme = useProjectTheme(projectSession?.project.path);
  const projectSettings = useProjectSettings(projectSession?.project.path);
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
  const [pendingJump, setPendingJump] = useState<StyleJumpRequest | null>(null);
  const [pulsedStyleFieldId, setPulsedStyleFieldId] = useState<string | null>(null);
  const [jumpWarning, setJumpWarning] = useState<string | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  const scopePopoverRef = useRef<HTMLDivElement | null>(null);
  const fieldFilterPopoverRef = useRef<HTMLDivElement | null>(null);
  const { openColorFieldId, onColorInputBlur, toggleColorField } = useColorPickerToggle();
  const editScope = editScopeFromViewport(viewport.viewport);
  const activeThemeTokens = theme.activeTheme?.tokens ?? null;
  const block = builder.selectedBlock;
  const viewportMetaLabels = useMemo<Record<BuilderViewport, string>>(
    () => buildViewportMenuMetaLabels(projectSettings.settings.breakpoints),
    [projectSettings.settings.breakpoints]
  );

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

  useEffect(() => {
    const onStyleJump = (event: Event) => {
      const detail = (event as CustomEvent<StyleJumpRequest>).detail;
      if (!detail) {
        return;
      }
      viewport.setViewport(detail.viewport);
      builder.selectBlock(detail.blockId);
      builder.selectPrimitiveTarget(detail.blockId, detail.primitivePath);

      if (detail.state === "hover") {
        const targetPrefix = detail.primitivePath
          ? `primitive:${encodePrimitiveTarget(detail.blockId, detail.primitivePath)}`
          : `section:${detail.blockId}`;
        const stateKey = `${targetPrefix}:${detail.fieldKey}`;
        setFieldStates((prev) => ({ ...prev, [stateKey]: "hover" }));
      }

      setCollapsedGroups((prev) => {
        const next = { ...prev, [`section:${detail.category}`]: false };
        for (const primitiveType of Object.keys(PRIMITIVE_EXCLUDED_STYLE_KEYS)) {
          next[`primitive:${primitiveType}:${detail.category}`] = false;
        }
        return next;
      });

      setJumpWarning(null);
      setPendingJump(detail);
    };
    window.addEventListener(BUILDER_STYLE_JUMP_EVENT, onStyleJump);
    return () => window.removeEventListener(BUILDER_STYLE_JUMP_EVENT, onStyleJump);
  }, [builder, viewport]);

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
      hoverSectionBlockIds: primitiveHoverActive
        ? []
        : sectionHoverActive
          ? selectedSectionBlockIds
          : [],
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

  const primitiveList = block ? walkPrimitives(buildPreviewTreeForBlock(block)) : [];
  const selectedPaths = selectedTargets
    .filter((target) => target.blockId === block?.id)
    .map((target) => target.primitivePath);
  const selectedSectionBlocks = selectedSectionBlockIds
    .map((blockId) => builder.selectedPage.blocks.find((entry) => entry.id === blockId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const selectedPath = selectedPaths[selectedPaths.length - 1] ?? null;
  const selectedPrimitive = selectedPath
    ? (primitiveList.find((entry) => entry.path === selectedPath) ?? null)
    : null;

  const primitiveStyleGroups = selectedPrimitive
    ? buildStyleGroups(
        PRIMITIVE_SUPPORTED_KEYS,
        query,
        new Set(PRIMITIVE_EXCLUDED_STYLE_KEYS[selectedPrimitive.type] ?? [])
      )
    : ([] as StyleGroup<PrimitiveStyleKey>[]);

  const sectionStyleGroups = buildStyleGroups(
    SECTION_SUPPORTED_KEYS,
    query,
    new Set<SectionStyleKey>()
  );

  const currentGroups = selectedPrimitive ? primitiveStyleGroups : sectionStyleGroups;
  const collapseScope = selectedPrimitive ? `primitive:${selectedPrimitive.type}` : "section";

  useEffect(() => {
    if (!pendingJump || !block) {
      return;
    }
    if (pendingJump.blockId !== block.id) {
      return;
    }
    const selectionMatches =
      (pendingJump.primitivePath === null && !selectedPrimitive) ||
      selectedPrimitive?.path === pendingJump.primitivePath;
    if (!selectionMatches) {
      return;
    }

    const fieldId = buildStyleFieldId({
      blockId: pendingJump.blockId,
      primitivePath: pendingJump.primitivePath,
      viewport: pendingJump.viewport,
      state: pendingJump.state,
      fieldKey: pendingJump.fieldKey as PrimitiveStyleKey | SectionStyleKey,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const selector = `[data-style-field-id="${safeCssEscape(fieldId)}"]`;
        const fallbackSelector = [
          `[data-style-block-id="${safeCssEscape(pendingJump.blockId)}"]`,
          `[data-style-primitive-path="${safeCssEscape(pendingJump.primitivePath ?? "")}"]`,
          `[data-style-viewport="${safeCssEscape(pendingJump.viewport)}"]`,
          `[data-style-state="${safeCssEscape(pendingJump.state)}"]`,
          `[data-style-field-key="${safeCssEscape(String(pendingJump.fieldKey))}"]`,
        ].join("");
        const fieldNode =
          document.querySelector<HTMLElement>(selector) ??
          document.querySelector<HTMLElement>(fallbackSelector);
        if (fieldNode) {
          const scrollHost = scrollRootRef.current?.closest(".drawer-tab-body");
          if (scrollHost instanceof HTMLElement) {
            const hostRect = scrollHost.getBoundingClientRect();
            const fieldRect = fieldNode.getBoundingClientRect();
            const delta =
              fieldRect.top - hostRect.top - scrollHost.clientHeight / 2 + fieldRect.height / 2;
            scrollHost.scrollTo({
              top: scrollHost.scrollTop + delta,
              behavior: "smooth",
            });
          } else {
            fieldNode.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setPulsedStyleFieldId(fieldId);
          setJumpWarning(null);
          if (pulseTimeoutRef.current !== null) {
            window.clearTimeout(pulseTimeoutRef.current);
          }
          pulseTimeoutRef.current = window.setTimeout(() => {
            setPulsedStyleFieldId((prev) => (prev === fieldId ? null : prev));
            pulseTimeoutRef.current = null;
          }, 5000);
        } else {
          setJumpWarning("Jump target unavailable in current style schema.");
        }
        setPendingJump((current) => (current === pendingJump ? null : current));
      });
    });
  }, [block, pendingJump, scrollRootRef, selectedPrimitive]);

  useEffect(
    () => () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    },
    []
  );

  const scopeIndicatorText = `${interaction.mode === "edit" ? "Edit" : "Preview"}: ${VIEWPORT_SCOPE_LABELS[editScope]}`;
  const fieldScopeLabelPrefix = VIEWPORT_SCOPE_LABELS[editScope];

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
              className={`style-tab-scope-indicator ${viewportToneClass(viewport.viewport)}`}
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
              <div
                className="builder-popover align-start style-tab-popover"
                role="menu"
                aria-label="Select viewport"
              >
                <div className="popover-title">Viewport size</div>
                <div className="popover-option-list">
                  {VIEWPORT_MENU_ORDER.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      role="menuitemradio"
                      aria-checked={viewport.viewport === entry}
                      className={`popover-option viewport-option ${viewportToneClass(entry)}${
                        viewport.viewport === entry ? " active" : ""
                      }`}
                      onClick={() => {
                        viewport.setViewport(entry);
                        setScopePopoverOpen(false);
                      }}
                    >
                      <span>{VIEWPORT_SCOPE_LABELS[entry]}</span>
                      <small>{viewportMetaLabels[entry]}</small>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div ref={fieldFilterPopoverRef} className="style-tab-filter-control">
            <button
              type="button"
              className={`style-tab-filter-indicator ${filterToneClass(fieldFilter)}`}
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
              <div
                className="builder-popover style-tab-popover style-tab-filter-popover"
                role="menu"
                aria-label="Filter fields"
              >
                <div className="popover-title">Field filter</div>
                <div className="popover-option-list">
                  {FIELD_FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={fieldFilter === option.value}
                      className={`popover-option single-line filter-option ${filterToneClass(option.value)}${
                        fieldFilter === option.value ? " active" : ""
                      }`}
                      onClick={() => {
                        setFieldFilter(option.value);
                        setFieldFilterPopoverOpen(false);
                      }}
                    >
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {jumpWarning ? (
          <div className="style-jump-warning-pill" role="status" aria-live="polite">
            <span className="dot" />
            {jumpWarning}
          </div>
        ) : null}
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
                const activeFieldState = getFieldState(
                  String(field.key),
                  Boolean(selectedPrimitive)
                );
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
                  const explicitDefaultValuesForSelection = primitiveSelectionTargets.map(
                    (target) => {
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
                        "default",
                        activeFieldState
                      );
                    }
                  );
                  const firstValue = valuesForSelection[0] ?? "";
                  const value = valuesForSelection.every((entry) => entry === firstValue)
                    ? firstValue
                    : "";
                  const hasExplicitCurrent = explicitValuesForSelection.some(
                    (entry) => entry.trim().length > 0
                  );
                  const hasExplicitDefault = explicitDefaultValuesForSelection.some(
                    (entry) => entry.trim().length > 0
                  );
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
                  let themeSourceToken = resolveThemeTokenSource(
                    field.key as AllStyleKey,
                    placeholder,
                    activeThemeTokens,
                    block.type,
                    selectedPrimitive?.type,
                    selectedPrimitive?.className
                  );
                  if (
                    !themeSourceToken &&
                    !hasExplicitCurrent &&
                    value.trim().length === 0 &&
                    activeThemeTokens &&
                    isCardLikePrimitive(selectedPrimitive?.type, selectedPrimitive?.className)
                  ) {
                    if (field.key === "backgroundColor") {
                      themeSourceToken = "cardBackground";
                    } else if (field.key === "borderColor") {
                      themeSourceToken = "cardBorder";
                    } else if (field.key === "borderWidth") {
                      themeSourceToken = "cardBorderWidth";
                    } else if (field.key === "borderStyle") {
                      themeSourceToken = "cardBorderStyle";
                    } else if (field.key === "borderRadius") {
                      themeSourceToken = "cardRadius";
                    }
                  }
                  const hasThemeFallback =
                    Boolean(activeThemeTokens) &&
                    getThemeTokenCandidates(
                      field.key as AllStyleKey,
                      block.type,
                      selectedPrimitive?.type,
                      selectedPrimitive?.className
                    ).length > 0;
                  const status = resolveFieldValueStatus({
                    hasExplicitCurrent,
                    hasExplicitDefault,
                    resolvedValue: value,
                    computedValue: placeholder,
                    fieldKey: field.key as AllStyleKey,
                    scope: editScope,
                    themeTokens: activeThemeTokens,
                    themeSourceToken,
                    hasThemeFallback,
                  });
                  const isThemeOverride =
                    status === "override" &&
                    editScope === "default" &&
                    (hasThemeFallback || Boolean(themeSourceToken));
                  const inherited = status === "inherited";
                  if (!matchesFieldFilter(status, fieldFilter)) {
                    return null;
                  }
                  const displayValue =
                    (status === "theme" || status === "block") && value.trim().length === 0
                      ? status === "theme" && themeSourceToken && activeThemeTokens
                        ? activeThemeTokens[themeSourceToken]
                        : placeholder === "Mixed values"
                          ? ""
                          : placeholder
                      : value;
                  const targetIds = primitiveSelectionTargets.map((target) =>
                    encodePrimitiveTarget(target.blockId, target.primitivePath)
                  );
                  const anchorTarget = primitiveSelectionTargets[0] ?? {
                    blockId: block.id,
                    primitivePath: selectedPath ?? "",
                  };
                  const fieldId = buildStyleFieldId({
                    blockId: anchorTarget.blockId,
                    primitivePath: anchorTarget.primitivePath || null,
                    viewport: editScope,
                    state: activeFieldState,
                    fieldKey: field.key as PrimitiveStyleKey,
                  });
                  const inheritedOrigin =
                    inherited && anchorTarget.primitivePath
                      ? resolvePrimitiveStyleOrigin(
                          block.styleOverrides,
                          anchorTarget.primitivePath,
                          field.key as PrimitiveStyleKey,
                          editScope,
                          activeFieldState
                        )
                      : null;
                  return (
                    <div
                      key={field.key}
                      className={`inspector-field compact${
                        pulsedStyleFieldId === fieldId ? " style-field-pulse" : ""
                      }`}
                      data-style-field-id={fieldId}
                      data-style-block-id={anchorTarget.blockId}
                      data-style-primitive-path={anchorTarget.primitivePath || ""}
                      data-style-viewport={editScope}
                      data-style-state={activeFieldState}
                      data-style-field-key={String(field.key)}
                      data-style-category={group.category}
                    >
                      <span className="style-field-label-row">
                        <span className="style-field-status-dot-wrap">
                          {inherited && inheritedOrigin ? (
                            <button
                              type="button"
                              className={`style-field-status-dot ${status}`}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                requestStyleJump({
                                  blockId: anchorTarget.blockId,
                                  primitivePath: anchorTarget.primitivePath || null,
                                  viewport: inheritedOrigin.viewport,
                                  state: inheritedOrigin.state,
                                  fieldKey: String(field.key),
                                  category: group.category,
                                });
                              }}
                              aria-label="Jump to inherited source"
                              title="Jump to inherited source"
                            />
                          ) : status === "theme" && themeSourceToken ? (
                            <button
                              type="button"
                              className={`style-field-status-dot ${status}`}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                requestThemeTokenJump({ tokenKey: themeSourceToken });
                              }}
                              aria-label="Jump to theme source"
                              title="Jump to theme source"
                            />
                          ) : (
                            <span
                              className={`style-field-status-dot ${status}`}
                              aria-hidden="true"
                            />
                          )}
                          <span className="style-field-status-tooltip" role="tooltip">
                            {status === "override" ? (
                              isThemeOverride ? (
                                "Override of theme value"
                              ) : (
                                `Override of Default in ${VIEWPORT_SCOPE_LABELS[editScope]}`
                              )
                            ) : status === "edited" ? (
                              `Edited in ${VIEWPORT_SCOPE_LABELS[editScope]}`
                            ) : status === "inherited" ? (
                              inheritedOrigin ? (
                                `Inherited from ${VIEWPORT_SCOPE_LABELS[inheritedOrigin.viewport]}${
                                  inheritedOrigin.state === "hover" ? " (Hover)" : ""
                                }`
                              ) : (
                                `Inherited from Default`
                              )
                            ) : status === "theme" ? (
                              <>
                                <span>Resolved from active theme token.</span>
                                <span className="style-field-status-theme-hint">
                                  Click the indicator circle to jump to theme source.
                                </span>
                              </>
                            ) : status === "block" ? (
                              "Resolved from block baseline styles"
                            ) : (
                              `Uninitialized`
                            )}
                          </span>
                        </span>
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
                          {activeFieldState === "default"
                            ? VIEWPORT_SCOPE_LABELS[editScope]
                            : "Hover"}
                        </small>
                      </span>
                      {renderStyleField({
                        field,
                        value: displayValue,
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
                const explicitDefaultSectionValues = selectedSectionBlocks.map((entry) =>
                  getExplicitSectionStyleValue(
                    entry.styleOverrides,
                    sectionField,
                    "default",
                    activeFieldState
                  )
                );
                const firstValue = sectionValues[0] ?? "";
                const value = sectionValues.every((entry) => entry === firstValue)
                  ? firstValue
                  : "";
                const hasExplicitCurrent = explicitSectionValues.some(
                  (entry) => entry.trim().length > 0
                );
                const hasExplicitDefault = explicitDefaultSectionValues.some(
                  (entry) => entry.trim().length > 0
                );
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
                const anchorBlockId = selectedSectionBlocks[0]?.id ?? block.id;
                const originBlock =
                  selectedSectionBlocks.find((entry) => entry.id === anchorBlockId) ?? block;
                let themeSourceToken = resolveThemeTokenSource(
                  field.key as AllStyleKey,
                  placeholder,
                  activeThemeTokens,
                  originBlock.type
                );
                if (
                  sectionField === "backgroundColor" &&
                  !hasExplicitCurrent &&
                  value.trim().length === 0 &&
                  !themeSourceToken &&
                  activeThemeTokens
                ) {
                  themeSourceToken = resolveThemeSectionBackgroundToken(originBlock.type);
                }
                const status = resolveFieldValueStatus({
                  hasExplicitCurrent,
                  hasExplicitDefault,
                  resolvedValue: value,
                  computedValue: placeholder,
                  fieldKey: field.key as AllStyleKey,
                  scope: editScope,
                  themeTokens: activeThemeTokens,
                  themeSourceToken,
                  hasThemeFallback:
                    Boolean(activeThemeTokens) &&
                    getThemeTokenCandidates(field.key as AllStyleKey, originBlock.type).length > 0,
                });
                const hasThemeFallback =
                  Boolean(activeThemeTokens) &&
                  getThemeTokenCandidates(field.key as AllStyleKey, originBlock.type).length > 0;
                const isThemeOverride =
                  status === "override" &&
                  editScope === "default" &&
                  (hasThemeFallback || Boolean(themeSourceToken));
                const inherited = status === "inherited";
                if (!matchesFieldFilter(status, fieldFilter)) {
                  return null;
                }
                const displayValue =
                  (status === "theme" || status === "block") && value.trim().length === 0
                    ? status === "theme" && themeSourceToken && activeThemeTokens
                      ? activeThemeTokens[themeSourceToken]
                      : placeholder === "Mixed values"
                        ? ""
                        : placeholder
                    : value;
                const fieldId = buildStyleFieldId({
                  blockId: anchorBlockId,
                  primitivePath: null,
                  viewport: editScope,
                  state: activeFieldState,
                  fieldKey: field.key as SectionStyleKey,
                });
                const inheritedOrigin = inherited
                  ? resolveSectionStyleOrigin(
                      originBlock.styleOverrides,
                      field.key as SectionStyleKey,
                      editScope,
                      activeFieldState
                    )
                  : null;
                return (
                  <div
                    key={field.key}
                    className={`inspector-field compact${
                      pulsedStyleFieldId === fieldId ? " style-field-pulse" : ""
                    }`}
                    data-style-field-id={fieldId}
                    data-style-block-id={anchorBlockId}
                    data-style-primitive-path=""
                    data-style-viewport={editScope}
                    data-style-state={activeFieldState}
                    data-style-field-key={String(field.key)}
                    data-style-category={group.category}
                  >
                    <span className="style-field-label-row">
                      <span className="style-field-status-dot-wrap">
                        {inherited && inheritedOrigin ? (
                          <button
                            type="button"
                            className={`style-field-status-dot ${status}`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              requestStyleJump({
                                blockId: originBlock.id,
                                primitivePath: null,
                                viewport: inheritedOrigin.viewport,
                                state: inheritedOrigin.state,
                                fieldKey: String(field.key),
                                category: group.category,
                              });
                            }}
                            aria-label="Jump to inherited source"
                            title="Jump to inherited source"
                          />
                        ) : status === "theme" && themeSourceToken ? (
                          <button
                            type="button"
                            className={`style-field-status-dot ${status}`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              requestThemeTokenJump({ tokenKey: themeSourceToken });
                            }}
                            aria-label="Jump to theme source"
                            title="Jump to theme source"
                          />
                        ) : (
                          <span className={`style-field-status-dot ${status}`} aria-hidden="true" />
                        )}
                        <span className="style-field-status-tooltip" role="tooltip">
                          {status === "override" ? (
                            isThemeOverride ? (
                              "Override of theme value"
                            ) : (
                              `Override of Default in ${VIEWPORT_SCOPE_LABELS[editScope]}`
                            )
                          ) : status === "edited" ? (
                            `Edited in ${VIEWPORT_SCOPE_LABELS[editScope]}`
                          ) : status === "inherited" ? (
                            inheritedOrigin ? (
                              `Inherited from ${VIEWPORT_SCOPE_LABELS[inheritedOrigin.viewport]}${
                                inheritedOrigin.state === "hover" ? " (Hover)" : ""
                              }`
                            ) : (
                              `Inherited from Default`
                            )
                          ) : status === "theme" ? (
                            <>
                              <span>Resolved from active theme token.</span>
                              <span className="style-field-status-theme-hint">
                                Click the indicator circle to jump to theme source.
                              </span>
                            </>
                          ) : status === "block" ? (
                            "Resolved from block baseline styles"
                          ) : (
                            `Uninitialized`
                          )}
                        </span>
                      </span>
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
                        {activeFieldState === "default"
                          ? VIEWPORT_SCOPE_LABELS[editScope]
                          : "Hover"}
                      </small>
                    </span>
                    {renderStyleField({
                      field,
                      value: displayValue,
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

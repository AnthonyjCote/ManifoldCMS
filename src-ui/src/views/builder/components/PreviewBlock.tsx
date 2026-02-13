import type { CSSProperties } from "react";

import { buildPreviewTreeForBlock } from "../../../features/builder/catalog";
import { getSectionStyleValue, type BuilderViewport } from "../../../features/builder/style-scopes";
import type { BlockInstance, PrimitiveType, StyleStateKey } from "../../../features/builder/types";
import { PrimitiveRenderer } from "./PrimitiveRenderer";

type PreviewBlockProps = {
  block: BlockInstance;
  previewScope: BuilderViewport;
  editable: boolean;
  selectionEnabled?: boolean;
  hoverEnabled?: boolean;
  onInlineCommit: (fieldKey: string, value: string) => void;
  selectedPrimitivePaths: string[];
  hoveredPrimitivePath: string | null;
  onHoverPrimitive: (path: string | null) => void;
  onSelectPrimitive: (path: string, type: PrimitiveType, multi: boolean) => void;
  onPrimitiveStyleSet: (
    path: string,
    key:
      | "marginTop"
      | "marginRight"
      | "marginBottom"
      | "marginLeft"
      | "paddingTop"
      | "paddingRight"
      | "paddingBottom"
      | "paddingLeft"
      | "translateX"
      | "translateY",
    value: string
  ) => void;
  onStyleDragSessionStart?: () => void;
  onStyleDragSessionEnd?: () => void;
  sectionStyleState?: StyleStateKey;
  hoverPrimitivePaths?: string[];
  pulsedPrimitivePath?: string | null;
};

function normalizeBackgroundImage(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed === "none") {
    return "none";
  }
  if (
    trimmed.startsWith("url(") ||
    trimmed.startsWith("linear-gradient(") ||
    trimmed.startsWith("radial-gradient(") ||
    trimmed.startsWith("conic-gradient(")
  ) {
    return trimmed;
  }
  return `url("${trimmed}")`;
}

function composeBackgroundOverride(
  backgroundColor: string | undefined,
  backgroundImage: string | undefined
): string | undefined {
  const color = typeof backgroundColor === "string" ? backgroundColor.trim() : "";
  const image = backgroundImage?.trim() ?? "";
  if (!color && !image) {
    return undefined;
  }
  if (image && image !== "none") {
    return color ? `${color} ${image}` : image;
  }
  if (image === "none") {
    return color || "none";
  }
  return color;
}

export function PreviewBlock({
  block,
  previewScope,
  editable,
  selectionEnabled = true,
  hoverEnabled = false,
  onInlineCommit,
  selectedPrimitivePaths,
  hoveredPrimitivePath,
  onHoverPrimitive,
  onSelectPrimitive,
  onPrimitiveStyleSet,
  onStyleDragSessionStart,
  onStyleDragSessionEnd,
  sectionStyleState = "default",
  hoverPrimitivePaths = [],
  pulsedPrimitivePath = null,
}: PreviewBlockProps) {
  const tree = buildPreviewTreeForBlock(block);
  const backgroundImage = normalizeBackgroundImage(
    getSectionStyleValue(block.styleOverrides, "backgroundImage", previewScope, sectionStyleState)
  );
  const background = composeBackgroundOverride(
    getSectionStyleValue(block.styleOverrides, "backgroundColor", previewScope, sectionStyleState),
    backgroundImage
  );
  const style: CSSProperties = {
    marginTop: getSectionStyleValue(
      block.styleOverrides,
      "marginTop",
      previewScope,
      sectionStyleState
    ),
    marginRight: getSectionStyleValue(
      block.styleOverrides,
      "marginRight",
      previewScope,
      sectionStyleState
    ),
    marginBottom: getSectionStyleValue(
      block.styleOverrides,
      "marginBottom",
      previewScope,
      sectionStyleState
    ),
    marginLeft: getSectionStyleValue(
      block.styleOverrides,
      "marginLeft",
      previewScope,
      sectionStyleState
    ),
    paddingTop: getSectionStyleValue(
      block.styleOverrides,
      "paddingTop",
      previewScope,
      sectionStyleState
    ),
    paddingRight: getSectionStyleValue(
      block.styleOverrides,
      "paddingRight",
      previewScope,
      sectionStyleState
    ),
    paddingBottom: getSectionStyleValue(
      block.styleOverrides,
      "paddingBottom",
      previewScope,
      sectionStyleState
    ),
    paddingLeft: getSectionStyleValue(
      block.styleOverrides,
      "paddingLeft",
      previewScope,
      sectionStyleState
    ),
    borderWidth: getSectionStyleValue(
      block.styleOverrides,
      "borderWidth",
      previewScope,
      sectionStyleState
    ),
    borderStyle: getSectionStyleValue(
      block.styleOverrides,
      "borderStyle",
      previewScope,
      sectionStyleState
    ),
    borderColor: getSectionStyleValue(
      block.styleOverrides,
      "borderColor",
      previewScope,
      sectionStyleState
    ),
    borderRadius: getSectionStyleValue(
      block.styleOverrides,
      "borderRadius",
      previewScope,
      sectionStyleState
    ),
    background,
    color: getSectionStyleValue(block.styleOverrides, "textColor", previewScope, sectionStyleState),
    fontSize: getSectionStyleValue(
      block.styleOverrides,
      "fontSize",
      previewScope,
      sectionStyleState
    ),
    transform:
      getSectionStyleValue(block.styleOverrides, "translateX", previewScope, sectionStyleState) ||
      getSectionStyleValue(block.styleOverrides, "translateY", previewScope, sectionStyleState)
        ? `translate(${getSectionStyleValue(block.styleOverrides, "translateX", previewScope, sectionStyleState) ?? "0px"}, ${getSectionStyleValue(block.styleOverrides, "translateY", previewScope, sectionStyleState) ?? "0px"})`
        : undefined,
  };
  return (
    <section
      className={`site-block site-block-${block.type.replace(/_/g, "-")}`}
      style={style}
      data-block-id={block.id}
    >
      {tree.map((node, index) => (
        <PrimitiveRenderer
          key={`${node.type}-${index}`}
          node={node}
          editable={editable}
          selectionEnabled={selectionEnabled}
          hoverEnabled={hoverEnabled}
          onInlineCommit={onInlineCommit}
          primitivePath={String(index)}
          selectedPrimitivePaths={selectedPrimitivePaths}
          hoveredPrimitivePath={hoveredPrimitivePath}
          onHoverPrimitive={onHoverPrimitive}
          onSelectPrimitive={onSelectPrimitive}
          onPrimitiveStyleSet={onPrimitiveStyleSet}
          onStyleDragSessionStart={onStyleDragSessionStart}
          onStyleDragSessionEnd={onStyleDragSessionEnd}
          previewScope={previewScope}
          primitiveStyles={block.styleOverrides.primitiveStyles}
          primitiveViewportStyles={block.styleOverrides.primitiveViewportStyles}
          primitiveStateViewportStyles={block.styleOverrides.primitiveStateViewportStyles}
          hoverPrimitivePaths={hoverPrimitivePaths}
          pulsedPrimitivePath={pulsedPrimitivePath}
        />
      ))}
    </section>
  );
}

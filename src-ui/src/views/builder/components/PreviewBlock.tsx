import type { CSSProperties } from "react";

import { buildPreviewTreeForBlock } from "../../../features/builder/catalog";
import { getSectionStyleValue, type BuilderViewport } from "../../../features/builder/style-scopes";
import type { BlockInstance, PrimitiveType } from "../../../features/builder/types";
import { PrimitiveRenderer } from "./PrimitiveRenderer";

type PreviewBlockProps = {
  block: BlockInstance;
  previewScope: BuilderViewport;
  editable: boolean;
  selectionEnabled?: boolean;
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
  onInlineCommit,
  selectedPrimitivePaths,
  hoveredPrimitivePath,
  onHoverPrimitive,
  onSelectPrimitive,
  onPrimitiveStyleSet,
  onStyleDragSessionStart,
  onStyleDragSessionEnd,
}: PreviewBlockProps) {
  const tree = buildPreviewTreeForBlock(block);
  const backgroundImage = normalizeBackgroundImage(
    getSectionStyleValue(block.styleOverrides, "backgroundImage", previewScope)
  );
  const background = composeBackgroundOverride(
    getSectionStyleValue(block.styleOverrides, "backgroundColor", previewScope),
    backgroundImage
  );
  const style: CSSProperties = {
    marginTop: getSectionStyleValue(block.styleOverrides, "marginTop", previewScope),
    marginRight: getSectionStyleValue(block.styleOverrides, "marginRight", previewScope),
    marginBottom: getSectionStyleValue(block.styleOverrides, "marginBottom", previewScope),
    marginLeft: getSectionStyleValue(block.styleOverrides, "marginLeft", previewScope),
    paddingTop: getSectionStyleValue(block.styleOverrides, "paddingTop", previewScope),
    paddingRight: getSectionStyleValue(block.styleOverrides, "paddingRight", previewScope),
    paddingBottom: getSectionStyleValue(block.styleOverrides, "paddingBottom", previewScope),
    paddingLeft: getSectionStyleValue(block.styleOverrides, "paddingLeft", previewScope),
    borderWidth: getSectionStyleValue(block.styleOverrides, "borderWidth", previewScope),
    borderStyle: getSectionStyleValue(block.styleOverrides, "borderStyle", previewScope),
    borderColor: getSectionStyleValue(block.styleOverrides, "borderColor", previewScope),
    borderRadius: getSectionStyleValue(block.styleOverrides, "borderRadius", previewScope),
    background,
    color: getSectionStyleValue(block.styleOverrides, "textColor", previewScope),
    fontSize: getSectionStyleValue(block.styleOverrides, "fontSize", previewScope),
    transform:
      getSectionStyleValue(block.styleOverrides, "translateX", previewScope) ||
      getSectionStyleValue(block.styleOverrides, "translateY", previewScope)
        ? `translate(${getSectionStyleValue(block.styleOverrides, "translateX", previewScope) ?? "0px"}, ${getSectionStyleValue(block.styleOverrides, "translateY", previewScope) ?? "0px"})`
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
        />
      ))}
    </section>
  );
}

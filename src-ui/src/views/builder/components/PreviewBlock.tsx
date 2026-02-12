import type { CSSProperties } from "react";

import { buildPreviewTreeForBlock } from "../../../features/builder/catalog";
import type { BlockInstance, PrimitiveType } from "../../../features/builder/types";
import { PrimitiveRenderer } from "./PrimitiveRenderer";

type PreviewBlockProps = {
  block: BlockInstance;
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
  const backgroundImage = normalizeBackgroundImage(block.styleOverrides.backgroundImage);
  const background = composeBackgroundOverride(
    block.styleOverrides.backgroundColor,
    backgroundImage
  );
  const style: CSSProperties = {
    marginTop: block.styleOverrides.marginTop,
    marginRight: block.styleOverrides.marginRight,
    marginBottom: block.styleOverrides.marginBottom,
    marginLeft: block.styleOverrides.marginLeft,
    paddingTop: block.styleOverrides.paddingTop,
    paddingRight: block.styleOverrides.paddingRight,
    paddingBottom: block.styleOverrides.paddingBottom,
    paddingLeft: block.styleOverrides.paddingLeft,
    borderWidth: block.styleOverrides.borderWidth,
    borderStyle: block.styleOverrides.borderStyle,
    borderColor: block.styleOverrides.borderColor,
    borderRadius: block.styleOverrides.borderRadius,
    background,
    color: block.styleOverrides.textColor,
    fontSize: block.styleOverrides.fontSize,
    transform:
      block.styleOverrides.translateX || block.styleOverrides.translateY
        ? `translate(${block.styleOverrides.translateX ?? "0px"}, ${block.styleOverrides.translateY ?? "0px"})`
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
          primitiveStyles={block.styleOverrides.primitiveStyles}
        />
      ))}
    </section>
  );
}

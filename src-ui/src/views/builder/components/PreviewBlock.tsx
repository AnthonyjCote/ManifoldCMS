import type { CSSProperties } from "react";

import { buildPreviewTreeForBlock } from "../../../features/builder/catalog";
import type { BlockInstance, PrimitiveType } from "../../../features/builder/types";
import { PrimitiveRenderer } from "./PrimitiveRenderer";

type PreviewBlockProps = {
  block: BlockInstance;
  editable: boolean;
  onInlineCommit: (fieldKey: string, value: string) => void;
  selectedPrimitivePath: string | null;
  hoveredPrimitivePath: string | null;
  onHoverPrimitive: (path: string | null) => void;
  onSelectPrimitive: (path: string, type: PrimitiveType) => void;
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

export function PreviewBlock({
  block,
  editable,
  onInlineCommit,
  selectedPrimitivePath,
  hoveredPrimitivePath,
  onHoverPrimitive,
  onSelectPrimitive,
  onPrimitiveStyleSet,
  onStyleDragSessionStart,
  onStyleDragSessionEnd,
}: PreviewBlockProps) {
  const tree = buildPreviewTreeForBlock(block);
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
    backgroundColor: block.styleOverrides.backgroundColor,
    color: block.styleOverrides.textColor,
    fontSize: block.styleOverrides.fontSize,
    transform:
      block.styleOverrides.translateX || block.styleOverrides.translateY
        ? `translate(${block.styleOverrides.translateX ?? "0px"}, ${block.styleOverrides.translateY ?? "0px"})`
        : undefined,
  };
  return (
    <section className={`site-block site-block-${block.type.replace(/_/g, "-")}`} style={style}>
      {tree.map((node, index) => (
        <PrimitiveRenderer
          key={`${node.type}-${index}`}
          node={node}
          editable={editable}
          onInlineCommit={onInlineCommit}
          primitivePath={String(index)}
          selectedPrimitivePath={selectedPrimitivePath}
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

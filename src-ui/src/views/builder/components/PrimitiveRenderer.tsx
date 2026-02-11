import type { KeyboardEvent, MouseEvent } from "react";

import type { BlockInstance, PrimitiveNode, PrimitiveType } from "../../../features/builder/types";

type PrimitiveRendererProps = {
  node: PrimitiveNode;
  editable?: boolean;
  onInlineCommit?: (fieldKey: string, value: string) => void;
  primitivePath?: string;
  selectedPrimitivePath?: string | null;
  hoveredPrimitivePath?: string | null;
  onHoverPrimitive?: (path: string | null) => void;
  onSelectPrimitive?: (path: string, type: PrimitiveType) => void;
  primitiveStyles?: BlockInstance["styleOverrides"]["primitiveStyles"];
};

function toHeadingTag(levelRaw: string | number | boolean | undefined): "h1" | "h2" | "h3" | "h4" {
  const level = typeof levelRaw === "string" ? levelRaw.toLowerCase() : "h2";
  if (level === "h1" || level === "h2" || level === "h3" || level === "h4") {
    return level;
  }
  return "h2";
}

function columnsTemplate(ratioRaw: unknown, countRaw: unknown): string {
  if (typeof countRaw === "number" && countRaw > 0) {
    return `repeat(${countRaw}, minmax(0, 1fr))`;
  }
  if (typeof ratioRaw === "string" && ratioRaw.includes(":")) {
    const segments = ratioRaw
      .split(":")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    if (segments.length > 0) {
      return segments.map((entry) => `${entry}fr`).join(" ");
    }
  }
  return "repeat(2, minmax(0, 1fr))";
}

function commitEditableText(
  event: { currentTarget: HTMLElement },
  fieldKey: string,
  onInlineCommit?: (fieldKey: string, value: string) => void
) {
  if (!onInlineCommit) {
    return;
  }
  const value = event.currentTarget.textContent?.trim() ?? "";
  onInlineCommit(fieldKey, value);
}

function onEditableKeyDown(event: KeyboardEvent<HTMLElement>) {
  if (event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.blur();
  }
}

function toPrimitiveStyle(
  style: NonNullable<BlockInstance["styleOverrides"]["primitiveStyles"]>[string] | undefined
) {
  if (!style) {
    return undefined;
  }
  return {
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    borderWidth: style.borderWidth,
    borderStyle: style.borderStyle,
    borderColor: style.borderColor,
    borderRadius: style.borderRadius,
    backgroundColor: style.backgroundColor,
    color: style.textColor,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign as "left" | "center" | "right" | "justify" | undefined,
    width: style.width,
    height: style.height,
  };
}

export function PrimitiveRenderer({
  node,
  editable = false,
  onInlineCommit,
  primitivePath = "0",
  selectedPrimitivePath = null,
  hoveredPrimitivePath = null,
  onHoverPrimitive,
  onSelectPrimitive,
  primitiveStyles,
}: PrimitiveRendererProps) {
  const style = toPrimitiveStyle(primitiveStyles?.[primitivePath]);
  const isSelected = selectedPrimitivePath === primitivePath;
  const isHovered = hoveredPrimitivePath === primitivePath;
  const primitiveClass = `preview-primitive-node${isSelected ? " selected" : ""}${isHovered ? " hovered" : ""}`;
  const selectPrimitive = () => onSelectPrimitive?.(primitivePath, node.type);
  const onPrimitiveClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.isContentEditable && !isSelected) {
      active.blur();
    }
    selectPrimitive();
  };
  const onPrimitiveMove = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onHoverPrimitive?.(primitivePath);
  };

  if (node.type === "stack") {
    return (
      <div
        className={`${primitiveClass} primitive-stack ${String(node.props?.className ?? "").trim()}`}
        style={style}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
      >
        {node.children?.map((child, index) => (
          <PrimitiveRenderer
            key={`${child.type}-${index}`}
            node={child}
            editable={editable}
            onInlineCommit={onInlineCommit}
            primitivePath={`${primitivePath}.${index}`}
            selectedPrimitivePath={selectedPrimitivePath}
            hoveredPrimitivePath={hoveredPrimitivePath}
            onHoverPrimitive={onHoverPrimitive}
            onSelectPrimitive={onSelectPrimitive}
            primitiveStyles={primitiveStyles}
          />
        ))}
      </div>
    );
  }

  if (node.type === "columns") {
    return (
      <div
        className={`${primitiveClass} primitive-columns ${String(node.props?.className ?? "").trim()}`}
        style={{
          gridTemplateColumns: columnsTemplate(node.props?.ratio, node.props?.columnCount),
          ...style,
        }}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
      >
        {node.children?.map((child, index) => (
          <PrimitiveRenderer
            key={`${child.type}-${index}`}
            node={child}
            editable={editable}
            onInlineCommit={onInlineCommit}
            primitivePath={`${primitivePath}.${index}`}
            selectedPrimitivePath={selectedPrimitivePath}
            hoveredPrimitivePath={hoveredPrimitivePath}
            onHoverPrimitive={onHoverPrimitive}
            onSelectPrimitive={onSelectPrimitive}
            primitiveStyles={primitiveStyles}
          />
        ))}
      </div>
    );
  }

  if (node.type === "cards") {
    const columns =
      typeof node.props?.columns === "number" ? Math.max(1, Number(node.props.columns)) : 2;
    return (
      <div
        className={`${primitiveClass} primitive-cards`}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, ...style }}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
      >
        {node.children?.map((child, index) => (
          <PrimitiveRenderer
            key={`${child.type}-${index}`}
            node={child}
            editable={editable}
            onInlineCommit={onInlineCommit}
            primitivePath={`${primitivePath}.${index}`}
            selectedPrimitivePath={selectedPrimitivePath}
            hoveredPrimitivePath={hoveredPrimitivePath}
            onHoverPrimitive={onHoverPrimitive}
            onSelectPrimitive={onSelectPrimitive}
            primitiveStyles={primitiveStyles}
          />
        ))}
      </div>
    );
  }

  if (node.type === "heading") {
    const level = toHeadingTag(node.props?.level);
    const editorFieldKey =
      typeof node.props?.editorFieldKey === "string" ? node.props.editorFieldKey : null;
    const editableProps =
      editable && editorFieldKey
        ? {
            contentEditable: true,
            suppressContentEditableWarning: true,
            onBlur: (event: { currentTarget: HTMLElement }) =>
              commitEditableText(event, editorFieldKey, onInlineCommit),
            onKeyDown: onEditableKeyDown,
          }
        : {};
    if (level === "h1") {
      return (
        <h1
          className={`${primitiveClass}${editable && editorFieldKey && isSelected ? " preview-inline-editable" : ""}`}
          style={style}
          onClick={onPrimitiveClick}
          onMouseMove={onPrimitiveMove}
          {...editableProps}
        >
          {String(node.props?.value ?? "Heading")}
        </h1>
      );
    }
    if (level === "h2") {
      return (
        <h2
          className={`${primitiveClass}${editable && editorFieldKey && isSelected ? " preview-inline-editable" : ""}`}
          style={style}
          onClick={onPrimitiveClick}
          onMouseMove={onPrimitiveMove}
          {...editableProps}
        >
          {String(node.props?.value ?? "Heading")}
        </h2>
      );
    }
    if (level === "h3") {
      return (
        <h3
          className={`${primitiveClass}${editable && editorFieldKey && isSelected ? " preview-inline-editable" : ""}`}
          style={style}
          onClick={onPrimitiveClick}
          onMouseMove={onPrimitiveMove}
          {...editableProps}
        >
          {String(node.props?.value ?? "Heading")}
        </h3>
      );
    }
    return (
      <h4
        className={`${primitiveClass}${editable && editorFieldKey && isSelected ? " preview-inline-editable" : ""}`}
        style={style}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
        {...editableProps}
      >
        {String(node.props?.value ?? "Heading")}
      </h4>
    );
  }

  if (node.type === "text") {
    const editorFieldKey =
      typeof node.props?.editorFieldKey === "string" ? node.props.editorFieldKey : null;
    const editableProps =
      editable && editorFieldKey
        ? {
            contentEditable: true,
            suppressContentEditableWarning: true,
            onBlur: (event: { currentTarget: HTMLElement }) =>
              commitEditableText(event, editorFieldKey, onInlineCommit),
            onKeyDown: onEditableKeyDown,
          }
        : {};
    return (
      <p
        className={`${primitiveClass}${editable && editorFieldKey && isSelected ? " preview-inline-editable" : ""}`}
        style={style}
        onClick={onPrimitiveClick}
        {...editableProps}
      >
        {String(node.props?.value ?? "")}
      </p>
    );
  }

  if (node.type === "image") {
    const src = String(node.props?.src ?? "");
    const alt = String(node.props?.alt ?? "");
    return src ? (
      <img
        className={`${primitiveClass} ${String(node.props?.className ?? "").trim()}`.trim()}
        style={style}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
        src={src}
        alt={alt}
      />
    ) : (
      <div
        className={`${primitiveClass} primitive-image-placeholder`}
        style={style}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
      >
        Lorem ipsum image placeholder.
      </div>
    );
  }

  if (node.type === "video") {
    const src = String(node.props?.src ?? "");
    return (
      <div
        className={`${primitiveClass} primitive-embed`}
        style={style}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
      >
        {src.length > 0 ? `Video: ${src}` : "Lorem ipsum video placeholder."}
      </div>
    );
  }

  if (node.type === "embed") {
    return (
      <div
        className={`${primitiveClass} primitive-embed`}
        style={style}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
      >
        {String(node.props?.value ?? "Lorem ipsum embed placeholder.")}
      </div>
    );
  }

  if (node.type === "code") {
    return (
      <pre
        className={`${primitiveClass} primitive-code`}
        style={style}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
      >
        {String(node.props?.value ?? "")}
      </pre>
    );
  }

  if (node.type === "button") {
    const editorFieldKey =
      typeof node.props?.editorFieldKey === "string" ? node.props.editorFieldKey : null;
    const canEdit = editable && !!editorFieldKey;
    return (
      <a
        href={String(node.props?.href ?? "#")}
        className={`${primitiveClass} hero-cta`}
        style={style}
        onMouseDown={(event) => event.stopPropagation()}
        onMouseMove={onPrimitiveMove}
        onClick={(event) => {
          event.stopPropagation();
          selectPrimitive();
          event.preventDefault();
        }}
      >
        {canEdit ? (
          <span
            contentEditable
            suppressContentEditableWarning
            className="preview-inline-editable"
            onBlur={(event) =>
              commitEditableText(
                event as unknown as { currentTarget: HTMLElement },
                editorFieldKey!,
                onInlineCommit
              )
            }
            onKeyDown={onEditableKeyDown}
          >
            {String(node.props?.label ?? "Action")}
          </span>
        ) : (
          String(node.props?.label ?? "Action")
        )}
      </a>
    );
  }

  if (node.type === "spacer") {
    const size = typeof node.props?.size === "number" ? node.props.size : 24;
    return (
      <div
        className={primitiveClass}
        style={{ height: `${size}px`, ...style }}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
      />
    );
  }

  if (node.type === "details") {
    return (
      <details
        className={`${primitiveClass} faq-item`}
        style={style}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
      >
        <summary>{String(node.props?.summary ?? "Lorem ipsum dolor sit amet?")}</summary>
        <p>
          {String(
            node.props?.body ??
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
          )}
        </p>
      </details>
    );
  }

  return null;
}

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";

import type { BlockInstance, PrimitiveNode, PrimitiveType } from "../../../features/builder/types";

type PrimitiveStyleSetKey =
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft";

type PrimitiveRendererProps = {
  node: PrimitiveNode;
  editable?: boolean;
  onInlineCommit?: (fieldKey: string, value: string) => void;
  primitivePath?: string;
  selectedPrimitivePath?: string | null;
  hoveredPrimitivePath?: string | null;
  onHoverPrimitive?: (path: string | null) => void;
  onSelectPrimitive?: (path: string, type: PrimitiveType) => void;
  onPrimitiveStyleSet?: (path: string, key: PrimitiveStyleSetKey, value: string) => void;
  primitiveStyles?: BlockInstance["styleOverrides"]["primitiveStyles"];
};

type SpacingHandle = {
  id: string;
  key: PrimitiveStyleSetKey;
  label: string;
  kind: "margin" | "padding";
  side: "top" | "right" | "bottom" | "left";
  axis: "x" | "y";
  deltaSign: 1 | -1;
};

const SPACING_HANDLES: SpacingHandle[] = [
  {
    id: "margin-top",
    key: "marginTop",
    label: "Margin top",
    kind: "margin",
    side: "top",
    axis: "y",
    deltaSign: 1,
  },
  {
    id: "margin-right",
    key: "marginRight",
    label: "Margin right",
    kind: "margin",
    side: "right",
    axis: "x",
    deltaSign: -1,
  },
  {
    id: "margin-bottom",
    key: "marginBottom",
    label: "Margin bottom",
    kind: "margin",
    side: "bottom",
    axis: "y",
    deltaSign: 1,
  },
  {
    id: "margin-left",
    key: "marginLeft",
    label: "Margin left",
    kind: "margin",
    side: "left",
    axis: "x",
    deltaSign: 1,
  },
  {
    id: "padding-top",
    key: "paddingTop",
    label: "Padding top",
    kind: "padding",
    side: "top",
    axis: "y",
    deltaSign: 1,
  },
  {
    id: "padding-right",
    key: "paddingRight",
    label: "Padding right",
    kind: "padding",
    side: "right",
    axis: "x",
    deltaSign: -1,
  },
  {
    id: "padding-bottom",
    key: "paddingBottom",
    label: "Padding bottom",
    kind: "padding",
    side: "bottom",
    axis: "y",
    deltaSign: 1,
  },
  {
    id: "padding-left",
    key: "paddingLeft",
    label: "Padding left",
    kind: "padding",
    side: "left",
    axis: "x",
    deltaSign: 1,
  },
];

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
    marginRight: style.marginRight,
    marginBottom: style.marginBottom,
    marginLeft: style.marginLeft,
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

function keyToComputedProperty(key: PrimitiveStyleSetKey): keyof CSSStyleDeclaration {
  if (key === "marginTop") {
    return "marginTop";
  }
  if (key === "marginRight") {
    return "marginRight";
  }
  if (key === "marginBottom") {
    return "marginBottom";
  }
  if (key === "marginLeft") {
    return "marginLeft";
  }
  if (key === "paddingTop") {
    return "paddingTop";
  }
  if (key === "paddingRight") {
    return "paddingRight";
  }
  if (key === "paddingBottom") {
    return "paddingBottom";
  }
  return "paddingLeft";
}

function parsePxValue(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampPx(value: number): number {
  return Math.max(0, Math.round(value));
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
  onPrimitiveStyleSet,
  primitiveStyles,
}: PrimitiveRendererProps) {
  const style = toPrimitiveStyle(primitiveStyles?.[primitivePath]);
  const isSelected = selectedPrimitivePath === primitivePath;
  const isHovered = hoveredPrimitivePath === primitivePath;
  const primitiveClass = `preview-primitive-node${isSelected ? " selected" : ""}${isHovered ? " hovered" : ""}`;
  const selectPrimitive = () => onSelectPrimitive?.(primitivePath, node.type);
  const primitiveRef = useRef<HTMLElement | null>(null);
  const [overlayModel, setOverlayModel] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
  } | null>(null);
  const dragRef = useRef<{
    handle: SpacingHandle;
    startCoord: number;
    startValue: number;
    onPointerMove: (event: PointerEvent) => void;
    onPointerUp: () => void;
  } | null>(null);
  const [activeDrag, setActiveDrag] = useState<{ label: string; value: number } | null>(null);

  const updateOverlayRect = useCallback(() => {
    if (!isSelected || !primitiveRef.current) {
      setOverlayModel(null);
      return;
    }
    const computedStyle = window.getComputedStyle(primitiveRef.current);
    const rect = primitiveRef.current.getBoundingClientRect();
    setOverlayModel({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      marginTop: parsePxValue(computedStyle.marginTop),
      marginRight: parsePxValue(computedStyle.marginRight),
      marginBottom: parsePxValue(computedStyle.marginBottom),
      marginLeft: parsePxValue(computedStyle.marginLeft),
      paddingTop: parsePxValue(computedStyle.paddingTop),
      paddingRight: parsePxValue(computedStyle.paddingRight),
      paddingBottom: parsePxValue(computedStyle.paddingBottom),
      paddingLeft: parsePxValue(computedStyle.paddingLeft),
    });
  }, [isSelected]);

  useLayoutEffect(() => {
    if (!isSelected) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      updateOverlayRect();
    });

    const onWindowChange = () => updateOverlayRect();
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
    };
  }, [isSelected, primitivePath, updateOverlayRect]);

  useEffect(() => {
    return () => {
      if (!dragRef.current) {
        return;
      }
      window.removeEventListener("pointermove", dragRef.current.onPointerMove);
      window.removeEventListener("pointerup", dragRef.current.onPointerUp);
    };
  }, []);

  const readCurrentSpacing = (key: PrimitiveStyleSetKey): number => {
    const overrideValue = primitiveStyles?.[primitivePath]?.[key];
    if (overrideValue) {
      return parsePxValue(overrideValue);
    }
    if (!primitiveRef.current) {
      return 0;
    }
    const computedStyle = window.getComputedStyle(primitiveRef.current);
    const computedKey = keyToComputedProperty(key);
    const computedValue = String(computedStyle[computedKey] ?? "0");
    return parsePxValue(computedValue);
  };

  const startSpacingDrag = (event: ReactPointerEvent<HTMLButtonElement>, handle: SpacingHandle) => {
    if (!onPrimitiveStyleSet) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    selectPrimitive();

    const startCoord = handle.axis === "y" ? event.clientY : event.clientX;
    const startValue = readCurrentSpacing(handle.key);
    setActiveDrag({ label: handle.label, value: startValue });

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentCoord = handle.axis === "y" ? moveEvent.clientY : moveEvent.clientX;
      const delta = (currentCoord - startCoord) * handle.deltaSign;
      const nextValue = clampPx(startValue + delta);
      onPrimitiveStyleSet(primitivePath, handle.key, `${nextValue}px`);
      setActiveDrag({ label: handle.label, value: nextValue });
      updateOverlayRect();
    };

    const onPointerUp = () => {
      if (!dragRef.current) {
        return;
      }
      window.removeEventListener("pointermove", dragRef.current.onPointerMove);
      window.removeEventListener("pointerup", dragRef.current.onPointerUp);
      dragRef.current = null;
      setActiveDrag(null);
    };

    if (dragRef.current) {
      window.removeEventListener("pointermove", dragRef.current.onPointerMove);
      window.removeEventListener("pointerup", dragRef.current.onPointerUp);
    }

    dragRef.current = { handle, startCoord, startValue, onPointerMove, onPointerUp };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const renderSpacingOverlay = () => {
    if (!isSelected || !overlayModel || !onPrimitiveStyleSet) {
      return null;
    }

    return (
      <div
        className="primitive-spacing-overlay"
        style={{
          top: `${overlayModel.top}px`,
          left: `${overlayModel.left}px`,
          width: `${overlayModel.width}px`,
          height: `${overlayModel.height}px`,
        }}
      >
        <div className="primitive-spacing-guide baseline" />
        <div
          className="primitive-spacing-guide margin"
          style={{
            top: `${-overlayModel.marginTop}px`,
            right: `${-overlayModel.marginRight}px`,
            bottom: `${-overlayModel.marginBottom}px`,
            left: `${-overlayModel.marginLeft}px`,
          }}
        />
        <div
          className="primitive-spacing-guide padding"
          style={{
            top: `${overlayModel.paddingTop}px`,
            right: `${overlayModel.paddingRight}px`,
            bottom: `${overlayModel.paddingBottom}px`,
            left: `${overlayModel.paddingLeft}px`,
          }}
        />

        {SPACING_HANDLES.map((handle) => (
          <button
            key={`${primitivePath}-${handle.id}`}
            className={`primitive-spacing-handle ${handle.kind} ${handle.side}`}
            onPointerDown={(event) => startSpacingDrag(event, handle)}
            title={handle.label}
            aria-label={handle.label}
            type="button"
          />
        ))}

        {activeDrag ? (
          <div className="primitive-spacing-readout">
            {activeDrag.label}: {activeDrag.value}px
          </div>
        ) : null}
      </div>
    );
  };

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

  const withOverlay = (element: ReactElement) => (
    <>
      {element}
      {renderSpacingOverlay()}
    </>
  );

  const setPrimitiveRef = (element: HTMLElement | null) => {
    primitiveRef.current = element;
  };

  if (node.type === "stack") {
    return withOverlay(
      <div
        ref={setPrimitiveRef}
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
            onPrimitiveStyleSet={onPrimitiveStyleSet}
            primitiveStyles={primitiveStyles}
          />
        ))}
      </div>
    );
  }

  if (node.type === "columns") {
    return withOverlay(
      <div
        ref={setPrimitiveRef}
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
            onPrimitiveStyleSet={onPrimitiveStyleSet}
            primitiveStyles={primitiveStyles}
          />
        ))}
      </div>
    );
  }

  if (node.type === "cards") {
    const columns =
      typeof node.props?.columns === "number" ? Math.max(1, Number(node.props.columns)) : 2;
    return withOverlay(
      <div
        ref={setPrimitiveRef}
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
            onPrimitiveStyleSet={onPrimitiveStyleSet}
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
      return withOverlay(
        <h1
          ref={setPrimitiveRef}
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
      return withOverlay(
        <h2
          ref={setPrimitiveRef}
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
      return withOverlay(
        <h3
          ref={setPrimitiveRef}
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
    return withOverlay(
      <h4
        ref={setPrimitiveRef}
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
    return withOverlay(
      <p
        ref={setPrimitiveRef}
        className={`${primitiveClass}${editable && editorFieldKey && isSelected ? " preview-inline-editable" : ""}`}
        style={style}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
        {...editableProps}
      >
        {String(node.props?.value ?? "")}
      </p>
    );
  }

  if (node.type === "image") {
    const src = String(node.props?.src ?? "");
    const alt = String(node.props?.alt ?? "");
    return src
      ? withOverlay(
          <img
            ref={setPrimitiveRef}
            className={`${primitiveClass} ${String(node.props?.className ?? "").trim()}`.trim()}
            style={style}
            onClick={onPrimitiveClick}
            onMouseMove={onPrimitiveMove}
            src={src}
            alt={alt}
          />
        )
      : withOverlay(
          <div
            ref={setPrimitiveRef}
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
    return withOverlay(
      <div
        ref={setPrimitiveRef}
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
    return withOverlay(
      <div
        ref={setPrimitiveRef}
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
    return withOverlay(
      <pre
        ref={setPrimitiveRef}
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
    return withOverlay(
      <a
        ref={setPrimitiveRef}
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
    return withOverlay(
      <div
        ref={setPrimitiveRef}
        className={primitiveClass}
        style={{ height: `${size}px`, ...style }}
        onClick={onPrimitiveClick}
        onMouseMove={onPrimitiveMove}
      />
    );
  }

  if (node.type === "details") {
    return withOverlay(
      <details
        ref={setPrimitiveRef}
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

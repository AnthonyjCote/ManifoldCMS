import {
  cloneElement,
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
import { createPortal } from "react-dom";
import heroImagePlaceholder from "../../../assets/placeholders/images/camera-corner-placeholder.svg";

import {
  getPrimitiveStyleValue,
  type BuilderViewport,
} from "../../../features/builder/style-scopes";
import type {
  BlockInstance,
  PrimitiveNode,
  PrimitiveType,
  StyleStateKey,
} from "../../../features/builder/types";

type PrimitiveStyleSetKey =
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "translateX"
  | "translateY";

type PrimitiveRendererProps = {
  node: PrimitiveNode;
  editable?: boolean;
  selectionEnabled?: boolean;
  hoverEnabled?: boolean;
  onInlineCommit?: (fieldKey: string, value: string) => void;
  primitivePath?: string;
  selectedPrimitivePaths?: string[];
  hoveredPrimitivePath?: string | null;
  onHoverPrimitive?: (path: string | null) => void;
  onSelectPrimitive?: (path: string, type: PrimitiveType, multi: boolean) => void;
  onPrimitiveStyleSet?: (path: string, key: PrimitiveStyleSetKey, value: string) => void;
  onStyleDragSessionStart?: () => void;
  onStyleDragSessionEnd?: () => void;
  previewScope: BuilderViewport;
  primitiveStyles?: BlockInstance["styleOverrides"]["primitiveStyles"];
  primitiveViewportStyles?: BlockInstance["styleOverrides"]["primitiveViewportStyles"];
  primitiveStateViewportStyles?: BlockInstance["styleOverrides"]["primitiveStateViewportStyles"];
  hoverPrimitivePaths?: string[];
  pulsedPrimitivePath?: string | null;
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

function toPrimitiveStyle(opts: {
  primitivePath: string;
  styleOverrides: BlockInstance["styleOverrides"];
  previewScope: BuilderViewport;
  styleState?: StyleStateKey;
}) {
  const styleState = opts.styleState ?? "default";
  const style = {
    marginTop: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "marginTop",
      opts.previewScope,
      styleState
    ),
    marginRight: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "marginRight",
      opts.previewScope,
      styleState
    ),
    marginBottom: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "marginBottom",
      opts.previewScope,
      styleState
    ),
    marginLeft: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "marginLeft",
      opts.previewScope,
      styleState
    ),
    paddingTop: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "paddingTop",
      opts.previewScope,
      styleState
    ),
    paddingRight: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "paddingRight",
      opts.previewScope,
      styleState
    ),
    paddingBottom: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "paddingBottom",
      opts.previewScope,
      styleState
    ),
    paddingLeft: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "paddingLeft",
      opts.previewScope,
      styleState
    ),
    borderWidth: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "borderWidth",
      opts.previewScope,
      styleState
    ),
    borderStyle: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "borderStyle",
      opts.previewScope,
      styleState
    ),
    borderColor: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "borderColor",
      opts.previewScope,
      styleState
    ),
    borderRadius: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "borderRadius",
      opts.previewScope,
      styleState
    ),
    backgroundColor: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "backgroundColor",
      opts.previewScope,
      styleState
    ),
    textColor: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "textColor",
      opts.previewScope,
      styleState
    ),
    fontSize: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "fontSize",
      opts.previewScope,
      styleState
    ),
    fontWeight: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "fontWeight",
      opts.previewScope,
      styleState
    ),
    lineHeight: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "lineHeight",
      opts.previewScope,
      styleState
    ),
    textAlign: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "textAlign",
      opts.previewScope,
      styleState
    ),
    width: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "width",
      opts.previewScope,
      styleState
    ),
    height: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "height",
      opts.previewScope,
      styleState
    ),
    translateX: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "translateX",
      opts.previewScope,
      styleState
    ),
    translateY: getPrimitiveStyleValue(
      opts.styleOverrides,
      opts.primitivePath,
      "translateY",
      opts.previewScope,
      styleState
    ),
  };
  if (!style) {
    return undefined;
  }
  const hasBackgroundOverride =
    typeof style.backgroundColor === "string" && style.backgroundColor.trim().length > 0;
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
    background: hasBackgroundOverride ? style.backgroundColor : undefined,
    backgroundImage: hasBackgroundOverride ? "none" : undefined,
    color: style.textColor,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign as "left" | "center" | "right" | "justify" | undefined,
    width: style.width,
    height: style.height,
    transform:
      style.translateX || style.translateY
        ? `translate(${style.translateX ?? "0px"}, ${style.translateY ?? "0px"})`
        : undefined,
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

function parseTranslateFromComputed(transform: string): { x: number; y: number } {
  if (!transform || transform === "none") {
    return { x: 0, y: 0 };
  }
  const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
  if (matrixMatch) {
    const parts = matrixMatch[1].split(",").map((part) => Number.parseFloat(part.trim()));
    if (parts.length === 6 && Number.isFinite(parts[4]) && Number.isFinite(parts[5])) {
      return { x: parts[4], y: parts[5] };
    }
  }
  const matrix3dMatch = transform.match(/matrix3d\(([^)]+)\)/);
  if (matrix3dMatch) {
    const parts = matrix3dMatch[1].split(",").map((part) => Number.parseFloat(part.trim()));
    if (parts.length === 16 && Number.isFinite(parts[12]) && Number.isFinite(parts[13])) {
      return { x: parts[12], y: parts[13] };
    }
  }
  return { x: 0, y: 0 };
}

function clampNonNegativePx(value: number): number {
  return Math.max(0, Math.round(value));
}

function roundPx(value: number): number {
  return Math.round(value);
}

function normalizeSpacingByKey(key: PrimitiveStyleSetKey, value: number): number {
  if (
    key === "marginTop" ||
    key === "marginRight" ||
    key === "marginBottom" ||
    key === "marginLeft"
  ) {
    return roundPx(value);
  }
  return clampNonNegativePx(value);
}

export function PrimitiveRenderer({
  node,
  editable = false,
  selectionEnabled = true,
  hoverEnabled = false,
  onInlineCommit,
  primitivePath = "0",
  selectedPrimitivePaths = [],
  hoveredPrimitivePath = null,
  onHoverPrimitive,
  onSelectPrimitive,
  onPrimitiveStyleSet,
  onStyleDragSessionStart,
  onStyleDragSessionEnd,
  previewScope,
  primitiveStyles,
  primitiveViewportStyles,
  primitiveStateViewportStyles,
  hoverPrimitivePaths = [],
  pulsedPrimitivePath = null,
}: PrimitiveRendererProps) {
  const styleState: StyleStateKey = hoverPrimitivePaths.includes(primitivePath)
    ? "hover"
    : "default";
  const style = toPrimitiveStyle({
    primitivePath,
    previewScope,
    styleState,
    styleOverrides: {
      variant: "default",
      primitiveStyles,
      primitiveViewportStyles,
      primitiveStateViewportStyles,
    },
  });
  const isSelected = selectionEnabled && selectedPrimitivePaths.includes(primitivePath);
  const isHovered = selectionEnabled && hoveredPrimitivePath === primitivePath;
  const isPulsed = pulsedPrimitivePath === primitivePath;
  const primitiveClass = `preview-primitive-node${isSelected ? " selected" : ""}${isHovered ? " hovered" : ""}${isPulsed ? " jump-pulse" : ""}`;
  const selectPrimitive = (multi = false) => onSelectPrimitive?.(primitivePath, node.type, multi);
  const primitiveRef = useRef<HTMLElement | null>(null);
  const [overlayHost, setOverlayHost] = useState<HTMLElement | null>(null);
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
    translateX: number;
    translateY: number;
  } | null>(null);
  const dragRef = useRef<{
    handle: SpacingHandle;
    startCoord: number;
    startValue: number;
    onPointerMove: (event: PointerEvent) => void;
    onPointerUp: () => void;
  } | null>(null);
  const [activeDrag, setActiveDrag] = useState<{ label: string; value: number } | null>(null);
  const [activeTransformDrag, setActiveTransformDrag] = useState<{ x: number; y: number } | null>(
    null
  );

  const updateOverlayRect = useCallback(() => {
    if (!isSelected || !primitiveRef.current) {
      setOverlayHost(null);
      setOverlayModel(null);
      return;
    }
    const host = primitiveRef.current.closest(".site-preview-page");
    if (!(host instanceof HTMLElement)) {
      setOverlayHost(null);
      setOverlayModel(null);
      return;
    }
    setOverlayHost(host);
    const computedStyle = window.getComputedStyle(primitiveRef.current);
    const computedTranslate = parseTranslateFromComputed(computedStyle.transform);
    const rect = primitiveRef.current.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    setOverlayModel((prev) => {
      const next = {
        top: rect.top - hostRect.top + host.scrollTop,
        left: rect.left - hostRect.left + host.scrollLeft,
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
        translateX: computedTranslate.x,
        translateY: computedTranslate.y,
      };
      if (
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.marginTop === next.marginTop &&
        prev.marginRight === next.marginRight &&
        prev.marginBottom === next.marginBottom &&
        prev.marginLeft === next.marginLeft &&
        prev.paddingTop === next.paddingTop &&
        prev.paddingRight === next.paddingRight &&
        prev.paddingBottom === next.paddingBottom &&
        prev.paddingLeft === next.paddingLeft &&
        prev.translateX === next.translateX &&
        prev.translateY === next.translateY
      ) {
        return prev;
      }
      return next;
    });
  }, [isSelected]);

  useLayoutEffect(() => {
    if (!isSelected) {
      return;
    }
    const onChange = () => updateOverlayRect();
    const frameId = window.requestAnimationFrame(onChange);
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);

    const host = primitiveRef.current?.closest(".site-preview-page");
    const resizeObserver = new ResizeObserver(onChange);
    if (primitiveRef.current) {
      resizeObserver.observe(primitiveRef.current);
    }
    if (host instanceof HTMLElement) {
      resizeObserver.observe(host);
    }
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
      resizeObserver.disconnect();
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
    const overrideValue =
      key === "translateX" || key === "translateY"
        ? undefined
        : getPrimitiveStyleValue(
            {
              variant: "default",
              primitiveStyles,
              primitiveViewportStyles,
            },
            primitivePath,
            key,
            previewScope
          );
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
    onStyleDragSessionStart?.();

    const startCoord = handle.axis === "y" ? event.clientY : event.clientX;
    const startValue = readCurrentSpacing(handle.key);
    setActiveDrag({ label: handle.label, value: startValue });

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentCoord = handle.axis === "y" ? moveEvent.clientY : moveEvent.clientX;
      const delta = (currentCoord - startCoord) * handle.deltaSign;
      const nextValue = normalizeSpacingByKey(handle.key, startValue + delta);
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
      onStyleDragSessionEnd?.();
    };

    if (dragRef.current) {
      window.removeEventListener("pointermove", dragRef.current.onPointerMove);
      window.removeEventListener("pointerup", dragRef.current.onPointerUp);
      onStyleDragSessionEnd?.();
    }

    dragRef.current = { handle, startCoord, startValue, onPointerMove, onPointerUp };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const readCurrentTransform = (): { x: number; y: number } => {
    const styleOverrides = {
      variant: "default",
      primitiveStyles,
      primitiveViewportStyles,
    } as const;
    const xOverride = getPrimitiveStyleValue(
      styleOverrides,
      primitivePath,
      "translateX",
      previewScope
    );
    const yOverride = getPrimitiveStyleValue(
      styleOverrides,
      primitivePath,
      "translateY",
      previewScope
    );
    if (xOverride || yOverride) {
      return {
        x: parsePxValue(xOverride),
        y: parsePxValue(yOverride),
      };
    }
    if (!primitiveRef.current) {
      return { x: 0, y: 0 };
    }
    return parseTranslateFromComputed(window.getComputedStyle(primitiveRef.current).transform);
  };

  const startTransformDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!onPrimitiveStyleSet) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onStyleDragSessionStart?.();

    const startX = event.clientX;
    const startY = event.clientY;
    const initial = readCurrentTransform();
    setActiveTransformDrag(initial);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const nextX = roundPx(initial.x + deltaX);
      const nextY = roundPx(initial.y + deltaY);
      onPrimitiveStyleSet(primitivePath, "translateX", `${nextX}px`);
      onPrimitiveStyleSet(primitivePath, "translateY", `${nextY}px`);
      setActiveTransformDrag({ x: nextX, y: nextY });
      updateOverlayRect();
    };

    const onPointerUp = () => {
      if (!dragRef.current) {
        return;
      }
      window.removeEventListener("pointermove", dragRef.current.onPointerMove);
      window.removeEventListener("pointerup", dragRef.current.onPointerUp);
      dragRef.current = null;
      setActiveTransformDrag(null);
      onStyleDragSessionEnd?.();
    };

    if (dragRef.current) {
      window.removeEventListener("pointermove", dragRef.current.onPointerMove);
      window.removeEventListener("pointerup", dragRef.current.onPointerUp);
      onStyleDragSessionEnd?.();
    }

    dragRef.current = {
      handle: SPACING_HANDLES[0],
      startCoord: startX,
      startValue: initial.x,
      onPointerMove,
      onPointerUp,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const renderSpacingOverlay = () => {
    if (!selectionEnabled || !isSelected || !overlayModel || !onPrimitiveStyleSet) {
      return null;
    }

    const overlay = (
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
          className="primitive-spacing-guide transform-origin"
          style={{
            transform: `translate(${-overlayModel.translateX}px, ${-overlayModel.translateY}px)`,
          }}
        />
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

        <button
          className="primitive-transform-handle"
          onPointerDown={startTransformDrag}
          title="Drag to offset X and Y"
          aria-label="Drag to offset X and Y"
          type="button"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v16M4 12h16M7 7l-3 5 3 5M17 7l3 5-3 5" />
          </svg>
        </button>

        {activeDrag ? (
          <div className="primitive-spacing-readout">
            {activeDrag.label}: {activeDrag.value}px
          </div>
        ) : null}
        {activeTransformDrag ? (
          <div className="primitive-transform-readout">
            X: {activeTransformDrag.x}px Y: {activeTransformDrag.y}px
          </div>
        ) : null}
      </div>
    );

    if (!overlayHost) {
      return null;
    }
    return createPortal(overlay, overlayHost);
  };

  const onPrimitiveClick = (event: MouseEvent<HTMLElement>) => {
    if (!selectionEnabled) {
      return;
    }
    event.stopPropagation();
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.isContentEditable && !isSelected) {
      active.blur();
    }
    selectPrimitive(event.shiftKey);
  };

  const onPrimitiveMove = (event: MouseEvent<HTMLElement>) => {
    if (!selectionEnabled && !hoverEnabled) {
      return;
    }
    event.stopPropagation();
    onHoverPrimitive?.(primitivePath);
  };

  const withOverlay = (element: ReactElement) => (
    <>
      {cloneElement(element as ReactElement<Record<string, unknown>>, {
        "data-primitive-path": primitivePath,
      })}
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
            selectionEnabled={selectionEnabled}
            hoverEnabled={hoverEnabled}
            onInlineCommit={onInlineCommit}
            primitivePath={`${primitivePath}.${index}`}
            selectedPrimitivePaths={selectedPrimitivePaths}
            hoveredPrimitivePath={hoveredPrimitivePath}
            onHoverPrimitive={onHoverPrimitive}
            onSelectPrimitive={onSelectPrimitive}
            onPrimitiveStyleSet={onPrimitiveStyleSet}
            onStyleDragSessionStart={onStyleDragSessionStart}
            onStyleDragSessionEnd={onStyleDragSessionEnd}
            previewScope={previewScope}
            primitiveStyles={primitiveStyles}
            primitiveViewportStyles={primitiveViewportStyles}
            primitiveStateViewportStyles={primitiveStateViewportStyles}
            hoverPrimitivePaths={hoverPrimitivePaths}
            pulsedPrimitivePath={pulsedPrimitivePath}
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
            selectionEnabled={selectionEnabled}
            hoverEnabled={hoverEnabled}
            onInlineCommit={onInlineCommit}
            primitivePath={`${primitivePath}.${index}`}
            selectedPrimitivePaths={selectedPrimitivePaths}
            hoveredPrimitivePath={hoveredPrimitivePath}
            onHoverPrimitive={onHoverPrimitive}
            onSelectPrimitive={onSelectPrimitive}
            onPrimitiveStyleSet={onPrimitiveStyleSet}
            onStyleDragSessionStart={onStyleDragSessionStart}
            onStyleDragSessionEnd={onStyleDragSessionEnd}
            previewScope={previewScope}
            primitiveStyles={primitiveStyles}
            primitiveViewportStyles={primitiveViewportStyles}
            primitiveStateViewportStyles={primitiveStateViewportStyles}
            hoverPrimitivePaths={hoverPrimitivePaths}
            pulsedPrimitivePath={pulsedPrimitivePath}
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
            selectionEnabled={selectionEnabled}
            hoverEnabled={hoverEnabled}
            onInlineCommit={onInlineCommit}
            primitivePath={`${primitivePath}.${index}`}
            selectedPrimitivePaths={selectedPrimitivePaths}
            hoveredPrimitivePath={hoveredPrimitivePath}
            onHoverPrimitive={onHoverPrimitive}
            onSelectPrimitive={onSelectPrimitive}
            onPrimitiveStyleSet={onPrimitiveStyleSet}
            onStyleDragSessionStart={onStyleDragSessionStart}
            onStyleDragSessionEnd={onStyleDragSessionEnd}
            previewScope={previewScope}
            primitiveStyles={primitiveStyles}
            primitiveViewportStyles={primitiveViewportStyles}
            primitiveStateViewportStyles={primitiveStateViewportStyles}
            hoverPrimitivePaths={hoverPrimitivePaths}
            pulsedPrimitivePath={pulsedPrimitivePath}
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
    const className = String(node.props?.className ?? "").trim();
    const isHeroImagePlaceholder = className.split(/\s+/).includes("hero-image");
    return src
      ? withOverlay(
          <img
            ref={setPrimitiveRef}
            className={`${primitiveClass} ${className}`.trim()}
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
            className={`${primitiveClass} primitive-image-placeholder ${className}${
              isHeroImagePlaceholder ? " hero-image-placeholder-art" : ""
            }`.trim()}
            style={style}
            onClick={onPrimitiveClick}
            onMouseMove={onPrimitiveMove}
          >
            {isHeroImagePlaceholder ? (
              <img
                src={heroImagePlaceholder}
                alt=""
                aria-hidden="true"
                className="hero-image-placeholder-icon"
              />
            ) : (
              "Lorem ipsum image placeholder."
            )}
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
        onMouseDown={(event) => {
          if (!selectionEnabled) {
            return;
          }
          event.stopPropagation();
        }}
        onMouseMove={onPrimitiveMove}
        onClick={(event) => {
          if (!selectionEnabled) {
            return;
          }
          event.stopPropagation();
          selectPrimitive(event.shiftKey);
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

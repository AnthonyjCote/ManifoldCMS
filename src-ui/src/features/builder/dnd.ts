import type { BlockType } from "./types";

export const BUILDER_DND_MIME = "application/x-manifold-builder-dnd";
export const BUILDER_POINTER_DRAG_MOVE_EVENT = "manifold:builder-pointer-drag-move";
export const BUILDER_POINTER_DRAG_DROP_EVENT = "manifold:builder-pointer-drag-drop";
export const BUILDER_POINTER_DRAG_END_EVENT = "manifold:builder-pointer-drag-end";

export type BuilderDragPayload =
  | { kind: "catalog"; blockType: BlockType }
  | { kind: "canvas"; blockId: string };

export type BuilderPointerDragDetail = {
  clientX: number;
  clientY: number;
  payload: BuilderDragPayload;
};

let activeDragPayload: BuilderDragPayload | null = null;
let pointerDragCleanup: (() => void) | null = null;

export function writeBuilderDragPayload(
  transfer: DataTransfer | null,
  payload: BuilderDragPayload
): void {
  activeDragPayload = payload;
  if (!transfer) {
    return;
  }
  const raw = JSON.stringify(payload);
  transfer.setData(BUILDER_DND_MIME, raw);
  transfer.setData("text/plain", raw);
  transfer.effectAllowed = "copyMove";
}

export function readBuilderDragPayload(transfer: DataTransfer | null): BuilderDragPayload | null {
  if (!transfer) {
    return activeDragPayload;
  }

  const raw = transfer.getData(BUILDER_DND_MIME) || transfer.getData("text/plain");
  if (!raw) {
    return activeDragPayload;
  }

  try {
    const parsed = JSON.parse(raw) as BuilderDragPayload;
    if (parsed.kind === "catalog" && typeof parsed.blockType === "string") {
      return parsed;
    }
    if (parsed.kind === "canvas" && typeof parsed.blockId === "string") {
      return parsed;
    }
    return null;
  } catch {
    return activeDragPayload;
  }
}

export function clearBuilderDragPayload(): void {
  activeDragPayload = null;
}

function beginPointerDrag(
  payload: BuilderDragPayload,
  start: { clientX: number; clientY: number }
): void {
  if (pointerDragCleanup) {
    pointerDragCleanup();
  }

  activeDragPayload = payload;
  document.body.classList.add("builder-pointer-dragging");

  const emit = (name: string, detail: BuilderPointerDragDetail) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  const onMove = (event: PointerEvent) => {
    emit(BUILDER_POINTER_DRAG_MOVE_EVENT, {
      clientX: event.clientX,
      clientY: event.clientY,
      payload,
    });
  };

  const onUp = (event: PointerEvent) => {
    emit(BUILDER_POINTER_DRAG_DROP_EVENT, {
      clientX: event.clientX,
      clientY: event.clientY,
      payload,
    });
    emit(BUILDER_POINTER_DRAG_END_EVENT, {
      clientX: event.clientX,
      clientY: event.clientY,
      payload,
    });
    cleanup();
  };

  const cleanup = () => {
    window.removeEventListener("pointermove", onMove, true);
    window.removeEventListener("pointerup", onUp, true);
    window.removeEventListener("pointercancel", onUp, true);
    document.body.classList.remove("builder-pointer-dragging");
    activeDragPayload = null;
    pointerDragCleanup = null;
  };

  window.addEventListener("pointermove", onMove, true);
  window.addEventListener("pointerup", onUp, true);
  window.addEventListener("pointercancel", onUp, true);
  pointerDragCleanup = cleanup;

  emit(BUILDER_POINTER_DRAG_MOVE_EVENT, {
    clientX: start.clientX,
    clientY: start.clientY,
    payload,
  });
}

export function beginPointerCatalogDrag(
  blockType: BlockType,
  start: { clientX: number; clientY: number }
): void {
  beginPointerDrag({ kind: "catalog", blockType }, start);
}

export function beginPointerCanvasDrag(
  blockId: string,
  start: { clientX: number; clientY: number }
): void {
  beginPointerDrag({ kind: "canvas", blockId }, start);
}

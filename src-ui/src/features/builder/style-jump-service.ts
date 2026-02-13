import type { StyleCategory } from "./style-field-config";
import type { StyleStateKey, StyleViewportKey } from "./types";

export const BUILDER_STYLE_JUMP_EVENT = "manifold:builder-style-jump";

export type StyleJumpRequest = {
  blockId: string;
  primitivePath: string | null;
  viewport: StyleViewportKey;
  state: StyleStateKey;
  fieldKey: string;
  category: StyleCategory;
};

export function requestStyleJump(request: StyleJumpRequest): void {
  window.dispatchEvent(
    new CustomEvent<StyleJumpRequest>(BUILDER_STYLE_JUMP_EVENT, { detail: request })
  );
}

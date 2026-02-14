import type { ThemeTokens } from "./types";

export const BUILDER_THEME_TOKEN_JUMP_EVENT = "manifold:builder-theme-token-jump";

export type ThemeTokenJumpRequest = {
  tokenKey: keyof ThemeTokens;
};

let pendingThemeTokenJump: ThemeTokenJumpRequest | null = null;

export function requestThemeTokenJump(request: ThemeTokenJumpRequest): void {
  pendingThemeTokenJump = request;
  window.dispatchEvent(
    new CustomEvent<ThemeTokenJumpRequest>(BUILDER_THEME_TOKEN_JUMP_EVENT, {
      detail: request,
    })
  );
}

export function consumePendingThemeTokenJump(): ThemeTokenJumpRequest | null {
  const next = pendingThemeTokenJump;
  pendingThemeTokenJump = null;
  return next;
}

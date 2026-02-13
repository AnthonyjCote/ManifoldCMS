import type { CSSProperties } from "react";

export type ThemeSource = "bundled" | "user";

export type ThemeTokens = {
  baseColor: string;
  accentColor: string;
  altColor: string;
  linkColor: string;
  canvasBackground: string;
  surfaceBackground: string;
  mutedBackground: string;
  textPrimary: string;
  textSecondary: string;
  headingColor: string;
  buttonBackground: string;
  buttonText: string;
  buttonAltBackground: string;
  buttonAltText: string;
  cardBackground: string;
  cardBorder: string;
};

export type ThemeRecord = {
  id: string;
  name: string;
  description: string;
  source: ThemeSource;
  createdAt: string;
  updatedAt: string;
  tokens: ThemeTokens;
};

export type ThemeSnapshot = {
  id: string;
  createdAt: string;
  theme: ThemeRecord;
};

export type ThemeState = {
  schemaVersion: 1;
  activeThemeId: string;
  themes: ThemeRecord[];
  snapshots: ThemeSnapshot[];
};

export function themeToCssVars(tokens: ThemeTokens): CSSProperties {
  return {
    ["--theme-base-color" as string]: tokens.baseColor,
    ["--theme-accent-color" as string]: tokens.accentColor,
    ["--theme-alt-color" as string]: tokens.altColor,
    ["--theme-link-color" as string]: tokens.linkColor,
    ["--theme-canvas-bg" as string]: tokens.canvasBackground,
    ["--theme-surface-bg" as string]: tokens.surfaceBackground,
    ["--theme-muted-bg" as string]: tokens.mutedBackground,
    ["--theme-text-primary" as string]: tokens.textPrimary,
    ["--theme-text-secondary" as string]: tokens.textSecondary,
    ["--theme-heading-color" as string]: tokens.headingColor,
    ["--theme-button-bg" as string]: tokens.buttonBackground,
    ["--theme-button-text" as string]: tokens.buttonText,
    ["--theme-button-alt-bg" as string]: tokens.buttonAltBackground,
    ["--theme-button-alt-text" as string]: tokens.buttonAltText,
    ["--theme-card-bg" as string]: tokens.cardBackground,
    ["--theme-card-border" as string]: tokens.cardBorder,
  };
}

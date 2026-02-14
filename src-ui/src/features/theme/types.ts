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
  fontFamilyBody: string;
  fontFamilyHeading: string;
  fontFamilyMono: string;
  fontWeightBody: string;
  fontWeightHeading: string;
  fontSizeBody: string;
  lineHeightBody: string;
  fontSizeH1: string;
  fontSizeH2: string;
  fontSizeH3: string;
  lineHeightHeading: string;
  letterSpacingHeading: string;
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

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  baseColor: "#0f1726",
  accentColor: "#8ea3c8",
  altColor: "#304669",
  linkColor: "#a7c4f1",
  canvasBackground: "#0b0f15",
  surfaceBackground: "#111825",
  mutedBackground: "#0e1420",
  textPrimary: "#e6eaf4",
  textSecondary: "#b9c5e0",
  headingColor: "#f5f7ff",
  buttonBackground: "#0f1726",
  buttonText: "#f6f9ff",
  buttonAltBackground: "#f4f8ff",
  buttonAltText: "#17243a",
  cardBackground: "#ffffff",
  cardBorder: "#dce3f2",
  fontFamilyBody: '"Manrope", "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif',
  fontFamilyHeading: '"Manrope", "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif',
  fontFamilyMono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
  fontWeightBody: "400",
  fontWeightHeading: "700",
  fontSizeBody: "19px",
  lineHeightBody: "1.6",
  fontSizeH1: "64px",
  fontSizeH2: "44px",
  fontSizeH3: "24px",
  lineHeightHeading: "1.08",
  letterSpacingHeading: "-0.02em",
};

export function normalizeThemeTokens(input: Partial<ThemeTokens> | undefined): ThemeTokens {
  return {
    ...DEFAULT_THEME_TOKENS,
    ...(input ?? {}),
  };
}

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
    ["--theme-font-family-body" as string]: tokens.fontFamilyBody,
    ["--theme-font-family-heading" as string]: tokens.fontFamilyHeading,
    ["--theme-font-family-mono" as string]: tokens.fontFamilyMono,
    ["--theme-font-weight-body" as string]: tokens.fontWeightBody,
    ["--theme-font-weight-heading" as string]: tokens.fontWeightHeading,
    ["--theme-font-size-body" as string]: tokens.fontSizeBody,
    ["--theme-line-height-body" as string]: tokens.lineHeightBody,
    ["--theme-font-size-h1" as string]: tokens.fontSizeH1,
    ["--theme-font-size-h2" as string]: tokens.fontSizeH2,
    ["--theme-font-size-h3" as string]: tokens.fontSizeH3,
    ["--theme-line-height-heading" as string]: tokens.lineHeightHeading,
    ["--theme-letter-spacing-heading" as string]: tokens.letterSpacingHeading,
  };
}

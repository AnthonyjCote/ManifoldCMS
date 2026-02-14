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
  buttonRadius: string;
  buttonPaddingX: string;
  buttonPaddingY: string;
  buttonPrimaryBorderColor: string;
  buttonPrimaryBorderWidth: string;
  buttonPrimaryBorderStyle: string;
  buttonPrimaryShadow: string;
  buttonSecondaryBorderColor: string;
  buttonSecondaryBorderWidth: string;
  buttonSecondaryBorderStyle: string;
  buttonSecondaryShadow: string;
  buttonGhostBackground: string;
  buttonGhostText: string;
  buttonGhostBorderColor: string;
  buttonGhostBorderWidth: string;
  buttonGhostBorderStyle: string;
  buttonGhostShadow: string;
  cardBackground: string;
  cardBorder: string;
  cardBorderWidth: string;
  cardBorderStyle: string;
  cardRadius: string;
  cardShadow: string;
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
  buttonRadius: "999px",
  buttonPaddingX: "18px",
  buttonPaddingY: "11px",
  buttonPrimaryBorderColor: "transparent",
  buttonPrimaryBorderWidth: "1px",
  buttonPrimaryBorderStyle: "solid",
  buttonPrimaryShadow: "none",
  buttonSecondaryBorderColor: "transparent",
  buttonSecondaryBorderWidth: "1px",
  buttonSecondaryBorderStyle: "solid",
  buttonSecondaryShadow: "none",
  buttonGhostBackground: "transparent",
  buttonGhostText: "#f6f9ff",
  buttonGhostBorderColor: "#dce3f2",
  buttonGhostBorderWidth: "1px",
  buttonGhostBorderStyle: "solid",
  buttonGhostShadow: "none",
  cardBackground: "#ffffff",
  cardBorder: "#dce3f2",
  cardBorderWidth: "1px",
  cardBorderStyle: "solid",
  cardRadius: "14px",
  cardShadow: "0 8px 24px rgba(16, 24, 40, 0.06)",
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
    ["--theme-button-radius" as string]: tokens.buttonRadius,
    ["--theme-button-px" as string]: tokens.buttonPaddingX,
    ["--theme-button-py" as string]: tokens.buttonPaddingY,
    ["--theme-button-primary-border-color" as string]: tokens.buttonPrimaryBorderColor,
    ["--theme-button-primary-border-width" as string]: tokens.buttonPrimaryBorderWidth,
    ["--theme-button-primary-border-style" as string]: tokens.buttonPrimaryBorderStyle,
    ["--theme-button-primary-shadow" as string]: tokens.buttonPrimaryShadow,
    ["--theme-button-secondary-border-color" as string]: tokens.buttonSecondaryBorderColor,
    ["--theme-button-secondary-border-width" as string]: tokens.buttonSecondaryBorderWidth,
    ["--theme-button-secondary-border-style" as string]: tokens.buttonSecondaryBorderStyle,
    ["--theme-button-secondary-shadow" as string]: tokens.buttonSecondaryShadow,
    ["--theme-button-ghost-bg" as string]: tokens.buttonGhostBackground,
    ["--theme-button-ghost-text" as string]: tokens.buttonGhostText,
    ["--theme-button-ghost-border-color" as string]: tokens.buttonGhostBorderColor,
    ["--theme-button-ghost-border-width" as string]: tokens.buttonGhostBorderWidth,
    ["--theme-button-ghost-border-style" as string]: tokens.buttonGhostBorderStyle,
    ["--theme-button-ghost-shadow" as string]: tokens.buttonGhostShadow,
    ["--theme-card-bg" as string]: tokens.cardBackground,
    ["--theme-card-border" as string]: tokens.cardBorder,
    ["--theme-card-border-width" as string]: tokens.cardBorderWidth,
    ["--theme-card-border-style" as string]: tokens.cardBorderStyle,
    ["--theme-card-radius" as string]: tokens.cardRadius,
    ["--theme-card-shadow" as string]: tokens.cardShadow,
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

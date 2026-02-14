import type { ThemeTokens } from "../types";

export type ThemeTokenKey = keyof ThemeTokens;

export type ThemeTokenField = {
  key: ThemeTokenKey;
  label: string;
  kind: "color" | "text";
  description?: string;
};

export type ThemeTokenGroup = {
  id: string;
  label: string;
  fields: ThemeTokenField[];
};

export const THEME_TOKEN_GROUPS: ThemeTokenGroup[] = [
  {
    id: "palette",
    label: "Palette",
    fields: [
      { key: "baseColor", label: "Base Color", kind: "color" },
      { key: "accentColor", label: "Accent Color", kind: "color" },
      { key: "altColor", label: "Alt Color", kind: "color" },
      { key: "linkColor", label: "Link Color", kind: "color" },
    ],
  },
  {
    id: "surfaces",
    label: "Surfaces",
    fields: [
      { key: "canvasBackground", label: "Canvas Background", kind: "color" },
      { key: "surfaceBackground", label: "Surface Background", kind: "color" },
      { key: "mutedBackground", label: "Muted Background", kind: "color" },
      { key: "cardBackground", label: "Card Background", kind: "color" },
      { key: "cardBorder", label: "Card Border", kind: "color" },
    ],
  },
  {
    id: "typography",
    label: "Typography",
    fields: [
      { key: "headingColor", label: "Heading Color", kind: "color" },
      { key: "textPrimary", label: "Text Primary", kind: "color" },
      { key: "textSecondary", label: "Text Secondary", kind: "color" },
      { key: "fontFamilyBody", label: "Body Font Family", kind: "text" },
      { key: "fontFamilyHeading", label: "Heading Font Family", kind: "text" },
      { key: "fontFamilyMono", label: "Mono Font Family", kind: "text" },
      { key: "fontWeightBody", label: "Body Font Weight", kind: "text" },
      { key: "fontWeightHeading", label: "Heading Font Weight", kind: "text" },
      { key: "fontSizeBody", label: "Body Font Size", kind: "text" },
      { key: "lineHeightBody", label: "Body Line Height", kind: "text" },
      { key: "fontSizeH1", label: "H1 Font Size", kind: "text" },
      { key: "fontSizeH2", label: "H2 Font Size", kind: "text" },
      { key: "fontSizeH3", label: "H3 Font Size", kind: "text" },
      { key: "lineHeightHeading", label: "Heading Line Height", kind: "text" },
      { key: "letterSpacingHeading", label: "Heading Letter Spacing", kind: "text" },
    ],
  },
  {
    id: "buttons",
    label: "Buttons",
    fields: [
      { key: "buttonBackground", label: "Button Background", kind: "color" },
      { key: "buttonText", label: "Button Text", kind: "color" },
      { key: "buttonAltBackground", label: "Alt Button Background", kind: "color" },
      { key: "buttonAltText", label: "Alt Button Text", kind: "color" },
    ],
  },
];

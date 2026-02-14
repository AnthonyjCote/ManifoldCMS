import type { ThemeTokens } from "../types";

export type ThemeTokenKey = keyof ThemeTokens;

export type ThemeTokenField = {
  key: ThemeTokenKey;
  label: string;
  kind: "color" | "text";
  description?: string;
  section?: string;
};

export type ThemeTokenGroup = {
  id: string;
  label: string;
  fields: ThemeTokenField[];
};

export const THEME_TOKEN_GROUPS: ThemeTokenGroup[] = [
  {
    id: "typography",
    label: "Typography",
    fields: [
      { key: "headingColor", label: "Heading Color", kind: "color", section: "Headings" },
      { key: "fontFamilyHeading", label: "Heading Font Family", kind: "text", section: "Headings" },
      { key: "fontWeightHeading", label: "Heading Font Weight", kind: "text", section: "Headings" },
      { key: "fontSizeH1", label: "H1 Font Size", kind: "text", section: "Headings" },
      { key: "fontSizeH2", label: "H2 Font Size", kind: "text", section: "Headings" },
      { key: "fontSizeH3", label: "H3 Font Size", kind: "text", section: "Headings" },
      { key: "lineHeightHeading", label: "Heading Line Height", kind: "text", section: "Headings" },
      {
        key: "letterSpacingHeading",
        label: "Heading Letter Spacing",
        kind: "text",
        section: "Headings",
      },
      { key: "textPrimary", label: "Text Primary", kind: "color", section: "Body" },
      { key: "textSecondary", label: "Text Secondary", kind: "color", section: "Body" },
      { key: "fontFamilyBody", label: "Body Font Family", kind: "text", section: "Body" },
      { key: "fontFamilyMono", label: "Mono Font Family", kind: "text", section: "Body" },
      { key: "fontWeightBody", label: "Body Font Weight", kind: "text", section: "Body" },
      { key: "fontSizeBody", label: "Body Font Size", kind: "text", section: "Body" },
      { key: "lineHeightBody", label: "Body Line Height", kind: "text", section: "Body" },
    ],
  },
  {
    id: "surfaces",
    label: "Surfaces",
    fields: [
      { key: "canvasBackground", label: "Canvas Background", kind: "color" },
      { key: "surfaceBackground", label: "Surface Background", kind: "color" },
      { key: "mutedBackground", label: "Muted Background", kind: "color" },
    ],
  },
  {
    id: "buttons",
    label: "Buttons",
    fields: [
      { key: "buttonRadius", label: "Button Radius", kind: "text", section: "Shared" },
      { key: "buttonPaddingX", label: "Button Padding X", kind: "text", section: "Shared" },
      { key: "buttonPaddingY", label: "Button Padding Y", kind: "text", section: "Shared" },
      {
        key: "buttonBackground",
        label: "Primary Button Background",
        kind: "color",
        section: "Primary",
      },
      { key: "buttonText", label: "Primary Button Text", kind: "color", section: "Primary" },
      {
        key: "buttonPrimaryBorderColor",
        label: "Primary Button Border Color",
        kind: "color",
        section: "Primary",
      },
      {
        key: "buttonPrimaryBorderWidth",
        label: "Primary Button Border Width",
        kind: "text",
        section: "Primary",
      },
      {
        key: "buttonPrimaryBorderStyle",
        label: "Primary Button Border Style",
        kind: "text",
        section: "Primary",
      },
      {
        key: "buttonPrimaryShadow",
        label: "Primary Button Shadow",
        kind: "text",
        section: "Primary",
      },
      {
        key: "buttonAltBackground",
        label: "Secondary Button Background",
        kind: "color",
        section: "Secondary",
      },
      { key: "buttonAltText", label: "Secondary Button Text", kind: "color", section: "Secondary" },
      {
        key: "buttonSecondaryBorderColor",
        label: "Secondary Button Border Color",
        kind: "color",
        section: "Secondary",
      },
      {
        key: "buttonSecondaryBorderWidth",
        label: "Secondary Button Border Width",
        kind: "text",
        section: "Secondary",
      },
      {
        key: "buttonSecondaryBorderStyle",
        label: "Secondary Button Border Style",
        kind: "text",
        section: "Secondary",
      },
      {
        key: "buttonSecondaryShadow",
        label: "Secondary Button Shadow",
        kind: "text",
        section: "Secondary",
      },
      {
        key: "buttonGhostBackground",
        label: "Ghost Button Background",
        kind: "color",
        section: "Ghost",
      },
      { key: "buttonGhostText", label: "Ghost Button Text", kind: "color", section: "Ghost" },
      {
        key: "buttonGhostBorderColor",
        label: "Ghost Button Border Color",
        kind: "color",
        section: "Ghost",
      },
      {
        key: "buttonGhostBorderWidth",
        label: "Ghost Button Border Width",
        kind: "text",
        section: "Ghost",
      },
      {
        key: "buttonGhostBorderStyle",
        label: "Ghost Button Border Style",
        kind: "text",
        section: "Ghost",
      },
      { key: "buttonGhostShadow", label: "Ghost Button Shadow", kind: "text", section: "Ghost" },
    ],
  },
  {
    id: "cards",
    label: "Cards",
    fields: [
      { key: "cardBackground", label: "Card Background", kind: "color" },
      { key: "cardBorder", label: "Card Border", kind: "color" },
      { key: "cardBorderWidth", label: "Card Border Width", kind: "text" },
      { key: "cardBorderStyle", label: "Card Border Style", kind: "text" },
      { key: "cardRadius", label: "Card Radius", kind: "text" },
      { key: "cardShadow", label: "Card Shadow", kind: "text" },
    ],
  },
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
];

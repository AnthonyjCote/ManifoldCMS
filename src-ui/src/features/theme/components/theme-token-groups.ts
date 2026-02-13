import type { ThemeTokens } from "../types";

export type ThemeTokenKey = keyof ThemeTokens;

export type ThemeTokenField = {
  key: ThemeTokenKey;
  label: string;
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
      { key: "baseColor", label: "Base Color" },
      { key: "accentColor", label: "Accent Color" },
      { key: "altColor", label: "Alt Color" },
      { key: "linkColor", label: "Link Color" },
    ],
  },
  {
    id: "surfaces",
    label: "Surfaces",
    fields: [
      { key: "canvasBackground", label: "Canvas Background" },
      { key: "surfaceBackground", label: "Surface Background" },
      { key: "mutedBackground", label: "Muted Background" },
      { key: "cardBackground", label: "Card Background" },
      { key: "cardBorder", label: "Card Border" },
    ],
  },
  {
    id: "typography",
    label: "Typography",
    fields: [
      { key: "headingColor", label: "Heading Color" },
      { key: "textPrimary", label: "Text Primary" },
      { key: "textSecondary", label: "Text Secondary" },
    ],
  },
  {
    id: "buttons",
    label: "Buttons",
    fields: [
      { key: "buttonBackground", label: "Button Background" },
      { key: "buttonText", label: "Button Text" },
      { key: "buttonAltBackground", label: "Alt Button Background" },
      { key: "buttonAltText", label: "Alt Button Text" },
    ],
  },
];

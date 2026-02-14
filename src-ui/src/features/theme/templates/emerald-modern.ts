import type { BundledThemeDefinition } from "../library";

const theme: BundledThemeDefinition = {
  id: "theme-emerald-modern",
  name: "Emerald Modern",
  description: "High trust green-forward business palette.",
  order: 40,
  tokens: {
    baseColor: "#0f251e",
    accentColor: "#23d18b",
    altColor: "#1ea36f",
    linkColor: "#38ddb3",
    canvasBackground: "#0e201b",
    surfaceBackground: "#152d26",
    mutedBackground: "#102720",
    textPrimary: "#e7fff5",
    textSecondary: "#a5d0bf",
    headingColor: "#f0fff8",
    buttonBackground: "#23d18b",
    buttonText: "#0d241c",
    buttonAltBackground: "#1a4034",
    buttonAltText: "#d8ffef",
    cardBackground: "#17362d",
    cardBorder: "#2f735f",
    fontFamilyBody: '"Inter", "Manrope", "Segoe UI", sans-serif',
    fontFamilyHeading: '"Manrope", "Inter", "Segoe UI", sans-serif',
    fontWeightBody: "410",
    fontWeightHeading: "720",
    fontSizeBody: "19px",
    lineHeightBody: "1.62",
    fontSizeH1: "63px",
    fontSizeH2: "43px",
    fontSizeH3: "24px",
    lineHeightHeading: "1.07",
    letterSpacingHeading: "-0.022em",
  },
};

export default theme;

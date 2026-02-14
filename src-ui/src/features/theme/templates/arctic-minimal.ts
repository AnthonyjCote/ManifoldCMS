import type { BundledThemeDefinition } from "../library";

const theme: BundledThemeDefinition = {
  id: "theme-arctic-minimal",
  name: "Arctic Minimal",
  description: "Clean light surfaces and cool blue accents.",
  order: 20,
  tokens: {
    baseColor: "#f5f8ff",
    accentColor: "#2f6cf5",
    altColor: "#1f9ad8",
    linkColor: "#2a63d9",
    canvasBackground: "#f7f9ff",
    surfaceBackground: "#ffffff",
    mutedBackground: "#eef3ff",
    textPrimary: "#121b2d",
    textSecondary: "#4b5a76",
    headingColor: "#0f1a2f",
    buttonBackground: "#2f6cf5",
    buttonText: "#ffffff",
    buttonAltBackground: "#dfe8ff",
    buttonAltText: "#1a2f58",
    cardBackground: "#ffffff",
    cardBorder: "#d9e4fb",
    fontFamilyBody: '"Inter", "Manrope", "Segoe UI", sans-serif',
    fontFamilyHeading: '"Inter", "Manrope", "Segoe UI", sans-serif',
    fontWeightBody: "400",
    fontWeightHeading: "680",
    fontSizeBody: "18px",
    lineHeightBody: "1.62",
    fontSizeH1: "60px",
    fontSizeH2: "40px",
    fontSizeH3: "23px",
    lineHeightHeading: "1.1",
    letterSpacingHeading: "-0.02em",
  },
};

export default theme;

import type { BundledThemeDefinition } from "../library";

const theme: BundledThemeDefinition = {
  id: "theme-midnight-neon",
  name: "Midnight Neon",
  description: "Dark premium contrast with neon accents.",
  order: 10,
  tokens: {
    baseColor: "#0b1220",
    accentColor: "#5cf4b7",
    altColor: "#4a7eff",
    linkColor: "#7cd8ff",
    canvasBackground: "#090f1b",
    surfaceBackground: "#111a2b",
    mutedBackground: "#0f1726",
    textPrimary: "#eaf0ff",
    textSecondary: "#b5c1de",
    headingColor: "#f2f6ff",
    buttonBackground: "#5cf4b7",
    buttonText: "#0b1a17",
    buttonAltBackground: "#192a44",
    buttonAltText: "#eaf0ff",
    cardBackground: "#121d30",
    cardBorder: "#2f4268",
    fontFamilyBody: '"Inter", "Manrope", "Segoe UI", sans-serif',
    fontFamilyHeading: '"Space Grotesk", "Inter", "Segoe UI", sans-serif',
    fontWeightBody: "400",
    fontWeightHeading: "700",
    fontSizeBody: "19px",
    lineHeightBody: "1.6",
    fontSizeH1: "62px",
    fontSizeH2: "42px",
    fontSizeH3: "24px",
    lineHeightHeading: "1.06",
    letterSpacingHeading: "-0.025em",
  },
};

export default theme;

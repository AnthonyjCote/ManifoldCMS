import type { BundledThemeDefinition } from "../library";

const theme: BundledThemeDefinition = {
  id: "theme-violet-luxe",
  name: "Violet Luxe",
  description: "Luxury dark palette with vivid art-direction accents.",
  order: 50,
  tokens: {
    baseColor: "#171026",
    accentColor: "#d26bff",
    altColor: "#7a5cff",
    linkColor: "#b996ff",
    canvasBackground: "#120b1f",
    surfaceBackground: "#1d1430",
    mutedBackground: "#170f27",
    textPrimary: "#f4ecff",
    textSecondary: "#c9b8e8",
    headingColor: "#fff6ff",
    buttonBackground: "#d26bff",
    buttonText: "#2c1140",
    buttonAltBackground: "#31204f",
    buttonAltText: "#f1e8ff",
    cardBackground: "#24183a",
    cardBorder: "#4f3a77",
    fontFamilyBody: '"Inter", "Manrope", "Segoe UI", sans-serif',
    fontFamilyHeading: '"Sora", "Inter", "Segoe UI", sans-serif',
    fontWeightBody: "400",
    fontWeightHeading: "700",
    fontSizeBody: "19px",
    lineHeightBody: "1.62",
    fontSizeH1: "64px",
    fontSizeH2: "44px",
    fontSizeH3: "24px",
    lineHeightHeading: "1.06",
    letterSpacingHeading: "-0.028em",
  },
};

export default theme;

import type { BundledThemeDefinition } from "../library";

const theme: BundledThemeDefinition = {
  id: "theme-sandstone-editorial",
  name: "Sandstone Editorial",
  description: "Warm neutral palette for content-heavy sites.",
  order: 30,
  tokens: {
    baseColor: "#f4efe7",
    accentColor: "#a45728",
    altColor: "#5e6a83",
    linkColor: "#8f3e18",
    canvasBackground: "#f2ece2",
    surfaceBackground: "#fffaf2",
    mutedBackground: "#ece1d0",
    textPrimary: "#2a251f",
    textSecondary: "#5e5448",
    headingColor: "#1f1a15",
    buttonBackground: "#a45728",
    buttonText: "#fff7ee",
    buttonAltBackground: "#e9dcc8",
    buttonAltText: "#4f3624",
    cardBackground: "#fffaf2",
    cardBorder: "#d9c7ab",
    fontFamilyBody: '"Source Serif 4", "Georgia", serif',
    fontFamilyHeading: '"Fraunces", "Source Serif 4", "Georgia", serif',
    fontWeightBody: "400",
    fontWeightHeading: "700",
    fontSizeBody: "20px",
    lineHeightBody: "1.72",
    fontSizeH1: "66px",
    fontSizeH2: "46px",
    fontSizeH3: "25px",
    lineHeightHeading: "1.12",
    letterSpacingHeading: "-0.015em",
  },
};

export default theme;

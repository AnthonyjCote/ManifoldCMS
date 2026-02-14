import type { BundledThemeDefinition } from "../library";

const theme: BundledThemeDefinition = {
  id: "theme-slate-mono",
  name: "Slate Mono",
  description: "Monochrome neutral baseline for product-led sites.",
  order: 60,
  tokens: {
    baseColor: "#0f1216",
    accentColor: "#d7dde9",
    altColor: "#7f8a9f",
    linkColor: "#c1cfeb",
    canvasBackground: "#0d1117",
    surfaceBackground: "#141a22",
    mutedBackground: "#111722",
    textPrimary: "#e9edf5",
    textSecondary: "#a4afc3",
    headingColor: "#f3f7ff",
    buttonBackground: "#e7edf8",
    buttonText: "#111823",
    buttonAltBackground: "#232c3b",
    buttonAltText: "#e6edf8",
    cardBackground: "#171f2a",
    cardBorder: "#2a3446",
    fontFamilyBody: '"IBM Plex Sans", "Inter", "Segoe UI", sans-serif',
    fontFamilyHeading: '"IBM Plex Sans", "Inter", "Segoe UI", sans-serif',
    fontWeightBody: "400",
    fontWeightHeading: "650",
    fontSizeBody: "18px",
    lineHeightBody: "1.6",
    fontSizeH1: "58px",
    fontSizeH2: "40px",
    fontSizeH3: "22px",
    lineHeightHeading: "1.1",
    letterSpacingHeading: "-0.018em",
  },
};

export default theme;

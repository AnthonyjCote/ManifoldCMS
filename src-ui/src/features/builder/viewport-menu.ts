import type { ProjectSettings } from "../project-settings/useProjectSettings";
import type { BuilderViewport } from "./style-scopes";

export const VIEWPORT_MENU_ORDER: BuilderViewport[] = [
  "default",
  "mobile",
  "tablet",
  "desktop",
  "wide",
];

export const VIEWPORT_SCOPE_LABELS: Record<BuilderViewport, string> = {
  default: "Default",
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
  wide: "Retina/Wide",
};

export function buildViewportMenuMetaLabels(
  breakpoints: ProjectSettings["breakpoints"]
): Record<BuilderViewport, string> {
  return {
    default: "Fallback base styles",
    mobile: `≤ ${breakpoints.mobileMax}px`,
    tablet: `≤ ${breakpoints.tabletMax}px`,
    desktop: `≤ ${breakpoints.desktopMax}px`,
    wide: `≥ ${breakpoints.retinaMin}px`,
  };
}

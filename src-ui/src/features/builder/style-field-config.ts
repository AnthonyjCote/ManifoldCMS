import type { PrimitiveStyleKey, PrimitiveType, SectionStyleKey } from "./types";

export type StyleCategory =
  | "Layout"
  | "Spacing"
  | "Border"
  | "Background"
  | "Typography"
  | "Effects"
  | "Transform";

export const SECTION_STYLE_KEYS: SectionStyleKey[] = [
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderWidth",
  "borderStyle",
  "borderColor",
  "borderRadius",
  "backgroundColor",
  "backgroundImage",
  "textColor",
  "fontSize",
  "translateX",
  "translateY",
];

export const PRIMITIVE_STYLE_KEYS: PrimitiveStyleKey[] = [
  "width",
  "height",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderWidth",
  "borderStyle",
  "borderColor",
  "borderRadius",
  "backgroundColor",
  "textColor",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "textAlign",
  "translateX",
  "translateY",
];

export const PRIMITIVE_EXCLUDED_STYLE_KEYS: Record<PrimitiveType, PrimitiveStyleKey[]> = {
  heading: ["width", "height", "backgroundColor", "borderWidth", "borderStyle", "borderColor"],
  text: ["width", "height", "backgroundColor", "borderWidth", "borderStyle", "borderColor"],
  button: ["lineHeight", "textAlign", "width", "height"],
  image: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "backgroundColor"],
  video: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "backgroundColor"],
  embed: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "backgroundColor"],
  code: ["width", "height", "textAlign"],
  stack: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign"],
  columns: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign"],
  cards: ["textColor", "fontSize", "fontWeight", "lineHeight", "textAlign", "width", "height"],
  details: ["width", "height", "textColor", "fontSize", "fontWeight", "lineHeight", "textAlign"],
  spacer: [
    "textColor",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "textAlign",
    "backgroundColor",
    "width",
    "height",
  ],
};

export const STYLE_CATEGORY_BY_KEY: Record<string, StyleCategory> = {
  width: "Layout",
  height: "Layout",
  marginTop: "Spacing",
  marginRight: "Spacing",
  marginBottom: "Spacing",
  marginLeft: "Spacing",
  paddingTop: "Spacing",
  paddingRight: "Spacing",
  paddingBottom: "Spacing",
  paddingLeft: "Spacing",
  borderWidth: "Border",
  borderStyle: "Border",
  borderColor: "Border",
  borderRadius: "Border",
  backgroundColor: "Background",
  backgroundImage: "Background",
  textColor: "Typography",
  fontSize: "Typography",
  fontWeight: "Typography",
  lineHeight: "Typography",
  textAlign: "Typography",
  translateX: "Transform",
  translateY: "Transform",
};

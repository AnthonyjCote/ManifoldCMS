export type BlockType =
  | "hero"
  | "feature_grid"
  | "services_list"
  | "cta"
  | "testimonials"
  | "pricing"
  | "faq"
  | "logo_cloud"
  | "contact_section"
  | "footer"
  | "custom_section";
export type BlockCategory =
  | "Hero"
  | "Features"
  | "Conversion"
  | "Content"
  | "Trust"
  | "Navigation"
  | "Custom";

export type BlockFieldType = "text" | "textarea" | "link" | "image" | "repeater" | "embed" | "code";

export type BlockFieldSchema = {
  key: string;
  label: string;
  type: BlockFieldType;
  required?: boolean;
  maxItems?: number;
  maxLength?: number;
};

export type BlockDefinition = {
  id: BlockType;
  label: string;
  category: BlockCategory;
  description: string;
  fields: BlockFieldSchema[];
};

export type PrimitiveType =
  | "heading"
  | "text"
  | "image"
  | "video"
  | "embed"
  | "code"
  | "button"
  | "spacer"
  | "stack"
  | "columns"
  | "cards"
  | "details";

export type PrimitiveNode = {
  type: PrimitiveType;
  props?: Record<string, string | number | boolean | undefined>;
  children?: PrimitiveNode[];
};

export type StyleViewportKey = "default" | "mobile" | "tablet" | "desktop" | "wide";
export type StyleStateKey = "default" | "hover";
export type NonDefaultStyleStateKey = Exclude<StyleStateKey, "default">;

export type SectionStyleKey =
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "borderWidth"
  | "borderStyle"
  | "borderColor"
  | "borderRadius"
  | "backgroundColor"
  | "backgroundImage"
  | "textColor"
  | "fontSize"
  | "translateX"
  | "translateY";

export type PrimitiveStyleKey =
  | Exclude<SectionStyleKey, "backgroundImage">
  | "fontWeight"
  | "lineHeight"
  | "textAlign"
  | "width"
  | "height";

export type SectionStyleValues = Partial<Record<SectionStyleKey, string>>;
export type PrimitiveStyleValues = Partial<Record<PrimitiveStyleKey, string>>;
export type ResponsiveStyleValues<T> = Partial<Record<StyleViewportKey, T>>;
export type ResponsiveStateStyleValues<T> = Partial<
  Record<StyleViewportKey, Partial<Record<NonDefaultStyleStateKey, T>>>
>;

export type BlockInstance = {
  id: string;
  type: BlockType;
  props: Record<string, string | number>;
  visibility: "visible" | "hidden";
  styleOverrides: {
    variant: string;
    primitiveStyles?: Record<string, PrimitiveStyleValues>;
    viewportStyles?: ResponsiveStyleValues<SectionStyleValues>;
    primitiveViewportStyles?: Record<string, ResponsiveStyleValues<PrimitiveStyleValues>>;
    stateViewportStyles?: ResponsiveStateStyleValues<SectionStyleValues>;
    primitiveStateViewportStyles?: Record<string, ResponsiveStateStyleValues<PrimitiveStyleValues>>;
  } & SectionStyleValues;
};

export type BuilderPage = {
  id: string;
  title: string;
  route: string;
  seo: {
    title: string;
    description: string;
  };
  blocks: BlockInstance[];
};

export type BuilderState = {
  pages: BuilderPage[];
  selectedPageId: string;
  selectedBlockId: string | null;
  selectedBlockIds: string[];
  selectedPrimitivePaths: string[];
  dirty: boolean;
  lastSavedAt: string;
  routeValidationError: string | null;
};

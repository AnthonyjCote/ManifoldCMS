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

export type BlockInstance = {
  id: string;
  type: BlockType;
  props: Record<string, string | number>;
  visibility: "visible" | "hidden";
  styleOverrides: {
    variant: string;
    marginTop?: string;
    marginBottom?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    borderWidth?: string;
    borderStyle?: string;
    borderColor?: string;
    borderRadius?: string;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    primitiveStyles?: Record<
      string,
      {
        marginTop?: string;
        marginBottom?: string;
        paddingTop?: string;
        paddingRight?: string;
        paddingBottom?: string;
        paddingLeft?: string;
        borderWidth?: string;
        borderStyle?: string;
        borderColor?: string;
        borderRadius?: string;
        backgroundColor?: string;
        textColor?: string;
        fontSize?: string;
        fontWeight?: string;
        lineHeight?: string;
        textAlign?: string;
        width?: string;
        height?: string;
      }
    >;
  };
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
  selectedPrimitivePath: string | null;
  dirty: boolean;
  lastSavedAt: string;
  routeValidationError: string | null;
};

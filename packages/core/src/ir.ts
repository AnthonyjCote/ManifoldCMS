export type BlockVisibility = "visible" | "hidden";

export type BlockInstanceIR = {
  instanceId: string;
  blockId: string;
  props: Record<string, unknown>;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  visibility: BlockVisibility;
  children?: BlockInstanceIR[];
};

export type PageIR = {
  pageId: string;
  route: string;
  seo: {
    title?: string;
    description?: string;
  };
  blocks: BlockInstanceIR[];
};

export type ThemeIR = {
  tokens: Record<string, string | number>;
};

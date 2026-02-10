import type { PageIR, ThemeIR } from "./ir";

export type RuntimeRenderContext = {
  page: PageIR;
  theme: ThemeIR;
};

export type RuntimeRenderedBlock = {
  instanceId: string;
  blockId: string;
  html: string;
};

export type RuntimeRenderResult = {
  pageId: string;
  route: string;
  blocks: RuntimeRenderedBlock[];
};

export interface RuntimeRenderer {
  renderPage(context: RuntimeRenderContext): RuntimeRenderResult;
}

import type { BlockDefinition, BlockInstance, PrimitiveNode } from "../types";

export type BlockCatalogEntry = BlockDefinition & {
  buildPreviewTree: (block: BlockInstance) => PrimitiveNode[];
};

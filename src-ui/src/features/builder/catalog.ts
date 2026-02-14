import type { BlockDefinition, BlockInstance, BlockType, PrimitiveNode } from "./types";
import type { BlockCatalogEntry } from "./blocks/block-entry";

type BlockModule = {
  block?: BlockCatalogEntry;
  default?: BlockCatalogEntry;
};

const BLOCK_ORDER: BlockType[] = [
  "hero",
  "image_text",
  "feature_grid",
  "services_list",
  "cta",
  "testimonials",
  "pricing",
  "faq",
  "logo_cloud",
  "contact_section",
  "footer",
  "custom_section",
];

const moduleMap = import.meta.glob<BlockModule>("./blocks/*.ts", { eager: true });

function loadBlockCatalog(): BlockCatalogEntry[] {
  const collected = Object.values(moduleMap)
    .map((entry) => entry.block ?? entry.default)
    .filter((entry): entry is BlockCatalogEntry => Boolean(entry));

  const orderIndex = new Map(BLOCK_ORDER.map((id, index) => [id, index]));

  return collected.sort((a, b) => {
    const aIndex = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return a.label.localeCompare(b.label);
  });
}

export const BLOCK_CATALOG: BlockCatalogEntry[] = loadBlockCatalog();

export function blockDefinitionById(id: string): BlockDefinition | undefined {
  return BLOCK_CATALOG.find((item) => item.id === id);
}

export function buildPreviewTreeForBlock(block: BlockInstance): PrimitiveNode[] {
  const definition = BLOCK_CATALOG.find((item) => item.id === block.type);
  if (!definition) {
    return [
      {
        type: "text",
        props: {
          value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
        },
      },
    ];
  }
  return definition.buildPreviewTree(block);
}

export function groupedBlockCatalog() {
  const groups = new Map<string, BlockDefinition[]>();
  for (const block of BLOCK_CATALOG) {
    const current = groups.get(block.category) ?? [];
    current.push(block);
    groups.set(block.category, current);
  }
  return Array.from(groups.entries()).map(([category, blocks]) => ({
    category,
    blocks,
  }));
}

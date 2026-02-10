import type { ContentRecordFile, PageManifestFile, ThemeFile } from "./schema";
import type { BlockInstanceIR, PageIR, ThemeIR } from "./ir";
import { deterministicInstanceId } from "./id";

function stripUnknown(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const entries = Object.entries(input as Record<string, unknown>)
    .filter(([key]) => key.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  return Object.fromEntries(entries);
}

function contentLookupMap(contentRecords: ContentRecordFile[]): Map<string, ContentRecordFile> {
  return new Map(contentRecords.map((record) => [record.id, record]));
}

function resolveBlockContent(
  contentRefs: Record<string, string>,
  recordsById: Map<string, ContentRecordFile>
): Record<string, unknown> {
  const resolvedEntries = Object.entries(contentRefs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slotKey, contentId]) => [slotKey, recordsById.get(contentId)?.data ?? null] as const);

  return Object.fromEntries(resolvedEntries);
}

function normalizeBlock(
  pageId: string,
  seed: string,
  block: PageManifestFile["blocks"][number],
  index: number,
  recordsById: Map<string, ContentRecordFile>
): BlockInstanceIR {
  return {
    instanceId:
      block.instanceId ||
      deterministicInstanceId({
        pageId,
        blockId: block.blockId,
        insertionIndex: index,
        seed,
      }),
    blockId: block.blockId,
    props: stripUnknown(block.props),
    content: resolveBlockContent(block.contentRefs, recordsById),
    styles: stripUnknown(block.styleOverrides),
    visibility: block.visibility,
  };
}

export function resolveThemeIR(theme: ThemeFile): ThemeIR {
  return {
    tokens: {
      ...theme.tokens,
    },
  };
}

export function normalizePageManifestToIR(input: {
  page: PageManifestFile;
  contentRecords: ContentRecordFile[];
  seed: string;
}): PageIR {
  const recordsById = contentLookupMap(input.contentRecords);

  return {
    pageId: input.page.pageId,
    route: input.page.route,
    seo: {
      title: input.page.seo.title,
      description: input.page.seo.description,
    },
    blocks: input.page.blocks.map((block, index) =>
      normalizeBlock(input.page.pageId, input.seed, block, index, recordsById)
    ),
  };
}

import type { BlockDefinition, BlockFieldSchema, BlockInstance, PrimitiveNode } from "./types";

type InternalBlockDefinition = BlockDefinition & {
  buildPreviewTree: (block: BlockInstance) => PrimitiveNode[];
};

function text(block: BlockInstance, key: string, fallback: string): string {
  const raw = block.props[key];
  if (typeof raw !== "string") {
    return fallback;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function lines(block: BlockInstance, key: string, fallback: string[]): string[] {
  const raw = block.props[key];
  if (typeof raw !== "string") {
    return fallback;
  }
  const parsed = raw
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return parsed.length > 0 ? parsed : fallback;
}

function splitRows(input: string[]): string[][] {
  return input.map((row) => row.split("|").map((value) => value.trim()));
}

function boundedCount(
  block: BlockInstance,
  key: string,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = Number.parseInt(text(block, key, String(fallback)), 10);
  if (Number.isNaN(raw)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, raw));
}

function fieldOrLegacyLine(
  block: BlockInstance,
  fieldKey: string,
  legacyKey: string,
  legacyIndex: number,
  fallback: string
): string {
  const value = text(block, fieldKey, "");
  if (value.length > 0) {
    return value;
  }
  const legacy = lines(block, legacyKey, []);
  return legacy[legacyIndex] || fallback;
}

function fieldOrLegacySplit(
  block: BlockInstance,
  fieldKey: string,
  legacyKey: string,
  rowIndex: number,
  partIndex: number,
  fallback: string
): string {
  const value = text(block, fieldKey, "");
  if (value.length > 0) {
    return value;
  }
  const legacyRows = splitRows(lines(block, legacyKey, []));
  return legacyRows[rowIndex]?.[partIndex] || fallback;
}

function makeCardFields(
  countKey: string,
  countLabel: string,
  maxCards: number,
  perCard: Array<{ suffix: string; label: string; maxLength?: number }>
): BlockFieldSchema[] {
  const fields: BlockFieldSchema[] = [{ key: countKey, label: countLabel, type: "text" }];
  for (let index = 1; index <= maxCards; index += 1) {
    for (const schema of perCard) {
      fields.push({
        key: `card${index}${schema.suffix}`,
        label: `Card ${index} ${schema.label}`,
        type: "text",
        maxLength: schema.maxLength,
      });
    }
  }
  return fields;
}

function parseCustomSectionPrimitives(raw: string): PrimitiveNode[] {
  const rows = raw
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (rows.length === 0) {
    return [];
  }
  return rows.map((row) => {
    const [type, ...rest] = row.split(":");
    const payload = rest.join(":").trim();
    const primitiveType = type.trim().toLowerCase();

    if (primitiveType === "heading") {
      return {
        type: "heading",
        props: { value: payload || "Lorem Ipsum Dolor Sit Amet", level: "h3" },
      };
    }
    if (primitiveType === "text") {
      return {
        type: "text",
        props: {
          value:
            payload ||
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
        },
      };
    }
    if (primitiveType === "image") {
      return { type: "image", props: { src: payload, alt: "Lorem ipsum image" } };
    }
    if (primitiveType === "button") {
      return { type: "button", props: { label: payload || "Lorem Ipsum", href: "#" } };
    }
    if (primitiveType === "code") {
      return { type: "code", props: { value: payload || "const lorem = 'ipsum';" } };
    }
    if (primitiveType === "video") {
      return { type: "video", props: { src: payload } };
    }
    if (primitiveType === "embed") {
      return { type: "embed", props: { value: payload || "Lorem ipsum embed placeholder." } };
    }
    if (primitiveType === "spacer") {
      return { type: "spacer", props: { size: Number(payload) || 24 } };
    }
    return { type: "text", props: { value: row } };
  });
}

export const BLOCK_CATALOG: InternalBlockDefinition[] = [
  {
    id: "hero",
    label: "Hero",
    category: "Hero",
    description: "Intro section with headline, copy, CTA, and optional image.",
    fields: [
      { key: "headline", label: "Headline", type: "text", required: true, maxLength: 90 },
      { key: "subhead", label: "Subhead", type: "textarea", maxLength: 220 },
      { key: "ctaLabel", label: "CTA Label", type: "text", maxLength: 30 },
      { key: "ctaUrl", label: "CTA Link", type: "link" },
      { key: "heroImage", label: "Hero Image URL", type: "image" },
    ],
    buildPreviewTree: (block) => [
      {
        type: "columns",
        props: { ratio: "2:1", className: "hero-layout" },
        children: [
          {
            type: "stack",
            children: [
              {
                type: "heading",
                props: {
                  value: text(block, "headline", "Lorem Ipsum Dolor Sit Amet"),
                  level: "h1",
                  editorFieldKey: "headline",
                },
              },
              {
                type: "text",
                props: {
                  value: text(
                    block,
                    "subhead",
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore."
                  ),
                  editorFieldKey: "subhead",
                },
              },
              {
                type: "button",
                props: {
                  label: text(block, "ctaLabel", "Lorem Ipsum"),
                  href: text(block, "ctaUrl", "#"),
                  editorFieldKey: "ctaLabel",
                },
              },
            ],
          },
          {
            type: "image",
            props: {
              src: text(block, "heroImage", ""),
              alt: "Lorem ipsum image",
              className: "hero-image",
            },
          },
        ],
      },
    ],
  },
  {
    id: "feature_grid",
    label: "Feature Grid",
    category: "Features",
    description: "Multi-column feature grid with repeatable items.",
    fields: [
      { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
      { key: "cardColumns", label: "Columns (1-6)", type: "text" },
      ...makeCardFields("cardCount", "Card Count (1-8)", 8, [
        { suffix: "Title", label: "Title", maxLength: 70 },
        { suffix: "Body", label: "Body", maxLength: 180 },
      ]),
      { key: "items", label: "Legacy Items (one per line)", type: "repeater", maxItems: 8 },
    ],
    buildPreviewTree: (block) => [
      {
        type: "heading",
        props: {
          value: text(block, "sectionTitle", "Lorem Ipsum"),
          level: "h2",
          editorFieldKey: "sectionTitle",
        },
      },
      {
        type: "cards",
        props: { columns: boundedCount(block, "cardColumns", 2, 1, 6) },
        children: Array.from({ length: boundedCount(block, "cardCount", 4, 1, 8) }).map(
          (_, index) => ({
            type: "stack",
            props: { className: "feature-card" },
            children: [
              {
                type: "heading",
                props: {
                  value: fieldOrLegacyLine(
                    block,
                    `card${index + 1}Title`,
                    "items",
                    index,
                    "Lorem ipsum dolor"
                  ),
                  level: "h3",
                  editorFieldKey: `card${index + 1}Title`,
                },
              },
              {
                type: "text",
                props: {
                  value: text(
                    block,
                    `card${index + 1}Body`,
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
                  ),
                  editorFieldKey: `card${index + 1}Body`,
                },
              },
            ],
          })
        ),
      },
    ],
  },
  {
    id: "services_list",
    label: "Services List",
    category: "Features",
    description: "Service cards with title and supporting copy.",
    fields: [
      { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
      { key: "cardColumns", label: "Columns (1-6)", type: "text" },
      ...makeCardFields("cardCount", "Card Count (1-8)", 8, [
        { suffix: "Title", label: "Title", maxLength: 70 },
        { suffix: "Body", label: "Body", maxLength: 180 },
      ]),
      {
        key: "services",
        label: "Legacy Services (Title|Description per line)",
        type: "repeater",
        maxItems: 8,
      },
    ],
    buildPreviewTree: (block) => [
      {
        type: "heading",
        props: {
          value: text(block, "sectionTitle", "Lorem Ipsum"),
          level: "h2",
          editorFieldKey: "sectionTitle",
        },
      },
      {
        type: "cards",
        props: { columns: boundedCount(block, "cardColumns", 3, 1, 6) },
        children: Array.from({ length: boundedCount(block, "cardCount", 3, 1, 8) }).map(
          (_, index) => ({
            type: "stack",
            props: { className: "feature-card" },
            children: [
              {
                type: "heading",
                props: {
                  value: fieldOrLegacySplit(
                    block,
                    `card${index + 1}Title`,
                    "services",
                    index,
                    0,
                    "Lorem Ipsum"
                  ),
                  level: "h3",
                  editorFieldKey: `card${index + 1}Title`,
                },
              },
              {
                type: "text",
                props: {
                  value: fieldOrLegacySplit(
                    block,
                    `card${index + 1}Body`,
                    "services",
                    index,
                    1,
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
                  ),
                  editorFieldKey: `card${index + 1}Body`,
                },
              },
            ],
          })
        ),
      },
    ],
  },
  {
    id: "cta",
    label: "CTA Banner",
    category: "Conversion",
    description: "Single conversion callout with short copy and action link.",
    fields: [
      { key: "copy", label: "Copy", type: "textarea", maxLength: 180 },
      { key: "link", label: "Link", type: "link" },
      { key: "label", label: "Button Label", type: "text", maxLength: 30 },
    ],
    buildPreviewTree: (block) => [
      {
        type: "stack",
        props: { className: "cta-banner" },
        children: [
          {
            type: "heading",
            props: {
              value: text(
                block,
                "copy",
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod."
              ),
              level: "h2",
              editorFieldKey: "copy",
            },
          },
          {
            type: "button",
            props: {
              label: text(block, "label", "Lorem Ipsum"),
              href: text(block, "link", "#"),
              editorFieldKey: "label",
            },
          },
        ],
      },
    ],
  },
  {
    id: "testimonials",
    label: "Testimonials",
    category: "Trust",
    description: "Customer testimonial quotes.",
    fields: [
      { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
      { key: "cardColumns", label: "Columns (1-6)", type: "text" },
      ...makeCardFields("cardCount", "Card Count (1-8)", 8, [
        { suffix: "Quote", label: "Quote", maxLength: 220 },
        { suffix: "Author", label: "Author", maxLength: 70 },
      ]),
      {
        key: "quotes",
        label: "Legacy Quotes (Quote|Author per line)",
        type: "repeater",
        maxItems: 8,
      },
    ],
    buildPreviewTree: (block) => [
      {
        type: "heading",
        props: {
          value: text(block, "sectionTitle", "Lorem Ipsum"),
          level: "h2",
          editorFieldKey: "sectionTitle",
        },
      },
      {
        type: "cards",
        props: { columns: boundedCount(block, "cardColumns", 2, 1, 6) },
        children: Array.from({ length: boundedCount(block, "cardCount", 2, 1, 8) }).map(
          (_, index) => ({
            type: "stack",
            props: { className: "feature-card" },
            children: [
              {
                type: "text",
                props: {
                  value: fieldOrLegacySplit(
                    block,
                    `card${index + 1}Quote`,
                    "quotes",
                    index,
                    0,
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
                  ),
                  editorFieldKey: `card${index + 1}Quote`,
                },
              },
              {
                type: "text",
                props: {
                  value: fieldOrLegacySplit(
                    block,
                    `card${index + 1}Author`,
                    "quotes",
                    index,
                    1,
                    "Lorem Ipsum"
                  ),
                  editorFieldKey: `card${index + 1}Author`,
                },
              },
            ],
          })
        ),
      },
    ],
  },
  {
    id: "pricing",
    label: "Pricing",
    category: "Conversion",
    description: "Pricing cards with plan and amount.",
    fields: [
      { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
      { key: "cardColumns", label: "Columns (1-6)", type: "text" },
      ...makeCardFields("cardCount", "Card Count (1-6)", 6, [
        { suffix: "Plan", label: "Plan", maxLength: 70 },
        { suffix: "Price", label: "Price", maxLength: 40 },
        { suffix: "Body", label: "Description", maxLength: 180 },
      ]),
      {
        key: "plans",
        label: "Legacy Plans (Plan|Price|Description per line)",
        type: "repeater",
        maxItems: 6,
      },
    ],
    buildPreviewTree: (block) => [
      {
        type: "heading",
        props: {
          value: text(block, "sectionTitle", "Lorem Ipsum"),
          level: "h2",
          editorFieldKey: "sectionTitle",
        },
      },
      {
        type: "cards",
        props: { columns: boundedCount(block, "cardColumns", 3, 1, 6) },
        children: Array.from({ length: boundedCount(block, "cardCount", 3, 1, 6) }).map(
          (_, index) => ({
            type: "stack",
            props: { className: "feature-card" },
            children: [
              {
                type: "heading",
                props: {
                  value: fieldOrLegacySplit(
                    block,
                    `card${index + 1}Plan`,
                    "plans",
                    index,
                    0,
                    "Lorem"
                  ),
                  level: "h3",
                  editorFieldKey: `card${index + 1}Plan`,
                },
              },
              {
                type: "heading",
                props: {
                  value: fieldOrLegacySplit(
                    block,
                    `card${index + 1}Price`,
                    "plans",
                    index,
                    1,
                    "Ipsum"
                  ),
                  level: "h2",
                  editorFieldKey: `card${index + 1}Price`,
                },
              },
              {
                type: "text",
                props: {
                  value: fieldOrLegacySplit(
                    block,
                    `card${index + 1}Body`,
                    "plans",
                    index,
                    2,
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
                  ),
                  editorFieldKey: `card${index + 1}Body`,
                },
              },
              { type: "button", props: { label: "Lorem Ipsum", href: "#" } },
            ],
          })
        ),
      },
    ],
  },
  {
    id: "faq",
    label: "FAQ",
    category: "Content",
    description: "Expandable question and answer list.",
    fields: [
      { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
      {
        key: "items",
        label: "FAQ Items (Question|Answer per line)",
        type: "repeater",
        maxItems: 12,
      },
    ],
    buildPreviewTree: (block) => [
      {
        type: "heading",
        props: {
          value: text(block, "sectionTitle", "Lorem Ipsum"),
          level: "h2",
          editorFieldKey: "sectionTitle",
        },
      },
      ...splitRows(
        lines(block, "items", [
          "Lorem ipsum dolor sit amet?|Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
          "Ut enim ad minim veniam?|Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        ])
      ).map(([question, answer]) => ({
        type: "details" as const,
        props: {
          summary: question || "Lorem ipsum dolor sit amet?",
          body:
            answer ||
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
        },
      })),
    ],
  },
  {
    id: "logo_cloud",
    label: "Logo Cloud",
    category: "Trust",
    description: "Client/partner logos in a simple responsive grid.",
    fields: [
      { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
      { key: "cardColumns", label: "Columns (1-6)", type: "text" },
      ...makeCardFields("cardCount", "Card Count (1-16)", 16, [
        { suffix: "Label", label: "Label", maxLength: 40 },
      ]),
      { key: "logos", label: "Legacy Logo labels (one per line)", type: "repeater", maxItems: 16 },
    ],
    buildPreviewTree: (block) => [
      {
        type: "heading",
        props: {
          value: text(block, "sectionTitle", "Lorem Ipsum"),
          level: "h2",
          editorFieldKey: "sectionTitle",
        },
      },
      {
        type: "cards",
        props: { columns: boundedCount(block, "cardColumns", 4, 1, 6) },
        children: Array.from({ length: boundedCount(block, "cardCount", 4, 1, 16) }).map(
          (_, index) => ({
            type: "stack",
            props: { className: "logo-badge" },
            children: [
              {
                type: "text",
                props: {
                  value: fieldOrLegacyLine(block, `card${index + 1}Label`, "logos", index, "Lorem"),
                  editorFieldKey: `card${index + 1}Label`,
                },
              },
            ],
          })
        ),
      },
    ],
  },
  {
    id: "contact_section",
    label: "Contact Section",
    category: "Conversion",
    description: "Contact callout with embed placeholder and CTA.",
    fields: [
      { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
      { key: "copy", label: "Copy", type: "textarea", maxLength: 180 },
      { key: "embed", label: "Embed Snippet/URL", type: "embed" },
      { key: "ctaLabel", label: "CTA Label", type: "text", maxLength: 30 },
      { key: "ctaUrl", label: "CTA URL", type: "link" },
    ],
    buildPreviewTree: (block) => [
      {
        type: "columns",
        props: { ratio: "1:1" },
        children: [
          {
            type: "stack",
            children: [
              {
                type: "heading",
                props: {
                  value: text(block, "sectionTitle", "Lorem Ipsum"),
                  level: "h2",
                  editorFieldKey: "sectionTitle",
                },
              },
              {
                type: "text",
                props: {
                  value: text(
                    block,
                    "copy",
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
                  ),
                  editorFieldKey: "copy",
                },
              },
              {
                type: "button",
                props: {
                  label: text(block, "ctaLabel", "Lorem Ipsum"),
                  href: text(block, "ctaUrl", "#"),
                  editorFieldKey: "ctaLabel",
                },
              },
            ],
          },
          {
            type: "embed",
            props: { value: text(block, "embed", "Lorem ipsum embed placeholder.") },
          },
        ],
      },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    category: "Navigation",
    description: "Footer with copyright and links.",
    fields: [
      { key: "brand", label: "Brand", type: "text", maxLength: 50 },
      { key: "linkColumns", label: "Columns (1-6)", type: "text" },
      { key: "links", label: "Links (Label|URL per line)", type: "repeater", maxItems: 10 },
      { key: "copyright", label: "Copyright Text", type: "text", maxLength: 120 },
    ],
    buildPreviewTree: (block) => [
      {
        type: "stack",
        props: { className: "footer-block" },
        children: [
          {
            type: "heading",
            props: {
              value: text(block, "brand", "Lorem Ipsum"),
              level: "h3",
              editorFieldKey: "brand",
            },
          },
          {
            type: "cards",
            props: { columns: boundedCount(block, "linkColumns", 4, 1, 6) },
            children: splitRows(
              lines(block, "links", ["Lorem|/#", "Ipsum|/#", "Dolor|/#", "Sit|/#"])
            ).map(([label, href], index) => ({
              type: "button",
              props: {
                label: label || "Lorem",
                href: href || "#",
                editorFieldKey: `@split:links:${index}:0`,
              },
            })),
          },
          {
            type: "text",
            props: {
              value: text(
                block,
                "copyright",
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
              ),
              editorFieldKey: "copyright",
            },
          },
        ],
      },
    ],
  },
  {
    id: "custom_section",
    label: "Custom Section",
    category: "Custom",
    description: "Flexible section with 1-4 columns and primitive stacks per column.",
    fields: [
      { key: "columns", label: "Column Count (1-4)", type: "text" },
      { key: "ratios", label: "Ratios (e.g. 1:1, 2:1)", type: "text" },
      {
        key: "column1",
        label: "Column 1 primitives (heading:text, text:copy)",
        type: "repeater",
      },
      { key: "column2", label: "Column 2 primitives", type: "repeater" },
      { key: "column3", label: "Column 3 primitives", type: "repeater" },
      { key: "column4", label: "Column 4 primitives", type: "repeater" },
    ],
    buildPreviewTree: (block) => {
      const requested = Number.parseInt(text(block, "columns", "2"), 10);
      const columnCount = Number.isNaN(requested) ? 2 : Math.max(1, Math.min(4, requested));
      const ratio = text(block, "ratios", "1:1");
      const columns: PrimitiveNode[] = [];

      for (let index = 1; index <= columnCount; index += 1) {
        const parsed = parseCustomSectionPrimitives(text(block, `column${index}`, ""));
        columns.push({
          type: "stack",
          props: { className: "feature-card" },
          children:
            parsed.length > 0
              ? parsed
              : [
                  {
                    type: "text",
                    props: {
                      value:
                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
                    },
                  },
                ],
        });
      }

      return [
        {
          type: "columns",
          props: { ratio, columnCount },
          children: columns,
        },
      ];
    },
  },
];

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

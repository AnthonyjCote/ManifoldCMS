import type { BlockCatalogEntry } from "./block-entry";
import { boundedCount, fieldOrLegacySplit, makeCardFields, text } from "./_shared";

export const block: BlockCatalogEntry = {
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
  buildPreviewTree: (instance) => [
    {
      type: "heading",
      props: {
        value: text(instance, "sectionTitle", "Lorem Ipsum"),
        level: "h2",
        editorFieldKey: "sectionTitle",
      },
    },
    {
      type: "cards",
      props: { columns: boundedCount(instance, "cardColumns", 3, 1, 6) },
      children: Array.from({ length: boundedCount(instance, "cardCount", 3, 1, 8) }).map(
        (_, index) => ({
          type: "stack",
          props: { className: "feature-card" },
          children: [
            {
              type: "heading",
              props: {
                value: fieldOrLegacySplit(
                  instance,
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
                  instance,
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
};

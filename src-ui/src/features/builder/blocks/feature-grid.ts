import type { BlockCatalogEntry } from "./block-entry";
import { boundedCount, fieldOrLegacyLine, makeCardFields, text } from "./_shared";

export const block: BlockCatalogEntry = {
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
      props: { columns: boundedCount(instance, "cardColumns", 2, 1, 6) },
      children: Array.from({ length: boundedCount(instance, "cardCount", 4, 1, 8) }).map(
        (_, index) => ({
          type: "stack",
          props: { className: "feature-card" },
          children: [
            {
              type: "heading",
              props: {
                value: fieldOrLegacyLine(
                  instance,
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
                  instance,
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
};

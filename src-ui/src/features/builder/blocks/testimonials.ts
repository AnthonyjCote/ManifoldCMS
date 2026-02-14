import type { BlockCatalogEntry } from "./block-entry";
import { boundedCount, fieldOrLegacySplit, makeCardFields, text } from "./_shared";

export const block: BlockCatalogEntry = {
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
      children: Array.from({ length: boundedCount(instance, "cardCount", 2, 1, 8) }).map(
        (_, index) => ({
          type: "stack",
          props: { className: "feature-card" },
          children: [
            {
              type: "text",
              props: {
                value: fieldOrLegacySplit(
                  instance,
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
                  instance,
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
};

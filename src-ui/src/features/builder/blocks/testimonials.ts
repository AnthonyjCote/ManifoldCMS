import type { BlockCatalogEntry } from "./block-entry";
import { boundedCount, fieldOrLegacySplit, makeCardFields, text } from "./_shared";
import avatarPlaceholder from "../../../assets/placeholders/images/camera-corner-placeholder.svg";

export const block: BlockCatalogEntry = {
  id: "testimonials",
  label: "Testimonials",
  category: "Trust",
  description: "Customer testimonial quotes.",
  fields: [
    { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
    { key: "sectionBody", label: "Section Body", type: "textarea", maxLength: 180 },
    { key: "cardColumns", label: "Columns (1-6)", type: "text" },
    ...Array.from({ length: 8 }).map((_, index) => ({
      key: `card${index + 1}Avatar`,
      label: `Card ${index + 1} Avatar`,
      type: "image" as const,
    })),
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
      type: "text",
      props: {
        value: text(
          instance,
          "sectionBody",
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
        ),
        editorFieldKey: "sectionBody",
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
              type: "image",
              props: {
                src: text(instance, `card${index + 1}Avatar`, avatarPlaceholder),
                alt: fieldOrLegacySplit(
                  instance,
                  `card${index + 1}Author`,
                  "quotes",
                  index,
                  1,
                  "Lorem Ipsum"
                ),
                className: "testimonial-avatar",
                editorFieldKey: `card${index + 1}Avatar`,
              },
            },
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

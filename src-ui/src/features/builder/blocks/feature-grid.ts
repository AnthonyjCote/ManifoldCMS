import type { BlockCatalogEntry } from "./block-entry";
import { boundedCount, fieldOrLegacyLine, makeCardFields, text } from "./_shared";
import imagePlaceholder from "../../../assets/placeholders/images/camera-corner-placeholder.svg";

export const block: BlockCatalogEntry = {
  id: "feature_grid",
  label: "Feature Grid",
  category: "Features",
  description: "Multi-column feature grid with repeatable items.",
  fields: [
    { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
    { key: "sectionBody", label: "Section Body", type: "textarea", maxLength: 180 },
    { key: "cardColumns", label: "Columns (1-6)", type: "text" },
    ...Array.from({ length: 8 }).map((_, index) => ({
      key: `card${index + 1}Image`,
      label: `Card ${index + 1} Image`,
      type: "image" as const,
    })),
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
        value: text(instance, "sectionTitle", "Feature Grid"),
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
      children: Array.from({ length: boundedCount(instance, "cardCount", 4, 1, 8) }).map(
        (_, index) => ({
          type: "stack",
          props: { className: "feature-card" },
          children: [
            {
              type: "columns",
              props: { ratio: "1:4", className: "feature-card-layout" },
              children: [
                {
                  type: "image",
                  props: {
                    src: text(instance, `card${index + 1}Image`, imagePlaceholder),
                    alt: fieldOrLegacyLine(
                      instance,
                      `card${index + 1}Title`,
                      "items",
                      index,
                      "Lorem ipsum dolor"
                    ),
                    className: "feature-card-media",
                    editorFieldKey: `card${index + 1}Image`,
                  },
                },
                {
                  type: "stack",
                  props: { className: "feature-card-content" },
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
                },
              ],
            },
          ],
        })
      ),
    },
  ],
};

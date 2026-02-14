import type { BlockCatalogEntry } from "./block-entry";
import { text } from "./_shared";

export const block: BlockCatalogEntry = {
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
  buildPreviewTree: (instance) => [
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
                  "copy",
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
                ),
                editorFieldKey: "copy",
              },
            },
            {
              type: "button",
              props: {
                label: text(instance, "ctaLabel", "Lorem Ipsum"),
                href: text(instance, "ctaUrl", "#"),
                editorFieldKey: "ctaLabel",
              },
            },
          ],
        },
        {
          type: "embed",
          props: { value: text(instance, "embed", "Lorem ipsum embed placeholder.") },
        },
      ],
    },
  ],
};

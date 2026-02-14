import type { BlockCatalogEntry } from "./block-entry";
import { boundedCount, lines, splitRows, text } from "./_shared";

export const block: BlockCatalogEntry = {
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
  buildPreviewTree: (instance) => [
    {
      type: "stack",
      props: { className: "footer-block" },
      children: [
        {
          type: "heading",
          props: {
            value: text(instance, "brand", "Lorem Ipsum"),
            level: "h3",
            editorFieldKey: "brand",
          },
        },
        {
          type: "text",
          props: {
            value: text(
              instance,
              "copyright",
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            ),
            editorFieldKey: "copyright",
          },
        },
        {
          type: "cards",
          props: { columns: boundedCount(instance, "linkColumns", 4, 1, 6) },
          children: splitRows(
            lines(instance, "links", ["Lorem|/#", "Ipsum|/#", "Dolor|/#", "Sit|/#"])
          ).map(([label, href], index) => ({
            type: "button",
            props: {
              label: label || "Lorem",
              href: href || "#",
              editorFieldKey: `@split:links:${index}:0`,
            },
          })),
        },
      ],
    },
  ],
};

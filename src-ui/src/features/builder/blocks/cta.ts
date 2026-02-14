import type { BlockCatalogEntry } from "./block-entry";
import { text } from "./_shared";

export const block: BlockCatalogEntry = {
  id: "cta",
  label: "CTA Banner",
  category: "Conversion",
  description: "Single conversion callout with short copy and action link.",
  fields: [
    { key: "copy", label: "Copy", type: "textarea", maxLength: 180 },
    { key: "link", label: "Link", type: "link" },
    { key: "label", label: "Button Label", type: "text", maxLength: 30 },
  ],
  buildPreviewTree: (instance) => [
    {
      type: "stack",
      props: { className: "cta-banner" },
      children: [
        {
          type: "heading",
          props: {
            value: text(
              instance,
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
            label: text(instance, "label", "Lorem Ipsum"),
            href: text(instance, "link", "#"),
            editorFieldKey: "label",
          },
        },
      ],
    },
  ],
};

import type { BlockCatalogEntry } from "./block-entry";
import { text } from "./_shared";

export const block: BlockCatalogEntry = {
  id: "hero",
  label: "Hero",
  category: "Hero",
  description: "Intro section with headline, copy, CTA, and optional image.",
  fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text", maxLength: 40 },
    { key: "headline", label: "Headline", type: "text", required: true, maxLength: 90 },
    { key: "subhead", label: "Subhead", type: "textarea", maxLength: 220 },
    { key: "ctaLabel", label: "CTA Label", type: "text", maxLength: 30 },
    { key: "ctaUrl", label: "CTA Link", type: "link" },
    { key: "heroImage", label: "Hero Image URL", type: "image" },
  ],
  buildPreviewTree: (instance) => [
    {
      type: "columns",
      props: { ratio: "2:1", className: "hero-layout" },
      children: [
        {
          type: "stack",
          children: [
            {
              type: "text",
              props: {
                value: text(instance, "eyebrow", "Hero Section"),
                editorFieldKey: "eyebrow",
              },
            },
            {
              type: "heading",
              props: {
                value: text(instance, "headline", "Lorem Ipsum Dolor Sit Amet"),
                level: "h1",
                editorFieldKey: "headline",
              },
            },
            {
              type: "text",
              props: {
                value: text(
                  instance,
                  "subhead",
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore."
                ),
                editorFieldKey: "subhead",
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
          type: "image",
          props: {
            src: text(instance, "heroImage", ""),
            alt: "Lorem ipsum image",
            className: "hero-image",
          },
        },
      ],
    },
  ],
};

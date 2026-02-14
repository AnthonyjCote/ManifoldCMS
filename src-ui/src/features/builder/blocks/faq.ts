import type { BlockCatalogEntry } from "./block-entry";
import { lines, splitRows, text } from "./_shared";

export const block: BlockCatalogEntry = {
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
  buildPreviewTree: (instance) => [
    {
      type: "heading",
      props: {
        value: text(instance, "sectionTitle", "Lorem Ipsum"),
        level: "h2",
        editorFieldKey: "sectionTitle",
      },
    },
    ...splitRows(
      lines(instance, "items", [
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
};

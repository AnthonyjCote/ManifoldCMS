import type { BlockCatalogEntry } from "./block-entry";
import { boundedCount, fieldOrLegacySplit, makeCardFields, text } from "./_shared";

const PRICING_PLAN_DEFAULTS = ["Starter", "Growth", "Scale", "Enterprise", "Custom", "Plus"];
const PRICING_PRICE_DEFAULTS = ["$19/mo", "$49/mo", "$99/mo", "$199/mo", "Contact Us", "$29/mo"];

export const block: BlockCatalogEntry = {
  id: "pricing",
  label: "Pricing",
  category: "Conversion",
  description: "Pricing cards with plan and amount.",
  fields: [
    { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
    { key: "cardColumns", label: "Columns (1-6)", type: "text" },
    ...makeCardFields("cardCount", "Card Count (1-6)", 6, [
      { suffix: "Plan", label: "Plan", maxLength: 70 },
      { suffix: "Price", label: "Price", maxLength: 40 },
      { suffix: "Body", label: "Description", maxLength: 180 },
    ]),
    {
      key: "plans",
      label: "Legacy Plans (Plan|Price|Description per line)",
      type: "repeater",
      maxItems: 6,
    },
  ],
  buildPreviewTree: (instance) => [
    {
      type: "heading",
      props: {
        value: text(instance, "sectionTitle", "Pricing"),
        level: "h2",
        editorFieldKey: "sectionTitle",
      },
    },
    {
      type: "cards",
      props: { columns: boundedCount(instance, "cardColumns", 3, 1, 6) },
      children: Array.from({ length: boundedCount(instance, "cardCount", 3, 1, 6) }).map(
        (_, index) => ({
          type: "stack",
          props: { className: "feature-card" },
          children: [
            {
              type: "heading",
              props: {
                value: fieldOrLegacySplit(
                  instance,
                  `card${index + 1}Plan`,
                  "plans",
                  index,
                  0,
                  PRICING_PLAN_DEFAULTS[index] ?? "Plan"
                ),
                level: "h3",
                editorFieldKey: `card${index + 1}Plan`,
              },
            },
            {
              type: "heading",
              props: {
                value: fieldOrLegacySplit(
                  instance,
                  `card${index + 1}Price`,
                  "plans",
                  index,
                  1,
                  PRICING_PRICE_DEFAULTS[index] ?? "$0/mo"
                ),
                level: "h2",
                editorFieldKey: `card${index + 1}Price`,
              },
            },
            {
              type: "text",
              props: {
                value: fieldOrLegacySplit(
                  instance,
                  `card${index + 1}Body`,
                  "plans",
                  index,
                  2,
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
                ),
                editorFieldKey: `card${index + 1}Body`,
              },
            },
            { type: "button", props: { label: "Lorem Ipsum", href: "#" } },
          ],
        })
      ),
    },
  ],
};

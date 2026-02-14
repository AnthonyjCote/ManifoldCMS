import type { PrimitiveNode } from "../types";
import type { BlockCatalogEntry } from "./block-entry";
import { parseCustomSectionPrimitives, text } from "./_shared";

export const block: BlockCatalogEntry = {
  id: "custom_section",
  label: "Custom Section",
  category: "Custom",
  description: "Flexible section with 1-4 columns and primitive stacks per column.",
  fields: [
    { key: "columns", label: "Column Count (1-4)", type: "text" },
    { key: "ratios", label: "Ratios (e.g. 1:1, 2:1)", type: "text" },
    {
      key: "column1",
      label: "Column 1 primitives (heading:text, text:copy)",
      type: "repeater",
    },
    { key: "column2", label: "Column 2 primitives", type: "repeater" },
    { key: "column3", label: "Column 3 primitives", type: "repeater" },
    { key: "column4", label: "Column 4 primitives", type: "repeater" },
  ],
  buildPreviewTree: (instance) => {
    const requested = Number.parseInt(text(instance, "columns", "2"), 10);
    const columnCount = Number.isNaN(requested) ? 2 : Math.max(1, Math.min(4, requested));
    const ratio = text(instance, "ratios", "1:1");
    const columns: PrimitiveNode[] = [];

    for (let index = 1; index <= columnCount; index += 1) {
      const parsed = parseCustomSectionPrimitives(text(instance, `column${index}`, ""));
      columns.push({
        type: "stack",
        props: { className: "feature-card" },
        children:
          parsed.length > 0
            ? parsed
            : [
                {
                  type: "text",
                  props: {
                    value:
                      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
                  },
                },
              ],
      });
    }

    return [
      {
        type: "columns",
        props: { ratio, columnCount },
        children: columns,
      },
    ];
  },
};

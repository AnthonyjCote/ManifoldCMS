import logoApex from "../../../assets/placeholders/logos/fake-company-apex.svg";
import logoNova from "../../../assets/placeholders/logos/fake-company-nova.svg";
import logoOrbit from "../../../assets/placeholders/logos/fake-company-orbit.svg";
import logoQuanta from "../../../assets/placeholders/logos/fake-company-quanta.svg";
import type { BlockCatalogEntry } from "./block-entry";
import { boundedCount, text } from "./_shared";

const LOGO_CLOUD_PLACEHOLDERS = [logoApex, logoOrbit, logoNova, logoQuanta];

function logoPlaceholderByIndex(index: number): string {
  return LOGO_CLOUD_PLACEHOLDERS[index % LOGO_CLOUD_PLACEHOLDERS.length];
}

export const block: BlockCatalogEntry = {
  id: "logo_cloud",
  label: "Logo Cloud",
  category: "Trust",
  description: "Client/partner logos in a simple responsive grid.",
  fields: [
    { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
    { key: "copy", label: "Copy", type: "textarea", maxLength: 180 },
    { key: "cardColumns", label: "Columns (1-6)", type: "text" },
    { key: "cardCount", label: "Card Count (1-16)", type: "text" },
  ],
  buildPreviewTree: (instance) => [
    {
      type: "heading",
      props: {
        value: text(instance, "sectionTitle", "Our Clients"),
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
      type: "spacer",
      props: { size: 8 },
    },
    {
      type: "cards",
      props: { columns: boundedCount(instance, "cardColumns", 4, 1, 6) },
      children: Array.from({ length: boundedCount(instance, "cardCount", 4, 1, 16) }).map(
        (_, index) => ({
          type: "stack",
          props: { className: "logo-badge" },
          children: [
            {
              type: "image",
              props: {
                src: logoPlaceholderByIndex(index),
                alt: "Placeholder company logo",
                className: "logo-badge-mark",
              },
            },
          ],
        })
      ),
    },
  ],
};

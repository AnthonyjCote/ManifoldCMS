import imagePlaceholder from "../../../assets/placeholders/images/camera-corner-placeholder.svg";
import type { BlockCatalogEntry } from "./block-entry";
import { text } from "./_shared";

function isReversed(
  rawPlacement: string | number | undefined,
  rawLegacy?: string | number
): boolean {
  if (typeof rawPlacement === "string") {
    return rawPlacement.trim().toLowerCase() === "right";
  }
  if (typeof rawLegacy === "number") {
    return rawLegacy === 1;
  }
  if (typeof rawLegacy !== "string") {
    return false;
  }
  const value = rawLegacy.trim().toLowerCase();
  return (
    value === "true" || value === "1" || value === "yes" || value === "on" || value === "right"
  );
}

function parseRatio(raw: string | number | undefined): string {
  if (typeof raw !== "string") {
    return "1:2";
  }
  const cleaned = raw.trim();
  const match = cleaned.match(/^(\d+)\s*:\s*(\d+)$/);
  if (!match) {
    return "1:2";
  }
  const left = Number.parseInt(match[1], 10);
  const right = Number.parseInt(match[2], 10);
  if (Number.isNaN(left) || Number.isNaN(right) || left <= 0 || right <= 0) {
    return "1:2";
  }
  return `${left}:${right}`;
}

function invertRatio(ratio: string): string {
  const match = ratio.match(/^(\d+)\s*:\s*(\d+)$/);
  if (!match) {
    return ratio;
  }
  const left = Number.parseInt(match[1], 10);
  const right = Number.parseInt(match[2], 10);
  if (Number.isNaN(left) || Number.isNaN(right) || left <= 0 || right <= 0) {
    return ratio;
  }
  return `${right}:${left}`;
}

export const block: BlockCatalogEntry = {
  id: "image_text",
  label: "Image + Text",
  category: "Content",
  description: "Two-column image and copy section with optional reverse layout.",
  fields: [
    { key: "sectionTitle", label: "Section Title", type: "text", maxLength: 70 },
    { key: "copy", label: "Copy", type: "textarea", maxLength: 420 },
    { key: "image", label: "Image", type: "image" },
    { key: "imageAlt", label: "Image Alt", type: "text", maxLength: 140 },
    { key: "desktopRatio", label: "Desktop Ratio (image:text, e.g. 1:2)", type: "text" },
    {
      key: "imagePlacement",
      label: "Image Placement",
      type: "select",
      options: ["left", "right"],
    },
  ],
  buildPreviewTree: (instance) => {
    const imageNode = {
      type: "image" as const,
      props: {
        src: text(instance, "image", imagePlaceholder),
        alt: text(instance, "imageAlt", "Image + Text placeholder"),
        className: "hero-image",
        editorFieldKey: "image",
      },
    };

    const textNode = {
      type: "stack" as const,
      children: [
        {
          type: "heading" as const,
          props: {
            value: text(instance, "sectionTitle", "Image + Text"),
            level: "h2",
            editorFieldKey: "sectionTitle",
          },
        },
        {
          type: "text" as const,
          props: {
            value: text(
              instance,
              "copy",
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Integer consequat nibh sem facilisis erat, vel ultricies neque justo at mauris.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Quisque tristique elit in varius convallis, arcu massa ullamcorper tortor."
            ),
            editorFieldKey: "copy",
          },
        },
      ],
    };

    const reverse = isReversed(instance.props.imagePlacement, instance.props.reverseColumns);

    const baseRatio = parseRatio(instance.props.desktopRatio);
    const effectiveRatio = reverse ? invertRatio(baseRatio) : baseRatio;

    return [
      {
        type: "columns",
        props: { ratio: effectiveRatio, className: "hero-layout" },
        children: reverse ? [textNode, imageNode] : [imageNode, textNode],
      },
    ];
  },
};

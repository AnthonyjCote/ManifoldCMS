import { buildPreviewTreeForBlock } from "../../../features/builder/catalog";
import { useBuilderStore } from "../../../features/builder/builder-store";
import type { PrimitiveNode, PrimitiveType } from "../../../features/builder/types";

type SectionStyleKey =
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "borderWidth"
  | "borderStyle"
  | "borderColor"
  | "borderRadius"
  | "backgroundColor"
  | "textColor"
  | "fontSize";

type PrimitiveStyleKey =
  | SectionStyleKey
  | "fontWeight"
  | "lineHeight"
  | "textAlign"
  | "width"
  | "height";

type StyleField<K extends string> = {
  key: K;
  label: string;
  type?: "text" | "color" | "select";
  options?: string[];
  placeholder?: string;
};

type PrimitiveEntry = {
  path: string;
  type: PrimitiveType;
  label: string;
};

const SECTION_STYLE_FIELDS: Array<{ heading: string; fields: StyleField<SectionStyleKey>[] }> = [
  {
    heading: "Spacing",
    fields: [
      { key: "marginTop", label: "Margin Top", placeholder: "0px" },
      { key: "marginRight", label: "Margin Right", placeholder: "0px" },
      { key: "marginBottom", label: "Margin Bottom", placeholder: "0px" },
      { key: "marginLeft", label: "Margin Left", placeholder: "0px" },
      { key: "paddingTop", label: "Padding Top", placeholder: "64px" },
      { key: "paddingRight", label: "Padding Right", placeholder: "48px" },
      { key: "paddingBottom", label: "Padding Bottom", placeholder: "64px" },
      { key: "paddingLeft", label: "Padding Left", placeholder: "48px" },
    ],
  },
  {
    heading: "Border",
    fields: [
      { key: "borderWidth", label: "Border Width", placeholder: "1px" },
      {
        key: "borderStyle",
        label: "Border Style",
        type: "select",
        options: ["solid", "dashed", "dotted", "double", "none"],
      },
      { key: "borderColor", label: "Border Color", type: "color", placeholder: "#dce3f2" },
      { key: "borderRadius", label: "Border Radius", placeholder: "12px" },
    ],
  },
  {
    heading: "Typography & Surface",
    fields: [
      { key: "backgroundColor", label: "Background", type: "color", placeholder: "#ffffff" },
      { key: "textColor", label: "Text Color", type: "color", placeholder: "#11161f" },
      { key: "fontSize", label: "Base Font Size", placeholder: "16px" },
    ],
  },
];

const PRIMITIVE_FIELD_GROUPS: Record<
  PrimitiveType,
  Array<{ heading: string; fields: StyleField<PrimitiveStyleKey>[] }>
> = {
  heading: [
    {
      heading: "Typography",
      fields: [
        { key: "textColor", label: "Text Color", type: "color", placeholder: "#11161f" },
        { key: "fontSize", label: "Font Size", placeholder: "32px" },
        { key: "fontWeight", label: "Weight", placeholder: "700" },
        { key: "lineHeight", label: "Line Height", placeholder: "1.1" },
        {
          key: "textAlign",
          label: "Align",
          type: "select",
          options: ["left", "center", "right", "justify"],
        },
      ],
    },
    {
      heading: "Spacing",
      fields: [
        { key: "marginTop", label: "Margin Top", placeholder: "0px" },
        { key: "marginBottom", label: "Margin Bottom", placeholder: "16px" },
      ],
    },
  ],
  text: [
    {
      heading: "Typography",
      fields: [
        { key: "textColor", label: "Text Color", type: "color", placeholder: "#44506a" },
        { key: "fontSize", label: "Font Size", placeholder: "16px" },
        { key: "lineHeight", label: "Line Height", placeholder: "1.6" },
        {
          key: "textAlign",
          label: "Align",
          type: "select",
          options: ["left", "center", "right", "justify"],
        },
      ],
    },
    {
      heading: "Spacing",
      fields: [
        { key: "marginTop", label: "Margin Top", placeholder: "0px" },
        { key: "marginBottom", label: "Margin Bottom", placeholder: "16px" },
      ],
    },
  ],
  button: [
    {
      heading: "Surface",
      fields: [
        { key: "backgroundColor", label: "Background", type: "color", placeholder: "#0f1726" },
        { key: "textColor", label: "Text Color", type: "color", placeholder: "#f6f9ff" },
        { key: "borderRadius", label: "Radius", placeholder: "999px" },
      ],
    },
    {
      heading: "Box",
      fields: [
        { key: "paddingTop", label: "Padding Top", placeholder: "11px" },
        { key: "paddingRight", label: "Padding Right", placeholder: "18px" },
        { key: "paddingBottom", label: "Padding Bottom", placeholder: "11px" },
        { key: "paddingLeft", label: "Padding Left", placeholder: "18px" },
        { key: "borderWidth", label: "Border Width", placeholder: "0px" },
        { key: "borderColor", label: "Border Color", type: "color", placeholder: "#000000" },
      ],
    },
  ],
  image: [
    {
      heading: "Frame",
      fields: [
        { key: "width", label: "Width", placeholder: "100%" },
        { key: "height", label: "Height", placeholder: "auto" },
        { key: "borderRadius", label: "Radius", placeholder: "12px" },
      ],
    },
  ],
  video: [
    {
      heading: "Frame",
      fields: [
        { key: "width", label: "Width", placeholder: "100%" },
        { key: "height", label: "Height", placeholder: "240px" },
        { key: "borderRadius", label: "Radius", placeholder: "12px" },
      ],
    },
  ],
  embed: [
    {
      heading: "Frame",
      fields: [
        { key: "width", label: "Width", placeholder: "100%" },
        { key: "height", label: "Height", placeholder: "240px" },
        { key: "borderRadius", label: "Radius", placeholder: "12px" },
      ],
    },
  ],
  code: [
    {
      heading: "Typography",
      fields: [
        { key: "fontSize", label: "Font Size", placeholder: "14px" },
        { key: "lineHeight", label: "Line Height", placeholder: "1.5" },
      ],
    },
  ],
  spacer: [
    {
      heading: "Spacing",
      fields: [
        { key: "height", label: "Height", placeholder: "24px" },
        { key: "marginTop", label: "Margin Top", placeholder: "0px" },
        { key: "marginBottom", label: "Margin Bottom", placeholder: "0px" },
      ],
    },
  ],
  stack: [
    {
      heading: "Spacing",
      fields: [
        { key: "paddingTop", label: "Padding Top", placeholder: "0px" },
        { key: "paddingBottom", label: "Padding Bottom", placeholder: "0px" },
        { key: "backgroundColor", label: "Background", type: "color", placeholder: "#ffffff" },
      ],
    },
  ],
  columns: [
    {
      heading: "Spacing",
      fields: [
        { key: "paddingTop", label: "Padding Top", placeholder: "0px" },
        { key: "paddingBottom", label: "Padding Bottom", placeholder: "0px" },
        { key: "backgroundColor", label: "Background", type: "color", placeholder: "#ffffff" },
      ],
    },
  ],
  cards: [
    {
      heading: "Spacing",
      fields: [
        { key: "paddingTop", label: "Padding Top", placeholder: "0px" },
        { key: "paddingBottom", label: "Padding Bottom", placeholder: "0px" },
      ],
    },
  ],
  details: [
    {
      heading: "Surface",
      fields: [
        { key: "backgroundColor", label: "Background", type: "color", placeholder: "#ffffff" },
        { key: "borderRadius", label: "Radius", placeholder: "12px" },
      ],
    },
  ],
};

function walkPrimitives(nodes: PrimitiveNode[], pathPrefix = ""): PrimitiveEntry[] {
  const out: PrimitiveEntry[] = [];
  nodes.forEach((node, index) => {
    const path = pathPrefix ? `${pathPrefix}.${index}` : String(index);
    out.push({
      path,
      type: node.type,
      label: `${node.type} ${index + 1}`,
    });
    if (node.children && node.children.length > 0) {
      out.push(...walkPrimitives(node.children, path));
    }
  });
  return out;
}

function renderStyleField<K extends string>(opts: {
  field: StyleField<K>;
  value: string;
  setValue: (value: string) => void;
}) {
  const { field, value, setValue } = opts;
  if (field.type === "select") {
    return (
      <select
        value={value || (field.options?.[0] ?? "")}
        onChange={(event) => setValue(event.target.value)}
      >
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "color") {
    return (
      <div className="style-color-row">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(event) => setValue(event.target.value)}
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={field.placeholder}
          className="compact-input"
        />
      </div>
    );
  }
  return (
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={field.placeholder}
      className="compact-input"
    />
  );
}

export function StyleTab() {
  const builder = useBuilderStore();
  const block = builder.selectedBlock;

  if (!block) {
    return <div className="drawer-panel">Select a block to style.</div>;
  }

  const primitiveList = walkPrimitives(buildPreviewTreeForBlock(block));
  const selectedPath = builder.state.selectedPrimitivePath;
  const selectedPrimitive = selectedPath
    ? primitiveList.find((entry) => entry.path === selectedPath)
    : null;

  const primitiveFieldGroups = selectedPrimitive
    ? (PRIMITIVE_FIELD_GROUPS[selectedPrimitive.type] ?? [])
    : [];

  return (
    <div className="drawer-stack">
      <section className="inspector-card-item">
        <h4>Target</h4>
        <label className="inspector-field compact">
          <span>Element</span>
          <select
            value={selectedPrimitive?.path ?? ""}
            onChange={(event) =>
              builder.selectPrimitivePath(event.target.value ? event.target.value : null)
            }
          >
            <option value="">Section</option>
            {primitiveList.map((entry) => (
              <option key={entry.path} value={entry.path}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {selectedPrimitive
        ? primitiveFieldGroups.map((group) => (
            <section key={`primitive-${group.heading}`} className="inspector-card-item">
              <h4>{group.heading}</h4>
              <div className="inspector-card-grid">
                {group.fields.map((field) => {
                  const value = String(
                    block.styleOverrides.primitiveStyles?.[selectedPrimitive.path]?.[field.key] ??
                      ""
                  );
                  return (
                    <label key={field.key} className="inspector-field compact">
                      <span>{field.label}</span>
                      {renderStyleField({
                        field,
                        value,
                        setValue: (next) =>
                          builder.setPrimitiveStyle(selectedPrimitive.path, field.key, next),
                      })}
                    </label>
                  );
                })}
              </div>
            </section>
          ))
        : SECTION_STYLE_FIELDS.map((group) => (
            <section key={`section-${group.heading}`} className="inspector-card-item">
              <h4>{group.heading}</h4>
              <div className="inspector-card-grid">
                {group.fields.map((field) => {
                  const value = String(block.styleOverrides[field.key] ?? "");
                  return (
                    <label key={field.key} className="inspector-field compact">
                      <span>{field.label}</span>
                      {renderStyleField({
                        field,
                        value,
                        setValue: (next) => builder.setBlockStyle(field.key, next),
                      })}
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
    </div>
  );
}

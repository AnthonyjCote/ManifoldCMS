import { blockDefinitionById } from "../../../features/builder/catalog";
import { useBuilderStore } from "../../../features/builder/builder-store";

type FieldDef = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  maxItems?: number;
  maxLength?: number;
};

function fieldHint(type: string, maxItems?: number, maxLength?: number): string {
  if (type === "repeater") {
    return `Repeatable group${maxItems ? ` (max ${maxItems})` : ""}`;
  }
  if (type === "image") {
    return "Include image path and ensure alt text in content.";
  }
  if (type === "link") {
    return "Internal or external URL.";
  }
  if (type === "embed") {
    return "Embed URL or snippet placeholder.";
  }
  if (type === "code") {
    return "Code snippet content.";
  }
  if (maxLength) {
    return `Max ${maxLength} chars.`;
  }
  return "";
}

function parseCardCountRange(label: string): { min: number; max: number } | null {
  const match = label.match(/\((\d+)\s*-\s*(\d+)\)/);
  if (!match) {
    return null;
  }
  const min = Number.parseInt(match[1], 10);
  const max = Number.parseInt(match[2], 10);
  if (Number.isNaN(min) || Number.isNaN(max)) {
    return null;
  }
  return { min, max };
}

function isNumericStepperField(field: FieldDef): boolean {
  if (field.key === "cardCount") {
    return true;
  }
  if (field.key.endsWith("Count") || field.key.endsWith("Columns")) {
    return true;
  }
  return /\(\d+\s*-\s*\d+\)/.test(field.label);
}

function renderFieldInput(
  field: FieldDef,
  value: string,
  setValue: (next: string) => void,
  compact = false
) {
  if (isNumericStepperField(field)) {
    const range = parseCardCountRange(field.label);
    return (
      <input
        type="number"
        min={range?.min ?? 1}
        max={range?.max ?? 99}
        step={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={compact ? "compact-input" : undefined}
      />
    );
  }
  if (field.type === "textarea" || field.type === "repeater" || field.type === "code") {
    return (
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={field.type === "repeater" ? 6 : 4}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      className={compact ? "compact-input" : undefined}
    />
  );
}

export function InspectorTab() {
  const builder = useBuilderStore();
  const block = builder.selectedBlock;

  if (!block) {
    return <div className="drawer-panel">Select a block to inspect.</div>;
  }

  const definition = blockDefinitionById(block.type);
  if (!definition) {
    return <div className="drawer-panel">Unknown block type.</div>;
  }

  const cardCountField = definition.fields.find((field) => field.key === "cardCount");
  const cardRange = cardCountField ? parseCardCountRange(cardCountField.label) : null;
  const rawCardCount = Number.parseInt(String(block.props.cardCount ?? ""), 10);
  const enabledCardCount = cardRange
    ? Math.max(
        cardRange.min,
        Math.min(cardRange.max, Number.isNaN(rawCardCount) ? cardRange.min : rawCardCount)
      )
    : 0;

  const cardFieldPattern = /^card(\d+)(.+)$/;
  const cardFields = definition.fields.filter((field) => cardFieldPattern.test(field.key));
  const groupedCardFields = new Map<number, FieldDef[]>();
  for (const field of cardFields) {
    const match = field.key.match(cardFieldPattern);
    if (!match) {
      continue;
    }
    const cardIndex = Number.parseInt(match[1], 10);
    if (Number.isNaN(cardIndex)) {
      continue;
    }
    const items = groupedCardFields.get(cardIndex) ?? [];
    items.push(field);
    groupedCardFields.set(cardIndex, items);
  }

  const standardFields = definition.fields.filter(
    (field) => field.key !== "cardCount" && !cardFieldPattern.test(field.key)
  );
  const columnFields = standardFields.filter((field) => field.key.endsWith("Columns"));
  const remainingStandardFields = standardFields.filter((field) => !field.key.endsWith("Columns"));

  return (
    <div className="drawer-stack">
      <div className="drawer-inline-controls">
        <label>
          Visibility
          <select
            value={block.visibility}
            onChange={(event) =>
              builder.setBlockVisibility(event.target.value as "visible" | "hidden")
            }
          >
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label>
          Variant
          <input
            value={block.styleOverrides.variant}
            onChange={(event) => builder.setBlockVariant(event.target.value)}
          />
        </label>
      </div>
      <div className="drawer-inline-controls">
        <button className="secondary-btn" onClick={() => builder.moveBlock("up")}>
          Move Up
        </button>
        <button className="secondary-btn" onClick={() => builder.moveBlock("down")}>
          Move Down
        </button>
        <button className="danger-btn" onClick={() => builder.removeBlock()}>
          Remove
        </button>
      </div>

      {columnFields.map((field) => (
        <label key={field.key} className="inspector-field">
          <span>
            {field.label}
            {field.required ? " *" : ""}
          </span>
          {renderFieldInput(field, String(block.props[field.key] ?? ""), (next) =>
            builder.setBlockField(field.key, next)
          )}
          <small>{fieldHint(field.type, field.maxItems, field.maxLength)}</small>
        </label>
      ))}

      {cardCountField ? (
        <label className="inspector-field">
          <span>
            {cardCountField.label}
            {cardCountField.required ? " *" : ""}
          </span>
          {renderFieldInput(cardCountField, String(block.props[cardCountField.key] ?? ""), (next) =>
            builder.setBlockField(cardCountField.key, next)
          )}
          <small>
            {fieldHint(cardCountField.type, cardCountField.maxItems, cardCountField.maxLength)}
          </small>
        </label>
      ) : null}

      {cardCountField && enabledCardCount > 0 ? (
        <div className="inspector-card-repeater">
          {Array.from({ length: enabledCardCount }).map((_, index) => {
            const cardIndex = index + 1;
            const fields = groupedCardFields.get(cardIndex) ?? [];
            if (fields.length === 0) {
              return null;
            }
            return (
              <section key={cardIndex} className="inspector-card-item">
                <h4>Card {cardIndex}</h4>
                <div className="inspector-card-grid">
                  {fields.map((field) => (
                    <label key={field.key} className="inspector-field compact">
                      <span>
                        {field.label.replace(new RegExp(`^Card\\s+${cardIndex}\\s+`), "")}
                        {field.required ? " *" : ""}
                      </span>
                      {renderFieldInput(
                        field,
                        String(block.props[field.key] ?? ""),
                        (next) => builder.setBlockField(field.key, next),
                        true
                      )}
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}

      {remainingStandardFields.map((field) => (
        <label key={field.key} className="inspector-field">
          <span>
            {field.label}
            {field.required ? " *" : ""}
          </span>
          {renderFieldInput(field, String(block.props[field.key] ?? ""), (next) =>
            builder.setBlockField(field.key, next)
          )}
          <small>{fieldHint(field.type, field.maxItems, field.maxLength)}</small>
        </label>
      ))}
    </div>
  );
}

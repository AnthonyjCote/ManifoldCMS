# TEMP Scoped Chips Implementation Plan (Breakpoints + States)

## Purpose

Define the implementation plan for per-field scope chips so a single CSS field can edit values across breakpoint and state scopes without duplicating field UIs.

## Goal

- One field input component.
- One dynamic chip row component.
- Multiple value scopes per field (breakpoint + state).
- Lean CSS output (only emit explicit overrides).
- Easy future extension (add chips without rewriting field components).

---

## Locked Decisions (Set Now)

1. Desktop is default base scope

- `desktop/base` is the canonical default value for each field.
- Existing flat values migrate into `desktop/base`.

2. V1 scope surface

- Breakpoints: `desktop`, `tablet`, `mobile`.
- States: `base`, `hover`.
- Chips shown in v1:
  - breakpoint chips: desktop/tablet/mobile
  - state chips: base/hover

3. Breakpoints are variable (not hardcoded)

- Breakpoint definitions come from global settings (future global settings page).
- Style system consumes breakpoint definitions by stable `id`.

4. Dynamic chip architecture

- Chip rows are generated from scope config arrays.
- Adding new scopes later (`focus`, `active`, `selected`, custom breakpoint) is config-only.

5. Lean export

- Export only explicit scoped overrides.
- If a scoped value is empty/undefined, inherit from fallback chain and do not emit duplicate CSS.

6. Backward compatibility

- Add style schema versioning + migration.
- Legacy field values are preserved via migration into scoped map.

---

## Proposed Scope Model

### Scope axes

- Breakpoint axis: `desktop` | `tablet` | `mobile` | custom ids from settings
- State axis: `base` | `hover` (v1)

### Effective scope key (canonical)

- `bp:<breakpointId>|st:<stateId>`
- Examples:
  - `bp:desktop|st:base`
  - `bp:desktop|st:hover`
  - `bp:tablet|st:base`
  - `bp:mobile|st:hover`

### Value storage shape

```ts
stylesByScope?: {
  [scopeKey: string]: {
    [fieldKey: string]: string;
  };
}
```

Alternative normalized shape (equivalent):

```ts
fieldValues?: {
  [fieldKey: string]: {
    [scopeKey: string]: string;
  };
}
```

Implementation preference:

- Use `stylesByScope` (scope-first) for easier CSS generation per media/state block.

---

## Fallback / Precedence (Locked Default)

For resolving a value for `(breakpoint, state)`:

1. exact: `(breakpoint, state)`
2. same breakpoint + `base`
3. `desktop` + same `state`
4. `desktop/base`
5. undefined

Example:

- `mobile/hover` falls back to `mobile/base`, then `desktop/hover`, then `desktop/base`.

---

## UI Plan

## A) Reusable chips component

`ScopeChipRow` props:

- `breakpointOptions[]` (dynamic from settings)
- `stateOptions[]` (v1: base, hover)
- `activeBreakpointId`
- `activeStateId`
- callbacks for changing active scope

### B) Per-field rendering pattern

Each style field row:

1. label
2. compact chips row (breakpoint + state)
3. input control bound to active scope value
4. optional inherited indicator when value is falling back
5. reset action for current scope value

### C) Icon + tooltip model

- Breakpoint chips:
  - desktop icon
  - tablet icon
  - mobile icon
- State chips:
  - base icon
  - hover icon (cursor)
- Tooltips explain active target:
  - `Editing: Mobile + Hover`

### D) UX guardrails

- Only one active breakpoint chip at a time.
- Only one active state chip at a time.
- If a field/state is unsupported for a primitive, chips can be disabled (not removed) with tooltip reason.

---

## Data / Schema Changes

## Block style overrides (section)

Add scoped styles container:

```ts
styleOverrides: {
  // existing fields remain for migration/read compatibility
  stylesByScope?: Record<string, Record<string, string>>;
}
```

## Primitive style overrides

```ts
primitiveStyles?: {
  [primitivePath: string]: {
    // existing fields remain for migration/read compatibility
    stylesByScope?: Record<string, Record<string, string>>;
  }
}
```

## Migration

- On load:
  - if scoped styles absent and legacy field exists -> move to `bp:desktop|st:base`
- Preserve legacy fields during transition (optional dual-read), then clean up in next schema bump.

---

## CSS Export Plan

1. Emit desktop/base styles as default declarations.
2. Emit desktop/hover styles under `:hover` selector.
3. Emit tablet/mobile scopes under media queries from global settings.
4. Emit hover within each breakpoint media query only when explicitly set.
5. Skip empty/redundant declarations.

Pseudo output structure:

- base rules
- base hover rules
- `@media (max-width: tablet)` base + hover overrides
- `@media (max-width: mobile)` base + hover overrides

---

## Builder Runtime Plan

1. Keep existing style tab field registry.
2. Add scoped value read/write helpers:

- `getFieldValue(fieldKey, scope)`
- `setFieldValue(fieldKey, scope, value)`
- `resolveEffectiveFieldValue(fieldKey, scope)`

3. Plug helpers into all style inputs.
4. Ensure undo/redo captures scoped edits as single logical actions.

---

## Decisions Still To Lock Before Coding

1. Hover support policy

- Should hover chips show for all primitives, or only interactive ones by default?

2. Breakpoint query strategy

- Use max-width breakpoints, min-width, or range-based definitions?

3. Scope conflict editing UX

- Should inherited values be shown as ghost text, badge, or secondary line?

4. Style tab default scope

- On opening style tab, default active scope:
  - `desktop/base` (recommended)

5. Reset semantics

- `Reset current scope` only (recommended)
- or `Reset all scopes for this field` (secondary action)

6. Combined state+breakpoint support in v1

- Keep full matrix in v1 (`mobile + hover`) or restrict hover to desktop first.

---

## Suggested Implementation Sequence

1. Add scoped schema types and migration helpers.
2. Add runtime scope resolver utilities.
3. Build reusable `ScopeChipRow` component.
4. Integrate chips into style field renderer.
5. Update store setters/getters for scoped values.
6. Add export mapping for scoped CSS.
7. Add UI inherited/reset indicators.
8. Add tests for fallback precedence and export output.

---

## Acceptance Criteria

- Chips are generated from config and can be extended without per-field rewrites.
- Desktop/tablet/mobile + base/hover editing works per field.
- Legacy projects migrate automatically.
- Preview and export reflect the same scoped behavior.
- CSS output remains minimal (no redundant declarations).

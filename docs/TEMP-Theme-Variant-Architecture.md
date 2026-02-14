# TEMP Feature PDR: Theme + Variant Architecture (P0.3)

## Purpose

Build a robust, AI-ready theme system that drives primitive styling through reusable variants and class-based output, so users can apply a complete brand/theme with minimal manual editing.

---

## Why This Matters

Current styling can be edited field-by-field, but the V1 goal is faster site creation:

- choose a theme (or have AI generate one),
- drop blocks/sections,
- update content,
- ship.

To support that, primitive and block design quality must come from theme + variants, not one-off inline styles.

---

## Core Decisions

- Style tab explicit values are the primary source of truth for user-authored styling.
- Theme is optional and additive (never mandatory, never breaking for existing projects).
- Primitives consume theme variants by default.
- Blocks define layout and default variant choices, not bespoke styling.
- Output should be class-based and DRY as much as possible.
- AI should edit theme schema/variant maps, not random per-element style fields.
- Theme-generated classes should use an explicit `theme-` prefix for auditing clarity (theme vs user-authored values/classes).
- Theme editor UI must be DRY and reuse existing drawer-tab UI patterns/components from Style and Blocks tabs.
- When Classes tab ships, user classes become authoritative source of truth alongside explicit Style-tab values.

---

## Scope (P0.3)

## In Scope

1. Theme token schema (global site design tokens)
2. Primitive variant schema and assignment model
3. Block default variant mapping
4. Theme authoring/editing contract for AI workflows
5. Class-based style generation strategy
6. Runtime preview parity with export output
7. Clear separation between theme classes and future user-authored classes
8. Safe theme-apply workflow with automatic backup/versioning
9. Ship bundled V1 theme library for baseline switching/edit testing

## Out of Scope (for this phase)

- Full visual theme marketplace UX
- Animation preset system (handled in motion workstream)
- Full classes tab productization (covered in P2)

---

## Theme Schema (V1)

## 1) Color Tokens

Required:

- `theme.baseColor`
- `theme.accentColor`
- `theme.altColor`
- `theme.linkColor`

Recommended full palette:

- `bg.canvas`
- `bg.surface`
- `bg.elevated`
- `text.primary`
- `text.secondary`
- `text.muted`
- `color.base`
- `color.accent`
- `color.alt`
- `color.link`
- `color.linkHover`
- `color.success`
- `color.warning`
- `color.danger`
- `border.default`
- `border.strong`

## 2) Typography Tokens

- Font families: body/display/mono
- Size scale (step tokens)
- Weight scale
- Line-height scale
- Letter-spacing scale

## 3) Spacing + Radius + Border + Shadow

- spacing scale (`xs`..`3xl`)
- radius scale (`none/sm/md/lg/xl/full`)
- border widths + styles
- shadow levels (`sm/md/lg/xl`)

## 4) Responsive Token Overrides

- optional token overrides for mobile/tablet/desktop/retina-wide
- follows existing project breakpoint settings

---

## Primitive Variant System

Each primitive has named variants. Variants map to class names + token recipes.

## Heading variants

- `standard`
- `subheading`
- `accent`
- `hero`
- `eyebrow`

## Text variants

- `body`
- `lead`
- `muted`
- `small`

## Button variants

- `primary`
- `secondary`
- `ghost`
- `link`

## Link variants

- `default`
- `accent`
- `subtle`

Other primitives get variant sets as needed (image, cards, details, etc.)

---

## Block Quality Contract

Blocks should:

- define structure/layout,
- assign sensible default primitive variants,
- avoid hardcoded design values unless token-backed,
- remain theme-compatible without custom cleanup.

Definition:

- A block dropped into any valid theme should look production-ready immediately.

Product goal (explicit):

- Fast path users: pick theme (or generate with AI), drag/drop sections, edit content, ship.
- Advanced users/designers: still retain micro-granular control over CSS fields/variables where needed.
- System must serve both audiences without forcing either workflow.

---

## Data Model (Conceptual)

- `theme.json`
  - global tokens
  - responsive token overrides
  - primitive variant recipes
- `block-manifest.json`
  - primitive tree
  - default variant keys per primitive node
- page layout JSON
  - selected blocks
  - optional per-node variant override
  - optional per-node inline style override (explicit user choice)

Precedence (high -> low):

1. explicit style-tab value (scope/state-specific)
2. user class assignment (future Classes tab)
3. selected primitive variant override
4. block default primitive variant
5. theme base variant/tokens (additive fallback)
6. hard fallback token/default

---

## Inheritance + Classifier Contract

To keep style debugging clear, the builder must classify where each resolved field value comes from.

## Source chain (effective value resolution)

For non-state styles:

- `theme` -> `block` -> `default` -> `viewport` (`mobile/tablet/desktop/retina-wide`)

For state styles:

- state values resolve using the same source order within the active scope.

Interpretation:

- Theme provides global/base styling intent.
- Block provides pre-made section defaults when present.
- Default provides project/page-level baseline overrides.
- Viewport scopes provide additive responsive overrides.
- Explicit Style-tab edits always override upstream sources at the current scope.
- If no theme is selected, behavior must remain non-breaking and equivalent to manual styling flow.

## Classifier statuses (required)

- `theme` (purple): value resolved from active theme token/variant.
- `block` (blue): value resolved from the pre-made block defaults.
- `override` (red): explicit value at current scope overriding lower-precedence source.
- `inherited` (yellow): value inherited from earlier link in the chain.
- `edited` (green): explicit value at current scope (when distinct from override handling in UI).
- `uninitialized` (hollow/low-contrast): no value from any source.

## Notes

- `block` classification is required for fields originating from shipped block defaults
  (for example section spacing/surface defaults baked into a block template).
- Source classification must be consistent across:
  - Style tab field indicators,
  - filters,
  - Section Style Audit modal.
- Theme-resolved values should behave like inherited values in the Style tab.
- If a user edits a theme-resolved field in Style tab, classify it as `override` (red) at that scope.
- Keep Style-tab explicit values authoritative for both preview and export output.
- Add jump-to-theme-source action from the purple `theme` tooltip to open/focus the matching Theme-tab control.

---

## AI Workflow Requirements

AI must be able to:

- create/edit theme tokens safely,
- generate variant recipes for brand direction,
- assign/reassign primitive variants across pages,
- report diffs in theme + variant mappings,
- rollback theme edits cleanly.

---

## Export Strategy (DRY / Class-Based)

- Generate shared class rules for theme variants using explicit theme-prefixed naming
  (example: `.theme-heading--subheading`, `.theme-button--primary`).
- Generate CSS variables from theme tokens
- Keep inline styles for true local overrides only
- Ensure export parity with builder preview
- Preserve source visibility:
  - theme classes = `theme-*`
  - user classes (future classes tab) = `user-*` or equivalent explicit namespace
- Export source-of-truth contract:
  - current phase: Style-tab explicit values are authoritative for export.
  - future Classes tab phase: user class assignments + Style-tab explicit values are authoritative.
  - theme remains a control/helper layer for unresolved style keys and class keys.

---

## Theme Library + Live Theme Editing UX

## Top-level Theme Library view (left rail)

- Display starter themes in a visual grid.
- V1 preview contract: each card renders the same canonical hero section only for side-by-side comparison.
- Card actions (V1): `Apply`.
- Card actions (near-future): `Preview`, `Duplicate`, `Import`, `Export`.
- Bundle first V1 theme pack during this phase (minimum 6 baseline themes).

## Builder right drawer Theme tab

- Expose granular theme token controls.
- Apply edits live to the active site preview.
- Clearly indicate the active theme being edited.
- Keep this tab focused on token/variant editing, not library browsing.
- Reuse the same structure and visual language as existing Style/Blocks tabs:
  - fixed top search/control bar pattern,
  - accordion/toggle group pattern,
  - shared dropdown/popover styles,
  - shared field row/input patterns.

## Safety requirement (non-negotiable)

- When user applies any library theme, always save a snapshot of current active theme first.
- Theme apply flow must never destroy unsaved user theme work.
- Minimum safety behavior:
  - auto-create backup snapshot/version,
  - then apply selected library theme,
  - allow restore/rollback to pre-apply state.
- Theme apply must open a modal with two explicit options:
  - `Merge (Recommended)` applies theme additively and preserves explicit local overrides.
  - `Replace` applies theme broadly and may overwrite local styling intent.
- `Replace` must require a secondary warning confirmation:
  - explicit “Are you sure?” step,
  - clear impact explanation before applying.
- Optional near-future safety UX:
  - lightweight confirm dialog summarizing that a backup was created,
  - version history entry with timestamp + source theme id.

---

## Acceptance Criteria

- Theme can define base/accent/alt/link color system and apply globally.
- Heading primitive includes `subheading` variant.
- Primitive variants are selectable and applied consistently.
- Blocks look high-quality by default under theme control.
- Exported output is class-based and DRY for theme/variant styles.
- Theme styles are clearly auditable by class naming (`theme-*`).
- AI can modify theme + variants without direct source-code editing.
- Preview matches export for theme + variant styling.
- Applying library themes auto-preserves prior user theme state before replacement.
- Theme apply modal supports `Merge` vs `Replace`, with a secondary warning for `Replace`.
- V1 ships with 6 baseline bundled themes available in Theme Library.
- Theme switching + clone/edit workflow is testable across:
  - default/bundled theme instance,
  - user-cloned editable theme instance.
- Editing theme-resolved Style-tab values marks those fields as `override` while preserving Style-tab as final authority.
- Theme-classified fields support jump-to-theme-source navigation.

---

## P0.3 Implementation Checklist (Granular)

1. Theme schema contract

- [ ] Define `theme.json` schema and validation
- [x] Add required color token fields (`base`, `accent`, `alt`, `link`)
- [x] Add typography/spacing/radius/border/shadow tokens
- [ ] Add responsive token override support
- [x] Add theme metadata fields for versioning/snapshot lineage (id, source, createdAt, updatedAt)

2. Variant registry

- [ ] Add primitive variant registry model
- [ ] Add heading variants including `subheading`
- [ ] Add baseline variants for text/button/link
- [ ] Add fallback behavior for unknown variant keys

3. Builder integration

- [ ] Show variant selector in Content tab per primitive
- [ ] Apply variant classes in preview renderer
- [ ] Keep variant assignment separate from inline style overrides
- [ ] Ensure theme-applied classes are always emitted as `theme-*` names
- [x] Add right-drawer Theme tab for live token editing with immediate preview updates
- [x] Build Theme tab using shared Style/Blocks tab UI primitives (no bespoke one-off theme editor shell)

4. Block integration

- [ ] Add default variant mapping to block manifests
- [ ] Refactor blocks to remove non-token hardcoded styling
- [ ] QA dropped-block quality across default themes

5. Export integration

- [x] Generate theme CSS variables from tokens
- [ ] Generate variant class rules from registry
- [ ] Emit minimal inline style overrides only when explicit
- [ ] Verify preview-to-export parity snapshots

6. AI readiness

- [ ] Add machine-readable theme/variant context package
- [ ] Ensure theme + variant edits are diffed and reversible
- [ ] Add guardrails for invalid token/variant mutations

7. QA and completion

- [ ] Cross-theme visual QA for all v1 blocks
- [ ] Responsive QA for all viewport scopes
- [ ] Accessibility spot-checks for contrast and heading hierarchy
- [x] Update `TEMP-Priority-Execution-Plan.md` with completion status

8. Theme library safety workflow

- [x] Build top-level Theme Library page with canonical sample-preview cards
- [x] Implement `Apply` flow that auto-snapshots current theme before apply
- [x] Add restore path for last pre-apply snapshot (minimum)
- [ ] Log theme apply events with source/target IDs for auditability
- [x] Bundle first V1 theme set (6 baseline themes) as template modules (auto-discovered in `/features/theme/templates`).
- [x] Validate switch/edit behavior for bundled default vs user-clone versions
- [x] Build apply modal with `Merge (Recommended)` and `Replace` options.
- [x] Add secondary “Are you sure?” confirmation flow for `Replace`.

9. Style-tab/theme interaction rules

- [x] Treat theme-resolved fields as inherited-like in the Style tab.
- [x] On local edit of theme-resolved fields, classify as `override` at edited scope.
- [x] Add jump-to-theme-source action from theme tooltip.
- [x] Ensure preview/export continue to use Style-tab explicit values as final authority.
- [x] Ensure Theme-tab token edits update Style-tab resolved values and live preview immediately.
- [x] Track Theme-tab token edits in undo/redo history.

---

## Follow-Up (Near Future)

- Add Builder right-drawer `Primitives` tab for Custom Section assembly.
- Let users drag primitives into a custom section container.
- Inherit theme variants by default for newly dropped primitives.
- Add dedicated Classes tab/workflow for user-authored classes (visual creation + management).
- Allow both blocks and primitives to select class assignments from:
  - theme class list
  - user class list
- Add non-destructive full-site theme preview mode on the active project (preview-only apply before confirm).

---

## Pre-Implementation Readiness Checklist

Use this section to lock critical decisions before coding P0.3.

1. Theme schema versioning and migration

- [ ] Add `schemaVersion` to theme JSON.
- [ ] Define migration path for future token/variant changes.

2. Token fallback contract

- [ ] Define deterministic fallback order for missing theme tokens.
- [ ] Ensure preview and export share the same fallback resolver.

3. Theme apply safety UX

- [ ] Define apply flow UX with explicit `Merge` vs `Replace` options.
- [ ] Enforce snapshot-first behavior before any theme apply.
- [ ] Define restore entry point immediately after apply.
- [ ] Add secondary warning confirmation for `Replace`.

4. Bundled vs editable theme semantics

- [ ] Keep bundled library themes immutable.
- [ ] Define user-clone workflow for safe editing.

5. Preview-to-export parity testing

- [ ] Add parity checks for canonical test page across all viewport scopes.
- [ ] Verify generated classes + token variables match preview output.

6. Performance guardrails

- [ ] Avoid full app rerender on theme switch where possible.
- [ ] Cache generated CSS from theme+variant model.

7. Accessibility baseline in theme authoring

- [ ] Add contrast checks for text/background and link/background.
- [ ] Surface warnings for unsafe combinations.

8. Primitive/variant support matrix

- [ ] Define explicit variant support per primitive.
- [ ] Handle unsupported variant assignments with deterministic fallback.

9. Theme vs local override visibility

- [ ] Show when a style is theme-driven vs locally overridden.
- [ ] Keep source-of-truth indicators consistent with classifier system.
- [ ] Include `block` source classification for pre-made block defaults (blue).

10. Baseline theme test fixture

- [ ] Define one canonical sample page for switching/edit tests.
- [ ] Use fixture for validating bundled 6-theme set and clone behavior.

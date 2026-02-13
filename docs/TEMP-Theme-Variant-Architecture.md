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

- Theme is the primary source of design intent.
- Primitives consume theme variants by default.
- Blocks define layout and default variant choices, not bespoke styling.
- Output should be class-based and DRY as much as possible.
- AI should edit theme schema/variant maps, not random per-element style fields.
- Theme-generated classes should use an explicit `theme-` prefix for auditing clarity (theme vs user-authored values/classes).

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

1. explicit inline override
2. selected primitive variant override
3. block default primitive variant
4. theme base variant
5. token fallback

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

---

## P0.3 Implementation Checklist (Granular)

1. Theme schema contract

- [ ] Define `theme.json` schema and validation
- [ ] Add required color token fields (`base`, `accent`, `alt`, `link`)
- [ ] Add typography/spacing/radius/border/shadow tokens
- [ ] Add responsive token override support

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

4. Block integration

- [ ] Add default variant mapping to block manifests
- [ ] Refactor blocks to remove non-token hardcoded styling
- [ ] QA dropped-block quality across default themes

5. Export integration

- [ ] Generate theme CSS variables from tokens
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
- [ ] Update `TEMP-Priority-Execution-Plan.md` with completion status

---

## Follow-Up (Near Future)

- Add Builder right-drawer `Primitives` tab for Custom Section assembly.
- Let users drag primitives into a custom section container.
- Inherit theme variants by default for newly dropped primitives.
- Add dedicated Classes tab/workflow for user-authored classes (visual creation + management).
- Allow both blocks and primitives to select class assignments from:
  - theme class list
  - user class list

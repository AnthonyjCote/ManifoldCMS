# TEMP Feature PDR: Iconography Utility + SVG Icon Primitive

## Purpose

Introduce a dedicated iconography system so users can insert and style SVG icons from large icon libraries with granular controls (color, stroke width, size, etc.), while preserving theme defaults, user overrides, and preview/export parity.

---

## Product Goals

- Add a first-class icon workflow (not image hacks).
- Support very large icon libraries with strong performance.
- Allow theme-driven icon defaults with local user overrides.
- Provide controls similar to modern icon tools (Google Icons-style controls).
- Keep exported output visually identical to builder preview.

---

## Core Decisions

- Icons should be a dedicated `icon` primitive.
- Icon rendering should be inline SVG (or symbol sprite) for style control.
- Theme provides default icon styling tokens.
- Style tab explicit values override theme defaults.
- Include only used icons in export output.

---

## Scope

## In Scope (V1)

1. New `icon` primitive
2. Icon picker modal with library browse/search/filter
3. Icon style controls (size, color, stroke width, opacity)
4. Theme token defaults for icon styles
5. Local override handling + classifier integration
6. Export pipeline support for used icons only

## Out of Scope (This Phase)

- Icon animation presets
- Advanced duotone/multicolor procedural effects
- AI icon generation

---

## Data Model (Conceptual)

## Icon primitive props

- `iconId`
- `iconSet` (`material`, `lucide`, `custom`, etc.)
- `variant` (`outline`, `filled`, etc. where supported)
- `viewBox` (optional override)
- `label` / accessibility metadata

## Icon style keys

- `iconColor`
- `iconSize`
- `iconStrokeWidth`
- `iconOpacity`
- `iconRotate` (optional)

## Theme token defaults (new)

- `iconColor`
- `iconStrokeWidth`
- `iconSize` (optional global default)

---

## Resolution / Precedence

1. Style-tab explicit icon value
2. Future class assignment (when Classes tab is active)
3. Block default icon config (if provided)
4. Theme icon token defaults
5. Primitive fallback defaults

Classifier expectations:

- theme (purple), override (red), edited (green), inherited (yellow), uninitialized (hollow)

---

## UX Requirements

## Icon Picker Modal

- Browse full icon catalog with virtualization.
- Search by name/tags.
- Filter by set/category/style.
- Fast preview grid with keyboard support.
- Insert action returns normalized icon reference object.

## Style Controls (Builder)

- Color picker + hex input
- Stroke width slider/field
- Size field
- Opacity field
- Optional “Use theme defaults” toggle

---

## Library Architecture

## Icon catalog service

- Normalized icon metadata index:
  - `id`, `name`, `set`, `tags`, `category`, `variants`, `supportsStroke`, `viewBox`
- Lazy load icon SVG payloads by set/chunk.
- Keep a compact local cache/index.

## Scaling strategy

- Do not bundle all SVG payloads into a monolith.
- Bundle metadata index + chunked icon payloads.
- Load icon payloads on demand.

---

## Rendering Strategy

- Preferred: inline SVG with `currentColor` + stroke attributes for full style control.
- Alternative for repeated icons: generated sprite symbols with per-instance CSS control.
- Avoid external `<img src=\"...svg\">` for controllable icons.

---

## Export / Build Contract

- Export only icons actually used in pages/components.
- Preserve style parity (color/stroke/size) with builder.
- Ensure icon rendering method in export matches preview behavior.

---

## Acceptance Criteria

- User can insert icons from large library without performance issues.
- User can control icon color/stroke/size in Style tab.
- Theme defaults apply automatically to icons.
- User overrides theme icon defaults per element.
- Classifier source states are accurate for icon fields.
- Exported site icon visuals match builder preview.

---

## Implementation Checklist

1. Primitive + schema

- [ ] Add `icon` primitive type and renderer
- [ ] Add icon style keys to style registry and supported primitive mappings
- [ ] Add serialization support for icon props

2. Theme integration

- [ ] Add icon tokens to theme schema
- [ ] Wire icon tokens to preview CSS vars
- [ ] Wire source-classifier mapping in Style tab

3. Picker + library

- [ ] Build icon metadata/index service
- [ ] Build lazy SVG payload loader
- [ ] Build virtualized icon picker modal
- [ ] Add set/category/tag filters

4. Builder integration

- [ ] Add “insert icon” flow
- [ ] Add style controls for icon fields
- [ ] Add theme-default vs override UI behavior

5. Export integration

- [ ] Build used-icon collection step
- [ ] Emit only used icon payloads
- [ ] Validate preview/export parity

6. QA

- [ ] Performance QA on large icon sets
- [ ] Accessibility QA (labels/aria)
- [ ] Classifier and undo/redo behavior QA

---

## Notes

- This doc is TEMP and should be merged into main execution planning after review.

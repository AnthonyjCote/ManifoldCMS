# TEMP Feature PDR: Brand Kit + Shared Font Library System

## Purpose

Create a reusable, app-wide font system powered by the full Google Fonts catalog, plus a new Brand Kit workspace for visualizing and composing typography + color combinations that feed directly into themes.

---

## Product Goals

- Full Google Fonts library is accessible without requiring search.
- Font names render in their actual font face in picker lists.
- Build once, reuse everywhere:
  - Brand Kit page
  - Builder Style tab font fields
  - Theme tab typography fields
- Eliminate manual-only font typing by adding a modal picker flow.
- Keep preview/export parity and performance safe with lazy loading + selective export.

---

## Core Decisions

- Search is optional, not mandatory. Users can browse full catalog.
- Full catalog UI must be virtualized and lazy-loaded for performance.
- Do not load all font files at once.
- Keep existing manual text input as fallback, but promote picker-first UX.
- Shared infrastructure must be DRY and used by all font selection entry points.
- Export should include only fonts actually used by theme/style/class outputs.
- Add a global offline font cache utility for authoring convenience.
- Global cache is not export source-of-truth; project font manifest remains export source-of-truth.

---

## Scope

## In Scope (V1)

1. Shared Google Fonts catalog service
2. Shared font lazy-loader + cache
3. Reusable Font Picker modal component
4. Integration into Builder Style tab (font-family fields)
5. Integration into Theme tab (heading/body/mono or accent typography slots)
6. New top-level Brand Kit page for typography + palette exploration
7. Project-level font usage manifest for export/build pipeline
8. Global font cache utility for offline use (Google downloads + system/custom references)

## Out of Scope (This Phase)

- Local font upload/import
- Advanced font pairing AI recommendations
- Full type scale generator wizard
- Animation/motion typography presets

---

## UX Requirements

## Font Picker Modal (Shared Component)

- Full-library list view with virtualization.
- Each family row/card displays name in its own font.
- Optional search + filters (not required to access catalog).
- Filter set modeled after Google Fonts-style browsing:
  - category/type (serif/sans/display/handwriting/mono)
  - variable vs static
  - weight/axis availability
  - script/language subsets
  - visual style tags (where metadata supports it)
- Selection output:
  - font family
  - selected weights/styles/axes
  - subset preferences

## Brand Kit Page (Top-level Left Rail View)

- Minimal, clean visual design workspace.
- Live specimen canvas showing:
  - heading text
  - body text
  - accent text
  - buttons/links/cards sample
- Role-based typography assignment:
  - Heading
  - Body
  - Accent
- Palette editor shown alongside typography:
  - base/accent/alt/link/surface/text tokens
- Fast swap/pairing workflow for trying combinations.
- Save as Theme / Apply to active Theme.

---

## Architecture

## Shared Modules

1. `font-catalog-service`

- Fetches/stores Google Fonts metadata.
- Persists cached catalog locally per app version.

2. `font-loader`

- Loads CSS/font files only for visible and selected families.
- Supports preload for active specimen families.
- Prevents duplicate loads.

3. `font-cache-store`

- Records recently viewed/selected families for quick reopen.
- Stores project-level selected families/weights for export.

4. `FontPickerModal` (UI)

- Reusable modal used across Brand Kit, Theme tab, Style tab.
- Accepts current selection and returns structured selection payload.

5. `global-font-cache-manager`

- User-level utility for managing downloaded/available fonts for offline authoring.
- Supports:
  - downloaded Google fonts,
  - system font references,
  - optional custom font file entries.
- Exposes “available offline fonts” dataset to picker and Brand Kit.

## Integration Surfaces

- Builder Style Tab:
  - Add font picker trigger beside font-family inputs.
- Theme Tab:
  - Add font picker triggers for theme typography tokens.
- Brand Kit Page:
  - Uses the same picker and loader stack.

---

## Data Model (Conceptual)

## Global font cache (user-level, non-export)

`global-font-cache.json`:

- `entries[]`
  - `id`
  - `family`
  - `source` (`google` | `system` | `custom`)
  - `weights[]`
  - `styles[]`
  - `subsets[]`
  - `localAssetPaths[]` (when downloaded/stored locally)
  - `lastValidatedAt`

Purpose:

- Provide offline availability and cross-project convenience.
- Not used directly by export/build as source of shipped assets.

## Project font usage manifest (new)

`project-fonts.json`:

- `families[]`
  - `family`
  - `weights[]`
  - `styles[]`
  - `variableAxes`
  - `subsets[]`
  - `sources` (theme/style/classes)

## Theme integration

- Theme tokens continue to store chosen family strings and related typography values.
- Style tab remains source of truth for explicit per-element overrides.
- Theme remains additive control layer for unresolved keys.

---

## Performance & Reliability Constraints

- Virtualized rendering is mandatory for full catalog browsing.
- Lazy load only visible/selected fonts.
- Debounced filter/search operations.
- Cache metadata and loaded families between sessions where practical.
- Guardrail: fallback to system stack if remote font load fails.

---

## Export / Build Contract

- Export includes only used font families/weights/subsets from manifest.
- No blanket inclusion of entire catalog.
- Preview font behavior must match exported site behavior.
- If self-host mode is enabled later, architecture should allow switching from CDN to local asset output.
- Global font cache must not implicitly leak into exports.
- Only project-referenced, in-use font entries are eligible for export packaging.

---

## Acceptance Criteria

- User can browse full Google Fonts library without typing search.
- Font names render in their own font in picker list.
- Picker works from Theme tab and Style tab (shared component).
- Brand Kit page can assign Heading/Body/Accent families and palette values.
- Applying Brand Kit updates active theme + preview live.
- Used fonts are tracked and only used fonts are exported.
- Performance remains smooth on large catalogs (virtualized + lazy).
- Users can download/cache Google fonts for offline authoring use.
- System/custom/global cached fonts can be selected in picker and then added to project usage.

---

## Implementation Checklist

1. Shared infra

- [ ] Build Google Fonts metadata service with local cache.
- [ ] Build lazy font loader with duplicate-load protection.
- [ ] Build project font usage manifest store.
- [ ] Build global font cache manager (user-level).
- [ ] Add download/store flow for Google fonts into global cache.
- [ ] Add global cache ingestion for system/custom font entries.

2. Shared UI

- [ ] Build reusable `FontPickerModal`.
- [ ] Build virtualization list rendering.
- [ ] Build filter controls and optional search UX.

3. Theme/Builder integration

- [ ] Wire Theme tab typography fields to open picker modal.
- [ ] Wire Builder Style tab font-family field(s) to open picker modal.
- [ ] Keep manual value input fallback.

4. Brand Kit view

- [ ] Add new top-level Brand Kit page in left rail.
- [ ] Add specimen canvas with heading/body/accent previews.
- [ ] Add palette + typography role editors.
- [ ] Add `Apply to Theme` and `Save Theme` actions.

5. Export integration

- [ ] Generate font usage manifest from theme/style/class usage.
- [ ] Ensure export includes only used families/weights.
- [ ] Validate preview-to-export font parity.
- [ ] Enforce rule: global cache entries are exportable only when referenced by project usage manifest.

6. QA

- [ ] Verify smooth scroll/perf with full catalog.
- [ ] Verify fallback behavior on font load failures.
- [ ] Verify picker consistency across all integration points.

---

## Risks

- Loading too many preview fonts can degrade UI performance if virtualization/lazy logic is incomplete.
- Metadata shape changes from upstream provider can break filters.
- Inconsistent font-family serialization can cause preview/export mismatches.

---

## Notes

- This doc is a TEMP planning artifact and should be promoted/merged into the main execution plan after review.

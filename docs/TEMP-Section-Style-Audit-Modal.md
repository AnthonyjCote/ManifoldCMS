# TEMP Feature PDR: Section Style Audit Modal

## Purpose

Add a section-level style audit tool that makes it easy to find where style edits were made across nested primitives, viewports, and states, then jump directly to the exact preview target and Style tab field.

---

## Problem

In complex sections, users can easily:

- edit the wrong element (for example margin vs padding on nested targets),
- edit the wrong viewport scope (mobile/tablet/desktop/wide),
- lose track of where a specific style override was applied.

Current workflow forces manual scanning across nested selections and accordion groups, which is slow and error-prone.

---

## V1 Solution

Introduce a near full-screen **Section Style Audit Modal** opened from each section shell (new icon placed to the left of the section drag handle).

The modal is a read-only audit view of explicit style overrides for that section and all nested primitives.

### Core behavior

- Shows all explicit style edits grouped by target.
- Displays edits per viewport in separate columns.
- Supports filtering (including CSS category filters mapped to style accordion categories).
- Clicking an audit row jumps to the exact target + field:
  - scroll preview to element,
  - open right drawer if closed,
  - pin right drawer if unpinned,
  - switch right drawer to Style tab,
  - expand corresponding style accordion category,
  - scroll style panel to the field,
  - pulse highlight both preview target and style field.

---

## Scope

## Included (V1)

- Section-level launch icon and modal.
- Near full-screen modal layout with 5 viewport columns:
  - Default
  - Mobile
  - Tablet
  - Desktop / Laptop / HD
  - Retina / Wide / UHD
- Read-only display of **explicit edits only**.
- Primitive sub-sections under the section.
- Filter popover with multi-select:
  - CSS categories: Layout, Spacing, Border, Background, Typography, Effects, Transform
  - target type options: Section / Primitive
  - state option: include/exclude Hover edits
- `Clear filters` action.
- Sticky modal header and sticky viewport column headers.
- Column edit counts.
- Deterministic row sorting:
  - Section first
  - Then primitives by preview order/path.
- Jump workflow + dual pulse highlight.
- Graceful fallback row state when a mapped field is unavailable in current Style tab.
- Performance behavior:
  - build modal dataset once on modal open,
  - invalidate and rebuild when relevant style data changes,
  - avoid rebuilding on every render.

## Excluded (V1)

- Editing styles directly inside the audit modal.
- Tracking whether edits came from single-select vs multi-select actions.
- Saved default filter presets.
- In-modal text search.
- keyboard shortcut for in-modal search focus.
- Drawer version of this UI (must be modal).

---

## UX / IA

## Launch

- New `Style Audit` icon button appears on selected section chrome, positioned left of section drag handle.
- Clicking opens modal for that section only.

## Modal layout

- Header:
  - section title/id,
  - summary counts,
  - filter popover trigger,
  - `Clear filters`,
  - close button.
- Body:
  - horizontally arranged 5 viewport columns,
  - each column shows grouped edits for section + primitives.
- Row:
  - target label (section or primitive label/path),
  - field label,
  - state badge (for example Hover),
  - value preview.
- Footer (optional compact status):
  - selection/jump hints.

## Jump interaction

Clicking any audit row executes:

1. set active viewport (with explicit UI indication),
2. select target in preview,
3. ensure right drawer open + pinned,
4. set right drawer tab to Style,
5. set correct target in Style tab (section vs primitive),
6. expand matching accordion category,
7. scroll field into view,
8. pulse preview target border and style field row for 1-2 seconds.

---

## Data Model / Mapping

Data source: section block `styleOverrides` plus nested `primitiveStyles`, `primitiveViewportStyles`, `primitiveStateViewportStyles`, `stateViewportStyles`.

Only include rows where value is explicitly defined in that viewport/state bucket.

Each audit row should carry:

- section block id,
- optional primitive path,
- viewport key,
- state key (`default` or `hover`),
- style key,
- style category,
- value.

This row id is also used for jump targeting and pulse tracking.

---

## Technical Notes

- Reuse existing master style registry category mapping for category filters.
- Add stable DOM hooks for style-field jump targeting (for example `data-style-field-id` + target context attributes).
- Implement a reusable shared jump layer (`StyleJumpService`) instead of modal-specific jump logic.
  - `jumpToField(target, viewport, state, fieldKey)`
  - `findValueOrigin(target, viewport, state, fieldKey)`
- Route modal row jumps through shared jump service.
- Route inherited-value indicator jumps through shared jump service.
- Maintain pulse states with timeout cleanup:
  - preview pulse target id,
  - style field pulse id.
- On viewport switch caused by jump, show explicit indicator so scope change is visible.

### Shared Jump Service Requirement

- Jump mapping must be reusable by other UI surfaces (not only this modal).
- The service should expose:
  - deterministic field-id resolution,
  - origin-resolution for inherited values,
  - jump orchestration (drawer open/pin/tab/expand/scroll/pulse),
  - structured failure result for fallback UX.
- Initial consumers:
  - Section Style Audit Modal row click,
  - inherited-value indicator click in Style tab.

---

## Acceptance Criteria

- Modal opens from section icon and fills most of viewport.
- Modal shows explicit style edits only, organized by viewport columns.
- Multi-select filter popover works for category/state/target filters.
- `Clear filters` resets all active filters.
- Empty filter results hide non-matching rows without errors.
- Clicking any row successfully scrolls both:
  - preview canvas to target,
  - style drawer to correct field.
- Clicking inherited-value indicators can jump to the origin field where inherited value is explicitly set.
- Right drawer auto-opens and pins if needed.
- Style tab is activated automatically.
- Matching accordion opens automatically.
- Preview + style field pulse highlights are visible and transient.
- Dataset is not rebuilt every render; it refreshes on modal open and style changes.

---

## Risks

- Jump-to-field mapping can drift if style field DOM structure changes.
- Large sections with many primitives/viewports can create heavy modal payloads if not memoized.
- Auto-navigation side effects (open/pin/tab switch/viewport switch) must be predictable to avoid user confusion.

### Mapping Stability Note

- Adding new CSS fields later is safe **if jump targeting uses stable IDs**, not DOM order.
- Implement jump anchors with deterministic IDs based on semantic keys, for example:
  - `target + viewport + state + fieldKey`
- Avoid mapping by:
  - row index / position,
  - display label text only,
  - fragile layout selectors.
- Renaming/removing canonical `fieldKey` values requires an explicit mapping update/migration step.

---

## Implementation Sequence

1. Add section icon + modal shell.
2. Build audit dataset model + memoized/invalidation strategy.
3. Render viewport columns + grouped rows + counts.
4. Add filter popover multi-select + clear filters.
5. Add jump pipeline (preview select/scroll + drawer open/pin + Style tab target + field scroll).
6. Add pulse highlights.
7. Add fallback behavior for unmapped fields.
8. QA for large nested sections and multi-viewport edit scenarios.

---

## Granular Implementation Checklist

### Phase 0: Contracts + Ordering (Blockers)

- [x] Define canonical `styleFieldId` contract (target + viewport + state + fieldKey).
- [x] Add helper utility to build/parse `styleFieldId` from shared inputs.
- [x] Define shared `StyleJumpService` contract (inputs, outputs, failure states).
- [x] Define and document jump execution order as a single orchestrated flow:
  1. set viewport,
  2. select preview target,
  3. open drawer,
  4. pin drawer,
  5. switch to Style tab,
  6. set Style target (section/primitive),
  7. expand accordion category,
  8. scroll style field into view,
  9. trigger dual pulse.
- [x] Add guard/debounce so repeated row clicks do not stack conflicting jumps.

### Phase 0.5: Inheritance Origin Resolution

- [x] Add resolver utility to find explicit origin for inherited values:
  - same target,
  - fallback chain by viewport/state precedence.
- [x] Return origin payload compatible with `StyleJumpService`.
- [x] Add deterministic “no origin found” result.

### Phase 1: Style Tab Targetability

- [x] Add `data-style-field-id` anchors to every style field row.
- [x] Ensure anchors exist for both section rows and primitive rows.
- [x] Ensure anchors are deterministic across rerenders.
- [x] Add fallback selector lookup by semantic keys when exact ID missing.
- [x] Add non-blocking “jump failed” handling path for unmapped fields.

### Phase 2: Modal Shell + Launch

- [x] Add section-level audit icon button left of section drag handle.
- [x] Add modal open/close state tied to selected section context.
- [x] Implement near full-screen modal layout and backdrop.
- [x] Add sticky modal header with title, counts, filter controls, close button.
- [x] Implement `Esc` close behavior.

### Phase 3: Audit Dataset Builder

- [x] Build read-only dataset extractor for explicit edits only.
- [x] Include section and primitive targets in one normalized row model.
- [x] Include viewport/state/category metadata per row.
- [x] Include stable preview order index for deterministic sorting.
- [x] Memoize dataset build on modal open.
- [x] Invalidate dataset only on relevant style data changes.

### Phase 4: Modal Rendering

- [x] Render 5 sticky viewport columns (Default/Mobile/Tablet/Desktop/Wide).
- [x] Show per-column edit count badges.
- [x] Render section edits first, then primitive edits by preview order.
- [x] Render state badges (including Hover).
- [x] Render graceful “no edits” empty state per column.

### Phase 5: Filtering

- [x] Add filter popover with multi-select categories:
  - Layout, Spacing, Border, Background, Typography, Effects, Transform.
- [x] Add target-type filters (Section / Primitive).
- [x] Add hover-state include/exclude filter.
- [x] Add `Clear filters` action.
- [x] Ensure filters update visible rows instantly.

### Phase 6: Jump-to-Field Pipeline

- [x] Implement click handler per audit row to trigger `StyleJumpService`.
- [x] Auto-open right drawer if closed.
- [x] Auto-pin right drawer if unpinned.
- [x] Force right drawer tab to Style.
- [x] Set selected preview target (section or primitive) before style scroll.
- [x] Ensure correct viewport is activated, with visible indicator state retained.
- [x] Expand matching style accordion category if collapsed.
- [x] Scroll style drawer to field anchor.
- [x] Scroll preview canvas to target element.

### Phase 6.5: Reuse via Inherited Indicator

- [x] Wire inherited-value indicator click in Style tab to `findValueOrigin(...)`.
- [x] If origin exists, jump via `StyleJumpService.jumpToField(...)`.
- [x] If origin missing, show non-blocking fallback state.

### Phase 7: Dual Pulse Feedback

- [x] Add transient preview pulse state keyed by target ID.
- [x] Add transient style-field pulse state keyed by `styleFieldId`.
- [x] Add CSS pulse animation tokens for both contexts.
- [x] Auto-clear pulse states after timeout.
- [x] Re-trigger pulse on repeated click of same row.

### Phase 8: Edge Cases

- [ ] Handle missing/deleted primitive paths gracefully in modal rows.
- [x] Handle fields filtered/excluded from current style schema.
- [ ] Handle state/viewport rows that exist with no current UI control.
- [ ] Keep jump robust when section selection changes during modal open.

### Phase 9: QA + Validation

- [x] Verify jump works for section fields across all 5 viewports.
- [x] Verify jump works for primitive fields across nested primitives.
- [x] Verify hover-state row jumps correctly.
- [x] Verify drawer open/pin/style-tab behavior from all starting states.
- [x] Verify filters hide/show rows and empty groups correctly.
- [ ] Verify large sections do not cause lag or repeated dataset rebuilds.
- [x] Verify no regression in current Style tab editing flows.

### Phase 10: Release Notes / Checklist Updates

- [x] Add completion notes in this temp PDR.
- [x] Add linked subtask reference in `TEMP-Priority-Execution-Plan.md`.
- [x] Mark follow-up items (editable audit modal, saved filter presets, modal search) as post-v1 backlog.

## Completion Notes (Done For Now)

- Implemented V1 Section Style Audit modal with:
  - section-level launch control,
  - 5 viewport columns,
  - grouped/collapsible target sections,
  - category/target/hover filters,
  - clear filters,
  - shared jump orchestration,
  - dual pulse indicators in preview + style drawer.
- Implemented inherited-origin jump support through shared mapping/jump infrastructure.
- Added fallback handling when mapped fields are unavailable in current style schema.
- Updated pulse UX for stronger visibility and longer duration during jump validation.
- Post-V1 backlog items retained:
  - editable audit modal interactions,
  - saved filter presets,
  - modal search/keyboard search focus,
  - additional large-section performance soak testing.

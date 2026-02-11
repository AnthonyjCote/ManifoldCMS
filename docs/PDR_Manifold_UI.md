# PDR: Manifold UI (V1)

Detailed UI Product Requirements for Manifold desktop app.
This document defines the complete V1 UI architecture and interaction model.
It is a sub-spec for task `14.6 Build app shell layout` in `docs/PDR_ManifoldCMS.md`.

## 1. Purpose

Define a clean, scalable UI system for Manifold that:

- prioritizes the visual website builder workflow,
- mirrors the proven 2LIP shell pattern (skinny global rail + right and bottom drawers),
- supports additional app functions without clutter,
- remains deterministic and AI-friendly.

## 2. Scope

In scope:

- App shell and layout framework.
- Global navigation model.
- Per-view layout behavior.
- Home/project launcher UX.
- Right and bottom drawer interaction model.
- Builder view composition.
- Export Wizard, Publish, and Settings view shells.
- State persistence for layout preferences.
- Keyboard/accessibility behavior.

Out of scope (V1):

- Final visual polish/theme system beyond baseline tokens.
- Animation-heavy transitions.
- Multi-window orchestration.
- Collaborative cursor/presence UI.

## 3. UI Principles

1. Focused workspace first.

- Builder should maximize preview/editing clarity.

2. Stable shell, flexible views.

- One shell pattern app-wide.
- View-specific content and optional panes.

3. Drawers for context, not navigation.

- Right and bottom drawers provide tools/diagnostics for current task.
- Left global rail remains the only top-level navigation.

4. Progressive complexity.

- Show essentials by default.
- Advanced controls in tabs/drawers.

5. Keyboard and pointer parity.

- Core actions available with both mouse and keyboard.

## 4. App Information Architecture

## 4.1 Global Views (left rail)

V1 views:

1. Home
2. Builder
3. Content
4. Theme
5. Assets
6. Blocks Library
7. Export Wizard
8. Publish
9. Settings

## 4.2 View Intent

- Home: project launcher and workspace overview.
- Builder: page composition, live preview, block editing.
- Content: global content records and collections.
- Theme: token/style system editor.
- Assets: asset library management.
- Blocks Library: internal + workspace block catalog management.
- Export Wizard: gated export flow and output reports.
- Publish: staging publish flow and status.
- Settings: workspace/toolchain/preferences/security settings.

## 5. Shell Layout Architecture

## 5.1 Regions

The root shell is composed of:

- `GlobalRail` (fixed left icon rail; always visible).
- `HeaderBar` (optional per view; default visible).
- `MainRegion` (primary content area).
- `RightDrawer` (collapsible/pinnable contextual tools).
- `BottomDrawer` (collapsible/pinnable diagnostics and logs).

Optional per-view:

- `LeftPane` (secondary tree/navigation inside MainRegion).

## 5.2 Region Ownership

- GlobalRail is app-level only.
- LeftPane is view-level only.
- RightDrawer/BottomDrawer are shell-level containers with view-provided tab payloads.

## 5.3 Layout Capability Model

Each view declares a capability config:

- `hasLeftPane: boolean`
- `hasRightDrawer: boolean`
- `hasBottomDrawer: boolean`
- `leftPaneDefaultWidth: number`
- `rightDrawerTabs: TabDef[]`
- `bottomDrawerTabs: TabDef[]`
- `rightDrawerDefault: { pinned: boolean, open: boolean }`
- `bottomDrawerDefault: { pinned: boolean, open: boolean }`
- `defaultPrimaryDrawer: 'right' | 'bottom'`

This avoids hard-coded per-view layout logic.

Rendering rules:

- If `hasRightDrawer` is false, the right drawer is not rendered.
- If `hasBottomDrawer` is false, the bottom drawer is not rendered.
- Disabled drawers must not reserve layout space.

## 6. Global Rail Specification

## 6.1 Visual

- Fixed width: 56px.
- Icon-only buttons with tooltip labels.
- Active view indicator (highlight + left accent).
- Top group: core authoring views.
- Bottom group: Settings.

## 6.2 Behavior

- Single active view at a time.
- Selecting a view swaps MainRegion content.
- Drawers retain state by view (not globally shared).

## 6.3 Accessibility

- `nav` landmark with label `Primary`.
- Buttons use `aria-label` with view name.
- Active button uses `aria-current="page"`.

## 7. Home View (Project Launcher)

## 7.1 Purpose

Home is the first screen and project switcher.

## 7.2 Data Source

- Workspace root path from Settings.
- Discover `.manifold` project packages and/or expanded project folders.
- Show recent/opened metadata.

## 7.3 States

- No workspace configured.
- Workspace configured, no projects found (empty CTA state).
- Projects found (grid/list).
- Scan error state with retry.

## 7.4 Actions

Primary actions:

- New Project
- Open Existing `.manifold`
- Rescan Workspace

Per-project actions:

- Open
- Duplicate
- Rename
- Reveal in File Manager
- Delete (confirmation required)

## 7.5 Layout

- No LeftPane.
- RightDrawer disabled.
- BottomDrawer disabled by default (optional for future diagnostics use).

## 8. Builder View

## 8.1 Primary Goal

Maximum editing and preview clarity.

## 8.2 Layout

- No LeftPane by default.
- Center: builder canvas + live preview context.
- RightDrawer enabled: primary control surface.
- BottomDrawer enabled: diagnostics/log surface.

## 8.3 Builder Top Bar

Required controls:

- Page selector (route list)
- Device preview selector (mobile/tablet/desktop)
- Save status indicator
- Validate/Lint quick actions

## 8.4 Right Drawer Tabs (Builder)

1. Blocks

- Visual block catalog (thumbnail cards, 2-column grid).
- Grouped by collapsible categories (e.g. Hero, Features, CTA, Gallery, Footer, Custom).
- Search/filter across all categories.
- Drag-and-drop source for adding blocks to the page canvas.
- No primary "add from dropdown" workflow in V1 Builder.
- Include `Custom Section` block type for flexible primitive-based layout composition.

2. Inspector

- Opens when a block is selected in live preview.
- Selected block props editor (schema-driven).
- Content editing fields (manifest-defined only).
- Style variable/token overrides (token-constrained; no raw CSS editor in V1).
- Visibility toggle and block-level actions.
- For `Custom Section`, Inspector must include:
  - section container controls
  - column count/ratio controls
  - per-column primitive stack controls

3. AI Agent

- Codex transcript panel.
- Action buttons: validate/export/publish.
- Diff review entrypoint.

4. Page SEO

- Title/description/OG defaults/overrides.

## 8.5 Bottom Drawer Tabs (Builder)

1. Validation

- Validation issue list grouped by page/block.

2. Lint

- Lint findings grouped by severity.

3. Export Log

- Latest export run logs and artifact summary.

4. Publish Log

- Git push/build/deploy logs.

## 8.6 Primary Drawer Behavior

When both right and bottom drawers are open:

- one drawer is marked `primary` (size priority),
- user can switch primary between `right` and `bottom`.

## 8.7 Builder Interaction Model (V1)

- Insert blocks by dragging from the right drawer Blocks catalog into the live preview.
- Reorder blocks directly in live preview with drag-and-drop.
- Select blocks by clicking in live preview.
- Edit selected block content/style in Inspector.
- Provide visible drop targets/insertion indicators during drag.
- Provide keyboard fallback for reorder (move up/down actions) for accessibility.
- `Custom Section` supports primitive-level insert/reorder inside each column.
- Primitive editing remains schema-driven and token-constrained.

## 9. Page-Specific LeftPane Policy

LeftPane is intentionally disabled on Builder to reduce clutter.

LeftPane enabled by default for:

- Content (content tree/collections)
- Assets (folder tree)
- Blocks Library (category tree optional)

LeftPane disabled by default for:

- Home
- Builder
- Export Wizard
- Publish
- Settings

## 10. Export Wizard View

## 10.1 Purpose

Guide user through deterministic export and verification.

## 10.2 Flow Steps

1. Target

- Output path and export naming.

2. Readiness

- Validation/lint summary with blockers.

3. Export

- Generate Astro codebase.

4. Verify

- Run local build check and checksum summary.

5. Finish

- Open output folder and handoff notes.

## 10.3 Layout

- No LeftPane.
- MainRegion is stepper UI.
- RightDrawer disabled.
- BottomDrawer enabled.
- BottomDrawer default tab: Export Log.

## 11. Publish View

## 11.1 Purpose

Publish exported repo to staging.

## 11.2 Layout

- No LeftPane.
- MainRegion: publish form + status cards.
- RightDrawer disabled.
- BottomDrawer enabled for publish logs and failure diagnostics.

## 11.3 Minimum Inputs

- repo URL
- branch (default `staging`)
- export folder
- commit message preview/edit

## 12. Settings View

## 12.1 Sections

- Workspace root paths
- Toolchain checks (Node/Rust/Tauri)
- Credentials status (no secret values shown)
- App preferences (default view, drawer defaults)

## 12.2 Layout

- No LeftPane.
- RightDrawer disabled.
- BottomDrawer disabled.

## 13. Drawer Interaction Model

## 13.1 Right Drawer

- Can open by hover edge trigger or pin.
- `pinned=true` keeps drawer open.
- `pinned=false` uses hover open/close with small delay.

## 13.2 Bottom Drawer

- Same behavior model as right drawer.
- Bottom trigger remains accessible even when collapsed.

## 13.3 Shared Rules

- Escape closes unpinned open drawer(s).
- Pinned drawer ignores hover-close.
- State transitions should not shift main content abruptly; use smooth width/height transitions.

## 13.4 Persisted State

Persist per-view in local storage:

- right pinned/open
- bottom pinned/open
- active right tab
- active bottom tab
- primary drawer
- left pane width (if enabled)

Persistence guard:

- Do not persist drawer state for drawers disabled in that view.

## 14. Sizing and Responsiveness

Desktop targets first (V1):

- Min app width: 1100px.
- Recommended default width: 1440px.

Defaults:

- Right drawer width: 320px (min 280, max 420).
- Bottom drawer height: 220px (min 160, max 360).
- LeftPane width (when enabled): 280px (min 220, max 420).

Responsive behavior:

- At narrow widths (<1200), auto-collapse unpinned drawers.
- If both drawers open and space constrained, keep only primary drawer expanded.

## 15. Keyboard Shortcuts (V1)

Required:

- Toggle right drawer
- Toggle bottom drawer
- Focus global search/command palette (if present)
- Switch global views (next/previous)
- Cycle drawer tabs (right and bottom)

## 16. Accessibility Requirements

- Landmark regions: nav/main/complementary.
- All icon buttons have accessible labels.
- Visible focus ring on keyboard navigation.
- Contrast meets WCAG AA for text/UI controls.
- Drawers trap focus only when modal behavior is used (not default).

## 17. Telemetry (Local, Optional V1)

Track non-sensitive UX metrics:

- view switch frequency
- drawer open/pin usage
- export/publish error rates

No content payloads or secrets stored in telemetry events.

## 18. V1 UI Acceptance Criteria

1. Global rail switches between all V1 views without layout breakage.
2. Home view correctly handles no-workspace, empty, and populated project states.
3. Builder view runs with no LeftPane and supports right/bottom drawer tabs.
4. Right and bottom drawers support hover, pin, and primary-drawer switching.
5. Per-view drawer states persist across app restart.
6. Export Wizard and Publish views are distinct pages and keep builder UI uncluttered.
7. Content/Assets views can enable LeftPane without affecting Builder layout.
8. Keyboard and accessibility requirements pass manual QA.

## 19. Implementation Notes (for 14.6 Subtasks)

Suggested component map:

- `ShellFrame`
- `GlobalRail`
- `ViewRouter`
- `RightDrawer`
- `BottomDrawer`
- `OptionalLeftPane`
- `DrawerTabHost`
- `HomeProjectLauncherView`
- `BuilderView`
- `ExportWizardView`
- `PublishView`
- `SettingsView`

Suggested state stores:

- `useViewModeStore`
- `useLayoutStateStore` (per-view drawer and pane state)
- `useProjectLauncherStore`

## 20. Code Organization and Anti-Monolith Rules

## 20.1 Required UI Folder Hierarchy

`src-ui/` should be organized as:

- `app/` (app bootstrap and top-level providers)
- `shell/` (shell frame, global rail, drawer host, layout primitives)
- `views/` (one folder per view)
- `features/` (domain logic shared across views, e.g. builder/content/export)
- `components/` (reusable presentational primitives only)
- `state/` (focused stores/selectors)
- `hooks/` (focused UI hooks)
- `types/` (UI and domain TS types)
- `lib/` (pure utilities and adapters)

## 20.2 View Folder Contract

Each view folder should follow:

- `views/<view-name>/<ViewName>View.tsx`
- `views/<view-name>/components/*` (view-local components)
- `views/<view-name>/hooks/*` (view-local hooks)
- `views/<view-name>/types.ts` (view-local types when needed)

No view should import implementation files from another view folder.

## 20.3 File Size and Responsibility Limits

Rules:

- Avoid monolith files; target <= 300 lines per component/module.
- Split JSX-heavy files when multiple concerns are present.
- Keep business logic in hooks/services, not inside large JSX blocks.
- Keep shell behavior in `shell/`; keep view behavior in `views/`.

## 20.4 Naming and Segmentation Rules

- Use descriptive names (`BuilderRightDrawerTabs.tsx`, `PublishLogPanel.tsx`).
- Avoid generic filenames like `utils.ts` and `helpers.ts` in feature/view folders.
- Shared primitives stay in `components/`; view-specific UI stays in `views/<view>/components/`.

## 20.5 Drawer Ownership Rules

- Drawer tabs are declared by each view via `ViewLayoutConfig`.
- Home and Settings disable both drawers in V1.
- Builder owns its full right/bottom tab sets.
- Export and Publish may enable bottom drawer while right drawer remains disabled.

## 21. Granular UI Checklist (Subtasks for 14.6)

### 21.1 Foundation and Structure

- [x] Create `src-ui/app/`, `src-ui/shell/`, `src-ui/views/`, `src-ui/features/`, `src-ui/components/`, `src-ui/state/`, `src-ui/hooks/`, `src-ui/types/`, `src-ui/lib/`.
- [x] Move existing app bootstrap into `src-ui/app/` entry structure.
- [x] Add `ViewMode` type and central view registry.
- [x] Add `ViewLayoutConfig` type with `hasLeftPane`, `hasRightDrawer`, `hasBottomDrawer`, drawer tab defs, and defaults.
- [x] Create one config entry per V1 view (Home, Builder, Content, Theme, Assets, Blocks Library, Export Wizard, Publish, Settings).
- [x] Add guard utilities so disabled drawers never render and never reserve layout space.
- [x] Add lint/docs note enforcing anti-monolith rules for UI files.

### 21.2 Shell Core

- [x] Implement `ShellFrame` as root UI shell container.
- [x] Implement `GlobalRail` (icon-only rail, active indicator, tooltips).
- [x] Implement `ViewRouter` that mounts view components from `ViewMode`.
- [ ] Implement `HeaderBar` slot API for per-view top controls.
- [x] Implement `OptionalLeftPane` slot API with resize support.
- [x] Implement `RightDrawer` shell component (hover trigger + pin).
- [x] Implement `BottomDrawer` shell component (hover trigger + pin).
- [x] Implement `DrawerTabHost` for tab rendering and active tab state.
- [x] Implement primary drawer toggling when both drawers are open.
- [x] Add shell class/state hooks for `side-open`, `bottom-open`, `primary-right`, `primary-bottom`.

### 21.3 Layout State and Persistence

- [x] Create `useLayoutStateStore` keyed by view.
- [x] Persist per-view state: right pinned/open, bottom pinned/open, active tabs, primary drawer, left pane width.
- [x] Add persistence guard: skip drawer state persistence if drawer disabled in current view.
- [x] Add first-run defaults from `ViewLayoutConfig`.
- [x] Add migration-safe localStorage key names (`manifold.ui.layout.*`).
- [x] Add restore-on-boot flow for view and layout state.

### 21.4 Global Navigation

- [x] Add all V1 global views to the rail in required order.
- [x] Add bottom-group placement for Settings.
- [x] Add `aria-current` behavior for active view button.
- [x] Add tooltip labels for every icon button.
- [ ] Add keyboard navigation for rail items (arrow keys + enter/space activation).

### 21.5 Home View (Project Launcher)

- [x] Create `views/home/HomeView.tsx`.
- [x] Build workspace state cards: no workspace, empty workspace, populated workspace, scan error.
- [x] Add actions: New Project, Open Existing `.manifold`, Rescan Workspace.
- [x] Add project discovery service for workspace root.
- [x] Add project card/list component with actions: Open, Duplicate, Rename, Reveal, Delete.
- [ ] Add confirmation UI for destructive actions (Delete).
- [x] Disable RightDrawer and BottomDrawer for Home in layout config.

### 21.6 Builder View Shell

- [x] Create `views/builder/BuilderView.tsx`.
- [x] Implement builder header controls: page selector, device selector, save status, validate/lint actions.
- [x] Implement center canvas container with preview slot.
- [x] Wire Builder config: no LeftPane, RightDrawer enabled, BottomDrawer enabled.
- [x] Implement right drawer tabs: Blocks, Inspector, AI Agent, Page SEO.
- [x] Implement bottom drawer tabs: Validation, Lint, Export Log, Publish Log.
- [x] Add tab stubs with clear empty/loading states (no raw placeholders without labels).

### 21.6A Builder Visual Block UX (Drag-and-Drop)

- [ ] Replace Builder "add block" dropdown/button flow with visual block cards.
- [ ] Render block catalog as 2-column thumbnail card grid in Blocks tab.
- [ ] Group block cards into collapsible category sections.
- [ ] Add catalog search/filter that works across categories.
- [ ] Implement drag source from block catalog cards.
- [ ] Implement drop targets in live preview for insert at specific positions.
- [ ] Implement drag-and-drop reorder directly in live preview.
- [ ] Add clear insertion indicator and drag hover states in preview.
- [ ] On block click in preview, set active selection and focus Inspector tab.
- [ ] Keep block editing constrained to manifest-defined content/style fields.
- [ ] Add keyboard fallback controls for block reorder (move up/down).
- [ ] Add tests for catalog render, drag-insert, drag-reorder, and click-to-edit selection flow.

### 21.6B Custom Section + Primitives

- [ ] Add `Custom Section` to block catalog with dedicated preview card.
- [ ] Implement `Custom Section` layout controls: column count (1-4), ratio presets.
- [ ] Implement per-column primitive stack UI (insert/remove/reorder).
- [ ] Add primitive palette for supported V1 primitives (`heading`, `text`, `image`, `video`, `embed`, `code`, `button`, `spacer`).
- [ ] Implement schema-driven primitive inspector controls.
- [ ] Enforce guardrails: token-only style controls, no raw HTML/CSS, no nested `Custom Section`.
- [ ] Add builder tests covering `Custom Section` create/edit/reorder flows.

### 21.7 Page-Specific LeftPane

- [x] Create reusable left pane frame with resize handle and min/max constraints.
- [x] Enable LeftPane for Content view with tree placeholder.
- [x] Enable LeftPane for Assets view with folder tree placeholder.
- [x] Optionally enable LeftPane for Blocks Library with category/filter tree.
- [x] Keep LeftPane disabled for Builder, Home, Export Wizard, Publish, Settings.

### 21.8 Export Wizard View

- [x] Create `views/export/ExportWizardView.tsx`.
- [x] Implement stepper scaffold: Target, Readiness, Export, Verify, Finish.
- [x] Add per-step header/body/footer structure.
- [x] Wire config: RightDrawer disabled, BottomDrawer enabled.
- [x] Set default BottomDrawer tab to Export Log.

### 21.9 Publish View

- [x] Create `views/publish/PublishView.tsx`.
- [x] Implement publish form scaffold: repo URL, branch, export folder, commit message.
- [x] Add status card region for push/build/deploy feedback.
- [x] Wire config: RightDrawer disabled, BottomDrawer enabled.
- [x] Add BottomDrawer tab host for Publish Log and diagnostics.

### 21.10 Settings View

- [x] Create `views/settings/SettingsView.tsx`.
- [x] Implement sections: workspace paths, toolchain checks, credentials status, UI preferences.
- [x] Disable RightDrawer and BottomDrawer in view config.
- [x] Add settings form grouping and validation message regions.

### 21.11 Drawer Interactions

- [x] Add hover-open behavior for unpinned right drawer.
- [x] Add hover-open behavior for unpinned bottom drawer.
- [x] Add delayed hover-close behavior (debounced) for both drawers.
- [x] Add pin toggle controls and pinned visual state.
- [x] Add `Escape` behavior to close unpinned open drawer(s).
- [x] Add primary drawer toggle controls when both drawers are open.
- [ ] Ensure no layout jitter when toggling drawers.

### 21.12 Keyboard Shortcuts

- [x] Add shortcut: toggle right drawer.
- [x] Add shortcut: toggle bottom drawer.
- [x] Add shortcut: next/previous global view.
- [x] Add shortcut: cycle right drawer tabs.
- [x] Add shortcut: cycle bottom drawer tabs.
- [ ] Add shortcut docs in Settings/help surface.

### 21.13 Accessibility

- [x] Add landmarks (`nav`, `main`, complementary regions).
- [x] Ensure all icon-only controls have `aria-label`.
- [ ] Ensure visible focus styles for keyboard users.
- [ ] Validate tab order through rail, header, main, drawers.
- [ ] Verify drawer controls are reachable/usable without pointer hover.
- [ ] Run accessibility review for contrast and focus traps.

### 21.14 Visual and Responsive Behavior

- [x] Enforce shell min width behavior.
- [x] Implement drawer default sizes and resize limits.
- [ ] Implement auto-collapse of unpinned drawers under narrow width.
- [ ] If both drawers open in narrow mode, enforce primary drawer priority.
- [ ] Validate 1100px, 1280px, and 1440px layouts.

### 21.15 Integration Wiring

- [x] Wire `ViewLayoutConfig` into `ShellFrame` rendering decisions.
- [x] Wire per-view tabs into `DrawerTabHost`.
- [x] Connect Builder tab stubs to existing feature modules where available.
- [x] Connect Home actions to project open/create services.
- [ ] Connect Export Wizard and Publish bottom tabs to existing log streams.

### 21.16 Testing and QA

- [ ] Add unit tests for layout config guards (drawer enable/disable behavior).
- [ ] Add unit tests for layout state persistence and restore.
- [ ] Add integration tests for view switching with correct drawer visibility.
- [ ] Add integration test for Home empty state and project list state.
- [ ] Add integration test for Builder right/bottom tab rendering.
- [ ] Add interaction test for pin/hover/escape drawer behavior.
- [ ] Add keyboard navigation tests for GlobalRail and drawer tab cycling.
- [ ] Run manual QA checklist across macOS and one secondary OS target.

### 21.17 Definition of Done (UI 14.6)

- [ ] All items in sections 21.1 through 21.16 completed or explicitly deferred with notes.
- [ ] UI acceptance criteria (section 18) pass without known critical defects.
- [ ] No UI shell/view files violate anti-monolith rule without approved exception.
- [ ] Main PDR `14.6 Build app shell layout` can be marked complete.

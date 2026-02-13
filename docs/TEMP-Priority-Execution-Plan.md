# TEMP Priority Execution Plan (Manifold)

## Purpose

Turn the current scattered priority notes into an executable backlog with sequencing, dependencies, and completion criteria.

## Milestone Order

1. Foundation UX + Editor Architecture
2. Content/Media System
3. Theme/Class/Style System
4. Motion + Advanced Visual Controls
5. SEO + Publishing Utilities
6. AI Agent + Help/Docs Experience

## P0: Immediate (Unblocks Core Builder)

### P0.1 Drag/Drop UX Clarity

- [x] Add full-canvas drop state for section insertion with strong visual target indicators.
- [x] Add insertion marker between existing sections (line + shaded zone).
- [x] Add premium drag-ghost while dragging from block library (show block card/thumbnail + plus badge).
- [x] Replace basic cursor-only drag feedback with explicit grabbed-state UI.
- [x] Keep success feedback visual-only in canvas (no toast requirement).
- [x] Improve empty-page CTA visual styling to better match premium UI quality.

Definition of done:

- Users can clearly predict where a block will land before release.
- Users can clearly see what block is currently grabbed while dragging.
- Drop feedback is visible in all viewport modes (desktop/tablet/mobile preview).
- Empty-state CTA looks visually polished and on-brand.

### P0.2 Master Style System Refactor

- [x] Build one master style field registry (single source of truth).
- [x] Default every primitive to all available CSS fields from the master registry.
- [x] Add per-primitive exclusion lists (not include lists) for non-relevant fields.
- [x] Add collapsible categories in Style tab (Layout, Spacing, Border, Background, Typography, Effects, Transform).
- [x] Add sticky search/filter field at top of Style tab to quickly locate style controls.
- [x] Ensure all edits are undo/redo compatible.
- [x] Ensure all style controls render with current dark UI style.
- [x] Add Section Style Audit/Inspect Modal (read-only) as a P0.2 extension for style debugging/navigation.
- [x] Add `override` source classifier (red) for viewport/state explicit values that override explicit default values.
- [x] Add `Override` option to style field filters (Style tab now, inspect modal later).
- [ ] Define source taxonomy contract for classifier system: `override`, `edited`, `inherited`, `theme`, `block`, `uninitialized`.
- [x] Add reusable `StyleJumpService` for jump-to-field navigation (shared infra, not modal-specific).
- [x] Add inherited-origin resolution + jump support (`findValueOrigin`) for future UI reuse.
- [x] Add stable `styleFieldId` field anchors for robust jump mapping (avoid DOM-order mapping).
- [x] Ensure audit modal opens preview target + style field reliably (scroll + pulse in both contexts).
- [ ] Enforce anti-monolith implementation boundaries for P0.2 extension:
  - dataset builder,
  - jump/orchestration service,
  - modal UI,
  - pulse/highlight controller.

Definition of done:

- New primitive onboarding defaults to full style control coverage with only optional exclusions.
- All style controls are consistent and discoverable.
- Style tab remains navigable under high field counts (search + collapsible groups).
- Section Style Audit/Inspect modal is read-only and dedicated to discovery + navigation only.
- Shared jump/origin infrastructure is reusable by audit modal and other UI surfaces.
- `Override` classification is available and filterable before audit modal rollout.

### P0.3 Baseline Theme + Block Quality

Reference doc:

- `docs/TEMP-Theme-Variant-Architecture.md` (source of truth for P0.3 schema, variant model, and implementation steps)

- [ ] Define default v1 theme tokens (type scale, colors, radius, borders, shadows, spacing).
- [ ] Make every block consume theme tokens by default.
- [ ] Modernize baseline styling for all blocks to “premium” quality.
- [ ] Ensure mobile responsive behavior for every block type.
- [ ] Add block provenance metadata for classifier system so preset block defaults can be labeled as `block` source.
- [ ] Enforce explicit theme class naming namespace (`theme-*`) for audit clarity vs user-authored classes.
- [ ] Enforce DRY Theme-tab UI implementation by reusing Style/Blocks tab structure, components, and styling patterns.
- [ ] Preserve dual workflow goals in P0.3:
  - fast path (`pick/generate theme -> drag/drop -> content -> ship`)
  - advanced path (micro-granular CSS control retained).
- [ ] Prepare class assignment model so blocks/primitives can later select from theme classes + user classes (future Classes tab integration).
- [ ] Bundle and ship first V1 Theme Library set (6 baseline themes) for switch/edit testing.
- [ ] Validate theme switch safety + clone/edit workflow across bundled default vs user-clone versions.

Definition of done:

- Every block looks production-grade at first drop.
- No block breaks in mobile/tablet/desktop preview.
- Block default source classification can be surfaced without heuristic DOM checks.

### P0.4 Header Navigation Block

- [ ] Create dedicated Navigation/Header block.
- [ ] Add desktop navigation layout.
- [ ] Add mobile hamburger + slide-in menu behavior.
- [ ] Auto-populate nav links from sitemap/page hierarchy by default.
- [ ] Add visual controls to exclude internal pages from nav.
- [ ] Add visual controls to insert external links and reorder links.
- [ ] Add style/content controls for logo, links, CTA, sticky behavior.

Definition of done:

- Header block is reusable and mobile behavior is fully functional.
- Header defaults to live sitemap-driven navigation with user-friendly overrides.

---

## P1: Content + Media Workflow

### P1.1 Project-Scoped Content Library

- [ ] Make content tree project-specific (not global).
- [ ] Store content/media under each project folder.
- [ ] Ensure project switch updates content tree immediately.

Definition of done:

- Each project has isolated content + media with no cross-project leakage.

### P1.2 Image Modal Workflow

- [ ] Replace image URL-only editing with image picker modal.
- [ ] Source images from project content library.
- [ ] Support SVG + raster formats.
- [ ] Add default “Undefined Image” SVG placeholder.
- [ ] Add double-click image behavior: open image edit modal.
- [ ] In modal support image source selection and optional image link editing.

Definition of done:

- Users can manage images visually without manual URL entry.

### P1.3 Media Page

- [ ] Build top-level Media page/view.
- [ ] Add upload, search, filter, and metadata display.
- [ ] Add preview and replace workflows.

Definition of done:

- Media can be centrally managed per project and consumed by blocks.

---

## P2: Theme, Classes, and In-Preview Editing

### P2.1 Theme Tab + Theme Editor

- [ ] Formalize theme JSON schema for storage/import/export.
- [ ] Add builder right-drawer Theme tab for live theme edits during page building.
- [ ] Define core theme controls: typography, heading/body scales, color roles, buttons, borders, corners, shadows.
- [ ] Add bundled theme packs shipped with app as JSON files.
- [ ] Add save/export/import theme workflow.
- [ ] Add manual theme creation and editing page/view.
- [ ] Add theme provenance metadata so fields resolved from theme are classified as `theme` source.
- [ ] Surface `theme` source classifier (purple) in Style tab and inspect modal filters once provenance is stable.

Definition of done:

- Theme controls can restyle a whole site quickly and consistently.
- Theme packs are portable JSON and can be imported/exported reliably.
- Theme-resolved field source classification is deterministic and filterable.

### P2.2 Classes System

- [ ] Add “Classes” tab in builder right drawer.
- [ ] Add class create/edit/delete workflows.
- [ ] Add class selection + assignment from Style tab.
- [ ] Add multi-target display in Style tab (class vs inline override context).

Definition of done:

- Reusable classes reduce repetitive primitive-by-primitive edits.

### P2.3 In-Preview Quick Edit Panel

- [ ] Add contextual floating editor for selected primitives.
- [ ] Include quick controls: text, link, image select, common spacing/surface settings.
- [ ] Keep deep controls in Style tab, quick controls in preview popover.

Definition of done:

- Most frequent edits can be completed without switching tabs.

### P2.4 Link Utility

- [ ] Add visual link utility for type/options (nofollow, noopener, sponsored, etc.).
- [ ] Support internal page refs + external links.

Definition of done:

- Link attributes are editable without raw HTML knowledge.

---

## P3: Advanced Visual + SEO + Auxiliary Pages

### P3.1 Motion/Animation Tab

- [ ] Add builder drawer tab for animation/motion effects.
- [ ] Include safe presets and timing/easing controls.
- [ ] Add per-primitive enable/disable and preview.
- [ ] Add preview refresh/replay control in live preview to simulate first page-load animations.

### P3.2 Background Utilities

- [ ] Add gradient utility (linear/radial presets + custom stops).
- [ ] Add pattern overlay utility (opacity/scale/blend controls).
- [ ] Ship built-in pattern presets.
- [ ] Support adding custom pattern assets.

### P3.3 Border Side Utility

- [ ] Add side-specific border controls (top/right/bottom/left) with visual UX.

### P3.4 SEO/Meta + Structured Data

- [ ] Expand Page Meta with OG/Twitter/Canonical fields.
- [ ] Add page-specific code injection fields in Page Meta: `Head`, `Body`, `Footer`.
- [ ] Add structured data utility with templates (Organization, Article, FAQ, Product, etc.).

### P3.5 Blog Utility View

- [ ] Build top-level Blog utility for creating/editing posts.
- [ ] Include slug/meta/cover/tags/category workflow.

### P3.6 Help/Docs View

- [ ] Build top-level Docs/Help page to render local `.md` docs.
- [ ] Add tutorials/getting-started pages.

### P3.8 Global Site Settings View (Top-Level)

- [ ] Add new left-rail top-level view for global site settings.
- [ ] Add global code injection fields: `Head`, `Body`, `Footer` (for analytics, verification tags, tracking pixels).
- [ ] Add global structured data controls.
- [ ] Add site-wide SEO controls (defaults/canonical/sitemap settings).
- [ ] Add crawler controls (robots directives / indexing preferences).
- [ ] Add security-related site settings relevant to static export/deploy targets.
- [ ] Define merge/precedence rules between global and page-specific injections/settings.

Definition of done:

- Global technical settings are manageable in one dedicated view.
- Page-level settings can override global where appropriate under explicit precedence rules.

### P3.7 Export Media Optimizations

- [ ] Add built-in WEBP conversion utility at export/build.
- [ ] Add crop/resize pipeline for generated exports.
- [ ] Keep original source assets in project media library by default.
- [ ] Add optional library-level conversion workflow to pre-convert assets and reduce build-time compute.

Definition of done (P3 overall):

- Advanced features are discoverable, safe-by-default, and integrated into existing build/export flow.

---

## AI Agent Workstream (Parallel, High Priority)

### Agent GUI + Context System

- [ ] Build CLI agent GUI panel in builder.
- [ ] Add explicit context package (project schema, block/primitive schema, theme/class context, constraints, project content/media context, sitemap/page hierarchy context).
- [ ] Add instruction presets for: scaffold page, restyle site, refactor section, fix responsive issues.
- [ ] Add user approval flow before file mutations.
- [ ] Add audit log of AI changes (what changed, where, why).
- [ ] Add change diff viewer for AI actions.
- [ ] Ensure AI changes are reversible (undo/rollback checkpoints).

Definition of done:

- AI can produce and update complete sites from natural language with traceable actions.
- AI actions are diffed, auditable, and reversible.

---

## Quality & Validation Recommendations (Post-AI Section)

### Q1 Pre-Export Validation + Manual Override

- [ ] Add pre-export validation pass covering links, metadata completeness, schema validity, accessibility signals, and performance warnings.
- [ ] Flag critical issues as `Requires Manual Override` instead of hard-blocking export.
- [ ] Add explicit override UX with strong recommendation messaging and risk summary before export continues.

Definition of done:

- Users get clear issue visibility and can still export with explicit informed override.

### Q2 Accessibility Compliance During Build

- [ ] Add automated accessibility checks directly in builder workflows (continuous lint/validation signals).
- [ ] Surface accessibility findings in builder with severity and actionable guidance.
- [ ] Auto-enforce safe defaults where possible (semantic markup, headings, alt prompts, keyboard/focus requirements).

Definition of done:

- Accessibility issues are surfaced early during building, not only at export.

### Q3 Top-Level Profiling & Testing View

- [ ] Add a new top-level left-rail page dedicated to profiling/testing.
- [ ] Integrate Lighthouse and complementary SEO/performance checks.
- [ ] Build dashboard-style visual reporting for key quality metrics.
- [ ] Provide machine-readable/AI-readable output so agent workflows can iterate automatically from test feedback.

Definition of done:

- Users and AI can run quality tests and use the results to systematically improve sites.

### Q4 SEO Suite Conceptualization Task

- [ ] Create a dedicated task to conceptualize a full SEO suite as its own future PDR.
- [ ] Define scope candidates (content scoring, internal linking intelligence, metadata quality, schema suggestions, crawl/index diagnostics).

Definition of done:

- SEO suite scope is documented and staged as a standalone product stream.

### Q5 Preview-to-Export Parity

- [ ] Ensure live preview rendering is a 100% match to exported site output for supported features.
- [ ] Add parity regression checks between preview and exported output snapshots.

Definition of done:

- What users see in preview is what ships in export.

---

## Dependency Map

- P0.2 (Master Style System) is prerequisite for P2.2 (Classes) and many P3 styling utilities.
- P0.2 Style Audit extension (shared `StyleJumpService` + `styleFieldId` mapping + inherited-origin resolver) is prerequisite for reliable cross-UI style jump workflows.
- P0.2 source taxonomy + `override` classifier is prerequisite for expanding classifier system to `theme` and `block`.
- P1.1 (Project-scoped content library) is prerequisite for P1.2 image modal workflow.
- P2.1 (Theme tab) should land before full baseline style modernization pass.
- P0.3 block provenance is prerequisite for `block` classifier.
- P2.1 theme provenance is prerequisite for `theme` classifier.
- AI Agent GUI should integrate after schema and style architecture stabilize (post P0.2 + P2.1).

## Suggested Execution Sequence (Concrete)

1. P0.1 Drag/drop indicators
2. P0.2 Master style registry + collapsible style UI
3. P0.2 extension: Section Style Audit/Inspect modal + shared jump/origin infrastructure + `override` classifier
4. P0.3 Theme token baseline + responsive pass for all blocks (includes block provenance)
5. P0.4 Header/navigation block with mobile drawer
6. P1.1 Project-scoped content library
7. P1.2 Image modal + undefined SVG placeholder + double-click image edit
8. P1.3 Media page
9. P2.1 Theme tab/editor + theme packs/import/export (includes theme provenance)
10. Classifier expansion: add `block` and `theme` source indicators + filters
11. P2.2 Classes system + style-tab class assignment
12. P2.3 In-preview quick edit panel
13. P2.4 Link utility
14. P3.1 Motion tab
15. P3.2 Gradient + pattern utilities
16. P3.3 Border-side utility
17. P3.4 Structured data + expanded page meta
18. P3.5 Blog utility
19. P3.6 Docs/help + tutorials
20. P3.7 WebP + crop/resize export pipeline
21. P3.8 Global site settings view (code injection + SEO + crawler/security)
22. AI Agent GUI hardening + full-context instruction system
23. Q2 Accessibility compliance during build
24. Q1 Pre-export validation with manual override
25. Q5 Preview-to-export parity checks
26. Q3 Profiling/testing top-level page (Lighthouse + AI-readable outputs)
27. Q4 SEO suite conceptualization (new standalone PDR task)

## Risks To Watch

- Style UI scope can become monolithic without strict registry architecture.
- P0.2 extension work must remain modular (no single multi-purpose script for dataset/jump/modal/pulse).
- Theme + class precedence needs deterministic rules to avoid user confusion.
- Image/media workflows must stay project-scoped to prevent broken references.
- Animation controls can conflict with responsive layout if not constrained.

## Notes

- This is a TEMP planning document and can be promoted into the main PDR once approved.

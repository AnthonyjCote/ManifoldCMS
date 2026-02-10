# PDR: AI-Native Manifest CMS Studio

Runtime Builder + Live Preview + Export to Clean Astro + Portable Projects + Codex Agent Panel

Tauri + React + TypeScript

## 1. Purpose

Build a desktop Studio app for agencies and freelancers to create static websites visually with a manifest-driven block system, preview changes live, and export a clean Astro codebase for deployment and handoff. The Studio is optimized for deterministic AI-assisted editing.

## 2. V1 Goals

- Fast site production from validated structured data (pages + blocks + content + theme).
- Visual runtime builder with live preview.
- Deterministic Astro export that looks hand-coded.
- Portable Studio projects that can be opened on another machine.
- Codex CLI agent panel with patch review and approvals.
- Staging publish flow via GitHub -> Cloudflare Pages.

## 3. Non-Goals (V1)

- Next.js export (V2+).
- Multi-provider agent support (Claude/Gemini in V2+).
- Multi-user real-time collaboration.
- Runtime plugins executed inside exported sites.
- Full CRM or back-office tooling.

## 4. Personas

- Agency Builder (primary): assembles and iterates client sites quickly.
- AI Agent Operator (primary): uses Codex with strict permissions and patch approval.
- Client Reviewer (secondary): reviews staging URL only.

---

## 5. Product Philosophy

### 5.1 Source of Truth

The Studio project (manifests + content + theme + assets + block definitions) is the source of truth.

### 5.2 Two Artifacts

V1 explicitly produces two separate artifacts:

1. Studio Project Package (`.cmsproj` zip): portable authoring data.
2. Production Export (Astro repo): deployable deliverable.

### 5.3 Canonical Render Model

The runtime editor and Astro exporter must use the same intermediate representation (IR), so preview and export stay aligned.

### 5.4 Edit and Release Loop

Edit in Studio -> Live Preview -> Validate/Lint -> Export Astro -> Build Check -> Publish to Agency Staging -> Client Review -> Handoff to Client Repo/CF (later flow).

---

## 6. Core Data Model

### 6.1 Separation of Concerns

- Structure: pages with ordered block instances.
- Content: JSON records referenced by pages/blocks.
- Theme: design tokens + typography + spacing with allowed overrides.
- Blocks: manifest-defined units with schemas, runtime render contract, and Astro export contract.

### 6.2 Studio Project Format (Portable)

Required:

- `project.json` (metadata, schema version)
- `site.json` (site config, nav/footer, SEO defaults)
- `theme.json` (tokens + theme settings)
- `pages/*.json` (page manifests)
- `content/*.json` (content records)
- `assets/` (images/files)
- `blocks/` (project-local custom blocks, optional)
- `blocks.lock.json` (block versions/hashes)
- `exports/` (export metadata, optional)

Excluded:

- provider/API tokens
- absolute machine paths
- local caches

### 6.3 Page Manifest Shape

Each page includes:

- route/path
- SEO metadata
- ordered block instances:
  - `{ instanceId, blockId, props, contentRefs, styleOverrides, visibility }`

### 6.4 Content Record Shape

Each content record:

- `{ id, type, data }`
- referenced via stable IDs
- supports list/collection content in V1

### 6.5 Schema Versioning and Migrations

- Project schema uses semver (`major.minor.patch`) in `project.json`.
- V1 supports forward-only migrations (no automatic downgrade path).
- Loading older schemas triggers migration with automatic backup saved to `backups/<timestamp>-pre-migration/`.
- Migration output must be deterministic and logged in `exports/migrations.log`.

### 6.6 Canonical IR Specification (Locked for V1)

All preview and export logic consumes normalized page IR:

- `PageIR`: `{ pageId, route, seo, blocks: BlockInstanceIR[] }`
- `BlockInstanceIR`: `{ instanceId, blockId, props, content, styles, visibility, children? }`
- `ThemeIR`: resolved token map used by runtime preview and exporter

Rules:

- `props`, `content`, and `styles` are fully validated and default-resolved before render/export.
- computed fields (for example resolved classes) are not persisted in project files.
- unknown fields are stripped during normalization to keep output deterministic.

---

## 7. Features (V1)

## 7.1 Project Creation and Templates

- New project wizard (project name, client name, template, theme preset).
- Open existing project folder.
- Recent projects list.
- Auto-save + manual save.
- Package/unpackage `.cmsproj`.

## 7.2 Runtime Visual Builder

### 7.2.1 Pages and Routing

- create, duplicate, rename, delete page
- route validation and collision checks

### 7.2.2 Block Composer

- add/reorder/remove blocks
- block catalog with search and categories
- per-instance settings (label, visibility, token-limited style overrides)

### 7.2.3 Schema-Driven Editing UI

- generated from `editorSchema`
- typed fields, repeatable groups, link/image controls, inline constraints
- raw JSON editor hidden behind advanced toggle

## 7.3 Live Preview

- embedded preview webview
- route switching + responsive presets
- hot reload on content/layout changes
- renders from runtime engine using canonical IR (not from exported files)

### 7.3.1 Preview Parity Contract (V1)

Preview and exported Astro output must match for:

- DOM block order/structure
- content values and links
- design token resolution
- responsive breakpoint behavior (within defined tolerance)

### 7.3.2 Parity Verification (Locked for V1)

- Run parity checks on 3 viewport widths: `390`, `768`, `1280`.
- Compare rendered DOM signatures (tag tree + key attributes + block markers).
- Compare computed token values for color, spacing, typography on known selectors.
- V1 pass threshold: 100% structural match, >= 98% token/style match on sampled selectors.

## 7.4 Validation and Lint

Validation:

- props schema validation
- content reference integrity
- required field enforcement

Lint default rules:

- SEO title/description presence
- missing alt text
- empty/invalid links
- content constraints (headline/CTA length, max items, etc.)

Outputs:

- human-readable issue list
- machine-readable JSON report for agent tools

## 7.5 Astro Export (Only Export Target in V1)

### 7.5.1 Output Properties

- conventional repo structure
- readable and deterministic files
- shared components extracted where appropriate

### 7.5.2 Export Steps

1. validate + lint gate
2. generate Astro repo (`src/pages`, `src/components`, `src/content`, `src/styles`, `public/assets`)
3. run formatting pass
4. generate export report (files, checksums, exporter version, timestamp)
5. optional local build check (`astro build`)

### 7.5.3 Determinism Rules

- stable instance IDs (non-random strategy)
- stable JSON key ordering
- stable file naming/pathing
- no volatile values injected into source files

### 7.5.4 Stable ID and File Naming Strategy (Locked for V1)

- `instanceId = base36(sha1(pageId + blockId + insertionIndex + seed))[:12]`
- `seed` is stored once in `project.json` at project creation.
- reordering blocks does not regenerate existing `instanceId`.
- exported component/page filenames are slug-based and collision-safe with deterministic suffixing (`-2`, `-3`).

## 7.6 Publishing Workflow (Agency Staging)

V1 publishes only exported Astro repo.

Flow:

1. export Astro repo
2. commit + push to agency GitHub staging repo
3. Cloudflare Pages builds staging URL for client review

V1 assumption:

- CF Pages project is already connected to staging repo

Repo strategy (locked for V1):

- Two repos:
  - Studio project repo (optional, internal backup)
  - Exported Astro staging repo (required for publish)
- Default publish branch: `staging`
- Commit format: `chore(export): <project-name> <YYYY-MM-DD HH:mm>`
- On push/build failure, Studio keeps local export and surfaces retry action with logs.

V2+:

- automate repo/project setup in GitHub + Cloudflare APIs
- guided handoff to client-owned repo and Pages project + domain

## 7.7 Agent Console (Codex-Only in V1)

### 7.7.1 Scope

- single provider: Codex CLI
- provider abstraction kept internal for future expansion

### 7.7.2 Workspace Permissions

- agent pinned to selected project/export folder
- default mode is read-only
- write mode requires explicit user action
- allowed operations toggles:
  - edit manifests/content/theme
  - edit assets
  - run validate/lint/export/build/publish

### 7.7.3 Deterministic Internal Commands

- `project.info`
- `blocks.catalog`
- `pages.list`
- `page.create`
- `page.update`
- `block.add`
- `block.remove`
- `block.reorder`
- `content.update`
- `theme.update`
- `validate`
- `lint`
- `preview.open`
- `export.astro`
- `publish.staging`

All commands return machine-readable JSON.

### 7.7.4 Patch Review Safety

- every write action produces a diff/patch
- user can approve/reject before apply
- revert action available for last applied change

### 7.7.5 Agent Path and Command Policy (Locked for V1)

Writable paths:

- Studio data only: `project.json`, `site.json`, `theme.json`, `pages/**`, `content/**`, `assets/**`, `blocks/**`
- Export workspace only: generated export folder

Denied paths:

- user home root outside selected workspace
- OS/system paths
- credential/keychain files

Allowed command families:

- validate/lint/preview/export/build/publish tool commands exposed by Studio
- no arbitrary shell commands by default in V1

---

## 8. Block System Specification (V1)

## 8.1 Block Definition Requirements

Each block includes:

- immutable, versioned `blockId` (for example `hero.split.v1`)
- metadata (name/category/description/tags/thumbnail)
- `propsSchema`
- `editorSchema`
- runtime render contract compatible with canonical IR
- Astro export contract/template
- defaults and constraints

## 8.2 Custom Blocks

- studio watches `project/blocks/**`
- discovered blocks appear in catalog without restart when valid
- invalid blocks surface clear schema errors

## 8.3 Workspace Block Library Contract (V1)

V1 supports two block sources:

1. Internal Library (bundled with Studio)
2. Workspace Library (user filesystem folder under the project)

Workspace folder contract:

- root path: `project/blocks/`
- each block lives in its own folder: `project/blocks/<block-id>/`
- required manifest file per block folder (for example `block.manifest.json`)
- manifest must declare:
  - `blockId` (immutable + versioned)
  - metadata (name/category/tags)
  - `propsSchema`
  - `editorSchema`
  - runtime render contract
  - Astro export contract/template reference

Hot-load behavior:

- file watcher listens for create/update/delete in `project/blocks/**`
- valid block add/update appears in catalog without app restart
- delete removes block from catalog for new placements, while existing instances are flagged for resolution
- invalid manifests never crash Studio; they appear in a "Block Load Errors" list with actionable diagnostics

## 8.4 Versioning

- no breaking changes within same block version
- version bump required for breaking changes
- migration hooks are V1.5+

## 8.5 Block Dependency Policy (Locked for V1)

- Workspace blocks may declare npm dependencies only from an allowlist in `project.json`.
- Exact versions are required (no range specifiers like `^` or `~`).
- Dependency conflicts fail validation before export.
- V1 default policy: prefer zero external dependencies for built-in blocks.

---

## 9. Technical Requirements

## 9.1 Desktop Stack

- Tauri v2 + React + TypeScript
- macOS, Windows, Linux

## 9.2 Runtime/Preview/Export

- Node-based Astro toolchain in V1
- preview runner managed by Studio (start/stop/logs)
- export runner scoped to project directories

## 9.3 Validation Stack

- Zod for schemas
- JSON schema export optional
- lint engine via modular rules and config

## 9.4 Security and Secrets

- project data in user-selected folders
- secrets in OS keychain/credential manager
- never write secrets into project package/export by default

## 9.5 Asset Pipeline (Locked for V1)

- Source assets live in `assets/` inside project.
- Export copies assets to `public/assets/` with deterministic filenames.
- Validation limits:
  - image max size: 10 MB per file
  - supported formats: `jpg`, `jpeg`, `png`, `webp`, `svg`
- V1 does not auto-convert formats; optimization/compression is deferred to V1.5.

---

## 10. UI Layout (V1)

- Left: project tree (Pages, Content, Theme, Assets, Blocks)
- Center: block list + schema-driven editor
- Right: live preview
- Bottom: issues/log console (validate/lint/export/publish)
- Dockable Codex panel

---

## 11. Acceptance Criteria (V1)

1. A project created on one machine can be packaged and opened on another with zero schema errors.
2. Pages are editable visually with schema-driven controls and block reordering, including custom workspace blocks.
3. Preview refresh after an edit is <= 500 ms median on a 5-page template project.
4. Parity checks pass on all 3 required breakpoints with thresholds defined in `7.3.2`.
5. Validation/lint surfaces actionable issues with page/block context and machine-readable JSON output.
6. Astro export is deterministic: two exports with no data changes produce identical checksums.
7. Exported repo passes local `astro build`, can be pushed, and deploys to Cloudflare Pages staging URL.
8. Codex panel enforces writable path policy, shows diffs, and requires approval before any write.

---

## 12. V1 Template and Built-In Block Minimums (Locked)

Templates shipped in V1:

1. Agency Landing
2. Local Business
3. Portfolio

Built-in block minimum (first-party):

1. Hero (2 variants)
2. Feature Grid
3. Services List
4. CTA Banner
5. Testimonials
6. Pricing
7. FAQ
8. Logo Cloud
9. Contact Section
10. Footer

---

## 13. Milestones

1. Project schema + save/load/package + migration
2. Canonical IR + runtime renderer foundations
3. Block spec + catalog + schema-driven editor
4. Page composer + live preview integration
5. Validation/lint + reporting
6. Deterministic Astro exporter + build check + export report
7. Publish pipeline (git commit/push + status/log UI)
8. Codex panel (scoped tools + patch review + permission model)

---

## 14. Granular V1 Dev/Build/Deploy Checklist

### 14.1 Repo and Delivery Setup

- [x] Link local repo to GitHub repo you already created.
- [x] Add remote: `git remote add origin <github-repo-url>` (or update existing remote URL).
- [x] Verify remote: `git remote -v`.
- [x] Push bootstrap branch: `git push -u origin main` (or chosen default branch).
- [x] Create baseline branches: `main`, `staging`, `dev`.
- [ ] Protect `main` in GitHub settings (PR required, no direct push).
- [ ] Add branch rules for `staging` (allow CI, optional PR requirement).
- [ ] Add issue labels/milestones matching sections 13.1 through 13.8.
- [x] Add `.editorconfig`, formatter config, and shared lint config.
- [x] Add CI workflow skeleton (lint, test, build placeholders).

### 14.2 Tauri + React Monorepo Foundation

- [x] Initialize Tauri v2 app with React + TypeScript.
- [x] Define folder structure for:
- [x] Folder target: `src-ui/` (React app).
- [x] Folder target: `src-tauri/` (Rust commands/services).
- [x] Folder target: `packages/core/` (schemas, IR, validators).
- [x] Folder target: `packages/exporter-astro/`.
- [x] Folder target: `packages/lint-rules/`.
- [x] Configure pnpm/npm workspace.
- [x] Set TypeScript project references.
- [x] Add Rust formatter/lints (`rustfmt`, `clippy`) config.
- [x] Add pre-commit hooks (format + lint).
- [ ] Confirm app boots on macOS and opens blank shell UI.

### 14.3 Project Schema and Persistence

- [x] Implement V1 schema files: `project.json`, `site.json`, `theme.json`, `pages/*`, `content/*`, `blocks.lock.json`.
- [x] Implement semver schema version in `project.json`.
- [x] Build deterministic JSON serializer (stable key ordering).
- [x] Implement create/open/save project flows.
- [x] Implement autosave with debounce and conflict-safe writes.
- [x] Implement `.cmsproj` packaging/unpackaging.
- [x] Implement migration runner (forward-only).
- [x] Implement backup creation at `backups/<timestamp>-pre-migration/`.
- [x] Log migrations to `exports/migrations.log`.
- [x] Add schema fixtures for migration tests.

### 14.4 Canonical IR and Runtime Engine

- [x] Define TypeScript types for `PageIR`, `BlockInstanceIR`, `ThemeIR`.
- [x] Implement normalization pipeline (defaults, strip unknowns, validation).
- [x] Implement deterministic `instanceId` generation using locked strategy.
- [x] Implement token resolution into `ThemeIR`.
- [x] Implement runtime block renderer interface bound to IR only.
- [x] Add snapshot tests for normalized IR output.
- [x] Add regression tests proving reorder does not regenerate IDs.

### 14.5 Block System (Internal + Workspace Library)

- [x] Create internal block registry and loader.
- [x] Implement workspace watcher for `project/blocks/**`.
- [x] Implement manifest parser for `block.manifest.json`.
- [x] Validate manifest required fields (`blockId`, schemas, contracts).
- [x] Add block catalog merge logic (internal + workspace).
- [ ] Add block load error panel with actionable diagnostics.
- [x] Implement delete behavior for missing workspace blocks (flag existing instances).
- [x] Add dependency allowlist parser from `project.json`.
- [x] Enforce exact version pin policy and conflict detection.
- [x] Add tests for add/update/delete hot-load events.

### 14.6 Visual Builder UI

- [ ] Build app shell layout (left tree, center editor, right preview, bottom console).
- [ ] Implement pages CRUD UI with route collision validation.
- [ ] Implement block composer UI (add/reorder/remove).
- [ ] Implement schema-driven editor renderer from `editorSchema`.
- [ ] Add controls for links, images, repeaters, and constraints display.
- [ ] Add visibility toggle and style overrides per block instance.
- [ ] Add undo/redo stack for builder actions.
- [ ] Add optimistic UI + save status indicators.

### 14.7 Live Preview

- [ ] Implement preview host/webview integration in Tauri window.
- [ ] Render preview directly from canonical IR.
- [ ] Add responsive viewport presets: `390`, `768`, `1280`.
- [ ] Implement hot refresh on model changes.
- [ ] Stream preview logs to bottom console.
- [ ] Measure refresh latency on 5-page fixture project.
- [ ] Optimize until median refresh <= 500 ms.

### 14.8 Validation and Lint Engine

- [ ] Implement schema validation pass across project files.
- [ ] Implement content reference integrity checks.
- [ ] Implement required field checks.
- [ ] Implement lint rules:
- [ ] Lint rule: SEO title/description.
- [ ] Lint rule: alt text.
- [ ] Lint rule: link hygiene.
- [ ] Lint rule: content constraints.
- [ ] Return two outputs: human-readable and machine-readable JSON.
- [ ] Wire validation/lint panel with page/block grouping.
- [ ] Add CLI-accessible validate/lint entrypoints for agent tools.

### 14.9 Astro Exporter

- [x] Scaffold `packages/exporter-astro/`.
- [ ] Implement IR -> Astro page generation.
- [ ] Implement shared component extraction strategy.
- [ ] Emit content JSON under `src/content/`.
- [ ] Emit token CSS under `src/styles/`.
- [ ] Copy assets to `public/assets/` with deterministic names.
- [ ] Enforce deterministic filename collision suffixing.
- [ ] Run formatter on generated output.
- [ ] Generate export report (checksums, created/changed files, version, timestamp).
- [ ] Implement optional local `astro build` check command.
- [ ] Add golden-file tests for deterministic export reproducibility.

### 14.10 Publishing Pipeline (Agency Staging)

- [ ] Implement publish configuration UI (repo URL, branch `staging`, local export path).
- [ ] Implement git status/commit/push flow in app.
- [ ] Implement commit message format: `chore(export): <project-name> <YYYY-MM-DD HH:mm>`.
- [ ] Show publish logs and failure diagnostics in console panel.
- [ ] Add retry workflow for failed push/build.
- [ ] Document CF Pages requirement (repo pre-connected in V1).
- [ ] Validate end-to-end staging deploy from exported repo.

### 14.11 Codex Panel (V1 Agent)

- [ ] Build dockable Codex panel UI (transcript, actions, diffs).
- [ ] Implement read-only default mode.
- [ ] Implement explicit write-mode toggle.
- [ ] Enforce writable path allowlist and denied path rules.
- [ ] Expose deterministic internal commands:
- [ ] Agent command: `project.info`.
- [ ] Agent command: `blocks.catalog`.
- [ ] Agent command: `pages.list`.
- [ ] Agent command: `page.create`.
- [ ] Agent command: `page.update`.
- [ ] Agent command: `block.add`.
- [ ] Agent command: `block.remove`.
- [ ] Agent command: `block.reorder`.
- [ ] Agent command: `content.update`.
- [ ] Agent command: `theme.update`.
- [ ] Agent command: `validate`.
- [ ] Agent command: `lint`.
- [ ] Agent command: `preview.open`.
- [ ] Agent command: `export.astro`.
- [ ] Agent command: `publish.staging`.
- [ ] Implement patch/diff preview for any write operation.
- [ ] Require approve/reject before apply.
- [ ] Implement one-step revert for last applied change.

### 14.12 Asset and Media Rules

- [ ] Enforce supported image formats (`jpg`, `jpeg`, `png`, `webp`, `svg`).
- [ ] Enforce max size 10 MB per image.
- [ ] Validate required alt text for image usage in blocks.
- [ ] Surface actionable errors for unsupported/oversized assets.

### 14.13 V1 Templates and Starter Content

- [ ] Build `Agency Landing` template.
- [ ] Build `Local Business` template.
- [ ] Build `Portfolio` template.
- [ ] Include minimum first-party blocks listed in section 12.
- [ ] Add template QA fixtures for preview/export parity tests.

### 14.14 Test and Quality Gates

- [x] Unit tests for schema, migration, IR normalization, ID generation.
- [ ] Integration tests for project save/load/package/import.
- [x] Integration tests for workspace block hot-load.
- [ ] Integration tests for validate/lint reporting.
- [ ] Export determinism test: two exports, identical checksums.
- [ ] Preview parity test on required breakpoints.
- [ ] Smoke tests for publish flow (mock + real repo path).
- [ ] Cross-platform sanity checks on macOS/Windows/Linux.
- [ ] CI green on lint/test/build before merge to `staging`.

### 14.15 Release and Completion

- [ ] Freeze V1 feature scope.
- [ ] Run acceptance criteria checklist in section 11 against release candidate.
- [ ] Fix all P0/P1 defects.
- [ ] Tag release candidate (`v1.0.0-rc1`), run final QA pass.
- [ ] Publish `v1.0.0`.
- [ ] Create post-release backlog for V1.5/V2 items (Next export, multi-provider agent, optimization pipeline, handoff automation).

---

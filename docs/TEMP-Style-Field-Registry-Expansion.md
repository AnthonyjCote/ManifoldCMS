# TEMP Style Field Registry Expansion (Annotated)

## Purpose

Capture approved and proposed additions to the master style field registry based on latest review notes, including deferred items and open design decisions.

## Status Legend

- `Approved`: Include in master style registry planning now.
- `Conditional`: Include with implementation caveat.
- `Deferred`: Do not add now; schedule later.
- `Open`: Needs product/UI decision before implementation.

---

## 1) Layout

Status: `Approved`

Fields:

- `display`
- `position`, `top`, `right`, `bottom`, `left`
- `zIndex`
- `overflow`, `overflowX`, `overflowY`
- `minWidth`, `maxWidth`, `minHeight`, `maxHeight`
- `aspectRatio`

Sticky-specific controls (explicit):

- `position: sticky`
- `top`, `right`, `bottom`, `left` (full side controls exposed for sticky behavior)

---

## 2) Spacing

Status: `Approved`

Fields:

- `gap`, `rowGap`, `columnGap`
- `boxSizing`

---

## 3) Border

Status: `Approved`

Fields:

- Per-side borders:
  - `borderTopWidth`, `borderTopStyle`, `borderTopColor`
  - `borderRightWidth`, `borderRightStyle`, `borderRightColor`
  - `borderBottomWidth`, `borderBottomStyle`, `borderBottomColor`
  - `borderLeftWidth`, `borderLeftStyle`, `borderLeftColor`
- Per-corner radius:
  - `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius`
- Outline:
  - `outline`
  - `outlineWidth`, `outlineStyle`, `outlineColor`, `outlineOffset`

V1 implementation note:

- Use standard field inputs in v1.

Post-v1 UX note:

- Add a dedicated visual border/radius widget: central box preview with border-side values around edges and corner radius values at each corner.

---

## 4) Background

Status: `Approved` + `Conditional`

Approved fields:

- `backgroundSize`
- `backgroundPosition`
- `backgroundRepeat`
- `backgroundBlendMode`
- `opacity`
- Layered background list support (advanced mode)

Conditional fields:

- `backgroundAttachment`
  - Note: Optional/conditional because background images are selected via modal; may be less necessary in v1.

Approved additions from notes:

- Background parallax style + settings
  - Candidate controls: parallax mode, speed/intensity, axis, clamp limits.

---

## 5) Typography

Status: `Approved`

Fields:

- `fontFamily`
- `fontStyle`
- `letterSpacing`
- `textTransform`
- `textDecoration`, `textDecorationThickness`, `textUnderlineOffset`
- `whiteSpace`, `wordBreak`, `overflowWrap`
- `textShadow`

---

## 6) Effects

Status: `Approved` + `UI Constraint`

Fields:

- `boxShadow` (multi-layer support)
- `filter` (expanded into separate effect fields)
- `backdropFilter`
- `mixBlendMode`
- `isolation`

UI/UX constraint from notes:

- Each effect must have its own explicit value field (no effect dropdown selector).
- Multiple effects must be usable together/layered.
- If an effect value is effectively `0`/`none`, omit it from generated CSS output to keep export CSS lean.

Expanded effect field candidates:

- Shadow:
  - `boxShadow` (multi-layer)
  - `textShadow`
  - `dropShadowX`, `dropShadowY`, `dropShadowBlur`, `dropShadowColor`
- Filter channels:
  - `blur`
  - `brightness`
  - `contrast`
  - `saturate`
  - `hueRotate`
  - `grayscale`
  - `sepia`
  - `invert`
  - `opacity` (filter channel)
- Backdrop channels:
  - `backdropBlur`
  - `backdropBrightness`
  - `backdropContrast`
  - `backdropSaturate`
  - `backdropHueRotate`
- Blend/compositing:
  - `mixBlendMode`
  - `backgroundBlendMode`
  - `isolation`

---

## 7) Transform

Status: `Approved`

Fields:

- `transformOrigin`
- `translateX`, `translateY`, `translateZ`
- `rotate`, `rotateX`, `rotateY`, `rotateZ`
- `scale`, `scaleX`, `scaleY`, `scaleZ`
- `skewX`, `skewY`
- `perspective`
- `transformStyle` (`flat` / `preserve-3d`)
- `backfaceVisibility`

---

## 8) Motion

Status: `Deferred`

Decision from notes:

- Do **not** add motion/animation controls to Style tab.
- Motion should be 100% in dedicated Motion/Animation tab.

Deferred fields:

- `transitionProperty`, `transitionDuration`, `transitionTimingFunction`, `transitionDelay`
- `animationName`, `animationDuration`, `animationTimingFunction`, `animationDelay`, `animationIterationCount`, `animationDirection`, `animationFillMode`, `animationPlayState`
- `willChange`

---

## 9) Interaction / State

Status: `Deferred` + `Direction Set`

Decision from notes:

- Leave interaction/state handling out of the Style tab for now.
- Implement state/responsive toggles on primary value fields instead (better UX direction).

Future direction:

- Primary field toggle modes:
  - default
  - hover
  - focus
  - active
  - responsive targets (mobile/tablet/desktop) where applicable

---

## 10) Visibility / Accessibility Helpers

Status: `Approved` + `Open UX extension`

Approved fields:

- `visibility`
- `pointerEvents`
- `cursor`

Open UX extension from notes:

- Add responsive visibility toggles (e.g., hidden on mobile, visible on desktop).
- Requires explicit breakpoint-targeting UX and precedence rules.

---

## Implementation Notes for Master Registry

- Continue using master registry + per-primitive exclusion strategy (default all, subtract unsupported).
- For complex compound CSS (filters, shadows, layered backgrounds), provide structured field editors over raw string input.
- Keep section groups collapsible and searchable (already implemented baseline).

## Suggested Next Design Tasks

1. Define primary-value field toggle UX model for state/responsive values (outside Style tab).
2. Define structured editors for `boxShadow`, `filter`, and layered backgrounds.
3. Define parallax background control schema and safe defaults.
4. Define responsive visibility field behavior and export mapping.

## Scope Boundary

- This is a temporary planning doc for style-field expansion and does not replace the main PDR.

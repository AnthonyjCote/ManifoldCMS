# TEMP Block Design Constraints

## Purpose

Define baseline design and implementation constraints for blocks/primitives so builder UX and rendered output stay consistent, predictable, and high-quality.

This starts intentionally simple and should be expanded as new issues are discovered.

---

## Initial Constraints (V1)

0. NO HACKS (top-level rule)

- No patchy top-level overrides that bypass or break the block/theme/style-edit pipeline.
- If a styling issue is rooted in theme tokens, block defaults, or style-resolution logic, fix at root cause.
- If root-cause ownership is unclear, stop and call it out for clarification before applying changes.
- Do not “force” visual outcomes with one-off overrides that create hidden regressions.

1. Parent-controlled sizing

- Primitive containers are the source of truth for sizing controls (`width`, `height`, spacing, etc.).
- Child media/content should adapt to container dimensions instead of imposing its own independent layout constraints.

2. Image primitive containment

- Raw image elements must remain contained within their parent primitive container.
- If fit behavior is needed, use explicit fit strategy (`contain`/`cover`) without breaking parent sizing control.
- Image placeholders must follow container sizing behavior and never force parent growth unexpectedly.

3. Video primitive containment

- Raw video/embed frames must remain contained within their parent primitive container.
- Video/content scaling should adapt to parent size and avoid overflow unless explicitly configured.

4. Predictable empty states

- Placeholder states must not introduce hidden min-height/aspect-ratio constraints that differ from filled states unless explicitly intended.
- Empty and filled primitive states should preserve similar layout behavior for easier editing.

5. Style source-of-truth consistency

- Size/spacing behavior should align with Style tab controls and live preview expectations.
- Blocks/primitives should avoid hardcoded CSS that conflicts with editable controls.

---

## Notes

- Add new constraints here as parity issues are found.
- Treat this as a living guardrail doc for block quality and UX consistency.

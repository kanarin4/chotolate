PROJECT: Chotolate

Purpose:
Interactive spatial operations board for placing staff and newcomers into resizable position containers.

Implementation rules:

1. Follow documentation in /docs exactly.
2. Never create free placement. All placement must snap into containers.
3. Tiles must always be consistent size.
4. Containers must auto-arrange internal grid layout.
5. Containers cannot shrink below minimum required size.
6. Highlight container when dragged tile cursor enters bounds.
7. If tile dropped outside container → return to original bank.
8. Banks behave like fixed containers.
9. Fatigue color is manual toggle only.
10. No scheduling or timing logic.

Documentation maintenance:

- After implementing a feature, create docs/features/<feature>.md
- Append changes to CHANGELOG.md
- Record reasoning in DEVLOG.md

Never modify PRD or architecture without explicit instruction.
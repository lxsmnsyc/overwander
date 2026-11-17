---
id: ui-redesign-finish
title: Finish the UI redesign
status: done
priority: must
type: story
outline: false
milestone: now
size: L
added: 2026-11-16
owns: []
shared: []
provides: []
depends_on:
  - on: ui-redesign-overworld
    kind: hard
    why: The dialogs take the HUD's handoffs, and every board reuses the finished screens' pieces
---

# Finish the UI redesign

## Goal

The last three redesign nodes ship as one feature on one branch, `feat/ui-redesign-finish`, so the maintainer approves the boards once, the screens are captured once, and the full suite runs once:

- `ui-redesign-finish-boards`: inventory and one board per screen for all three areas, approved at a single gate.
- `ui-redesign-overworld-dialogs`, `ui-redesign-shell`, `ui-redesign-social`: each builds its area to the approved boards and lands as one commit on the story branch, one after another (one node at a time on this device).

## Checks

- Each child runs only the fast check: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), and the test files it touched.
- The story runs the rest once, after the last child: the capture pass (desktop 1280x720 and phone 390x844, light and dark, every built screen compared with its board), then `pnpm test` (2 workers). One changeset, `minor`, for the whole story.

## Acceptance

- Every item in each child's inventory is ticked.
- Every built screen matches its board in light and dark; reduce motion fades.
- The checks above pass on the story branch, and the story pull request goes to the maintainer.

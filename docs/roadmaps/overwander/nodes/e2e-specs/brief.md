---
id: e2e-specs
title: Cut the e2e specs to a working smoke suite
status: todo
priority: should
type: chore
outline: false
milestone: next
size: M
spike: false
verify: pnpm test:e2e
gate: false
added: 2026-10-27
owns:
  - e2e/**
shared: []
provides: []
depends_on:
  - on: deps-update
    kind: hard
    why: The specs only load with the hook deps-update adds (e2e/vite-hooks.ts)
---

# Cut the e2e specs to a working smoke suite

## Goal

Keep end-to-end tests only for what no other suite can catch, the wiring between the browser and the server: signing in, server functions over HTTP, the live socket, and the server render taking over in the browser. Make that small suite pass, delete the rest, and fix the helpers so a test can put the player where it needs them.

## Context

- Source: found while running deps-update, 2026-10-27 (see its outcome), and decided with the maintainer on 2026-11-03.
- CI does not run e2e, so the specs fell behind the game unseen: no spec loaded from about 2026-09-25 until deps-update, and in the run stopped after 46 of 59 tests, 43 failed, most by timing out. A new player starts on a Portal, and its dialog covers the world, so a spec that presses keys or opens a dialog right after `signIn` waits out its timeout.
- The rules, data and server are covered elsewhere: about 5,800 unit tests, the database suite (`pnpm test:db`, 32 files over the server functions) and the component tests. A spec that only re-checks one of those is not worth a browser on this machine (8 GB, one suite at a time).
- `standBeside` in `e2e/walk.ts` writes the player's position beside a landmark, but the game puts the player back at their start town (seen 2026-11-03 trying to screenshot Nurse Joy and a Vendor): a position saved by the page wins over the written row, or the write misses. `openAuctionBoard` relies on the same helper.

## Steps

- [ ] `signIn` in `e2e/game.ts` handles the start: the Portal dialog is closed (or the player starts where no dialog opens) before a spec acts.
- [ ] `standBeside` holds: find why the written position does not take, fix it in the helper, and prove it by standing beside a Pokémon Center and reading the board's chunk in the label.
- [ ] Keep and fix five specs, one flow each:
  - `overworld.spec.ts`: sign in, the board loads, a step moves the player.
  - `safari.spec.ts`: meet a wild pokemon and catch it.
  - `battle.spec.ts`: a battle runs to its end.
  - `auction-flow.spec.ts`: list a pokemon and buy it as a second player.
  - `starter-gift.spec.ts`: a new player claims a starter.
- [ ] Delete the other specs (auctions, bag-use, battle-leave, boxes, catch-sheet, command-bar, friends, hover-card, icons, pick-team, pokedex, pp, profile-visit, profile, raids, second-screen, world-map) and any helper only they used. Before deleting one, check whether it holds the only test of something the other suites do not cover; if it does, keep that one test inside one of the five specs and say so in the outcome.

## Acceptance

- [ ] `pnpm test:e2e` passes, run alone (never beside `pnpm test:db` or `pnpm test`), twice in a row.
- [ ] `standBeside` puts the player beside a landmark, shown by a test.
- [ ] The outcome lists every deleted spec and why nothing is lost.

## Sizing

M: one helper fix that reaches every spec, one helper bug to find, five flows to bring up to date, and deletions.

## Notes for the worker

- Start with `e2e/game.ts`: a fix to `signIn` reaches every spec.
- Run Playwright with one worker. Stop the dev server on port 4321 and the dev database (`pnpm db:stop`) when done.

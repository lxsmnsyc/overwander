---
id: deps-update
title: Update the project's dependencies
status: done
priority: should
type: chore
outline: false
milestone: next
size: S
spike: false
verify: pnpm typecheck && pnpm exec oxlint src test && pnpm test
gate: false
added: 2026-10-27
owns:
  - package.json
  - pnpm-lock.yaml
shared: []
provides: []
depends_on: []
---

# Update the project's dependencies

## Goal

Bring every dependency to its latest release within its current major, and fix whatever the bumps break. Solid 2.0 and the libraries that follow it are not part of this node: they are `solid-2`.

## Context

- Source: user request, 2026-10-27.
- `pnpm outdated` on 2026-10-27 listed only patch and minor bumps: better-auth and @better-auth/passkey 1.7.13 (the passkey plugin is pinned exactly, keep the two in step), @solidjs/start 2.1.0, solid-js 1.9.17, vite 8.3.5, vitest 5.0.5, @playwright/test 1.64.1, oxlint 1.89.0, oxfmt 0.74.0, oxlint-tsgolint, wrangler, sharp, pg, jose, @types/node. Run it again: the list will have moved.
- Pinned on purpose: `nitro` (a dated beta) and `typescript` (7.1.0-beta). Move them only to a newer build of the same line, and only if the checks pass.

## Acceptance

- [ ] `pnpm outdated` lists nothing inside the current majors, apart from pins the outcome names with a reason.
- [ ] Fast check passes: `pnpm typecheck && pnpm exec oxlint src test` (read oxlint's exit code).
- [ ] Full check passes: `pnpm test`, then `pnpm test:db`, then `pnpm test:e2e`, one at a time.
- [ ] `pnpm build` succeeds.
- [ ] A changeset (patch) names the bumps that change behaviour, if any.

## Sizing

Patch and minor bumps; the work is fixing what a new oxlint rule or a library change flags.

## Notes for the worker

- `pnpm` only. A newer oxfmt may reformat files: run it, and commit the reformat as its own commit so the bump stays readable.
- A newer oxlint may report new errors in code other nodes own. Fix them here only when the fix is mechanical; otherwise pin oxlint and say so in the outcome.

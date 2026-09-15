---
name: server-function-order
description: A server function is addressed by its place in its file, so an existing one is never removed, reordered or given different parameters, and new ones go at the end. Applies whenever adding, removing, moving or changing the parameters of a function whose body opens with 'use server'.
---

# Server functions keep their place

In a production build, SolidStart names every `'use server'` function by its file and its position in that file (`<file hash>-<index>`). The function's name is not part of it.

A tab loaded before a deploy keeps calling those positions, with the arguments its own build sends. When a function moves, that tab calls whatever sits in its slot now. This has already happened twice:

- A new parameter at the front of the position save shifted every argument, so a player's chunk X was read as a step count and they were moved to 0,0.
- Three claim-list functions merged into one moved the nest and phenomenon claims up two slots.

## The rules

- **Add at the end.** A new server function goes after the last one already in the file.
- **Never remove one.** A function nothing calls any more keeps its slot. Export it so the type-check does not flag it as unused, and have it answer its old arguments sensibly. The claim lists in `src/auth/snapshots.ts` are the example.
- **Never reorder.** Moving code around a file keeps every `'use server'` body in the same order.
- **Never change the parameters.** A different argument list is a new function at the end; the old one keeps its signature.
- **Renaming is fine**, since the name is not in the address.

## The guard is a backstop

A tab names its build on every server call (`src/utils/stale-build.ts`), and `src/middleware/index.ts` refuses a call from another build before any function runs, so the tab reloads. It lets through a tab that names no build, and every open tab still reloads after a deploy, so the order rules still apply.

## Checking a change

List the `'use server'` functions of the file in order before and after the change, for example `git show HEAD:<file>` beside the working copy. Every function must still sit at the position it had.

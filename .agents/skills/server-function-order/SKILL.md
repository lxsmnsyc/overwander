---
name: server-function-order
description: A server function is addressed by where it is bound, and Solid's build check is what keeps a tab from another build from calling one whose parameters changed. Applies whenever adding, removing, renaming or changing the parameters of a function whose body opens with 'use server', and whenever touching the reload on an unknown build or anything that calls the server outside Solid's client.
---

# Server functions and old tabs

Solid names every `'use server'` function `<binding>-<xxhash32(file)>`: the dotted name it is bound to, then a hash of its root-relative path (`listAnnouncements-7b56653c`). Adding, removing or reordering other functions does not move it. Two functions bound to the same name in one file are told apart by order (`a-e4747210`, then `a-e4747210-1`), so reordering those two swaps them. The reference exposes the id as `fn.id`, and every call's path ends in it: `/_server/data/<id>` for an ordinary call, `/_server/<id>` for `fn.url` and form actions, `/_server/live/<id>` for the live wire.

A tab loaded before a deploy keeps calling those ids with the arguments its own build sends. A function that kept its name but changed its parameters would get the old arguments. This happened before there was a guard: a new parameter at the front of the position save read a player's chunk X as a step count and moved them to 0,0.

## Solid's build check

Every `vite build` draws a fresh random build id (`@solidjs/vite-plugin`, `randomBytes(8)`), the same in the client and server bundles. The client stamps it as `X-Server-Function-Build` on every non-GET call, and the server answers a call from another build with 409 and `X-Server-Function-Unknown` before any function runs. An unknown id answers 404 with the same header. The app keeps no build guard of its own for server functions.

Solid's client only throws on that header, so `src/auth/stale-build.ts` wraps `fetch` and reloads the tab once when an answer carries it, then fails the call with the `new-version` refusal. `guardServerCalls()` runs in `src/entry-client.tsx` before the app mounts.

Because no call from another build reaches a function, server functions may be added, removed, renamed or given new parameters like any other code. A function nothing calls any more is deleted.

## The rules

- **Every server call goes through Solid's client.** It stamps the build and looks `fetch` up at call time, so the reload wrapper sees every call. A call that sends no build header is let through, so anything that reaches `/_server` another way (a `<form action>` posted without JavaScript, `navigator.sendBeacon`, a worker, a script) skips the check: do not add one.
- **Reads stay POST.** GET calls are not stamped, so a declared `GET(fn)` read would skip the check.
- **Do not replace the client's `fetch`.** Setting `configureServerFunctionsClient({ fetch })` or a per-function `meta.fetch` would bypass the wrapper; an app `prepareRequest` is fine, Solid wraps it with its stamp.
- **The check exists only in a production build.** `pnpm dev` neither stamps nor checks, so a wrong build header reaches the function there.
- **The live feed has its own check.** `/_live` compares the tab's `VITE_BUILD_ID` (from `BUILD_ID`, or the build time) with the server's and sends `stale` to reload.

## Checking a change

For a change to the reload, run `test/model/build.test.ts` and `test/auth/stale-build.test.ts`. For a new way of calling the server, check in a production build's network panel that the request carries `X-Server-Function-Build`.

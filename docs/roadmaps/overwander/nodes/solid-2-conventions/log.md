# Log: solid-2-conventions

- Read the spike, area and server-calls outcomes, the cheatsheet and the owned files.
- Renamed `resource-suspense` to `async-reads` in both trees; rewrote it from `createLoad`, `catchFailure`, `watchLive` and the real `SpectatorList`, `HoneyTreeDialog` code.
- Checked the directive claim with `transformDirectives` on a scratch module: the client build drops the import only the server function used. Kept the sentence, named the compiler pass.
- Converted both `ticking` calls in `AnimatedSprite.tsx` to `onSettled`.
- Compiled every skill example in a scratch file (`createLoad` is a named import; `<For>` hands the row as a value), then deleted it.
- `pnpm typecheck` exit 0 after the changes.

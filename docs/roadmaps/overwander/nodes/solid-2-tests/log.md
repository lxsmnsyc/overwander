# Log: solid-2-tests

- 2026-11-18: branch `refactor/solid-2-tests` cut from `feat/solid-2`; `pnpm install` up to date. Deleted `test/components/resource-reads.test.ts`.
- Baseline under the stopgap: 94.6 s, 298 files, 5959 tests pass.
- Removed the stopgap: 186.7 s, 2 files fail (`forms.test.tsx`, `news.test.tsx`).
- Added `test.projects` (`client`, `server`, `server-news`); `forms.test.tsx` gets `flush()`. First split run missed the four fuzz files because I had excluded them; the default include covers them, fixed.
- Suite times swung with machine load (another project's Vitest). Re-ran the stopgap config right after the split: 431 s against 417 s.
- Typecheck and oxlint (exit 0) clean. Files that timed out under load pass alone.
- `pnpm test:db` alone: 171 tests pass.
- `pnpm build`, built server on 3123: calls carry `x-server-function-build`, a foreign build gets 409 with `x-server-function-unknown`.
- Runtime checks with Playwright on the built server: Portal, Gym Seat, Honey Tree, auction listing and bid, quest claim, raid lobby. Safari not reached.
- Dev server (port 3000, needed for the auth origin): warnings fixed in board, box, StatHexagon, HoverCard; AuctionBoard `Show` conditions left.
- Stopped the dev and built servers and `pnpm db` (`docker compose -f compose.dev.yaml stop`).
- Review fixes: fuzz and sim drop `projects`; `news.ssr.test.tsx` rule replaces the third project; AuctionBoard, profile sheet and terms warnings fixed in a dev run on port 3000.

# Outcome: solid-2-social

## Built

- Branch `refactor/solid-2-social`, cut from `feat/solid-2` (405ea34a2). 48 files changed: 43 under the owned paths, plus `src/components/app/watch.ts`, `src/components/app/Announcements.tsx`, `src/components/app/settings.ts`, `test/components/news.test.tsx` and this folder (see Deviations).
- Resources (Decision 1), every `createResource` in the owned paths:
  - Async memos under `Loading`, read in a child: `BidsList`, `CatchFace` and the lot name (`LotFace.tsx`, `auction-tab/lots.tsx`), the auction board's lots, sellers, buddy, only-one, sellable and standing, the duel lobby's names, `FriendsTab`'s names, `GiftsTab`, `PlayerPlace`, `SpritePicker`, the awards card's awards and achievements, `TitleBadge`, the quest board's standings and rotations, the raids window, the raid lobby's teams, names and may-join, `NamedCatch`, `PickBox`, `CreditsCard`, the passkeys and the security state. `refetch()` became `refresh(memo)`. A key that can be empty is a non-async compute returning `Promise<T> | null` (an async compute is pending even for its null case). Keys built from a list go through a string key memo first.
  - `createLoad` where 1.x read without waiting (`.latest`, `answered`, handler reads): the listing dialog's catch, the profile editor's titles, `TeamsCard`'s presets and each preset's party, the profile sheet's lots, the raid invite row's lair, and the buddy and only-one reasons in `TradeOfferDialog` and `TradesTab`. No file in the owned paths imports `resource-reads.ts` now (the profile sheet's `state.ts` and the raid lobby's `rows.tsx` and `teams.tsx` did).
  - Reads that were `settled` (raid lobby) or `.latest` under a boundary (quest board) are plain reads: 2.0's `Loading` keeps the content on screen through a refresh and a key change, which is what both helpers were for.
- Live feeds: every `from(...)` is now `createMemo(() => from(...))`. Where the reader draws an empty state (rows of a list, tabs without a boundary of their own), the subscribe calls `set(undefined)` first, so the memo never holds a `Loading`; 1.x `from` started at `undefined` too. The auction board's listing and its gold are left unseeded: they sit under the board's boundary, which already waits for the other reads.
- `watchLive` (`src/components/app/watch.ts`) is rebuilt on `from`: `watchLive(key, (key, set) => unsubscribe)`. The key goes through a memo, a null key opens nothing, the value is null until the first answer and on each re-open, and nothing opens during a server render.
- Effects split (Decision 2): `BidDialog`'s opening floor, the duel lobby rows (4), `createFriendTie`, `EditProfileDialog`'s opening reset, `QuestsTab`'s reopen re-read and the board's first placement, the raid lobby's presence and its rows (3), `TradeOfferDialog`'s reset. Handlers called from an apply (`onLobby`) are read in the compute. `on(...)` is gone.
- Owned-scope writes (Decision 3): the profile sheet's `last` latch is a writable derived signal; no `{ ownedWrite: true }` anywhere in the owned paths.
- JSX: `aria-pressed` through `spellAria` (duel ready stamp, `SpritePicker`); `maxLength` to `maxlength` (`TeamsCard`). `<Dynamic>` is gone: `dynamic(() => ...)` in the markdown builtins and `NewsTab`, a plain `const Glyph = RECORD[key]` where the lookup is not reactive (quest glyphs, settings panes).
- `ReleaseLine` (news) carries an accessor (runtime bug, see Gotchas).
- `news.test.tsx` renders the page as `<Page />` instead of the deprecated `<Dynamic>`. `settings.ts` asks `typeof globalThis.matchMedia === 'function'` before calling it.

## Proof

Refactor, no proof step.

## Deviations

- Decision 1 says async memos under `Loading`; the reads listed under `createLoad` are not, for the reason `solid-2-catches` gave (their readers draw an empty state, read in the declaring body or in handlers).
- Outside the owned paths:
  - `src/components/app/watch.ts` rewritten and its signature changed. It still had a one-argument effect, and its producer read signals inside the subscription, which a `from` in a memo does not track, so the key became its own argument. Its only callers are four social files and `src/components/app/Announcements.tsx`, whose one line was updated (`watchLive<true, Announcement[]>(() => true, ...)`). `solid-2-shell-routes` no longer needs to touch `watch.ts`.
  - `src/components/app/settings.ts`: the `matchMedia` guard the brief asked for.
  - `test/components/news.test.tsx`: the brief asked for a fix. It passed before any change (4 tests) on the current test posture; the only 2.0 issue left in it was the deprecated `<Dynamic>`, now gone.
- `AwardsCard` read its awards in its own body for the three count tiles (in 1.x that held the boundary above the card). The tiles now sit in a fallback-less `Loading` of their own, so the shelf switch stands while the awards are read.

- Behaviour changes a player can see:
  - The auction board shows its "reading" note until the first listing lands, where 1.x drew an empty board (and a gold of 0) for that moment.
  - A refresh no longer swaps a panel for its fallback: bids, gifts, passkeys, the security pane and the quest board stay on screen while they re-read.
  - The friend code is asked once per mount of the add-friend dialog, not on every reopen, and stays on screen through the closing fade.
  - The awards card's count tiles are blank while the awards are read, instead of holding the boundary above the card.
  - (Reverted by the orchestrator after review: the listing dialog now shows the record only for the catch it was read for, so it reads again on a catch change.) The listing dialog keeps the last catch's record on its row until the next one lands, where 1.x held the panel.
  - Fixed: the news page's line under its heading follows the release picked.

## Stubs left

- None. `src/components/app/resource-reads.ts` is left for `solid-2-shell-routes` to delete; nothing in the owned paths imports it.

## Gotchas

- **A provider's value is read once.** `<Ctx value={props.x}>` does not follow `props.x` (1.x read it once too, untracked; 2.0 now warns `STRICT_READ_UNTRACKED` in dev), so this bug was already on main. `ReleaseLine` kept the first release's line under every page the feed swapped in. A context whose value changes carries an accessor.
- **A subscription in a memo opens during the server render.** `createMemo(() => from(...))` runs the subscribe on the server, where 1.x's effect never ran. `Announcements` threw `location is not defined` in SSR through `watchLive` until it got an `isServer` guard. The seeded `from` sites in the social screens have no guard: today they mount only in the browser after sign-in, but a screen that renders on the server must guard its subscribe. Worth checking in `solid-2-shell-routes` for `src/routes/index.tsx` and `src/routes/admin.tsx`, which also call `from`.
- **`from` in a memo is pending until its first value.** Read where nothing waits, it holds the nearest `Loading` (in a list, every row's profile would hold the list). Seed it with `set(undefined)` where the reader draws an empty state.
- `Roster` (friends) and most social bodies call `useGame`, which throws without `GameProvider`; a harness has to keep those branches unmounted.
- Paraglide recompiling under a running `pnpm dev` once left the SSR runner unable to load a message file (500 on every request); a restart fixed it.

## Patterns settled (for `solid-2-conventions`)

- **Seeded live feed**: `createMemo(() => from<T | undefined>((set) => { set(undefined); return watchX(id, set); }))` for a feed whose reader draws an empty state; unseeded where a boundary already waits.
- **`watchLive(key, open)`** for a subscription that reopens when its subject changes; the key is a memo, null opens nothing.
- **A context value that changes is an accessor.**
- **Asked once opened**: `createMemo((was) => was === true || props.isOpen)` as the key of a read that should start on the first open and stay through the closing fade (`AddFriendDialog`'s code).
- **Run on opening only**: `createEffect(() => props.isOpen, (open) => { ... untrack(() => props.profile) ... })` when the apply needs other values but must not re-run on them.
- **A revision counter feeding async memos becomes `refresh(memo)`** in the handler that bumped it (auction board's buddy and sellable); the counter stays only where a child takes it as a prop.
- **Reads in a declaring body for a few numbers** get a small fallback-less `Loading` of their own rather than holding the parent.
- **`dynamic()`** where the component is reactive; a plain lookup where it is fixed for the render.

## Proposed learnings

- A context whose value changes carries an accessor | a provider reads its value once, in 1.x and 2.0 | `src/components` | partly (the dev warning; a lint on non-function provider values is not available)
- A subscription inside a memo guards `isServer` unless the component is browser-only | 2.0 runs `from`'s subscribe during SSR | `src/components` | no
- Seed a `from` feed whose reader draws an empty state | an unseeded feed holds the nearest `Loading` | `src/components` | no

## Verification

- `pnpm typecheck 2>&1 | grep -E 'src/components/(auctions|duels|friends|gifts|notifications|profile|quests|raids|trades|news|settings)'`: prints nothing. Whole branch: 232 errors before (154 in the owned paths), 77 after. No file outside the owned paths gained an error.
- `pnpm exec oxlint` per owned folder and on `app/watch.ts`, `app/settings.ts`, `app/Announcements.tsx` (through `rtk proxy`): exit 0 on each, warnings only (`no-unused-vars` in `auction-tab/rail.tsx`, `no-floating-promises` in `settings-tab/panes.tsx`, both untouched).
- `pnpm exec oxfmt --check src/components test/components`: clean.
- `pnpm exec vitest run test/components test/model test/auth` (news, create-load, auction, trade, raid-watch, search parsers, announcements): 34 files, 363 tests passed. No test folder is named after a social area.
- `grep ownedWrite` over the owned paths: none.
- Runtime, on `pnpm dev` with `pnpm db` and `pnpm seed`, a scratch harness module (deleted, never committed) injected into the page and driven by Playwright, signed in as the seeded alice: the announcements list (`watchLive`) went from 0 to 1 on an insert into the dev database and back to 0 on the delete, and `Announcements` showed the banner; `FriendsTab`'s blocked list showed the inserted block, named Bob through `FriendEntry`'s seeded profile feed, and emptied on the delete; a seeded `from` read `undefined` first and then the pushed value; `CreditsCard` drew its list; `NewsTab` drew a page and its heading line changed on picking another release. `pnpm db:stop` run, dev server killed, `ps` shows no vite or `pnpm dev`.
- Not run: `pnpm test`, `pnpm test:db`, `pnpm test:e2e`.
- Still owed once the shell renders: open each social screen in the app (auctions with a bid and a listing, a duel and a raid lobby, a trade offer, the profile sheet and its editor, quests with a claim, gifts, settings security).

## Size

- Estimated L, actual L.

# Outcome: ui-design-system

## Built

- **Boards**: the ten approved Field Kit files (nine `*.dc.html` boards and `canvas.json`) are in `docs/design/field-kit/`, copied unchanged from the maintainer's scratchpad.
- **Guide**: `docs/design/field-kit.md` holds the rules, every token, the motion table, the presets, reduce motion, what changed in each primitive, and the inventory rule.
- **Tokens** in `src/app.css`:
  - The board's day and night colours under the old names (`parchment`, `paper`, `ink`, `muted`, `line`, `line-soft`, `leaf`, `ember`, `gold`, `tide`, `arcane` and their `-dark` and `-soft`).
  - New colour tokens: `gold-dark`, `arcane-dark`, `on-gold`, and the button shades `--green-shade`, `--red-shade`, `--blue-shade`, `--yellow-shade`, `--violet-shade`.
  - Fonts: Nunito (`font-sans`) and Fredoka (`font-display`), loaded from Google Fonts with `display=swap`. The rounded system fallback and Hiragino Maru Gothic stay behind them.
  - Radii `rounded-chip` (8), `rounded-button` (12), `rounded-card` and `rounded-panel` (18), `rounded-sheet` (24).
  - Elevation `shadow-rest`, `shadow-pop`, `shadow-pop-lift`, `shadow-float`, `shadow-sheet`. Targets `size-target` (44px) and `size-square` (56px).
  - Motion: `--motion-tap|quick|base|move|scene` (90, 140, 240, 360, 560ms), their `-exit` twins at 70%, `--motion-stagger` (30ms), the distance tokens, `ease-settle`, `ease-spring`, `ease-exit`, `animate-rise`, `animate-hop`.
  - Reduce motion: under `.reduce-motion` the distances go to nothing and the durations to 120ms. Elements marked `motion-crossfade` fade over 120ms, and everything else keeps the 1ms floor. `motion-timer` keeps a timer bar at its real length.
- **Presets** in `src/components/styled/transition.ts`: `FADE` (dialog panel), new `GROW` (panel growing out of a control), `SHEER` (veil), new `DROP` with `dropOrigin(placement)` (dropped lists and menus), and new `RISE` (hover card, 140ms in and 98ms out on `--motion-quick-exit`). No preset leaves a scale or a translate on the resting state.
- **Primitives**. Every prop and behaviour is kept.
  - `Button`: board tones, a filled tone on its own shade, hover lift, a press that drops 3px and squashes, a spring release.
  - `Dialog`: 24px sheet. It springs in and leaves on the exit curve. The nameplate is a Fredoka tide pill that slides in 120ms later. New optional prop `origin?: Element | null` grows the panel out of that element and back into it.
  - `TabBar`: a pill track with a spring indicator. It falls back to the tab's own fill until measured.
  - `Menu`, `Select`, `Combobox`, `Filter`, search suggestions: `DROP` from the button's side.
  - `HoverCard`: opens after 300ms (`OPEN_DELAY`), 18px card, `RISE`.
  - Tooltip: rises in 140ms.
  - Toasts: spring in, leave in 168ms, a lifetime bar, timer and bar paused while hovered.
  - `Badge`: board chip tones.
  - `StatTile` and pager: Fredoka numbers.
  - `Switch`: knob springs across.
  - `RadioGroup` and inputs: token timing.
- **Demo**: `/demo/kit` (dev only) shows every primitive. `?dialog` and `?toast` open those.

## Deviations

- `src/routes/demo/kit.tsx` and `src/components/demo/KitDemo.tsx` are new and outside the owned paths. The captures needed one page with every primitive. Both are dev only, since the `/demo` layout answers 404 in a build.
- `text-gold` changed to `text-gold-dark` on words in 8 files outside the owned paths: `src/game/details.ts`, `src/components/forms/terms.tsx`, `src/components/app/GameMenu.tsx` (2 lines), `src/components/overworld/cell-notes.tsx`, `src/components/catches/catch-dialog/sections/StatsSection.tsx`, `src/components/items/ItemGrid.tsx`, `src/components/duels/DuelLobby.tsx`, `src/components/battle/UnitCard.tsx`. The board's gold (`#F2B33D`) is a fill and reads at about 1.9:1 on white. Icons, star glyphs and bars keep `text-gold` and `bg-gold`.
- Tooltips still open at once, not after 300ms. The brief lists "Hover card and Tooltip (300ms delay, rise)", but the board's 300ms is the hover card's ("was 400"), and the tooltip had no wait because a wait read as lag. Tooltips do get the rise. The maintainer should confirm.
- 44px targets and 56px squares are tokens only. Raising every button to 44px would change every screen's layout, which this node must not do.
- The bare `<button>` in the base layer drops but does not squash. Many rows and tabs opt out of the drop with `active:translate-y-0`, which would not stop a squash.

## Stubs left

- None.

## Handoffs

- The Motion board's hover card slides out sideways from the square it describes. `RISE` only rises 4px. The area node that redesigns the trays should give the card a slide that follows its placement.

## Gotchas

- Words in gold must use `text-gold-dark`. Plain `text-gold` is for fills, bars and icons.
- Night has no board values for ink, muted, line, line-soft or the page. The values here (`#E9F0FB`, `#9AA8C0`, `#2E3D5E`, `#1D2742`, `#0B1020`) were picked to sit on the board's night paper `#141C33`.
- `TabList` from terracotta did not call a `ref` before `onMount`. `TabBar` reaches the bar through its indicator's `parentElement`. It measures again when the bar or any tab resizes, on a selection or a relabel, and whenever a font finishes loading (`document.fonts` `loadingdone`).
- `Dialog`'s `origin` is read when the panel enters. Pass it from a signal (`origin={opener()}`), since a bare variable assigned by `ref` is still undefined when the JSX is built.
- `<meta name="theme-color">` in `src/entry-server.tsx` is still the old blue `#2a75bb`. It is outside the owned paths.
- Comments that were already in the touched `styled` files still have em-dashes. Only new prose was checked.
- Under reduce motion the tab indicator and the switch knob jump, since they move rather than fade. The changeset says so.

## Proposed learnings

- A transition preset never leaves a scale or a translate on its `entered` state | either one makes the element the containing block for `fixed` children | src/components/styled | no
- Words in gold use `text-gold-dark`, fills use `gold` | the gold fill is too pale to read on white | src/components | yes (a grep test over class strings)
- Mark a custom fade `motion-crossfade` and write its distances as `--motion-*` variables | reduce motion only reaches it that way | src/components | no

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm test --maxWorkers=2`: 281 files, 5826 tests passed.
- Captures: a Node and Playwright script ran against `pnpm dev`, with the dev database from `pnpm db`. It took before and after shots of `/demo/kit` (page, open menu, hover card, toast, dialog) in light and dark at 1280x900 and 390x844. The system board was rendered the same way and compared by eye.
- The same method checked that the tab indicator moves and the dialog's transform origin is set from `origin`. It checked that the dialog closes and unmounts with reduce motion on (panel transition 120ms). It checked that a hovered toast outlives its 4.5s lifetime and goes after the pointer leaves.

## Size

- Estimated L, actual L.

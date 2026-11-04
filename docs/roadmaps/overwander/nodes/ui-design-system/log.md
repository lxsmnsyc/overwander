# Log: ui-design-system

- 2026-11-04: Started on `feat/ui-design-system`. Nothing of the node existed yet. Copied the ten board files into `docs/design/field-kit/`.
- Added `/demo/kit` (dev only) showing every primitive, for the captures. Before shots taken against `pnpm dev` with the throwaway dev db (`pnpm db`, port 54324).
- Decisions: tooltips keep opening at once (their own doc says a wait read as lag); the 300ms wait is the hover card's. 44px targets become tokens only, since raising every button would change screen layouts.
- Tokens in `src/app.css` (colour day and night, fonts, radii, elevation, motion durations, easings, distances). Presets in `transition.ts`: FADE, GROW, SHEER, DROP, RISE.
- TabBar's ref on terracotta's `TabList` never fired before `onMount`; the indicator now finds the bar as its own parent.
- `text-gold` words moved to `text-gold-dark` in 8 files outside the owned paths (gold is now a pale fill). Icons and star glyphs keep `text-gold`.
- Checked in Playwright: tab indicator moves, dialog grows from its opener (transform origin set), dialog closes under reduce motion (120ms panel transition), toast stays while hovered and goes after.
- Checks: typecheck 0, lint 0, suite 281 files and 5826 tests passed (2 workers). `oxfmt src test` also reformatted 8 zenith YAML files and `test/overworld/encounter-shiny.test.ts`; left unstaged, not part of this node.
- Review fixes: TabBar re-measures on any tab's border-box resize and on font loadingdone (checked: pill follows the font swap 64 to 63px and a tab growing to 91px); RISE exits on new `--motion-quick-exit` (98ms); demo hover trigger is a kit Button; changeset says the tab pill and switch knob jump under reduce motion. Checks: typecheck 0, lint 0, 281 files and 5826 tests passed.

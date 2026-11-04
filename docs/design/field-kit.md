# Field Kit

Field Kit is the game's design system. Restyle every screen with these tokens and the primitives in `src/components/styled`, and follow the inventory rule at the end before you change a layout.

The spec is the boards in [field-kit/](field-kit/): `Main.dc.html` is the system and `Motion.dc.html` the motion. The other boards are the screens the area nodes start from. Open a board in a browser, or see the canvas in `field-kit/canvas.json`. To view the primitives in the game, run `pnpm dev` and open `/demo/kit`. `?dialog` opens the dialog and `?toast` pushes a toast that stays.

## Rules

- **The world first.** Chrome stays at the edges. Nothing covers the middle of the board unless the player asked for it.
- **Things have weight.** Panels have a 2px keyline and stand on a hard shadow plus a cast. A button squashes when pressed and lands when let go.
- **Motion has an origin.** A panel grows out of the control that opened it and returns to it. Exits are faster than entrances.
- **Colour is a word.** Each colour means one thing (table below). Never use one for decoration.
- **Pixels stay pixels.** Sprites are never smoothed or scaled by fractions. Stepped timing is for sprites only.

## Colour

All colours are in `src/app.css`. The token names did not change, so every component keeps its classes.

| token | means | day | night |
| --- | --- | --- | --- |
| `tide` | frames, place, focus | `#2360C8` | `#4A8BF0` |
| `leaf` | offers, go, health | `#1E8F52` | `#36B26F` |
| `ember` | cannot be undone, damage | `#D6372A` | `#F0584A` |
| `gold` | value, wind-up | `#F2B33D` | `#F7C969` |
| `arcane` | channelled, rare | `#6E46C9` | `#9C7BF0` |
| `paper` | panels | `#FFFFFF` | `#141C33` |
| `parchment` | the page | `#EEF4FC` | `#0B1020` |
| `ink` | text | `#14203A` | `#E9F0FB` |
| `muted` | quiet text | `#52627F` | `#9AA8C0` |
| `line` | keylines | `#C3D2E8` | `#2E3D5E` |
| `line-soft` | tracks, docks, tiles | `#E7EEF8` | `#1D2742` |

- Each hue also has `-soft` (a wash behind a chip) and `-dark` (words on a wash, the edge of a fill). At night `-dark` is the lighter sibling, since strength on a dark ground is light.
- Text on a fill is `text-on-accent` (white). Gold is the one exception: it takes `text-on-gold` (ink).
- Words in gold are `text-gold-dark`. Plain `gold` is too pale to read on white, so keep it for fills, bars and icons.
- `gold-dark` and `arcane-dark` are new. A filled button's shadow uses `--green-shade`, `--red-shade` or `--blue-shade`.

## Type

| role | face | size | Tailwind |
| --- | --- | --- | --- |
| display | Fredoka 600 | 40 | `font-display text-4xl font-semibold` |
| title | Fredoka 600 | 22 | `font-display text-xl font-semibold` |
| body | Nunito 400 | 15 | the default |
| label | Nunito 800, 0.12em, uppercase | 12 | `h4`, or `text-xs font-extrabold uppercase tracking-[0.12em]` |
| number | Fredoka 600, tabular | any | `font-display tabular-nums` |

- Fredoka is for names and numbers. Nunito is for everything read.
- Both load from Google Fonts with `display=swap`. Until they arrive the rounded system faces stand in, and Hiragino Maru Gothic covers Japanese.
- `h1` to `h3` are Fredoka in the base layer.

## Shape

| token | value | Tailwind |
| --- | --- | --- |
| chip radius | 8px | `rounded-chip` (same as `rounded-lg`) |
| button radius | 12px | `rounded-button` (same as `rounded-xl`) |
| card radius | 18px | `rounded-card`, `rounded-panel` |
| sheet radius | 24px | `rounded-sheet` |
| pill | full | `rounded-full` |
| target | 44px | `size-target`, `min-h-target` |
| grid square | 56px | `size-square` |

- Spacing is on a 4px grid, which is Tailwind's own scale.
- Elevation is `shadow-rest` (a control on the page), `shadow-pop` (a button), `shadow-float` (a menu, a card, a toast) and `shadow-sheet` (a dialog). Each is a hard edge, and the last two add a cast.

## Motion

| token | ms | for |
| --- | --- | --- |
| `--motion-tap` | 90 | a press |
| `--motion-quick` | 140 | a hover, a tooltip |
| `--motion-base` | 240 | a panel, a menu, a toast, a switch |
| `--motion-move` | 360 | a sheet, a tab indicator |
| `--motion-scene` | 560 | a battle coming in |

| easing | curve | for |
| --- | --- | --- |
| `ease-settle` | `cubic-bezier(.2,.8,.2,1)` | most moves |
| `ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | arrivals |
| `ease-exit` | `cubic-bezier(.5,0,.75,0)` | leaving |
| `steps(n)` | stepped | sprites only |

- Write a duration as `duration-(--motion-base)`.
- An exit takes 70% of its entrance: `--motion-quick-exit` (98), `--motion-base-exit` (168), `--motion-move-exit` (252), `--motion-scene-exit` (392).
- Lists stagger `--motion-stagger` (30ms) a row, for six rows at most.
- The hover card opens after 300ms (`OPEN_DELAY` in `src/components/styled/hover-delay.ts`). A tooltip still opens at once and rises into place in 140ms.

### The presets

`src/components/styled/transition.ts` holds the presets. Spread one into a terracotta `Transition` or `TransitionChild`.

| preset | what moves | use for |
| --- | --- | --- |
| `FADE` | springs in from 90% | a dialog's panel |
| `GROW` | springs out of a control from 15% | a dialog given `origin` |
| `SHEER` | opacity only | the veil behind a dialog |
| `DROP` | grows from its button's side | a menu, a listbox, a combobox; pair with `dropOrigin(placement)` |
| `RISE` | rises 4px, leaves in 98ms | a card placed against the window |

- The resting state never keeps a scale or a translate. Either one makes the element the containing block for anything `fixed` inside it.
- The `dialog-transitions` skill has the rest: the wrapper `Transition` never animates.

### Reduce motion

- The setting puts `.reduce-motion` on the root (`src/components/app/settings.ts`, `src/app.tsx`).
- Under it every move becomes a 120ms crossfade. The distance tokens (`--motion-grow`, `--motion-rise` and the rest) go to nothing, so a preset only fades.
- Everything else is cut to 1ms, not 0. A transition of 0ms never fires `transitionend`, and dialogs wait on it to unmount.
- So a thing that moves rather than fades, such as the tab indicator or the switch knob, jumps to its new place.
- Mark a fade of your own with `motion-crossfade` to get the 120ms. Mark a timer bar with `motion-timer` and set `--motion-timer`, so it keeps its real length.

## Primitives

| primitive | look and motion |
| --- | --- |
| `Button` | Tones as before. A filled tone stands on its own darker shade and brightens on hover. Hover lifts 1px, a press drops 3px and squashes to 98% by 94%, and release springs back in 90ms. |
| `Dialog` | 24px sheet, `shadow-sheet`. Springs in (360ms) and leaves on the exit curve (252ms). The nameplate is a tide pill in Fredoka that slides in 120ms after the sheet. New optional `origin` prop: the control that opened it, which the panel grows out of and returns to. |
| `DialogActions` | Unchanged: the dock, way out on the left. |
| `TabBar`, `TabButton` | Pill tabs on a `line-soft` track. An indicator springs to the selected tab (360ms). It measures again when any tab changes size and when the fonts finish loading. Before it has measured, the selected tab draws its own fill. |
| `Menu`, `Select`, `Combobox`, `Filter`, search suggestions | `DROP`: grow from the button's side on a spring. A phone sheet grows up from the bottom. |
| `HoverCard` | 18px card, opens after 300ms, `RISE`. |
| `TooltipHost` | No wait. Rises into place in 140ms. |
| Toasts | Drop in from above on a spring, leave in 168ms. A bar in the toast's colour shows the time left, and the toast and its bar pause while the pointer rests on it. |
| `Badge` | Board chips: a soft fill, a 40% keyline, words in `-dark`. |
| `StatTile`, pager | Numbers in Fredoka. |
| `Switch` | The knob springs across (240ms). |
| `RadioGroup`, `Slider`, inputs | Colours and timing from the tokens. Inputs show a tide edge on hover. |

The 44px target and 56px square are tokens only. The existing buttons keep their size, because a taller button changes every screen's layout. Each area node raises its own controls to `min-h-target` as it lays its screen out again.

## The inventory rule

Every area node follows this rule.

1. Before a screen is restyled or laid out anew, write its inventory from its `.tsx`. List every control, section and piece of state it shows.
2. Keep the inventory as a checklist in the node's log.
3. Every element keeps a place. Write each move as "from -> to, why".
4. Label anything new a proposal until the maintainer agrees to it.
5. A redesign may change layout and hierarchy. It may not lose an element.

The blue notes beside each screen board in `field-kit/canvas.json` are worked examples.

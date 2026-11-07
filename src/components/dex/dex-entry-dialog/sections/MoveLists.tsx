import { For, type JSX, Show } from 'solid-js';
import { TYPE_COLORS } from '../../../../data/constants/types';
import type { Moves } from '../../../../data/ids/moves';
import type { Species } from '../../../../data/ids/species';
import { getMoveData } from '../../../../data/moves';
import type { SpeciesData } from '../../../../data/species';
import MoveTooltip from '../../../moves/MoveTooltip';
import MoveCategorySprite from '../../../sprites/MoveCategorySprite';
import { Sigil } from '../../../sprites/TypeBadge';
import {
  CARD,
  CARD_TITLE,
  Hint,
  HintList,
  Note,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
  riseAfter,
} from '../../../styled';
import { listLevelMoves } from '../species-facts';
import { m } from '../../../../i18n/paraglide/messages.js';

/** Which list of moves is being read */
const enum MoveTab {
  Level = 0,
  Machines = 1,
  Egg = 2,
}

/** How big a move's type mark and category badge are drawn in a row */
const MARK_SIZE = 16;
const CATEGORY_SIZE = 36;

/** A tab's list, which scrolls inside the card on a wide screen */
const LIST = 'm-0 flex list-none flex-col p-0';

/** A tab's pane, the rest of the card's height */
const PANE = 'min-h-0 flex-1 overflow-y-auto';

/**
 * One move, as a row. The **level** is a column of its own on the far
 * left: a level-up list is read down that column ("what do I get
 * next"), and the numbers on the right line up under each other
 */
function MoveRow(props: { move: Moves; level?: number }): JSX.Element {
  const data = (): ReturnType<typeof getMoveData> => getMoveData(props.move);

  return (
    <li class="rounded-chip odd:bg-line-soft/60">
      {/* The whole row opens the move's card */}
      <MoveTooltip class="block" move={props.move}>
        <span
          class="grid grid-cols-[1.75rem_6px_minmax(0,1fr)_auto_auto_auto] items-center gap-x-2
            px-2 py-1 text-[13px] hover:bg-tide-soft"
        >
          <span class="font-display text-muted tabular-nums">{props.level ?? ''}</span>
          <span
            aria-hidden="true"
            class="h-[18px] rounded-[3px]"
            style={{ background: TYPE_COLORS[data().type] }}
          />
          <span class="truncate font-bold">{data().name}</span>
          <Sigil type={data().type} size={MARK_SIZE} />
          <MoveCategorySprite category={data().category} size={CATEGORY_SIZE} />
          <span class="min-w-[3.25rem] text-right font-display text-xs text-muted tabular-nums">
            <Show when={data().power != null} fallback={m.catch_pp_amount({ pp: data().pp })}>
              {m.dex_move_power_pp({ power: data().power ?? 0, pp: data().pp })}
            </Show>
          </span>
        </span>
      </MoveTooltip>
    </li>
  );
}

/** What it learns, by how it learns it, scrolling in its card */
export default function MoveLists(props: { species: Species; data: SpeciesData }): JSX.Element {
  return (
    <section class={`${CARD} min-h-0 md:h-full`} style={riseAfter(5)}>
      <span class="flex items-center gap-1.5">
        <h3 class={CARD_TITLE}>{m.catch_moves()}</h3>
        <Hint title={m.catch_moves_help()}>
          <HintList>
            <li>{m.dex_moves_help_level()}</li>
            <li>{m.dex_moves_help_machines()}</li>
            <li>{m.dex_moves_help_egg()}</li>
            <li>{m.dex_moves_help_hover()}</li>
          </HintList>
        </Hint>
      </span>
      <TabGroup horizontal defaultValue={MoveTab.Level} class="flex min-h-0 flex-1 flex-col gap-2">
        <TabBar>
          <TabButton value={MoveTab.Level}>{m.dex_tab_level()}</TabButton>
          <TabButton value={MoveTab.Machines}>{m.item_pocket_machines()}</TabButton>
          <TabButton value={MoveTab.Egg}>{m.ui_egg()}</TabButton>
        </TabBar>

        <TabPane value={MoveTab.Level} class={PANE}>
          <Show
            when={listLevelMoves(props.species).length}
            fallback={<Note>{m.dex_moves_none_level()}</Note>}
          >
            <ul class={LIST}>
              <For each={listLevelMoves(props.species)}>
                {([level, moves]) => (
                  <For each={moves}>{(move) => <MoveRow move={move} level={level} />}</For>
                )}
              </For>
            </ul>
          </Show>
        </TabPane>

        {/* One list rather than two: a machine and a tutor are the same
            question to a player holding the item */}
        <TabPane value={MoveTab.Machines} class={PANE}>
          <Show
            when={props.data.learnSet.teachable.length}
            fallback={<Note>{m.dex_moves_none_machines()}</Note>}
          >
            <ul class={LIST}>
              <For each={props.data.learnSet.teachable}>{(move) => <MoveRow move={move} />}</For>
            </ul>
          </Show>
        </TabPane>

        <TabPane value={MoveTab.Egg} class={PANE}>
          <Show
            when={(props.data.learnSet.egg ?? []).length}
            fallback={<Note>{m.dex_moves_none_egg()}</Note>}
          >
            <ul class={LIST}>
              <For each={props.data.learnSet.egg ?? []}>{(move) => <MoveRow move={move} />}</For>
            </ul>
          </Show>
        </TabPane>
      </TabGroup>
    </section>
  );
}

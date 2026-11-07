import { For, type JSX, Show } from 'solid-js';
import type { Moves } from '../../../../data/ids/moves';
import type { Species } from '../../../../data/ids/species';
import { getMoveData } from '../../../../data/moves';
import type { SpeciesData } from '../../../../data/species';
import MoveTooltip from '../../../moves/MoveTooltip';
import MoveCategorySprite from '../../../sprites/MoveCategorySprite';
import { Sigil } from '../../../sprites/TypeBadge';
import {
  DialogSection,
  Hint,
  HintList,
  List,
  Meta,
  Note,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
} from '../../../styled';
import { listLevelMoves } from '../species-facts';
import { m } from '../../../../i18n/paraglide/messages.js';

/** Which list of moves is being read */
const enum MoveTab {
  Level = 0,
  Machines = 1,
  Egg = 2,
}

/**
 * One move, as a row. The **level** is a column of its own on the far
 * left rather than a word among the numbers on the right: a level-up
 * list is read down that column ("what do I get next"), and a
 * right-aligned number lines the ones and the tens up under each other
 */
function MoveRow(props: { move: Moves; level?: number }): JSX.Element {
  return (
    <li class="list-none">
      {/* The whole row opens the move's card, so its type mark is a plain
          picture rather than a tooltip of its own */}
      <MoveTooltip class="block" move={props.move}>
        <span class="flex items-center justify-between gap-2 rounded-lg px-1 py-0.5 hover:bg-tide-soft">
          <span class="flex items-center gap-2">
            <Show when={props.level != null}>
              <span class="w-6 shrink-0 text-right text-sm font-semibold">{props.level}</span>
            </Show>
            <Sigil type={getMoveData(props.move).type} />
            <MoveCategorySprite category={getMoveData(props.move).category} />
            <span class="font-medium">{getMoveData(props.move).name}</span>
          </span>
          <Meta>
            <Show
              when={getMoveData(props.move).power != null}
              fallback={m.catch_pp_amount({ pp: getMoveData(props.move).pp })}
            >
              {m.dex_move_power_pp({
                power: getMoveData(props.move).power ?? 0,
                pp: getMoveData(props.move).pp,
              })}
            </Show>
          </Meta>
        </span>
      </MoveTooltip>
    </li>
  );
}

/** What it learns, by how it learns it */
export default function MoveLists(props: { species: Species; data: SpeciesData }): JSX.Element {
  return (
    <DialogSection
      title={m.catch_moves()}
      hint={
        <Hint title={m.catch_moves_help()}>
          <HintList>
            <li>{m.dex_moves_help_level()}</li>
            <li>{m.dex_moves_help_machines()}</li>
            <li>{m.dex_moves_help_egg()}</li>
            <li>{m.dex_moves_help_hover()}</li>
          </HintList>
        </Hint>
      }
    >
      <TabGroup horizontal defaultValue={MoveTab.Level} class="flex flex-col gap-3">
        <TabBar>
          <TabButton value={MoveTab.Level}>{m.dex_tab_level()}</TabButton>
          <TabButton value={MoveTab.Machines}>{m.item_pocket_machines()}</TabButton>
          <TabButton value={MoveTab.Egg}>{m.ui_egg()}</TabButton>
        </TabBar>

        <TabPane value={MoveTab.Level}>
          <Show
            when={listLevelMoves(props.species).length}
            fallback={<Note>{m.dex_moves_none_level()}</Note>}
          >
            <List>
              <For each={listLevelMoves(props.species)}>
                {([level, moves]) => (
                  <For each={moves}>{(move) => <MoveRow move={move} level={level} />}</For>
                )}
              </For>
            </List>
          </Show>
        </TabPane>

        {/* One list rather than two: a machine and a tutor are the same
            question to a player holding the item */}
        <TabPane value={MoveTab.Machines}>
          <Show
            when={props.data.learnSet.teachable.length}
            fallback={<Note>{m.dex_moves_none_machines()}</Note>}
          >
            <List>
              <For each={props.data.learnSet.teachable}>{(move) => <MoveRow move={move} />}</For>
            </List>
          </Show>
        </TabPane>

        <TabPane value={MoveTab.Egg}>
          <Show
            when={(props.data.learnSet.egg ?? []).length}
            fallback={<Note>{m.dex_moves_none_egg()}</Note>}
          >
            <List>
              <For each={props.data.learnSet.egg ?? []}>{(move) => <MoveRow move={move} />}</For>
            </List>
          </Show>
        </TabPane>
      </TabGroup>
    </DialogSection>
  );
}

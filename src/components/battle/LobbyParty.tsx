import { type Accessor, For, Loading, Show, createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { isShiny } from '../../model/caught-record';
import { isEgg } from '../../model/egg';
import { Genders, Species } from '../../data/ids/species';
import CatchCard from '../catches/CatchCard';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { titleCatch } from '../details';
import { type CaughtPokemon, getCaughtBatched } from '../../auth/caught';
import TeamStrip from '../catches/TeamStrip';
import { HoverCard, Note } from '../styled';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * One lobby party's live records, square for square. The reads live
 * here and are rendered a child down, so a party still arriving
 * suspends its own strip rather than the lobby around it
 */
export default function LobbyParty(props: {
  catches: string[];
  class?: string;
  /**
   * Drawn as a plain row of this many squares, with no tray around it,
   * for a party that already stands on something (a lobby's field)
   */
  flat?: number;
}): JSX.Element {
  // Keyed on the ids, so a lobby rebuilding its rows does not ask again
  const asked = createMemo(() => props.catches.join(','));
  const party = createMemo(async (): Promise<[string, CaughtPokemon][]> => {
    const key = asked();
    const pending: Promise<[string, CaughtPokemon | null]>[] = [];

    // Every party on screen asks in the same moment, so the whole lobby is one read
    for (const id of key.split(',')) {
      if (id === '') {
        continue;
      }
      pending.push(
        getCaughtBatched(id).then((caught): [string, CaughtPokemon | null] => [id, caught]),
      );
    }

    const rows = await Promise.all(pending);
    const found: [string, CaughtPokemon][] = [];

    for (const [id, caught] of rows) {
      if (caught != null) {
        found.push([id, caught]);
      }
    }
    return found;
  });

  return (
    <Loading fallback={<Note>{m.lobby_reading_party()}</Note>}>
      <Show when={props.flat} fallback={<PartyStrip party={party} class={props.class} />} keyed>
        {(size) => <PartyRow party={party} size={size} />}
      </Show>
    </Loading>
  );
}

function PartyStrip(props: {
  party: Accessor<[string, CaughtPokemon][]>;
  class?: string;
}): JSX.Element {
  // The boundary holds it through a re-read, so a party that changed
  // does not blink back to "Reading"
  return <TeamStrip catches={props.party()} class={props.class} />;
}

/** The party as a plain row of squares, the empty seats in it dashed */
function PartyRow(props: {
  party: Accessor<[string, CaughtPokemon][]>;
  size: number;
}): JSX.Element {
  const held = (): [string, CaughtPokemon][] => props.party();
  const open = (): number[] => {
    const left: number[] = [];

    for (let slot = held().length; slot < props.size; slot += 1) {
      left.push(slot);
    }
    return left;
  };

  return (
    <ul
      class="m-0 grid list-none gap-1 p-0"
      style={{ 'grid-template-columns': `repeat(${props.size}, minmax(0, 1fr))` }}
    >
      <For each={held()}>
        {([, caught]) => (
          <li class="aspect-square min-w-0">
            <HoverCard
              class="block size-full"
              title={titleCatch(caught)}
              quietTitle
              kind={m.battle_kind_pokemon()}
              trigger={
                <span
                  class="flex size-full items-end justify-center rounded-lg border-2 border-line-soft
                    bg-paper/85 p-0.5"
                >
                  <AnimatedSprite
                    species={isEgg(caught) ? Species.Egg : caught.species}
                    shiny={!isEgg(caught) && isShiny(caught)}
                    female={caught.gender === Genders.Female}
                    direction="Down"
                    still
                    fill
                    label=""
                  />
                </span>
              }
            >
              <CatchCard caught={caught} />
            </HoverCard>
          </li>
        )}
      </For>
      <For each={open()}>
        {() => (
          <li
            aria-hidden="true"
            class="aspect-square rounded-lg border-2 border-dashed border-line/70"
          />
        )}
      </For>
    </ul>
  );
}

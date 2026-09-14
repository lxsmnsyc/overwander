import { type JSX, type Resource, Suspense, createResource } from 'solid-js';
import { type CaughtPokemon, getCaught } from '../../auth/caught';
import TeamStrip from '../catches/TeamStrip';
import { Note } from '../styled';

/**
 * One lobby party's live records, square for square. The reads live
 * here and are rendered a child down, so a party still arriving
 * suspends its own strip rather than the lobby around it
 */
export default function LobbyParty(props: { catches: string[]; class?: string }): JSX.Element {
  const [party] = createResource(
    () => props.catches.join(','),
    async (key): Promise<[string, CaughtPokemon][]> => {
      const pending: Promise<[string, CaughtPokemon | null]>[] = [];

      for (const id of key.split(',')) {
        if (id === '') {
          continue;
        }
        pending.push(getCaught(id).then((caught): [string, CaughtPokemon | null] => [id, caught]));
      }

      const rows = await Promise.all(pending);
      const found: [string, CaughtPokemon][] = [];

      for (const [id, caught] of rows) {
        if (caught != null) {
          found.push([id, caught]);
        }
      }
      return found;
    },
  );

  return (
    <Suspense fallback={<Note>Reading the party…</Note>}>
      <PartyStrip party={party} class={props.class} />
    </Suspense>
  );
}

function PartyStrip(props: {
  party: Resource<[string, CaughtPokemon][]>;
  class?: string;
}): JSX.Element {
  return <TeamStrip catches={props.party() ?? []} class={props.class} />;
}

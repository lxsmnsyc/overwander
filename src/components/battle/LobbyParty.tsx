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
      const rows = await Promise.all(
        key
          .split(',')
          .filter(Boolean)
          .map(async (id): Promise<[string, CaughtPokemon | null]> => [id, await getCaught(id)]),
      );

      return rows.filter((row): row is [string, CaughtPokemon] => row[1] != null);
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

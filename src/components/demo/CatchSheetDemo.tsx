import { useSearchParams } from '@solidjs/router';
import { type JSX, createResource } from 'solid-js';
import { type CaughtPokemon, asCaughtPokemon } from '../../auth/caught-record';
import type { PokedexView } from '../../auth/pokedex';
import { Species } from '../../data/ids/species';
import { CatchSheetBody } from '../catches/catch-dialog/sheet';

/**
 * The catch sheet with a made-up pokemon, for looking at its layout
 * without an account. `?species=` picks the species by id
 */
export default function CatchSheetDemo(): JSX.Element {
  const [params] = useSearchParams();
  const species = (): Species => {
    const asked = Number(params.species);

    return Number.isFinite(asked) && asked > 0 ? asked : Species.Charizard;
  };
  const caught = (): CaughtPokemon =>
    asCaughtPokemon({
      owner: 'demo',
      species: species(),
      nickname: params.nickname ?? '',
      level: 36,
      ivs: 0x3fffffff,
      gender: 1,
      nature: 3,
      shiny: params.shiny === '1',
      favorite: true,
      moves: [],
      abilities: [],
      items: [],
      ball: 1,
      walked: 1240,
      caughtAt: new Date().toISOString(),
      origin: { timestamp: Date.now(), x: 0, y: 0, biome: 0 },
    });

  const [detail] = createResource(() => ({ id: 'demo', caught: caught() }));
  const [owners] = createResource(() => new Map<string, string>());
  const [dex] = createResource((): PokedexView => ({
    seenSpecies: 0,
    caughtSpecies: 0,
    seen: [],
    caught: [],
  }));
  const [evolutions] = createResource(() => []);
  const [no] = createResource(() => false);
  const [candies] = createResource(() => 42);
  const [bag] = createResource(() => []);
  const [buddy] = createResource((): string | null => null);

  return (
    <CatchSheetBody
      player="demo"
      catchId="demo"
      readOnly
      onClose={() => undefined}
      detail={detail}
      owners={owners}
      dex={dex}
      evolutions={evolutions}
      fighting={no}
      onlyOne={no}
      selling={no}
      candies={candies}
      bag={bag}
      buddy={buddy}
      onRecordChanged={() => undefined}
      onBagChanged={() => undefined}
      onBuddyChanged={() => undefined}
      onCandiesChanged={() => undefined}
      onEvolutionsChanged={() => undefined}
    />
  );
}

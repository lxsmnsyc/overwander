import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import { clientOnly } from '@solidjs/start';

/** The dex entry demo, loaded on the client like the other demos */
const PokedexDemo = clientOnly(async () => import('../../components/demo/PokedexDemo'));

export default function PokedexDemoPage(): JSX.Element {
  return (
    <>
      <Title>Pokedex demo · Overwander</Title>
      <PokedexDemo />
    </>
  );
}

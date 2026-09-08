import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import { clientOnly } from '@solidjs/start';

/**
 * The world demo, and nothing of it on the server.
 *
 * The page is a canvas the size of a quarter of a million cells, so
 * it is loaded on the client outright and the server sends the title
 * and a space for it
 */
const WorldDemo = clientOnly(async () => import('../../components/demo/WorldDemo'));

export default function WorldDemoPage(): JSX.Element {
  return (
    <>
      <Title>World demo · Overwander</Title>
      <WorldDemo />
    </>
  );
}

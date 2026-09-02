import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import { clientOnly } from '@solidjs/start';

/**
 * The shadow demo, and nothing of it on the server.
 *
 * The page is a canvas and a frame timer, neither of which exists
 * until a browser is here, so it is loaded on the client outright and
 * the server sends the title and a space for it
 */
const ShadowDemo = clientOnly(async () => import('../../components/demo/ShadowDemo'));

export default function ShadowDemoPage(): JSX.Element {
  return (
    <>
      <Title>Shadow demo · Overwander</Title>
      <ShadowDemo />
    </>
  );
}

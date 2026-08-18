import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import { clientOnly } from '@solidjs/start';

/**
 * The move demo, and nothing of it on the server.
 *
 * The page is a live battle: it stages an engine, runs a frame timer
 * and draws a canvas, none of which exists until a browser is here.
 * Rendering half of it server-side buys nothing and asks the client
 * to match markup that was drawn without any of the things the page
 * is about — so it is loaded on the client outright, and the server
 * sends the title and a space for it
 */
const MoveDemo = clientOnly(async () => import('../../components/demo/MoveDemo'));

export default function MoveDemoPage(): JSX.Element {
  return (
    <>
      <Title>Move demo · Poketerra</Title>
      <MoveDemo />
    </>
  );
}

import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import { clientOnly } from '@solidjs/start';

/**
 * The raid demo, and nothing of it on the server.
 *
 * Like the move demo beside it: the page stages an engine and runs a
 * frame timer, neither of which exists until a browser is here, so
 * the server sends the title and a space for it
 */
const RaidDemoBoard = clientOnly(async () => import('../../components/demo/RaidDemoBoard'));

export default function RaidDemo(): JSX.Element {
  return (
    <>
      <Title>Raid demo · Overwander</Title>
      <RaidDemoBoard />
    </>
  );
}

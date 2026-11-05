import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import { clientOnly } from '@solidjs/start';

/**
 * The gifts shelf on its own, for the browser tests: the real shelf for
 * the signed-in player, with no world behind it. Like every demo page it
 * answers 404 outside development (`../demo.tsx`)
 */
const GiftsDemo = clientOnly(async () => import('../../components/demo/GiftsDemo'));

export default function GiftsDemoPage(): JSX.Element {
  return (
    <>
      <Title>Gifts demo · Overwander</Title>
      <GiftsDemo />
    </>
  );
}

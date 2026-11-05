import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import { clientOnly } from '@solidjs/start';

/**
 * The auction board on its own, for the browser tests: the real board
 * for the signed-in player, with no world, canvas or position behind it.
 * Like every demo page it answers 404 outside development (`../demo.tsx`)
 */
const AuctionDemo = clientOnly(async () => import('../../components/demo/AuctionDemo'));

export default function AuctionDemoPage(): JSX.Element {
  return (
    <>
      <Title>Auction demo · Overwander</Title>
      <AuctionDemo />
    </>
  );
}

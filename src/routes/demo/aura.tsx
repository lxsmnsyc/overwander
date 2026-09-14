import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import { clientOnly } from '@solidjs/start';

/**
 * The aura demo, and nothing of it on the server: the auras are painted
 * on a canvas off a frame timer, neither of which exists until a
 * browser is here
 */
const AuraDemo = clientOnly(async () => import('../../components/demo/AuraDemo'));

export default function AuraDemoPage(): JSX.Element {
  return (
    <>
      <Title>Aura demo · Overwander</Title>
      <AuraDemo />
    </>
  );
}

import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import { clientOnly } from '@solidjs/start';

/** The design system's primitives on one page, loaded on the client like the other demos */
const KitDemo = clientOnly(async () => import('../../components/demo/KitDemo'));

export default function KitDemoPage(): JSX.Element {
  return (
    <>
      <Title>Field Kit demo · Overwander</Title>
      <KitDemo />
    </>
  );
}

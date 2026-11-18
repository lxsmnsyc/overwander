import { Title } from '@solidjs/meta';
import { type JSX, clientOnly } from '@solidjs/web';

/** The battle view's furniture over staged fights, loaded on the client like the other demos */
const BattleViewDemo = clientOnly(async () => import('../../components/demo/BattleViewDemo'));

export default function BattleViewDemoPage(): JSX.Element {
  return (
    <>
      <Title>Battle view demo · Overwander</Title>
      <BattleViewDemo />
    </>
  );
}

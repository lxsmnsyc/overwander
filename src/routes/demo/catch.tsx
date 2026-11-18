import { Title } from '@solidjs/meta';
import { type JSX, clientOnly } from '@solidjs/web';

/** The catch sheet demo, loaded on the client like the other demos */
const CatchSheetDemo = clientOnly(async () => import('../../components/demo/CatchSheetDemo'));

export default function CatchSheetDemoPage(): JSX.Element {
  return (
    <>
      <Title>Catch sheet demo · Overwander</Title>
      <CatchSheetDemo />
    </>
  );
}

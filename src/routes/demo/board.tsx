import { Title } from '@solidjs/meta';
import { type JSX, clientOnly } from '@solidjs/web';

/**
 * The board demo, and nothing of it on the server.
 *
 * The page is a canvas and a frame timer, neither of which exists
 * until a browser is here, so it is loaded on the client outright and
 * the server sends the title and a space for it
 */
const BoardDemo = clientOnly(async () => import('../../components/demo/BoardDemo'));

export default function BoardDemoPage(): JSX.Element {
  return (
    <>
      <Title>Board demo · Overwander</Title>
      <BoardDemo />
    </>
  );
}

import { Title } from '@solidjs/meta';
import { type JSX, clientOnly } from '@solidjs/web';

/** The teaser recording stage, client-only like the other demos */
const TeaserStage = clientOnly(async () => import('../../components/demo/teaser'));

export default function TeaserPage(): JSX.Element {
  return (
    <>
      <Title>Teaser stage · Overwander</Title>
      <TeaserStage />
    </>
  );
}

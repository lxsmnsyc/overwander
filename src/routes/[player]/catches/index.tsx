import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';
import type { JSX } from 'solid-js';
import CatchesList from '../../../components/CatchesList';

export default function CatchesPage(): JSX.Element {
  const params = useParams<{ player: string }>();

  return (
    <main>
      <Title>Catches - Poketerra</Title>
      <h1>Catches</h1>
      <CatchesList player={params.player} />
    </main>
  );
}

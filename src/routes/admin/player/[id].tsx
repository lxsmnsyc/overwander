import type { JSX } from '@solidjs/web';
import { useParams } from '@solidjs/router';
import AdminPlayer from '../../../components/admin/AdminPlayer';

/**
 * One account, opened from a row of the accounts. The uid comes out
 * of the path, so a page is a link somebody can keep
 */
export default function AdminPlayerPage(): JSX.Element {
  const params = useParams();

  return <AdminPlayer uid={params.id ?? ''} />;
}

import type { JSX } from 'solid-js';
import AdminPlayer from '../../../components/admin/AdminPlayer';
import { useParams } from '@solidjs/router';

/**
 * One account, opened from a row of the accounts. The uid comes out
 * of the path, so a page is a link somebody can keep
 */
export default function AdminPlayerPage(): JSX.Element {
  const params = useParams();

  return <AdminPlayer uid={params.id ?? ''} />;
}

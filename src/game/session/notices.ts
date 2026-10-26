import { type Notice, watchNotifications } from '../../auth/notifications';
import type { WritableStore } from '../store';

/**
 * Follow what is waiting on a player into `notices`, calling `fresh`
 * once per report that brings anything new. What was already waiting
 * at sign-in is not news, so the first report only fills the store.
 * Returns the stop
 */
export default function followNotices(
  uid: string,
  notices: WritableStore<Notice[]>,
  fresh: () => void,
): () => void {
  const heard = new Set<string>();
  let seeded = false;

  return watchNotifications(uid, (waiting) => {
    let news = false;

    for (const notice of waiting) {
      if (!heard.has(notice.id)) {
        heard.add(notice.id);
        news = true;
      }
    }
    if (news && seeded) {
      fresh();
    }
    seeded = true;
    notices.set(waiting);
  });
}

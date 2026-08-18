import { A } from '@solidjs/router';
import { For, type JSX } from 'solid-js';
import { linksFor } from '../../components/admin/sections';
import useStaff from '../../components/admin/staff-context';
import { Card, Note } from '../../components/styled';

/**
 * The way in: every section, with the sentence that says what it is
 * for. The sidebar is a list of words and this is the same list with
 * its reasons attached — which is what somebody opening the dashboard
 * for the first time needs
 */
export default function AdminOverview(): JSX.Element {
  const staff = useStaff();

  return (
    <div class="flex flex-col gap-4">
      <Card title="What this is">
        <Note>
          The staff side of Poketerra. Nothing here is part of the game a player sees, and every
          screen behind it is checked again on the server before it reads or changes anything.
        </Note>
      </Card>

      <div class="grid gap-3 sm:grid-cols-2">
        <For each={linksFor(staff.role()).filter((entry) => entry.href !== '/admin')}>
          {(entry) => (
            <A
              href={entry.href}
              class="flex flex-col gap-1 rounded-panel border-2 border-line bg-paper p-3 text-ink
                no-underline shadow-pop transition-colors hover:border-tide hover:text-ink"
            >
              <h3>{entry.title}</h3>
              <p class="text-sm text-muted">{entry.lede}</p>
            </A>
          )}
        </For>
      </div>
    </div>
  );
}

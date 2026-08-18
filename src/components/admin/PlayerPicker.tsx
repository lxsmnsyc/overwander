import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
} from 'solid-js';
import type { Listing, PlayerRow } from '../../auth/admin';
import { List, ListRow, Meta, Note, RowButton, Search } from '../styled';
import { listPlayers } from '../../auth/admin';

/**
 * Choosing one account out of all of them.
 *
 * A list this long is searched rather than scrolled, and the search
 * happens on the server — the addresses are in Firebase Auth, which
 * the browser cannot query. Only the first page of matches is offered:
 * somebody who cannot see who they meant should type more of the name
 */
export interface PlayerPickerProps {
  /** The uid that is picked, or an empty string while none is */
  value: string;
  onChange: (uid: string, nickname: string) => void;
}

function Matches(props: {
  found: Resource<Listing<PlayerRow>>;
  value: string;
  onChange: (uid: string, nickname: string) => void;
}): JSX.Element {
  const rows = (): PlayerRow[] => props.found()?.rows ?? [];

  return (
    <Show when={rows().length > 0} fallback={<Note>Nobody matches that.</Note>}>
      <List class="max-h-56 overflow-y-auto">
        <For each={rows()}>
          {(player) => (
            <ListRow selected={player.uid === props.value}>
              <RowButton
                pressed={player.uid === props.value}
                onClick={() => {
                  props.onChange(player.uid, player.nickname);
                }}
              >
                <span class="font-semibold">
                  {player.nickname === '' ? 'Unnamed trainer' : player.nickname}
                </span>{' '}
                <Meta>{player.email === '' ? player.uid : player.email}</Meta>
              </RowButton>
            </ListRow>
          )}
        </For>
      </List>
    </Show>
  );
}

export default function PlayerPicker(props: PlayerPickerProps): JSX.Element {
  const [search, setSearch] = createSignal('');
  const [found] = createResource(search, async (wanted) => listPlayers(wanted, 0));

  return (
    <div class="flex flex-col gap-2">
      <Search
        value={search()}
        placeholder="Name or address"
        onChange={(value) => {
          setSearch(value);
        }}
      />
      <Suspense fallback={<Note>Looking…</Note>}>
        <Matches found={found} value={props.value} onChange={props.onChange} />
      </Suspense>
    </div>
  );
}

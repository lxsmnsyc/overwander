import { A } from '@solidjs/router';
import { For, type JSX, type Resource, Show, Suspense, createResource, createSignal } from 'solid-js';
import type { Listing as ListingPage, PlayerRow } from '../../auth/admin';
import { Badge, List, ListRow, Meta, Note } from '../styled';
import { ADMIN_ROLE } from '../../auth/staff';
import Listing from './Listing';
import { listPlayers } from '../../auth/admin';
import namePlace from '../../overworld/place';

/**
 * Everybody who has ever signed in.
 *
 * A player is two records — the auth account holding the address and
 * the profile holding everything else — and the server joins them, so
 * a row here is the whole account whether or not it ever reached the
 * world.
 */

/** When the account was opened, said the way a date is said locally */
function opened(at: number): string {
  return Number.isNaN(at) ? 'unknown' : new Date(at).toLocaleDateString();
}

/**
 * The rows, which is where the listing is read. A read in the body
 * that declared it throws past every boundary written there, so the
 * reading half is a component of its own
 */
function PlayerList(props: {
  listing: Resource<ListingPage<PlayerRow>>;
  search: string;
  page: number;
  onSearch: (value: string) => void;
  onPage: (page: number) => void;
}): JSX.Element {
  const page = (): ListingPage<PlayerRow> =>
    props.listing() ?? { rows: [], total: 0, pages: 1, page: 0, capped: false };

  return (
    <Listing
      noun="accounts"
      placeholder="Name or address"
      search={props.search}
      onSearch={props.onSearch}
      page={page().page}
      pages={page().pages}
      total={page().total}
      capped={page().capped}
      onPage={props.onPage}
    >
      <List>
        <For each={page().rows}>
          {(player) => (
            <ListRow class="justify-between">
              {/* The whole of the left half opens the account: a row
                  is what somebody is looking for, so it is the row
                  that is pressed rather than a word at the end of it */}
              <A
                href={`/admin/player/${player.uid}`}
                class="flex min-w-0 grow flex-col text-ink no-underline hover:text-tide-dark"
              >
                <span class="font-semibold">
                  {player.nickname === '' ? 'Unnamed trainer' : player.nickname}
                </span>
                <Meta class="truncate">{player.email === '' ? player.uid : player.email}</Meta>
                {/* Where they left off. An account that never walked
                    anywhere says so rather than showing a chunk it
                    was never in */}
                <Show
                  when={player.position}
                  fallback={<Meta>has not walked anywhere</Meta>}
                >
                  {(at) => (
                    <Meta>
                      {namePlace(at().chunkX, at().chunkY)} · cell {at().cellX}, {at().cellY}
                    </Meta>
                  )}
                </Show>
              </A>
              <span class="flex flex-wrap items-center gap-2">
                {/* Staff is the one thing about an account worth
                    seeing at a glance; a player wears no badge for
                    being one */}
                {player.role === ADMIN_ROLE ? <Badge tone="tide">staff</Badge> : null}
                <Badge tone="gold">{player.gold} gold</Badge>
                <Meta>joined {opened(player.createdAt)}</Meta>
              </span>
            </ListRow>
          )}
        </For>
      </List>
    </Listing>
  );
}

export default function AdminPlayers(): JSX.Element {
  const [search, setSearch] = createSignal('');
  const [page, setPage] = createSignal(0);
  const [listing] = createResource(
    () => [search(), page()] as const,
    async ([wanted, at]) => listPlayers(wanted, at),
  );

  return (
    <Suspense fallback={<Note>Reading the accounts…</Note>}>
      <PlayerList
        listing={listing}
        search={search()}
        page={page()}
        onSearch={(value) => {
          setSearch(value);
        }}
        onPage={(at) => {
          setPage(at);
        }}
      />
    </Suspense>
  );
}

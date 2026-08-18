import { For, type JSX, type Resource, Suspense, createResource, createSignal } from 'solid-js';
import type { Listing as ListingPage, RaidRow } from '../../auth/admin';
import { Badge, List, ListRow, Meta, Note } from '../styled';
import Listing from './Listing';
import { RaidKind } from '../../auth/raid-record';
import { getSpeciesData } from '../../data/species';
import { listRaids } from '../../auth/admin';

/**
 * Every lobby the world has ever staged.
 *
 * A raid is written down when somebody walks up to a lair and opened
 * again by nobody, so this is a history rather than a list of what is
 * live: the newest window is the top of it, and what is still
 * gathering is whatever the top rows say is not cleared.
 */

/** What became of a lobby, which is three states rather than two */
function standing(raid: RaidRow): string {
  if (raid.cleared) {
    return 'cleared';
  }
  return raid.battle == null ? 'gathering' : 'fighting';
}

const KINDS: Record<RaidKind, string> = {
  [RaidKind.Legendary]: 'legendary',
  [RaidKind.Shadow]: 'shadow',
  [RaidKind.Mythical]: 'mythical',
};

/**
 * The window it stands in, as a wall clock. The stored instant is
 * already shifted into the zone that staged it, so it is printed as
 * if it were UTC — shifting it a second time by the reader's own zone
 * would say the raid opened somewhere it did not
 */
function windowAt(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 16).replace('T', ' ');
}

function RaidList(props: {
  listing: Resource<ListingPage<RaidRow>>;
  search: string;
  page: number;
  onSearch: (value: string) => void;
  onPage: (page: number) => void;
}): JSX.Element {
  const page = (): ListingPage<RaidRow> =>
    props.listing() ?? { rows: [], total: 0, pages: 1, page: 0, capped: false };

  return (
    <Listing
      noun="raids"
      placeholder="Lair name"
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
          {(raid) => (
            <ListRow class="justify-between">
              <span class="flex min-w-0 flex-col">
                <span class="font-semibold">{raid.title}</span>
                <Meta>
                  {getSpeciesData(raid.species).name} · ({raid.chunkX}, {raid.chunkY}) ·{' '}
                  {windowAt(raid.timestamp)}
                </Meta>
              </span>
              <span class="flex flex-wrap items-center gap-2">
                <Badge tone={raid.kind === RaidKind.Shadow ? 'ember' : 'tide'}>
                  {KINDS[raid.kind]}
                </Badge>
                {/* What became of it: cleared, being fought, or still
                    gathering a party */}
                <Badge tone={raid.cleared ? 'leaf' : 'neutral'}>{standing(raid)}</Badge>
                <Meta>
                  {raid.teams} {raid.teams === 1 ? 'team' : 'teams'} · hosted by{' '}
                  {raid.hostName === '' ? 'a trainer' : raid.hostName}
                </Meta>
              </span>
            </ListRow>
          )}
        </For>
      </List>
    </Listing>
  );
}

export default function AdminRaids(): JSX.Element {
  const [search, setSearch] = createSignal('');
  const [page, setPage] = createSignal(0);
  const [listing] = createResource(
    () => [search(), page()] as const,
    async ([wanted, at]) => listRaids(wanted, at),
  );

  return (
    <Suspense fallback={<Note>Reading the lobbies…</Note>}>
      <RaidList
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

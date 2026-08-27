import { type JSX, type Resource, createResource } from 'solid-js';
import { isLockLive } from '../../../auth/battle-lock';
import { getBuddy } from '../../../auth/buddy';
import { syncServerClock } from '../../../auth/clock';

import { type CaughtPokemon, countCaught, getCaught, listCaught } from '../../../auth/caught';

import { type PokedexView, getPokedex } from '../../../auth/pokedex';
import { getProfile } from '../../../auth/profile';

import { type InventoryEntry, getInventory } from '../../../auth/inventory';
import { getSellerStanding } from '../../../auth/auctions';
import { getCandyCount } from '../../../auth/candy';

import { useAuth } from '../../../auth/context';
import { listEvolutionOptions } from '../../../auth/evolution';

import { getSpeciesData } from '../../../data/species';

import { type CatchDialogProps, CatchSheetBody } from './sheet';

export type { CatchDialogProps };

/**
 * A catch and its children come back together, so the dialog opens on
 * a single read.
 *
 * What came back is handed over with the id it was asked for. The
 * sheet reads the resource's last value rather than suspending on it,
 * and a last value is only worth showing while it is still about the
 * pokemon on screen: without the id, opening a second catch would show
 * the first one for as long as the read took
 */
async function loadDetail(catchId: string): Promise<{ id: string; caught: CaughtPokemon | null }> {
  return { id: catchId, caught: await getCaught(catchId) };
}

/**
 * The sheet with its record read, which is where everything derived
 * from that record is asked for: what it can evolve into, whose
 * hands it has been through, its candies, and whether it is fighting.
 * All four are keyed on the record, so they belong to a body below
 * the one holding it
 */
function CatchSheet(
  props: CatchDialogProps & {
    detail: Resource<{ id: string; caught: CaughtPokemon | null }>;
    siblings: Resource<string[]>;
    dex: Resource<PokedexView>;
    onlyOne: Resource<boolean>;
    selling: Resource<boolean>;
    bag: Resource<InventoryEntry[]>;
    buddy: Resource<string | null>;
    onRecordChanged: () => void;
    onBagChanged: () => void;
    onBuddyChanged: () => void;
  },
): JSX.Element {
  const auth = useAuth();

  const owned = (): string | null => {
    const user = auth.user();

    if (props.readOnly === true) {
      return null;
    }
    return user != null && user.uid === props.player ? user.uid : null;
  };

  const view = (): CaughtPokemon | null => {
    const held = props.detail.latest;
    const loaded = held?.id === props.catchId ? held.caught : null;

    if (loaded == null) {
      return null;
    }
    return props.readOnly === true || loaded.owner === props.player ? loaded : null;
  };

  /**
   * What everyone who has owned it is called. Profiles are readable by
   * every signed-in player — that is what nicknames are for — and the
   * chain is short, so they are read once for the whole of it and
   * looked up by uid as the rows draw
   */
  const [owners] = createResource(
    () => [...new Set(view()?.history.map((entry) => entry.owner) ?? [])].sort().join(','),
    async (key): Promise<Map<string, string>> => {
      const named = new Map<string, string>();

      await Promise.all(
        key
          .split(',')
          .filter(Boolean)
          .map(async (uid) => {
            const profile = await getProfile(uid);

            if (profile != null) {
              named.set(uid, profile.nickname);
            }
          }),
      );
      return named;
    },
  );

  /**
   * Every one of these is keyed by a **string** rather than by the
   * record or a tuple of it.
   *
   * A source is compared by identity, and a re-read of the record
   * hands back a new object every time — so keying on one asks the
   * server all of this again after every favourite, nickname and
   * effort point, and, worse, leaves the resource loading. A read of
   * a loading resource throws, the sheet has no boundary of its own,
   * and the page's boundary catches it: the whole screen is torn down
   * and built again. Keyed by what actually decides the answer, an
   * unchanged pokemon is not asked about twice
   */
  const [evolutions, { refetch: refetchEvolutions }] = createResource(
    () => {
      const uid = owned();
      const catchId = props.catchId;

      return uid == null || catchId == null ? null : `${uid}/${catchId}/${view()?.species ?? ''}`;
    },
    async () => {
      const uid = owned();
      const catchId = props.catchId;

      return uid == null || catchId == null ? [] : listEvolutionOptions(uid, catchId);
    },
  );

  /**
   * Whether this pokemon is fighting right now. A battle runs on a
   * frozen snapshot of the party, so the record it was copied from
   * holds still until the fight ends — the server refuses the writes
   * either way; this is only so the buttons say so first
   */
  const [fighting] = createResource(
    () => {
      const loaded = view();

      return loaded == null ? null : `${props.catchId ?? ''}/${loaded.lockedAt}`;
    },
    async () => {
      const loaded = view();

      return loaded != null && isLockLive(loaded, await syncServerClock());
    },
  );

  /**
   * The candies behind this catch: the stack is keyed by family, so
   * every stage of the line spends the same pile
   */
  const [candies, { refetch: refetchCandies }] = createResource(
    () => {
      const species = view()?.species;

      return species == null ? null : `${props.player}/${getSpeciesData(species).family}`;
    },
    async (key) => {
      const [player, family] = key.split('/');

      return getCandyCount(player, Number(family));
    },
  );

  return (
    <CatchSheetBody
      {...props}
      owners={owners}
      evolutions={evolutions}
      fighting={fighting}
      candies={candies}
      onCandiesChanged={() => {
        Promise.resolve(refetchCandies()).catch(() => undefined);
      }}
      onEvolutionsChanged={() => {
        Promise.resolve(refetchEvolutions()).catch(() => undefined);
      }}
    />
  );
}

/**
 * One pokemon in full.
 *
 * Everything the sheet is drawn from is read below this body rather
 * than in it: a record still arriving would otherwise throw to the
 * boundary around the whole page and take the world with it
 */
export default function CatchDialog(props: CatchDialogProps): JSX.Element {
  const auth = useAuth();

  const owned = (): string | null => {
    const user = auth.user();

    if (props.readOnly === true) {
      return null;
    }
    return user != null && user.uid === props.player ? user.uid : null;
  };

  const [detail, { refetch }] = createResource(() => props.catchId, loadDetail);

  /**
   * The rest of the box, in the order the box draws it — newest first,
   * the same sort the picker uses, so "next" means the square to the
   * right of this one rather than some other order nobody can see.
   *
   * Read once per player rather than per pokemon: stepping through a
   * collection would otherwise pay for the whole listing at every
   * press. It goes stale when a record leaves the box, which is a
   * release or a listing — and both of those shut the sheet
   */
  const [siblings] = createResource(
    // Read again each time the sheet **opens** rather than once for
    // the session: a pokemon caught since the last look belongs in the
    // run. Stepping does not re-read it — the source is the player
    // rather than the pokemon — so walking a box of three hundred is
    // still one query
    () =>
      props.readOnly === true || props.onCatch == null || props.catchId == null
        ? null
        : props.player,
    async (player) =>
      (await listCaught(player))
        .sort(([, one], [, other]) => other.caughtAt.localeCompare(one.caughtAt))
        .map(([id]) => id),
  );

  /**
   * What the reader's dex says, read once for the whole sheet.
   *
   * It is the dex rather than this record because of what it is for:
   * the evolutions below are drawn to what the **player** has met, so
   * a line they have never seen the end of is a silhouette here the
   * same way it is in the dex
   */
  const [dex] = createResource(() => auth.user()?.uid ?? null, getPokedex);

  /**
   * Whether this is the only pokemon they have. The server refuses to
   * release it either way; this is so the button says so before it is
   * pressed twice
   */
  const [onlyOne] = createResource(
    () => owned(),
    async (uid) => (await countCaught(uid)) <= 1,
  );

  /**
   * What the player is carrying. The bag is read once and split
   * below: some of it can be handed over, some of it can be spent on
   * the pokemon, and the two lists move together when either does
   */
  /**
   * Keyed on the sheet as well as the owner, so each pokemon opened
   * re-reads it. The sheet is mounted for the whole session — it is
   * the route's, not a list's — so a bag read once on mount is the bag
   * as it was before the player had played: a new account's read
   * landed before the starter gift did, and Use item stayed empty for
   * good
   */
  const [bag, { refetch: refetchBag }] = createResource(
    () => (props.catchId == null ? null : owned()),
    async (uid) => getInventory(uid),
  );

  /**
   * Which catch is currently walking with the player, so the button
   * can say whether this is the one
   */
  const [buddy, { refetch: refetchBuddy }] = createResource(() => owned(), getBuddy);

  /**
   * Whether the player's one auction a day is still taking bids. The
   * menu's Auction entry goes dead while it is: the server would
   * refuse a second listing anyway, and a dialog opened only to be
   * refused is worse than a dead entry. Keyed on the sheet so a
   * listing made moments ago is seen the next time one opens
   */
  const [selling] = createResource(
    () => (props.catchId == null ? null : owned()),
    async (uid) => {
      const standing = await getSellerStanding(uid);

      if (standing == null) {
        return false;
      }
      return (await syncServerClock()) < standing.endsAt;
    },
  );

  return (
    <CatchSheet
      {...props}
      detail={detail}
      siblings={siblings}
      dex={dex}
      onlyOne={onlyOne}
      selling={selling}
      bag={bag}
      buddy={buddy}
      onRecordChanged={() => {
        Promise.resolve(refetch()).catch(() => undefined);
      }}
      onBagChanged={() => {
        Promise.resolve(refetchBag()).catch(() => undefined);
      }}
      onBuddyChanged={() => {
        Promise.resolve(refetchBuddy()).catch(() => undefined);
      }}
    />
  );
}

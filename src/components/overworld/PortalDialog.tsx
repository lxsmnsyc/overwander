import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';
import { getItemCount } from '../../auth/inventory';
import usePortalOnServer from '../../auth/portals';
import { type TownRecord, listTowns } from '../../auth/towns';
import { BIOME_NAMES } from '../../data/biome';
import { Items } from '../../data/ids/items';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { chunkOfCell } from '../../overworld/grid';
import type { PortalDestination } from '../../overworld/portal';
import {
  Button,
  Dialog,
  DialogActions,
  LIST_PAGE,
  List,
  ListRow,
  Meta,
  Note,
  RowButton,
  TextField,
  createPager,
  useToast,
} from '../styled';
import AtlasSprite from '../sprites/AtlasSprite';
import { OW_SPRITE_ROOT } from '../../canvas/ow-char-sprites';
import Landmark from '../../data/overworld/landmark';
import landmarkPicture, { LANDMARK_SHEET } from '../../data/overworld/landmark-sprite';
import describeWhere from '../../overworld/bearing';
import { CostBadge, CounterStep, CounterTerms, HeadingPortrait } from './npc-dialog/terms';
import { failed, readable } from '../app/resource-reads';
import playEffect, { Effect } from '../app/sound';

/** The portal beside the heading */
const PORTAL_SPRITE = 44;

/**
 * A portal, and the name of somewhere to come out.
 *
 * A crossing is named rather than picked off a map: towns are the one
 * part of the world with names of their own, and the box finishes a
 * name the player has started typing. Which names it knows is the
 * shared record of every town anybody has walked into, so somewhere a
 * friend found is somewhere this player can go.
 *
 * Everything about a named town is derived on both sides, its name
 * included, so the confirm is only the key changing hands and the
 * server's word that somebody has been there. A key is spent per
 * crossing, so the choice takes a second press
 */

export interface PortalDialogProps {
  player: string;
  /**
   * The chunk the portal stands in, and the cell it stands on — or
   * null when the player is not at one
   */
  snapshot: ChunkSnapshot | null;
  cell: number | null;
  onClose: () => void;
  /**
   * Where the player came out. Walking through is the client's to do:
   * the game stores no position, so the tab moves them
   */
  onTravel: (destination: PortalDestination) => void;
}

/**
 * What the portal has to say, which is where the keys and the towns
 * are read.
 *
 * A resource read in the body that declared it throws past every
 * `Suspense` written there and lands on the boundary around the page,
 * so the reading half is its own component under one of its own
 */
function PortalBody(
  props: PortalDialogProps & {
    keys: Resource<number>;
    towns: Resource<TownRecord[]>;
    onSpent: () => void;
    onDone: () => void;
  },
): JSX.Element {
  const toast = useToast();
  /**
   * The name the player has settled on. Naming is not going: the box
   * is typed into and the crossing is confirmed underneath it, so a
   * wrong name costs nothing until the button at the bottom
   */
  const [named, setNamed] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const towns = createMemo(() => props.towns() ?? []);
  const chosen = createMemo((): TownRecord | null => {
    const name = named();

    for (const town of towns()) {
      if (town.name === name) {
        return town;
      }
    }
    return null;
  });
  const [query, setQuery] = createSignal('');

  /** Where the player stands, for how far each town is */
  const here = (): { chunkX: number; chunkY: number } | null => {
    const snapshot = props.snapshot;

    return snapshot == null ? null : { chunkX: snapshot.chunk.x, chunkY: snapshot.chunk.y };
  };
  const chunkOf = (town: TownRecord): { x: number; y: number } => ({
    x: chunkOfCell(town.x),
    y: chunkOfCell(town.y),
  });
  const distance = (town: TownRecord): number => {
    const at = here();

    return at == null
      ? 0
      : Math.max(
          Math.abs(chunkOfCell(town.x) - at.chunkX),
          Math.abs(chunkOfCell(town.y) - at.chunkY),
        );
  };

  /** Every town the search names, nearest first */
  const listed = createMemo((): TownRecord[] => {
    const wanted = query().trim().toLowerCase();
    const found: TownRecord[] = [];

    for (const town of towns()) {
      if (wanted === '' || town.name.toLowerCase().includes(wanted)) {
        found.push(town);
      }
    }
    return found.sort((one, other) => distance(one) - distance(other));
  });
  const page = createPager(listed, LIST_PAGE);

  const close = (): void => {
    setNamed(null);
    setBusy(false);
    props.onDone();
  };

  const cross = (): void => {
    const snapshot = props.snapshot;
    const cell = props.cell;
    const town = chosen();

    if (snapshot == null || cell == null || town == null) {
      return;
    }
    setBusy(true);
    usePortalOnServer(snapshot, cell, town.regionX, town.regionY)
      .then((arrived) => {
        setBusy(false);

        if (arrived == null) {
          toast.push({
            message: 'The portal stayed shut. A key opens one, and only one.',
            tone: 'ember',
          });
          props.onSpent();
          return;
        }
        playEffect(Effect.PortalCross);
        props.onTravel(arrived);
        close();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        toast.push({
          message: caught instanceof Error ? caught.message : String(caught),
          tone: 'ember',
        });
      });
  };

  return (
    <>
      <CounterTerms
        cost={{ item: Items.PortalKey }}
        have={{
          amount: readable(props.keys) ?? 0,
          short: (readable(props.keys) ?? 0) === 0,
          unit: (readable(props.keys) ?? 0) === 1 ? 'Portal Key' : 'Portal Keys',
        }}
        often="One key a crossing"
      />
      <Show when={failed(props.keys)}>{(said) => <Note>{said()}</Note>}</Show>

      <Show
        when={towns().length > 0}
        fallback={<Note class="text-center">Nobody has walked into a town yet.</Note>}
      >
        <CounterStep>Choose a town</CounterStep>
        <TextField
          label="Town"
          placeholder="Search towns"
          value={query()}
          onChange={(typed) => {
            setQuery(typed);
          }}
        />
        <Show when={listed().length > 0} fallback={<Note>No town by that name.</Note>}>
          <List>
            <For each={page.shown()}>
              {(town) => (
                <ListRow selected={named() === town.name}>
                  <RowButton
                    pressed={named() === town.name}
                    disabled={busy()}
                    onClick={() => {
                      setNamed(town.name);
                    }}
                  >
                    {/* Two lines, since a far town's distance runs longer
                        than any column set aside for it */}
                    <span class="flex w-full min-w-0 flex-col text-left">
                      <span class="truncate font-semibold">{town.name}</span>
                      <Meta class="truncate tabular-nums">
                        {describeWhere(chunkOf(town), here())} · {BIOME_NAMES[town.biome]}
                      </Meta>
                    </span>
                  </RowButton>
                </ListRow>
              )}
            </For>
          </List>
          {page.controls()}
        </Show>
      </Show>

      <DialogActions>
        <Button
          tone="primary"
          disabled={busy() || chosen() == null || (readable(props.keys) ?? 0) === 0}
          label="Cross, 1 Portal Key"
          onClick={cross}
        >
          Cross <CostBadge cost={{ item: Items.PortalKey }} />
        </Button>
        <Button onClick={close}>Walk on</Button>
      </DialogActions>
    </>
  );
}

/**
 * A ring of standing stones and a way through it.
 *
 * The keys and the towns are read one component down, under this
 * boundary: a list still arriving replaces the inside of the panel
 * rather than the page the panel is standing on
 */
export default function PortalDialog(props: PortalDialogProps): JSX.Element {
  /**
   * Whether there is a key to spend. The server checks it again, but a
   * player should be told what the portal wants before they name a
   * town rather than after
   */
  const [keys, { refetch }] = createResource(
    () => (props.cell == null ? null : props.player),
    async (player) => getItemCount(player, Items.PortalKey),
  );
  /**
   * Everywhere anybody has been. Read while the portal is open rather
   * than held, since a town found while this player was walking is one
   * they should be able to name
   */
  const [towns] = createResource(
    () => props.cell != null,
    async () => listTowns(),
  );

  return (
    <Dialog
      isOpen={props.cell != null}
      onClose={props.onClose}
      title="Portal"
      lead={
        <HeadingPortrait>
          <AtlasSprite
            sheet={`${OW_SPRITE_ROOT}/${LANDMARK_SHEET}`}
            name={landmarkPicture(Landmark.Portal) ?? ''}
            size={PORTAL_SPRITE}
            label=""
          />
        </HeadingPortrait>
      }
      description="A ring of standing stones, and a way through to any town's plaza."
    >
      <Suspense fallback={<Note>Reading the register…</Note>}>
        <PortalBody
          {...props}
          keys={keys}
          towns={towns}
          onSpent={() => {
            Promise.resolve(refetch()).catch(() => undefined);
          }}
          onDone={props.onClose}
        />
      </Suspense>
    </Dialog>
  );
}

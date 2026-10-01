import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
} from 'solid-js';
import { type SwitchRow, listSwitches, setSwitch } from '../../auth/admin';
import { Badge, Button, Card, List, ListRow, Note, Status, Switch, TextField } from '../styled';

/**
 * The switches that close a part of the game, flipped live. A closed
 * part refuses new starts only, so nobody is stranded halfway through
 */

interface Part {
  feature: string;
  name: string;
  /** What it refuses while closed */
  covers: string;
}

/** In the order the server lists them, maintenance first */
const PARTS: Part[] = [
  {
    feature: 'everything',
    name: 'Maintenance',
    covers: 'Every call from a player without a role. Staff still get in.',
  },
  { feature: 'auctions', name: 'Auctions', covers: 'Putting a lot up and bidding on one.' },
  { feature: 'trades', name: 'Trades', covers: 'Offering a trade and accepting one.' },
  { feature: 'stops', name: 'Stops', covers: 'Walking into a stop and starting its fight.' },
  { feature: 'raids', name: 'Raids', covers: 'Opening, joining and starting a raid.' },
  { feature: 'duels', name: 'Duels', covers: 'Hosting, joining and starting a duel.' },
  { feature: 'gym-seats', name: 'Gym seats', covers: 'Taking a seat and challenging one.' },
  { feature: 'gifts', name: 'Gifts', covers: 'Claiming a mystery gift.' },
  { feature: 'townsfolk', name: 'Townsfolk', covers: 'Everything the town counters do.' },
  { feature: 'catching', name: 'Catching', covers: 'Throwing a ball or a treat in the safari.' },
  {
    feature: 'claims',
    name: 'World claims',
    covers: 'Caches, berries, apricorns, nests, phenomena and honey trees.',
  },
];

function SwitchLine(props: {
  part: Part;
  row: SwitchRow | undefined;
  onChanged: () => void;
}): JSX.Element {
  const [draft, setDraft] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const closed = (): boolean => props.row?.closed === true;
  const message = (): string => draft() ?? props.row?.message ?? '';

  const write = (wantClosed: boolean): void => {
    setBusy(true);
    setError(null);
    setSwitch(props.part.feature, wantClosed, message())
      .then(() => {
        setDraft(null);
        props.onChanged();
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <ListRow tone={closed() ? 'ember' : undefined} class="flex-col items-stretch">
      <Switch
        label={props.part.name}
        description={props.part.covers}
        checked={!closed()}
        disabled={busy()}
        onChange={(open) => {
          write(!open);
        }}
      />
      <Show when={closed()}>
        <Badge tone="ember" class="self-start">
          Closed
        </Badge>
      </Show>
      <div class="flex flex-wrap items-end gap-2">
        <TextField
          class="min-w-0 grow"
          label="Message"
          placeholder="Empty uses the game's own line"
          value={message()}
          disabled={busy()}
          onChange={(value) => {
            setDraft(value);
          }}
        />
        <Button
          disabled={busy() || draft() == null || draft() === (props.row?.message ?? '')}
          onClick={() => {
            write(closed());
          }}
        >
          Save message
        </Button>
      </div>
      <Status message={error()} tone="alert" />
    </ListRow>
  );
}

function SwitchList(props: {
  switches: Resource<SwitchRow[]>;
  onChanged: () => void;
}): JSX.Element {
  const rowFor = (feature: string): SwitchRow | undefined => {
    for (const row of props.switches() ?? []) {
      if (row.feature === feature) {
        return row;
      }
    }
    return undefined;
  };

  return (
    <List>
      <For each={PARTS}>
        {(part) => (
          <SwitchLine part={part} row={rowFor(part.feature)} onChanged={props.onChanged} />
        )}
      </For>
    </List>
  );
}

export default function AdminSwitches(): JSX.Element {
  const [switches, { refetch }] = createResource(listSwitches);

  return (
    <Card>
      <Note>
        A switch turned off closes that part at once: new starts are refused, while leaving,
        collecting and settling stay open.
      </Note>
      <Suspense fallback={<Note>Reading the switches…</Note>}>
        <SwitchList
          switches={switches}
          onChanged={() => {
            Promise.resolve(refetch()).catch(() => undefined);
          }}
        />
      </Suspense>
    </Card>
  );
}

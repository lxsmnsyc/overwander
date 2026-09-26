import {
  type JSX,
  type Resource,
  Show,
  Suspense,
  createEffect,
  createResource,
  createSignal,
} from 'solid-js';
import useBottleCap from '../../auth/bottle-caps';
import { type CaughtPokemon, getCaught } from '../../auth/caught';
import { isShiny } from '../../auth/caught-record';
import { MAX_IV, STAT_NAMES, STAT_ORDER, type Stats, getIV } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import { getSpeciesData } from '../../data/species';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Button, Dialog, DialogActions, Note, RadioGroup, Status } from '../styled';
import { describeIVs } from './catch-dialog/describe';

/**
 * Spending a Bottle Cap on the stat the player picks. Nothing leaves
 * the bag until the stat is chosen and the button pressed, since a
 * polished value cannot be taken back
 */
export interface BottleCapDialogProps {
  /** Whose values are being polished, or null when the dialog is shut */
  catchId: string | null;
  onClose: () => void;
  /** Fired once the value has actually moved, so whatever is behind can re-read the record */
  onUsed?: (said: string) => void;
}

/** The choosing itself, where the record is read, so a record still arriving does not take the panel with it */
function CapBody(
  props: BottleCapDialogProps & {
    caught: Resource<CaughtPokemon | null>;
    onRead: () => void;
  },
): JSX.Element {
  const [chosen, setChosen] = createSignal<Stats | null>(null);
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const valueOf = (stat: Stats): number => {
    const record = props.caught();

    return record == null ? 0 : getIV(record.ivs, stat);
  };

  // Open on a stat that can take it, the lowest, since that is the one
  // most players are here for
  createEffect(() => {
    const record = props.caught();
    const current = chosen();

    if (record == null || (current != null && valueOf(current) < MAX_IV)) {
      return;
    }
    let lowest: Stats | null = null;

    for (const stat of STAT_ORDER) {
      if (valueOf(stat) < MAX_IV && (lowest == null || valueOf(stat) < valueOf(lowest))) {
        lowest = stat;
      }
    }
    setChosen(lowest);
  });

  const options = (): { value: Stats; label: string; description: string; disabled: boolean }[] => {
    const rows: { value: Stats; label: string; description: string; disabled: boolean }[] = [];

    for (const stat of STAT_ORDER) {
      const value = valueOf(stat);

      rows.push({
        value: stat,
        label: STAT_NAMES[stat],
        description: value < MAX_IV ? `${value} → ${MAX_IV}` : `Already ${MAX_IV}`,
        disabled: value >= MAX_IV,
      });
    }
    return rows;
  };

  const use = (): void => {
    const catchId = props.catchId;
    const stat = chosen();

    if (catchId == null || stat == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    useBottleCap(catchId, Items.BottleCap, stat)
      .then((ivs) => {
        setBusy(false);

        if (ivs == null) {
          setStatus(
            'The Bottle Cap could not be used. The stat may already be perfect, or you may no longer have one.',
          );
          // What the record says may be what refused it
          props.onRead();
          return;
        }
        props.onUsed?.(`${STAT_NAMES[stat]} is ${MAX_IV} now: ${describeIVs(ivs)}.`);
        setChosen(null);
        props.onClose();
      })
      .catch((thrown: unknown) => {
        setBusy(false);
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  return (
    <>
      <Show when={props.caught()} fallback={<Note>Reading the record…</Note>}>
        {(record) => (
          <div class="flex justify-center">
            <AnimatedSprite
              species={record().species}
              shiny={isShiny(record())}
              animation={SpriteAnim.Idle}
              direction="Down"
              scale={4}
              shadow
              label={getSpeciesData(record().species).name}
            />
          </div>
        )}
      </Show>

      <Show
        when={chosen() != null || props.caught() == null}
        fallback={<Note>Every value is already perfect.</Note>}
      >
        <RadioGroup
          label="Stat"
          value={chosen()}
          options={options()}
          onChange={(stat) => {
            setChosen(stat);
          }}
        />
      </Show>

      <Status message={status()} />

      <DialogActions>
        <Button disabled={busy()} onClick={props.onClose}>
          Cancel
        </Button>
        <Button
          tone="primary"
          disabled={busy() || chosen() == null || valueOf(chosen() ?? STAT_ORDER[0]) >= MAX_IV}
          onClick={use}
        >
          {busy() ? 'Using…' : 'Use Bottle Cap'}
        </Button>
      </DialogActions>
    </>
  );
}

/** Spending a Bottle Cap on one stat of a pokemon's choosing */
export default function BottleCapDialog(props: BottleCapDialogProps): JSX.Element {
  const [caught, { refetch }] = createResource(() => props.catchId, getCaught);

  return (
    <Dialog
      isOpen={props.catchId != null}
      onClose={props.onClose}
      title="Bottle Cap"
      description={`Raises one value to ${MAX_IV}. Choose which, since nothing takes it back.`}
    >
      <Suspense fallback={<Note>Reading the record…</Note>}>
        <CapBody
          {...props}
          caught={caught}
          onRead={() => {
            Promise.resolve(refetch()).catch(() => undefined);
          }}
        />
      </Suspense>
    </Dialog>
  );
}

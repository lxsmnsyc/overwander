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
import { isShiny } from '../../model/caught-record';
import { MAX_IV, STAT_NAMES, STAT_ORDER, type Stats, getIV } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import { Genders } from '../../data/ids/species';
import { getItemData } from '../../data/items';
import { getSpeciesData } from '../../data/species';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Button, Dialog, DialogActions, Note, RadioGroup, Status } from '../styled';
import { describeIVs } from './catch-dialog/describe';
import describeFailure from '../../i18n/refusals';
import { m } from '../../i18n/paraglide/messages.js';

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
        description: value < MAX_IV ? `${value} → ${MAX_IV}` : m.catch_cap_already({ max: MAX_IV }),
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
          setStatus(m.catch_cap_failed({ item: getItemData(Items.BottleCap).name }));
          // What the record says may be what refused it
          props.onRead();
          return;
        }
        props.onUsed?.(
          m.catch_cap_used({ stat: STAT_NAMES[stat], max: MAX_IV, ivs: describeIVs(ivs) }),
        );
        setChosen(null);
        props.onClose();
      })
      .catch((thrown: unknown) => {
        setBusy(false);
        setStatus(describeFailure(thrown));
      });
  };

  return (
    <>
      <Show when={props.caught()} fallback={<Note>{m.catch_reading_record()}</Note>}>
        {(record) => (
          <div class="flex justify-center">
            <AnimatedSprite
              species={record().species}
              female={record().gender === Genders.Female}
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
        fallback={<Note>{m.catch_cap_all_perfect()}</Note>}
      >
        <RadioGroup
          label={m.catch_cap_stat()}
          value={chosen()}
          options={options()}
          onChange={(stat) => {
            setChosen(stat);
          }}
        />
      </Show>

      <Status message={status()} />

      <DialogActions>
        <Button
          tone="primary"
          disabled={busy() || chosen() == null || valueOf(chosen() ?? STAT_ORDER[0]) >= MAX_IV}
          onClick={use}
        >
          {busy() ? m.catch_using() : m.catch_use_item({ item: getItemData(Items.BottleCap).name })}
        </Button>
        <Button disabled={busy()} onClick={props.onClose}>
          {m.battle_cancel()}
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
      title={getItemData(Items.BottleCap).name}
      description={m.catch_cap_description({ max: MAX_IV })}
    >
      <Suspense fallback={<Note>{m.catch_reading_record()}</Note>}>
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

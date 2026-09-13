import { type JSX, createSignal } from 'solid-js';
import type { InventoryEntry } from '../../../../auth/inventory';
import { reviveFossil } from '../../../../auth/npcs';
import type { Items } from '../../../../data/ids/items';
import { FOSSIL_BENCH_LIMIT } from '../../../../data/overworld/fossil';
import { isFossil } from '../../../../data/items';
import { FOSSIL_SPECIES } from '../../../../data/items/fossils';
import { getSpeciesData } from '../../../../data/species';
import { describeItem } from '../../../details';
import InventoryPicker from '../../../items/InventoryPicker';
import AnimatedSprite from '../../../sprites/AnimatedSprite';
import { Button, Detail, DialogActions, useToast } from '../../../styled';
import playEffect, { Effect } from '../../../app/sound';
import { type CounterProps, refusal } from '../shared';
import { ReviveCounter } from './goods';

/**
 * The fossil scientist: put the rocks on the bench and see what was in
 * them.
 *
 * The bench is opened the way the vendor's crate is sold from — a
 * fossil pressed, then how many of it — because a player carrying
 * four of the same rock wants them all opened rather than four
 * presses and four round trips. What comes out is the fossil's own
 * business rather than anybody's choice
 */
export default function Scientist(props: CounterProps): JSX.Element {
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);
  const [bench, setBench] = createSignal(false);

  /** What is in the bag that he can open */
  const fossils = (): InventoryEntry[] =>
    (props.bag.latest ?? []).filter((entry) => isFossil(entry.item) && entry.amount > 0);

  /** What is inside this rock, which is the whole of what a player is choosing */
  const inside = (item: Items): string => {
    const species = FOSSIL_SPECIES.get(item);

    return species == null ? '' : getSpeciesData(species).name;
  };

  const openRocks = (item: Items, amount: number): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setBusy(true);
    reviveFossil(snapshot, standing[0], item, amount)
      .then((revived) => {
        setBusy(false);

        if (revived == null || revived.length === 0) {
          toast.push({
            message: 'Nothing came of it. Those rocks are not in your bag any more.',
            tone: 'ember',
          });
          return;
        }
        // Once for the handover, however many rocks were on the
        // bench: one sound a pokemon is six sounds over each other
        playEffect(Effect.PokemonGet);
        // Said over the counter rather than under it: the bench is
        // cleared for the next rock the moment this one is open, and a
        // line in the panel would go with it
        for (const one of revived) {
          toast.push({
            title: getSpeciesData(one.species).name,
            message: `Level ${one.level}, out of ${describeItem(item)}.${
              one.shiny ? ' It sparkles.' : ''
            }`,
            art: () => (
              <span class="flex size-8 items-center justify-center">
                <AnimatedSprite
                  species={one.species}
                  shiny={one.shiny}
                  direction="DownLeft"
                  fill
                  still
                  label=""
                />
              </span>
            ),
            tone: 'leaf',
          });
        }
        props.onTraded();
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        toast.push({ message: refusal(caught), tone: 'ember' });
      });
  };

  return (
    <>
      <ReviveCounter carrying={fossils().length} />
      <DialogActions>
        <Button
          tone="primary"
          disabled={busy() || fossils().length === 0}
          onClick={() => {
            setBench(true);
          }}
        >
          Open a fossil
        </Button>
        {props.walkOn()}
      </DialogActions>

      <InventoryPicker
        open={bench()}
        keepOpen
        onClose={() => {
          setBench(false);
        }}
        player={props.player}
        title="On the bench"
        terse
        description="Press a fossil, then say how many of it to open."
        verb="Revive"
        entries={fossils()}
        disabled={busy()}
        value={null}
        counts
        empty="You are carrying nothing he can open."
        // What is in the rock, where the rock is being decided on: the
        // square is a fossil and every fossil looks like a fossil
        card={(entry) => <Detail label="Inside">{inside(entry.item)}</Detail>}
        most={(entry) => Math.min(FOSSIL_BENCH_LIMIT, entry.amount)}
        onPick={(item, amount) => {
          if (item != null && amount > 0) {
            openRocks(item, amount);
          }
        }}
      />
    </>
  );
}

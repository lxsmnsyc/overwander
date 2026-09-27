import { type JSX, Show, createSignal } from 'solid-js';
import { tradeWithTrader } from '../../../../auth/npcs';
import { isEgg } from '../../../../auth/egg';
import { isFavorite, isGuarded } from '../../../../auth/caught-record';
import { SPAWN_RARITY_NAMES, getSpawnRarity } from '../../../../data/biome';
import { getSpeciesData } from '../../../../data/species';
import type { Encounter } from '../../../../overworld/encounter';
import { deriveTraderPokemon, paysForOffer } from '../../../../overworld/trader';
import CatchBox, { type BoxEntry } from '../../../catches/CatchBox';
import playEffect, { Effect } from '../../../app/sound';
import Npc from '../../../../data/overworld/npc';
import { Button, DialogActions, DialogSection, Meta, useToast } from '../../../styled';
import { CounterSpent, CounterStep, PickOne } from '../terms';
import { type CounterProps, NPC_SPENT, optionsOf, refusal, useSaying } from '../shared';

/**
 * The trader: six pokemon from far off, and any one of them for one of
 * yours from the same band. Pick his first, then yours. His six are
 * derived from the window, so they need no read of their own
 */
export default function Trader(props: CounterProps): JSX.Element {
  const said = useSaying();
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);
  const [chosen, setChosen] = createSignal<number | null>(null);
  /** Which of the player's own goes the other way */
  const [giving, setGiving] = createSignal<string | null>(null);

  /** His six, as the player would receive each of them */
  const offers = (): Encounter[] => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return [];
    }

    const derived: Encounter[] = [];

    for (const spawn of snapshot.getTraderOffer(standing[0])) {
      derived.push(deriveTraderPokemon(snapshot, spawn, props.player));
    }
    return derived;
  };

  const entries = (): BoxEntry[] => {
    const boxed: BoxEntry[] = [];

    for (const [at, one] of offers().entries()) {
      boxed.push({
        id: String(at),
        species: one.species,
        shiny: one.shiny,
        egg: false,
        progress: 0,
        fainted: false,
        mark: chosen() === at ? 'picked' : undefined,
        label: `${getSpeciesData(one.species).name}, level ${one.level}`,
      });
    }
    return boxed;
  };

  const picked = (): Encounter | undefined => {
    const at = chosen();

    return at == null ? undefined : offers().at(at);
  };

  const trade = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const at = chosen();
    const offer = picked();
    const catchId = giving();

    if (snapshot == null || standing == null || at == null || offer == null || catchId == null) {
      return;
    }
    setBusy(true);
    tradeWithTrader(snapshot, standing[0], at, catchId)
      .then((arrived) => {
        setBusy(false);

        if (arrived == null) {
          said('He would not take that one. Your buddy, or one you cannot part with.', 'ember');
          return;
        }
        playEffect(Effect.ItemSlot);
        toast.push({
          title: getSpeciesData(offer.species).name,
          message: 'Traded. It arrives ready for anything a trade brings on.',
          tone: 'leaf',
        });
        setChosen(null);
        setGiving(null);
        props.onTraded();
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        said(refusal(caught), 'ember');
      });
  };

  const done = (): boolean => props.spent.latest === true;

  return (
    <>
      <DialogSection class="flex flex-col gap-3">
        <Show when={!done()} fallback={<CounterSpent says={NPC_SPENT[Npc.Trader] ?? ''} />}>
          <CounterStep>Choose one of his</CounterStep>
          <CatchBox
            entries={entries()}
            columns={3}
            capacity={entries().length}
            onOpen={(id) => {
              setChosen(Number(id));
              setGiving(null);
            }}
          />
          <Show when={picked()}>
            {(offer) => (
              <>
                <Meta class="block">
                  {getSpeciesData(offer().species).name}, level {offer().level}. He takes any of
                  yours that is {SPAWN_RARITY_NAMES[getSpawnRarity(offer().species)]}.
                </Meta>
                <PickOne
                  options={optionsOf(props)}
                  picked={giving()}
                  onPick={(next) => {
                    setGiving(next);
                  }}
                  busy={busy()}
                  verb="Give"
                  empty="You have nothing of that sort to give."
                  filter={(option) =>
                    !isEgg(option.caught) &&
                    !option.fighting &&
                    !isFavorite(option.caught) &&
                    !isGuarded(option.caught) &&
                    paysForOffer(option.caught.species, offer().species)
                  }
                />
              </>
            )}
          </Show>
        </Show>
      </DialogSection>
      <DialogActions>
        <Show when={!done()}>
          <Button
            tone="primary"
            disabled={busy() || picked() == null || giving() == null}
            onClick={trade}
          >
            Trade
          </Button>
        </Show>
        {props.walkOn()}
      </DialogActions>
    </>
  );
}

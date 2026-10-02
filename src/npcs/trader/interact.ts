import { isFavorite, isGuarded } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { tradeWithTrader } from '../../auth/npcs';
import { SPAWN_RARITY_NAMES, getSpawnRarity } from '../../data/biome';
import { getSpeciesData } from '../../data/species';
import type { Encounter } from '../../overworld/encounter';
import { deriveTraderPokemon, paysForOffer } from '../../overworld/trader';
import playEffect, { Effect } from '../../components/app/sound';
import type { BoxEntry } from '../../components/catches/CatchBox';
import { PickBoxForm } from '../../components/forms/pick-box';
import { PickCatchForm } from '../../components/forms/pick-catch';
import type { NpcScript } from '../create';

/**
 * The trader: six pokemon from far off, and any one of them for one of
 * yours from the same band. His six are derived from the window, so
 * they need no read of their own
 */
const trader: NpcScript = async (visit) => {
  const offers: Encounter[] = [];
  const entries: BoxEntry[] = [];

  for (const spawn of visit.snapshot.getTraderOffer(visit.cell)) {
    offers.push(deriveTraderPokemon(visit.snapshot, spawn, visit.player));
  }
  for (const [at, one] of offers.entries()) {
    entries.push({
      id: String(at),
      species: one.species,
      shiny: one.shiny,
      egg: false,
      progress: 0,
      fainted: false,
      label: `${getSpeciesData(one.species).name}, level ${one.level}`,
    });
  }

  const chosen = await visit.form(PickBoxForm, {
    entries,
    step: 'Choose one of his',
    action: 'Next',
  });

  if (chosen == null) {
    return;
  }

  const at = Number(chosen);
  const offer = offers[at];
  const band = SPAWN_RARITY_NAMES[getSpawnRarity(offer.species)];
  const giving = await visit.form(
    PickCatchForm,
    {
      player: visit.player,
      action: 'Trade',
      verb: 'Give',
      empty: 'You have nothing of that sort to give.',
      filter: (option) =>
        !isEgg(option.caught) &&
        !option.fighting &&
        !isFavorite(option.caught) &&
        !isGuarded(option.caught) &&
        paysForOffer(option.caught.species, offer.species),
    },
    {
      line: `${getSpeciesData(offer.species).name}, level ${offer.level}. I will take any of yours that is ${band}.`,
    },
  );

  if (giving == null) {
    return;
  }
  if ((await tradeWithTrader(visit.snapshot, visit.cell, at, giving[0].id)) == null) {
    await visit.say('Not that one. Your buddy, or one you cannot part with.');
    return;
  }
  playEffect(Effect.ItemSlot);
  visit.notify({
    title: getSpeciesData(offer.species).name,
    message: 'Traded. It arrives ready for anything a trade brings on.',
    tone: 'leaf',
  });
  visit.changed();
  await visit.say('A fair trade. Look after it for me.');
};

export default trader;

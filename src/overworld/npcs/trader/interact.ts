import { Genders } from '../../../data/ids/species';
import { isFavorite, isGuarded } from '../../../model/caught-record';
import { isEgg } from '../../../model/egg';
import { tradeWithTrader } from '../../../auth/npcs';
import { SPAWN_RARITY_NAMES, getSpawnRarity } from '../../../data/biome';
import { getSpeciesData } from '../../../data/species';
import type { Encounter } from '../../encounter';
import { deriveTraderPokemon, paysForOffer } from '../../trader';
import playEffect, { Effect } from '../../../components/app/sound';
import type { BoxEntry } from '../../../components/catches/CatchBox';
import { PickBoxForm } from '../../../components/forms/pick-box';
import { PickCatchForm } from '../../../components/forms/pick-catch';
import { m } from '../../../i18n/paraglide/messages.js';
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
      female: one.gender === Genders.Female,
      egg: false,
      progress: 0,
      fainted: false,
      label: m.npc_trader_label({ name: getSpeciesData(one.species).name, level: one.level }),
    });
  }

  const chosen = await visit.form(PickBoxForm, {
    entries,
    step: m.npc_trader_step(),
    action: m.npc_trader_next(),
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
      action: m.npc_trader_action(),
      verb: m.npc_trader_verb(),
      empty: m.npc_trader_empty(),
      filter: (option) =>
        !isEgg(option.caught) &&
        !option.fighting &&
        !isFavorite(option.caught) &&
        !isGuarded(option.caught) &&
        paysForOffer(option.caught.species, offer.species),
    },
    {
      line: m.npc_trader_line({
        name: getSpeciesData(offer.species).name,
        level: offer.level,
        band,
      }),
    },
  );

  if (giving == null) {
    return;
  }
  if ((await tradeWithTrader(visit.snapshot, visit.cell, at, giving[0].id)) == null) {
    await visit.say(m.npc_trader_refused());
    return;
  }
  playEffect(Effect.ItemSlot);
  visit.notify({
    title: getSpeciesData(offer.species).name,
    message: m.npc_trader_toast(),
    tone: 'leaf',
  });
  visit.changed();
  await visit.say(m.npc_trader_done());
};

export default trader;

import 'server-only';
import { Acquisition, asCaughtPokemon, isAuctionableCatch } from '../auth/caught-record';
import { ITEM_STACKS } from '../auth/stacks';
import { getMaxHealth, getStats, rescaleHealth } from '../auth/health';
import { getTimeOfDay } from '../data/ids/biome';
import { toLocalTime } from '../auth/local-time';
import { Balls, type Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import { Genders, type Species } from '../data/ids/species';
import type { EvolutionContext, EvolutionData } from '../data/species';
import {
  getConsumedItem,
  getSpeciesData,
  getSpentHeldItem,
  meetsEvolutionCriteria,
} from '../data/species';
import { Metric } from '../auth/quest-record';
import { isEggRecord, isGuardedRecord, withoutHeld } from './catch-fields';
import { recordFoundSpecies } from './pokedex';
import { type ProgressBump, bumpProgress } from './quest-progress';
import { readStackIn, writeStackIn } from './stacks';
import { readCaughtIn, updateCaughtIn } from './caught-io';
import { insertCaughtIn } from './caught';
import { tx } from './db';
import { isCatchLocked } from './locks';
import { asNumber, asNumberArray } from './read';
import { asBoolean } from '../auth/__normalize';

/**
 * Evolving, written with admin credentials. An evolution turns a
 * common pokemon into a rare one and spends a stone doing it, so the
 * criteria (level, held item, carried item) are checked here against
 * the stored rows and never taken from the caller.
 *
 * Resolves the new species, or null when the evolution is refused:
 * the catch is not the player's, the species is not one of its
 * evolutions, a condition is unmet, or the required item is gone
 */
export default async function evolveCatch(
  uid: string,
  catchId: string,
  into: Species,
  offset = 0,
  locale = '',
): Promise<Species | null> {
  let spent: Items | null = null;
  let from: Species | null = null;
  let sparkles = false;
  const husks: Species[] = [];
  const huskBalls: Items[] = [];
  const evolved = await tx(async (transaction) => {
    const caught = await readCaughtIn(transaction, catchId);

    // A pokemon in a live battle fights as the species its snapshot
    // froze, so it evolves once the fight is over and not before —
    // and an egg has to become a pokemon before it can become a
    // different one
    if (
      caught == null ||
      caught.owner !== uid ||
      isCatchLocked(caught) ||
      isEggRecord(caught) ||
      isGuardedRecord(caught)
    ) {
      return null;
    }

    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const species = asNumber(caught.species) as Species;
    // Every road to that species, since one shape can be reached by
    // more than one: a Feebas turns on a Prism Scale or on being
    // raised fond enough
    const roads: EvolutionData[] = [];

    for (const entry of getSpeciesData(species).evolvesInto ?? []) {
      // A husk is only ever left beside another evolution
      if (entry.species === into && entry.shed !== true) {
        roads.push(entry);
      }
    }

    if (roads.length === 0) {
      return null;
    }

    // Read off the stored record rather than taken from the caller: a
    // trade evolution is opened by the handover the server wrote, not
    // by a client saying one happened
    const context: EvolutionContext = {
      species,
      level: asNumber(caught.level),
      // Filled in below, once the criteria have said what to look for
      carried: new Set<Items>(),
      // The catch carries what it holds, so the criteria read the
      // same row the species change is written back to
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      held: new Set(asNumberArray(caught.items) as Items[]),
      // Its own move set, read off the row: a move evolution asks what
      // the pokemon has actually learned
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      moves: new Set(asNumberArray(caught.moves) as Moves[]),
      // Settled at the handover rather than re-read here: the server
      // wrote it, so a client saying it was traded changes nothing
      canEvolve: asBoolean(caught.canEvolve),
      // Derived from the stored record rather than reported: what a
      // Tyrogue becomes is decided by the numbers the server holds
      stats: getStats(asCaughtPokemon(caught)),
      friendship: asNumber(caught.friendship),
      // The server's instant in the player's zone: a day evolution is
      // not opened by a client saying the sun is up, but it is their sun
      time: getTimeOfDay(toLocalTime(Date.now(), offset)),
      // Written when it was met and never since: what a Wurmple spins
      // is settled the moment it is caught
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      gender: asNumber(caught.gender) as Genders,
    };
    // The road taken is the first one open, which decides what is
    // spent: a handover that does not cover the evolution pays a
    // Linking Cord for the half it would have covered
    let evolution: EvolutionData | null = null;
    let consumed: Items | null = null;
    let stock = 0;

    for (const road of roads) {
      // Only the item this road actually needs is read; the rest of
      // the bag has no bearing on the criteria
      const wanted = getConsumedItem(road, context.canEvolve);
      const held = wanted == null ? 0 : await readStackIn(transaction, ITEM_STACKS, uid, wanted);

      context.carried = wanted != null && held > 0 ? new Set([wanted]) : new Set<Items>();

      if (meetsEvolutionCriteria(road, context)) {
        evolution = road;
        consumed = wanted;
        stock = held;
        break;
      }
    }

    if (evolution == null) {
      return null;
    }

    if (consumed != null) {
      await writeStackIn(transaction, ITEM_STACKS, uid, consumed, stock - 1);
      spent = consumed;
    }
    from = species;
    // An evolution is a bigger pokemon, not a healed one: the share
    // of health it had is what it keeps, so a Charmander at half
    // stays a Charmeleon at half
    const record = asCaughtPokemon(caught);

    sparkles = record.shiny;

    const whole = getMaxHealth({ ...record, species: into });
    // The swap would have eaten it, so the cord standing in for the
    // swap does: a Seadra that pulled the cord arrives without its
    // Dragon Scale, the way a traded one does
    const worn = getSpentHeldItem(evolution, context.canEvolve);

    await updateCaughtIn(transaction, catchId, {
      species: into,
      ...(worn == null ? {} : { items: withoutHeld(record.items, worn) }),
      // Spent by the evolution it opened, and cleared by any other
      // change of shape: a handover earned by one species is never
      // read by the next one up
      canEvolve: false,
      // No Gen 1 line evolves into a legendary, so this changes
      // nothing today. It is written anyway because the day a line
      // does, a silent wrong answer here would be very hard to see
      auctionable: isAuctionableCatch({ ...record, species: into }),
      health: rescaleHealth(record.health, getMaxHealth(record), whole),
      maxHealth: whole,
    });

    // What comes out beside it, in the same transaction as the ball it
    // is left in: a Nincada becoming a Ninjask leaves a Shedinja
    for (const entry of getSpeciesData(species).evolvesInto ?? []) {
      if (entry.shed !== true) {
        continue;
      }
      const wanted = getConsumedItem(entry);
      const stocked = wanted == null ? 0 : await readStackIn(transaction, ITEM_STACKS, uid, wanted);
      const carried = wanted != null && stocked > 0 ? new Set([wanted]) : new Set<Items>();

      if (!meetsEvolutionCriteria(entry, { ...context, carried })) {
        continue;
      }
      if (wanted != null) {
        await writeStackIn(transaction, ITEM_STACKS, uid, wanted, stocked - 1);
        huskBalls.push(wanted);
      }

      const husk = getSpeciesData(entry.species);

      // The mainline copies the level, values, nature, moves and
      // sparkle, and nothing it held; the ability is the husk's own
      await insertCaughtIn(
        transaction,
        uid,
        {
          spawn: '',
          player: uid,
          type: record.type,
          species: entry.species,
          level: record.level,
          individualValue: record.individualValue,
          traitValue: record.traitValue,
          ivs: record.ivs,
          nature: record.nature,
          ability: husk.abilities[0],
          abilities: [...husk.abilities],
          gender: husk.genderRatio == null ? Genders.Genderless : record.gender,
          lair: null,
          shiny: record.shiny,
          shadow: false,
          moves: record.moves,
          items: [],
          timestamp: record.origin.timestamp,
          x: record.origin.x,
          y: record.origin.y,
          biome: record.origin.biome,
          ...(record.origin.place == null ? {} : { place: record.origin.place }),
        },
        Balls.PokeBall,
        Acquisition.Shed,
        Date.now(),
        offset,
        locale,
      );
      husks.push(entry.species);
    }
    return into;
  });

  // oxlint-disable-next-line typescript/no-unnecessary-condition
  if (evolved != null && from != null) {
    // The dex counts what the player has held, and after this they
    // hold one of these. Seen is written alongside caught: nothing
    // ever staged a meeting with the shape it just became
    await recordFoundSpecies(uid, evolved, sparkles);
    for (const husk of husks) {
      await recordFoundSpecies(uid, husk, sparkles);
    }

    const bumps: ProgressBump[] = [[Metric.Evolutions, from, 1]];

    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (spent != null) {
      bumps.push([Metric.ItemUses, spent, 1]);
    }
    for (const ball of huskBalls) {
      bumps.push([Metric.ItemUses, ball, 1]);
    }
    await bumpProgress(uid, bumps);
  }
  return evolved;
}

import { BASE_FRIENDSHIP } from '../data/constants/friendship';
import type { CatchSnapshot } from '../auth/catch-snapshot';
import { getMaxHealth } from '../auth/health';
import {
  DEFAULT_ABILITY_SLOTS,
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
  packSlots,
} from '../data/constants/slots';
import { getBannedBossMoves } from '../data/overworld/boss-moves';
import { MAX_LEVEL } from '../data/constants/levels';
import { MAX_EFFORT_PER_STAT, MAX_IV, PERFECT_IVS, Stats } from '../data/constants/stats';
import Abilities from '../data/ids/abilities';
import type { Moves } from '../data/ids/moves';
import { Species } from '../data/ids/species';
import { deriveAbility, deriveGender, deriveMoves, deriveNature, deriveSize } from './encounter';

/**
 * A raid boss is a maxed legendary: the fight is meant to need a
 * party, not a lucky level gap
 */
export const RAID_BOSS_LEVEL = MAX_LEVEL;

/**
 * The alliance the raid boss fights under; every player team shares
 * the other one, so the whole lobby is allied against it
 */
export const BOSS_ALLIANCE = 0;
export const PLAYER_ALLIANCE = 1;

/**
 * The reward comes at a fixed level rather than a rolled one, so
 * clearing the same raid is worth the same to everyone. A legendary
 * arrives half-grown; a shadow, being the commoner prize, arrives
 * lower still
 */
export const LEGENDARY_RAID_REWARD_LEVEL = 50;
export const SHADOW_RAID_REWARD_LEVEL = 25;

/**
 * What clearing one pays, on top of the pokemon.
 *
 * A raid pays each fighter the same purse — the boss decides the
 * amount, not who landed the last hit — so these stay flat where a
 * stop's is rolled. What they are worth is read off the same ladder
 * the stops are, at the middle of the rung each raid belongs to: a
 * shadow raid is a gym leader's afternoon and a legendary is one of
 * the Elite Four.
 *
 * A mythical sits under the Champion's middle rather than on it,
 * because a raid pays everybody who fought it where a champion pays
 * one winner. It is still the largest purse in the game, which the
 * relic spent to open it has to be worth
 */
export const SHADOW_RAID_GOLD = 35000;
export const LEGENDARY_RAID_GOLD = 80000;
export const MYTHICAL_RAID_GOLD = 200000;

/**
 * The level a mythical arrives at. Lower than a legendary's, the way
 * the games have always handed mythicals over — the prize is the
 * pokemon itself, not what it comes ready to do
 */
export const MYTHICAL_RAID_REWARD_LEVEL = 30;

/**
 * The highest an individual value goes; a raid boss has them all
 */
export const PERFECT_IV = MAX_IV;

/**
 * A boss is trained as far as anything can be. Nothing raised it, so
 * there is nobody for the effort to have come from: it is what a raid
 * is, the species at the most it could ever be
 */
function maxEffortValues(): Record<Stats, number> {
  return {
    [Stats.HP]: MAX_EFFORT_PER_STAT,
    [Stats.Attack]: MAX_EFFORT_PER_STAT,
    [Stats.Defense]: MAX_EFFORT_PER_STAT,
    [Stats.SpecialAttack]: MAX_EFFORT_PER_STAT,
    [Stats.SpecialDefense]: MAX_EFFORT_PER_STAT,
    [Stats.Speed]: MAX_EFFORT_PER_STAT,
  };
}

/**
 * The four moves a boss is staged with: what its species knows at
 * `RAID_BOSS_LEVEL`, less the ones a boss may never have. The ban is
 * applied before the four are taken, so a species with more to draw
 * on still comes with a full set
 */
export function getBossMoves(species: Species): Moves[] {
  return deriveMoves(species, RAID_BOSS_LEVEL, getBannedBossMoves(species));
}

/**
 * Species that are never staged as a boss, whatever the draw says.
 *
 * **Ditto** is the list. What it does is become something else, and a
 * boss is the one thing in the game that must not: the copy would
 * take a player's stats and throw away the raid-sized health pool the
 * fight is built around. Banning Transform already stops the copying,
 * but that leaves a Ditto with nothing at all to do — the answer is
 * that Ditto is not a raid boss rather than that Ditto is a quiet one
 */
export const BANNED_BOSS_SPECIES = new Set<Species>([Species.Ditto]);

/**
 * Whether the species can be a boss at all: not one of the banned
 * ones, and with something left to cast once the banned moves are
 * taken off it.
 *
 * The second half is a rule rather than a list, so a later ban cannot
 * quietly strand a species with an empty move list — it drops out of
 * the draw on its own
 */
export function canStageBoss(species: Species): boolean {
  return !BANNED_BOSS_SPECIES.has(species) && getBossMoves(species).length > 0;
}

/**
 * The raid boss as a catch snapshot, so a battle builds it from the
 * same shape as a player's party. Its individual values are perfect
 * and its effort values zero; the nature and ability come from the
 * raid's trait value, which every player in the lobby shares. It
 * belongs to no catch record, so its `caught` id is empty. A shadow
 * boss carries the Shadow ability on top of the Boss one
 */
export function createRaidBossSnapshot(
  species: Species,
  traitValue: number,
  shadow = false,
): CatchSnapshot {
  // The lobby shares the raid's trait value, so every player fights a
  // boss of exactly the same build
  const size = deriveSize(species, traitValue);

  return {
    caught: '',
    species,
    level: RAID_BOSS_LEVEL,
    ivs: PERFECT_IVS,
    effortValues: maxEffortValues(),
    nature: deriveNature(traitValue),
    // The boss reads its own gender ratio, the same way a spawn
    // does; only a genderless species comes out genderless
    gender: deriveGender(species, traitValue),
    height: size.height,
    weight: size.weight,
    // A boss never sparkles, and a shadow one carries the bit its
    // ability list already says it does
    shiny: false,
    shadow,
    // A boss is staged without the moves a boss must not have: see
    // getBannedBossMoves for what is on that list and why
    moves: getBossMoves(species),
    // A boss is staged rather than raised, so nothing has been spent
    // on what it knows
    movePoints: {},
    // The Boss ability is what makes it a raid: the health pool, the
    // stage immunities and the sweeping single-target moves all ride
    // on it, alongside the species' own rolled ability
    abilities: shadow
      ? [Abilities.Boss, Abilities.Shadow, deriveAbility(species, traitValue)]
      : [Abilities.Boss, deriveAbility(species, traitValue)],
    items: [],
    // The Boss ability and the shadow are both special, so all a boss
    // needs room for is the one it rolled
    slots: packSlots(DEFAULT_ABILITY_SLOTS, DEFAULT_ITEM_SLOTS, DEFAULT_MOVE_SLOTS),
    // A boss stands for no record either, and every lobby faces it at
    // full strength
    health: getMaxHealth({
      species,
      level: RAID_BOSS_LEVEL,
      ivs: PERFECT_IVS,
      effortValues: maxEffortValues(),
    }),
    // Nothing has raised it, so it thinks of nobody
    friendship: BASE_FRIENDSHIP,
    statuses: 0,
  };
}

/**
 * Build one battle unit from a frozen catch
 */

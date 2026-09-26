import { describe, expect, it } from 'vitest';
import registerBiomeSpawns from '../../src/data/biome';
import registerAbilities from '../../src/data/abilities';
import { Types } from '../../src/data/constants/types';
import { ItemFlags, ItemTypes, Items } from '../../src/data/ids/items';
import registerItems, { getItemData } from '../../src/data/items';
import { registerMoves } from '../../src/data/moves';
import { ITEM_POOL, getItemBand, isPreciousItem } from '../../src/data/overworld/item-pool';
import { isMarketable } from '../../src/data/overworld/vendor';
import { isHeartScale } from '../../src/data/items/heart-scale';
import { MEDICINES } from '../../src/data/items/medicine';
import { GEMS, GEM_PRICE } from '../../src/data/items/gems';
import { FOUND_GEAR, GEAR_PRICE, MARKET_GEAR, isGear } from '../../src/data/items/gear';
import { INCENSES, INCENSE_PRICE, INCENSE_TYPES } from '../../src/data/items/incenses';
import { BATTLE_ITEMS, BATTLE_ITEM_PRICE, isBattleItem } from '../../src/data/items/battle-items';
import { ONE_SHOTS, ONE_SHOT_PRICE, isOneShot } from '../../src/data/items/one-shots';
import { DRINKS, isDrink } from '../../src/data/items/drinks';
import { isSacredAsh } from '../../src/data/items/sacred-ash';
import {
  FOUND_TRINKETS,
  MARKET_TRINKETS,
  TRINKETS,
  TRINKET_PRICE,
  isTrinket,
} from '../../src/data/items/trinkets';
import { LUCK_INCENSE_BONUS } from '../../src/overworld/items/incenses';
import { AMULET_COIN_BONUS } from '../../src/overworld/items/trinkets';
import { ORBS, ORB_PRICE } from '../../src/data/items/orbs';
import { PLATES, PLATE_RESALE } from '../../src/data/items/plates';
import {
  GENERAL_STAT_BOOSTERS,
  RELIC_STAT_BOOSTERS,
  STAT_BOOSTER_PRICE,
} from '../../src/data/items/stat-boosters';
import { TYPE_BOOSTERS, TYPE_BOOSTER_PRICE } from '../../src/data/items/type-boosters';
import { registerSpecies } from '../../src/data/species';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

describe('type-enhancing items', () => {
  it('gives every attacking type one booster', () => {
    const boosted = [...TYPE_BOOSTERS.values()];

    // One item per type, and no type twice
    expect(new Set(boosted).size).toBe(boosted.length);
    // Every type a move can be, except the two that never attack
    for (let type = Types.Normal; type <= Types.Fairy; type++) {
      expect(new Set(boosted).has(type)).toBe(true);
    }
  });

  it('holds them rather than using them, and stocks them', () => {
    for (const item of TYPE_BOOSTERS.keys()) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Nothing consumes one: a Charcoal burns as long as it is held
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.flags & ItemFlags.Usable).toBe(0);
      // Bought, not found
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(TYPE_BOOSTER_PRICE);
      expect(data.sell).toBeLessThan(data.buy);
    }

    // Beside the wild species that carry them, the ground hides the
    // whole family in thin slots of the scarce band
    for (const item of TYPE_BOOSTERS.keys()) {
      expect(getItemBand(item)).toBe('scarce');
    }
  });

  it('gives every attacking type a gem, spent on the hit it lifts', () => {
    // One per attacking type, the same coverage the plain boosters
    // have — the two are the permanent and the one-shot of the same
    // idea
    expect(new Set(GEMS.values()).size).toBe(new Set(TYPE_BOOSTERS.values()).size);

    for (const [item, type] of GEMS) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // The one type item that is spent using it
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.buy).toBe(GEM_PRICE);
      // Cheaper than the booster it out-hits, because it only has the
      // one hit in it
      expect(data.buy).toBeLessThan(TYPE_BOOSTER_PRICE);
      expect(new Set(TYPE_BOOSTERS.values()).has(type)).toBe(true);
    }
  });

  it('buries a plate for every type but Normal', () => {
    const covered = new Set(PLATES.values());

    // Every attacking type has one except Normal, which the tablets
    // never had
    expect(covered.size).toBe(new Set(TYPE_BOOSTERS.values()).size - 1);
    expect(covered.has(Types.Normal)).toBe(false);

    for (const [item, type] of PLATES) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Held for as long as it is carried, and never spent
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      // Dug up rather than bought: no listing, only what a shop will
      // pay to take one off a player's hands
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBe(PLATE_RESALE);
      // Found in the ground, at a thin slot each
      expect(ITEM_POOL.rare.some((entry) => entry.item === item)).toBe(true);
      expect(new Set(TYPE_BOOSTERS.values()).has(type)).toBe(true);
    }

    // Seventeen thin slots together weigh about what one stone does
    const plated = ITEM_POOL.rare
      .filter((entry) => PLATES.has(entry.item))
      .reduce((total, entry) => total + entry.weight, 0);

    expect(plated).toBeLessThanOrEqual(20);
  });

  it('registers the orbs as held costs rather than consumables', () => {
    for (const [item, [name]] of ORBS) {
      const data = getItemData(item);

      expect(data.name).toBe(name);
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // An orb is never spent: it keeps costing its holder, which is
      // the point of it
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.buy).toBe(ORB_PRICE);
    }
  });

  it('registers every incense as a held, stocked smoke', () => {
    const pooled = new Set(
      [
        ...ITEM_POOL.base,
        ...ITEM_POOL.uncommon,
        ...ITEM_POOL.scarce,
        ...ITEM_POOL.rare,
        ...ITEM_POOL.special,
      ].map((entry) => entry.item),
    );

    for (const item of INCENSES) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // An incense burns for as long as it is carried
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.flags & ItemFlags.Usable).toBe(0);
      // Bought, and cheaper than the plain item it stands beside
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(INCENSE_PRICE);
      expect(data.buy).toBeLessThan(TYPE_BOOSTER_PRICE);
      expect(pooled.has(item)).toBe(false);
    }

    // Five of them lift a type, and two of those lift the same one:
    // the sea and the waves are the same water
    expect(INCENSE_TYPES.get(Items.SeaIncense)).toBe(Types.Water);
    expect(INCENSE_TYPES.get(Items.WaveIncense)).toBe(Types.Water);
    expect(INCENSE_TYPES.get(Items.OddIncense)).toBe(Types.Psychic);

    // The type ones stand apart from the plain boosters, which are
    // still one per attacking type
    for (const item of INCENSE_TYPES.keys()) {
      expect(TYPE_BOOSTERS.has(item)).toBe(false);
    }
  });

  it('stocks the general stat items and hides the relics', () => {
    for (const item of GENERAL_STAT_BOOSTERS.keys()) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Held for as long as it is carried: nothing spends one
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.flags & ItemFlags.Usable).toBe(0);
      // Bought, and dear: each is worth half of a stat
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(STAT_BOOSTER_PRICE);
      // And the ground hides one now and then besides
      expect(getItemBand(item)).toBe('rare');
    }

    for (const item of RELIC_STAT_BOOSTERS.keys()) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Found rather than stocked: no listing, only a resale price
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBeGreaterThan(0);
      expect(ITEM_POOL.rare.some((entry) => entry.item === item)).toBe(true);
    }
  });

  it('lists the gear the market carries and hides the rest of it', () => {
    const pooled = new Set(
      [
        ...ITEM_POOL.base,
        ...ITEM_POOL.uncommon,
        ...ITEM_POOL.scarce,
        ...ITEM_POOL.rare,
        ...ITEM_POOL.special,
      ].map((entry) => entry.item),
    );

    for (const [item, [name]] of MARKET_GEAR) {
      const data = getItemData(item);

      expect(data.name).toBe(name);
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Gear works for as long as it is carried: nothing spends it
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(GEAR_PRICE);
      expect(isGear(item)).toBe(true);
      // Listed, and hidden in the scarce band's thin slots besides
      expect(getItemBand(item)).toBe('scarce');
    }

    for (const [item] of FOUND_GEAR) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Found rather than stocked: no listing, only a resale price
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBeGreaterThan(0);
      expect(isGear(item)).toBe(true);
      expect(pooled.has(item)).toBe(true);
    }

    // The sludge is litter and the two lenses are species relics, so
    // the ground hides them where it hides their own kind
    expect(ITEM_POOL.base.some((entry) => entry.item === Items.BlackSludge)).toBe(true);
    expect(ITEM_POOL.rare.some((entry) => entry.item === Items.LuckyPunch)).toBe(true);
    expect(ITEM_POOL.rare.some((entry) => entry.item === Items.Stick)).toBe(true);
  });

  it('spends a one-shot the way it spends a berry', () => {
    for (const [item, [name]] of ONE_SHOTS) {
      const data = getItemData(item);

      expect(data.name).toBe(name);
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // The whole difference between these and the gear
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.buy).toBe(ONE_SHOT_PRICE);
      expect(isOneShot(item)).toBe(true);
      expect(isGear(item)).toBe(false);
    }

    // A one-shot is worth less than the gear it sits beside, because
    // a fight where its moment never comes is a fight it sat out
    expect(ONE_SHOT_PRICE).toBeLessThan(GEAR_PRICE);
  });

  it('sells the trinkets at what an incense costs, and never spends one', () => {
    const pooled = new Set(
      [
        ...ITEM_POOL.base,
        ...ITEM_POOL.uncommon,
        ...ITEM_POOL.scarce,
        ...ITEM_POOL.rare,
        ...ITEM_POOL.prized,
        ...ITEM_POOL.special,
      ].map((entry) => entry.item),
    );

    for (const [item, [name]] of TRINKETS) {
      const data = getItemData(item);

      expect(data.name).toBe(name);
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Nothing about them is spent: a trinket works for as long as
      // it is carried, like the incense it stands beside
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(isTrinket(item)).toBe(true);
      expect(isGear(item)).toBe(false);
      expect(isOneShot(item)).toBe(false);
    }

    for (const [item] of MARKET_TRINKETS) {
      const data = getItemData(item);

      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(TRINKET_PRICE);
      expect(pooled.has(item)).toBe(false);
    }

    // The two nobody sells are the two the ground hides
    for (const [item] of FOUND_TRINKETS) {
      const data = getItemData(item);

      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBeGreaterThan(0);
      expect(pooled.has(item)).toBe(true);
    }

    // The listed one is an incense by another name, and is priced as
    // one
    expect(TRINKET_PRICE).toBe(INCENSE_PRICE);
    // The coin pays more than the incense it stands against, which is
    // what being unbuyable is worth
    expect(AMULET_COIN_BONUS).toBeGreaterThan(LUCK_INCENSE_BONUS);
  });

  it('carries the battle items rather than throwing them in', () => {
    for (const item of BATTLE_ITEMS) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      // Spent the moment they answer something, like a one-shot
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBe(BATTLE_ITEM_PRICE);
      expect(isBattleItem(item)).toBe(true);
      expect(isOneShot(item)).toBe(false);
    }

    // Cheaper than a one-shot, because each answers one thing only
    expect(BATTLE_ITEM_PRICE).toBeLessThan(ONE_SHOT_PRICE);
    expect(isBattleItem(Items.Leftovers)).toBe(false);
  });

  it('bottles the drinks as held rather than as medicine', () => {
    for (const [item, drink] of DRINKS) {
      const data = getItemData(item);

      expect(data.name).toBe(drink.name);
      // Held, unlike everything else that gives health back over a
      // counter: a potion cannot be carried into a fight
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.flags & ItemFlags.Usable).toBe(0);
      expect(isDrink(item)).toBe(true);
      expect(drink.restore).toBeGreaterThan(0);
    }

    // All five are listed now that the chef stocks a counter — the
    // juice he squeezes himself, so it costs less than the milk
    expect(getItemData(Items.Lemonade).buy).toBeGreaterThan(0);
    expect(getItemData(Items.BerryJuice).buy).toBeGreaterThan(0);
    expect(getItemData(Items.BerryJuice).flags & ItemFlags.Marketable).not.toBe(0);
    expect(getItemData(Items.BerryJuice).buy).toBeLessThan(getItemData(Items.MoomooMilk).buy);

    // A drink pays for being carried: the cheapest bottle gives back
    // more than a Potion does and costs less, and what it charges for
    // instead is the held slot it takes up
    const water = DRINKS.get(Items.FreshWater);

    expect(getItemData(Items.FreshWater).buy).toBeLessThan(getItemData(Items.Potion).buy);
    expect(water?.restore).toBeGreaterThan(MEDICINES.get(Items.Potion)?.restore ?? 0);
  });

  it('hides the Sacred Ash rather than selling it', () => {
    const data = getItemData(Items.SacredAsh);
    const prized = new Set(ITEM_POOL.prized.map((entry) => entry.item));

    expect(isSacredAsh(Items.SacredAsh)).toBe(true);
    expect(data.type).toBe(ItemTypes.Held);
    expect(data.flags & ItemFlags.Holdable).not.toBe(0);
    expect(data.flags & ItemFlags.Consumable).not.toBe(0);
    // Nobody stocks one; a vendor will only take it off your hands
    expect(data.flags & ItemFlags.Marketable).toBe(0);
    expect(data.buy).toBe(0);
    expect(data.sell).toBeGreaterThan(0);

    // A second chance for a whole party, and one nothing else offers
    expect(prized.has(Items.SacredAsh)).toBe(true);
    expect(isPreciousItem(Items.SacredAsh)).toBe(true);
  });

  it('makes the Heart Scale worth nothing but a forgotten move', () => {
    const scale = getItemData(Items.HeartScale);

    expect(isHeartScale(Items.HeartScale)).toBe(true);
    expect(isHeartScale(Items.Nugget)).toBe(false);
    expect(scale.name).toBe('Heart Scale');
    expect(scale.flags & ItemFlags.Consumable).not.toBe(0);
    // Neither side of a vendor's counter takes one: it cannot be
    // bought, and it cannot be turned back into gold. That is what
    // keeps the reminder paced by walking rather than by a purse
    expect(scale.flags & ItemFlags.Marketable).toBe(0);
    expect(isMarketable(Items.HeartScale)).toBe(false);
    expect(scale.buy).toBe(0);
    expect(scale.sell).toBe(0);
    // So the only way to one is the ground
    expect(ITEM_POOL.uncommon.some((entry) => entry.item === Items.HeartScale)).toBe(true);
  });
});

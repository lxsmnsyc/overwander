import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { asBasicSpriteData } from '../../src/canvas/basic-sprite';
import registerBiomeSpawns, { isMythicalSpecies, listSpeciesHabitats } from '../../src/data/biome';
import Families from '../../src/data/ids/families';
import registerAbilities, { getAbilityData } from '../../src/data/abilities';
import Abilities from '../../src/data/ids/abilities';
import { TYPE_COLORS, TYPE_NAMES, Types } from '../../src/data/constants/types';
import {
  APRICORNS,
  BALL_ITEMS,
  ItemFlags,
  ItemTypes,
  Items,
  getApricornBall,
  getMachineItem,
  getMachineMove,
  isMachineItem,
} from '../../src/data/ids/items';
import {
  MOVE_CATEGORY_COLORS,
  MOVE_CATEGORY_NAMES,
  MoveCategories,
  Moves,
} from '../../src/data/ids/moves';
import {
  NON_VOLATILE_MASK,
  NON_VOLATILE_STATUSES,
  StatusFlags,
  Statuses,
  flagStatus,
  packStatuses,
  statusFlag,
  unpackStatuses,
} from '../../src/data/ids/status';
import { ARCEUS_FORMS, EvolutionMethod, Species } from '../../src/data/ids/species';
import { CANDY_PER_LEVEL, SHADOW_CANDY_MULTIPLIER, getCandyCost } from '../../src/auth/candy';
import registerItems, {
  ITEM_TYPE_NAMES,
  ITEM_TYPE_ORDER,
  getItemData,
  getTeachableMoves,
  listItemsByType,
} from '../../src/data/items';
import { WING_STATS, isWing } from '../../src/data/items/wings';
import {
  BAIT_BERRY_NAMES,
  BAIT_CATCH_BONUS,
  BERRY_BRACE_STAGES,
  BERRY_EFFORT_DROPS,
  BERRY_NATURE_HEALS,
  BERRY_PINCH_STAGES,
  BERRY_RESIST_TYPES,
  BERRY_STATUS_CURES,
  NANAB_FLEE_FACTOR,
  PINAP_CANDY_HELPINGS,
  PINCH_BERRIES,
  PRIZE_BERRY_NAMES,
  RAZZ_CATCH_BONUS,
  describeBerry,
  isBerry,
} from '../../src/data/items/berries';
import BERRY_POOL from '../../src/data/overworld/berry-pool';
import { getMoveData, registerMoves } from '../../src/data/moves';
import AleaRNG from '../../src/core/alea';
import {
  ITEM_POOL,
  getItemBand,
  getItemOdds,
  isPreciousItem,
} from '../../src/data/overworld/item-pool';
import {
  FOSSIL_OFFER_KINDS,
  FOSSIL_REVIVE_LEVEL,
  getFossilPrice,
  rollFossilOffer,
} from '../../src/data/overworld/fossil';
import { FOSSIL_SPECIES, isFossil, listFossils } from '../../src/data/items/fossils';
import {
  VENDOR_KINDS,
  VENDOR_KIND_NAMES,
  VENDOR_STAPLES,
  VENDOR_STOCK_KINDS,
  VendorKind,
  getChefGoods,
  getVendorGoods,
  isMarketable,
  rollVendorStock,
  sellPrice,
  vendorStockSize,
} from '../../src/data/overworld/vendor';
import { VALUABLE_SELL, isValuable } from '../../src/data/items/valuables';
import { PP_ITEMS, VITAMIN_STATS } from '../../src/data/items/vitamins';
import { TREATS } from '../../src/data/items/treats';
import { asBoolean } from '../../src/auth/__normalize';
import { CANDY_STACKS, ITEM_STACKS, getStack, listStacks } from '../../src/auth/stacks';
import {
  MAX_SLOTS,
  SLOT_BITS,
  SLOT_LIMITS,
  Slots,
  countAbilitySlots,
  countsAgainstSlots,
  defaultSlots,
  getSlots,
  leastSlots,
  mostSlots,
  packSlots,
  withSlots,
} from '../../src/data/constants/slots';
import getSigil, { BRAILLE_BASE, SIGIL_CELLS } from '../../src/data/constants/sigil';
import { isFavorite, isGuarded } from '../../src/auth/caught-record';
import {
  MAX_IV,
  MAX_IV_STARS,
  PERFECT_IVS,
  STAT_ORDER,
  Stats,
  getIV,
  getIVStars,
  packIVs,
  setIV,
  unpackIVs,
} from '../../src/data/constants/stats';
import {
  BOTTLE_CAPS,
  isBottleCap,
  isPerfectIVs,
  polishIVs,
} from '../../src/data/items/bottle-caps';
import { MINT_NATURES, describeMint, getMintNature, isMint } from '../../src/data/items/mints';
import { UTILITY_BELT_SLOT, isUtilityBelt } from '../../src/data/items/utility-belt';
import {
  ABILITY_CAPSULE_SLOT,
  isAbilityCapsule,
  isAbilityPatch,
} from '../../src/data/items/ability-items';
import {
  NPC_BATTLE_LIMITS,
  PVP_BATTLE_LIMITS,
  UNLIMITED_BATTLE_LIMITS,
  withLimit,
} from '../../src/data/constants/battle-limits';
import { DEFAULT_DUEL_RULES, asDuelRules } from '../../src/auth/duel-record';
import {
  PURIFY_IV_BOOST,
  isPurifiable,
  isPurifyingGem,
  purifyAbilities,
  purifyIVs,
} from '../../src/data/items/purifying-gem';
import { CANDY_ITEM_PRICE } from '../../src/data/items/candy-items';
import { isPortalKey } from '../../src/data/items/portal-key';
import Landmark, { LANDMARKS, LANDMARK_NAMES } from '../../src/data/overworld/landmark';
import {
  MEDICINES,
  bitterness,
  isHerbal,
  isMedicine,
  isRevive,
} from '../../src/data/items/medicine';
import { INCENSES } from '../../src/data/items/incenses';
import { BATTLE_ITEMS } from '../../src/data/items/battle-items';
import { DRINKS } from '../../src/data/items/drinks';
import { FEED_CATCH_BONUS, MAX_CATCH_BONUS } from '../../src/overworld/safari';
import { PLATES } from '../../src/data/items/plates';
import { FORM_ITEMS, getItemForms } from '../../src/data/items/form-items';
import { RAID_ITEMS, getRaidSpecies } from '../../src/data/items/raid-items';
import { getRegisteredSpecies, getSpeciesData, registerSpecies } from '../../src/data/species';
import Natures, { NATURE_EFFECTS, NATURE_NAMES } from '../../src/data/ids/natures';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

/** Kurt's seven, which nothing sells and nothing hides in a stash. */
const APRICORN_BALL_ITEMS: Items[] = [
  Items.LevelBall,
  Items.LureBall,
  Items.MoonBall,
  Items.FriendBall,
  Items.LoveBall,
  Items.HeavyBall,
  Items.FastBall,
];

describe('item data', () => {
  it('registers every ball a catch can be made with', () => {
    // The catch record stores a ball, and the UI names it through
    // the item registry, so every variant has to be registered
    for (const item of Object.values(BALL_ITEMS)) {
      expect(getItemData(item).type).toBe(ItemTypes.PokeBall);
    }

    expect(getItemData(Items.PokeBall).name).toBe('Poke Ball');
    expect(getItemData(Items.DuskBall).name).toBe('Dusk Ball');

    // A ball is spent by the throw, never held
    expect(getItemData(Items.UltraBall).flags & ItemFlags.Consumable).not.toBe(0);
    expect(getItemData(Items.UltraBall).flags & ItemFlags.Holdable).toBe(0);
  });

  it('generates one machine per teachable move', () => {
    const teachable = getTeachableMoves();

    expect(teachable.length).toBeGreaterThan(10);

    for (const move of teachable) {
      const item = getMachineItem(move);

      expect(isMachineItem(item)).toBe(true);
      expect(getMachineMove(item)).toBe(move);
      expect(getItemData(item).type).toBe(ItemTypes.Machine);
      expect(getItemData(item).name).toBe(`TM ${getMoveData(move).name}`);
    }

    // The hand-written items are not machines
    expect(isMachineItem(Items.MasterBall)).toBe(false);
    expect(getMachineMove(Items.MasterBall)).toBeNull();
  });

  it('keeps machines out of the overworld and in the market', () => {
    // A machine is bought, never found: no band of the pool holds one
    for (const band of ['base', 'uncommon', 'rare', 'special'] as const) {
      expect(ITEM_POOL[band].some((entry) => isMachineItem(entry.item))).toBe(false);
    }

    // Their price follows the move they teach, and selling one back
    // fetches half
    const cheap = getItemData(getMachineItem(Moves.Toxic));
    const solid = getItemData(getMachineItem(Moves.BodySlam));
    const strong = getItemData(getMachineItem(Moves.HyperBeam));

    expect(cheap.buy).toBeLessThan(solid.buy);
    expect(solid.buy).toBeLessThan(strong.buy);
    expect(strong.sell).toBe(strong.buy / 2);

    // Every machine is stocked
    expect(strong.flags & ItemFlags.Marketable).not.toBe(0);
  });

  it('stocks the candy items as ordinary held goods', () => {
    for (const item of [Items.ExpShare, Items.LuckyEgg]) {
      const data = getItemData(item);

      // Both are bought rather than found, held rather than used,
      // and neither is ever spent: what they pay, they pay on every
      // catch for as long as the buddy carries one
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).toBe(0);
      expect(data.buy).toBe(CANDY_ITEM_PRICE);
      expect(data.sell).toBeLessThan(data.buy);
    }
    expect(getItemData(Items.ExpShare).name).toBe('Exp. Share');
    expect(getItemData(Items.LuckyEgg).name).toBe('Lucky Egg');

    // Both hide where the Leftovers hide, and thinner: every party
    // wants one, and the ground is the only counter that carries them
    expect(getItemBand(Items.ExpShare)).toBe('rare');
    expect(getItemBand(Items.LuckyEgg)).toBe('rare');
  });

  it('stocks the medicine and hides some of it too', () => {
    for (const [item, effect] of MEDICINES) {
      const data = getItemData(item);

      // Used on a pokemon and spent doing it. Nothing here is
      // holdable: a potion cannot be drunk mid-raid, which is what
      // keeps a berry worth carrying
      expect(data.type).toBe(ItemTypes.Medicine);
      expect(data.flags & ItemFlags.Usable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.flags & ItemFlags.Holdable).toBe(0);
      // The one thing gold is always worth spending on
      expect(data.flags & ItemFlags.Marketable).not.toBe(0);
      expect(data.buy).toBeGreaterThan(0);
      expect(data.sell).toBeLessThan(data.buy);
      expect(isMedicine(item)).toBe(true);

      // Every one of them does something: restores, cures or revives
      expect(effect.restore > 0 || effect.cures != null || effect.revives > 0).toBe(true);
      // A revive does nothing but revive
      expect(isRevive(item)).toBe(effect.revives > 0);
      if (effect.revives > 0) {
        expect(effect.restore).toBe(0);
        expect(effect.cures).toBeNull();
      }
    }
    expect(getItemData(Items.MaxRevive).buy).toBeGreaterThan(getItemData(Items.Revive).buy);
    expect(isMedicine(Items.OranBerry)).toBe(false);

    // A potion is an everyday find; what a lost raid is undone with
    // is not
    expect(ITEM_POOL.base.some((entry) => entry.item === Items.Potion)).toBe(true);
    expect(ITEM_POOL.uncommon.some((entry) => entry.item === Items.SuperPotion)).toBe(true);
    for (const item of [Items.MaxPotion, Items.FullRestore, Items.Revive]) {
      expect(ITEM_POOL.rare.some((entry) => entry.item === item)).toBe(true);
      expect(ITEM_POOL.base.some((entry) => entry.item === item)).toBe(false);
    }
    // And the one that undoes a lost party rather than a lost fight
    // sits a band above the rest of them
    expect(ITEM_POOL.prized.some((entry) => entry.item === Items.MaxRevive)).toBe(true);
    expect(ITEM_POOL.rare.some((entry) => entry.item === Items.MaxRevive)).toBe(false);
    // None of it is one-per-world class
    for (const item of MEDICINES.keys()) {
      expect(ITEM_POOL.special.some((entry) => entry.item === item)).toBe(false);
    }
  });

  it('buries the fossils and leaves what is in them nowhere else', () => {
    expect(listFossils().length).toBe(FOSSIL_SPECIES.size);
    expect([...FOSSIL_SPECIES.values()]).toEqual([
      Species.Omanyte,
      Species.Kabuto,
      Species.Aerodactyl,
      Species.Lileep,
      Species.Anorith,
      Species.Cranidos,
      Species.Shieldon,
    ]);

    for (const [item, species] of FOSSIL_SPECIES) {
      const data = getItemData(item);

      // Spent opening it, and worth nothing to anybody in between:
      // no vendor stocks one and no vendor takes one, which is what
      // keeps a fossil paced by digging rather than by a purse
      expect(data.type).toBe(ItemTypes.Fossil);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(isMarketable(item)).toBe(false);
      expect(data.buy).toBe(0);
      expect(data.sell).toBe(0);
      expect(isFossil(item)).toBe(true);
      expect(data.name.length).toBeGreaterThan(0);

      // The maniac is the one person who will part with one, and he
      // charges gold for it
      expect(getFossilPrice(item)).toBeGreaterThan(0);

      // What is inside lives nowhere at all: reviving it is the only
      // way any of them is ever met
      expect(listSpeciesHabitats(species).length).toBe(0);
      expect(getSpeciesData(species).biomes).toEqual([]);
    }

    // ...and neither do the species they grow into
    for (const species of [Species.Omastar, Species.Kabutops, Species.Cradily, Species.Armaldo]) {
      expect(listSpeciesHabitats(species).length).toBe(0);
    }

    // Nothing else on the shelf is one
    expect(isFossil(Items.Nugget)).toBe(false);

    // Every one of them is prized: reviving one is irreversible and
    // is the only way to the species inside, which is what that band
    // is for. The amber is the thinnest slot, because Aerodactyl is
    // the rarest thing in them
    for (const item of listFossils()) {
      expect(ITEM_POOL.prized.some((entry) => entry.item === item)).toBe(true);
      expect(getItemBand(item)).toBe('prized');
      expect(isPreciousItem(item)).toBe(true);
    }
    expect(getFossilPrice(Items.OldAmber)).toBeGreaterThan(getFossilPrice(Items.HelixFossil));

    // Whatever comes out arrives at the same level for everybody who
    // carried the same rock in
    expect(FOSSIL_REVIVE_LEVEL).toBeGreaterThan(0);
  });

  it('has the maniac carry two of them, never the same one twice', () => {
    const rng = new AleaRNG('fossils');
    const pairs = new Set<string>();

    for (let at = 0; at < 400; at++) {
      const offer = rollFossilOffer(() => rng.random());

      expect(offer.length).toBe(FOSSIL_OFFER_KINDS);
      expect(new Set(offer).size).toBe(offer.length);
      for (const item of offer) {
        expect(isFossil(item)).toBe(true);
      }
      pairs.add(JSON.stringify([...offer].sort((left, right) => left - right)));
    }

    // Every pairing turns up, so no fossil is one a player can never
    // be offered
    const fossils = listFossils().length;

    expect(pairs.size).toBe((fossils * (fossils - 1)) / 2);
  });

  it('keeps the balls and the medicine on counters of their own', () => {
    const balls = new Set(getVendorGoods(VendorKind.Balls));
    const medicine = new Set(getVendorGoods(VendorKind.Medicine));

    // Each is a whole shelf rather than a shared one, so a player
    // after a Dusk Ball and a player after a Revive walk to different
    // stalls and both find what they came for
    for (const item of balls) {
      expect(getItemData(item).type, getItemData(item).name).toBe(ItemTypes.PokeBall);
      expect(medicine.has(item)).toBe(false);
    }
    // Honey is the one held item on the medicine shelf: it is food, and
    // the jar a honey tree wants
    expect(medicine.has(Items.Honey)).toBe(true);
    for (const item of medicine) {
      if (item === Items.Honey) {
        continue;
      }
      expect(getItemData(item).type, getItemData(item).name).toBe(ItemTypes.Medicine);
      expect(balls.has(item)).toBe(false);
    }

    // The one ball the registry never priced. It is left out because
    // it has no price rather than because a list says so
    expect(balls.has(Items.MasterBall)).toBe(false);
    expect(isMarketable(Items.MasterBall)).toBe(false);
  });

  it('pairs every apricorn with the ball its colour makes', () => {
    expect(APRICORNS.length).toBe(7);

    const balls = new Set<Items>();

    for (const apricorn of APRICORNS) {
      const data = getItemData(apricorn);
      const ball = getApricornBall(apricorn);

      expect(ball, data.name).not.toBeNull();

      if (ball == null) {
        continue;
      }
      // One colour, one ball, and no two colours the same one
      expect(balls.has(ball), data.name).toBe(false);
      balls.add(ball);

      // An apricorn is a ball nobody has carved yet: nothing holds
      // one, nothing uses one, and no counter lists one
      expect(data.flags, data.name).toBe(0);
      expect(data.buy, data.name).toBe(0);
      expect(data.sell, data.name).toBe(0);
      expect(data.name.endsWith(' Apricorn'), data.name).toBe(true);
      // The line names the ball, so it is read out of the registry
      // rather than typed twice
      expect(data.description, data.name).toContain(getItemData(ball).name);
    }

    // The seven balls the seven colours make are Kurt's seven
    expect([...balls].sort((one, other) => one - other)).toEqual(
      [...APRICORN_BALL_ITEMS].sort((one, other) => one - other),
    );
    expect(getApricornBall(Items.PokeBall)).toBeNull();
  });

  it("keeps Kurt's seven off every counter and out of every stash", () => {
    // They are turned out of apricorns rather than bought or found,
    // and the exclusion is a property of the data rather than a list
    // somebody has to remember: nothing prices them, so nothing that
    // filters on a price can carry them
    const pooled = new Set(
      [
        ITEM_POOL.base,
        ITEM_POOL.uncommon,
        ITEM_POOL.rare,
        ITEM_POOL.prized,
        ITEM_POOL.special,
      ].flatMap((band) => band.map((entry) => entry.item)),
    );

    for (const item of APRICORN_BALL_ITEMS) {
      const data = getItemData(item);

      expect(isMarketable(item), data.name).toBe(false);
      expect(data.buy, data.name).toBe(0);
      // Nor will he take one off a player's hands
      expect(data.sell, data.name).toBe(0);
      expect(pooled.has(item), `${data.name} is in a stash`).toBe(false);

      for (const kind of VENDOR_KINDS) {
        expect(new Set(getVendorGoods(kind)).has(item), `${data.name} on a counter`).toBe(false);
      }
    }
  });

  it('gives every counter a priced shelf, and two of them a staple', () => {
    for (const kind of VENDOR_KINDS) {
      const goods = new Set(getVendorGoods(kind));

      expect(goods.size, VENDOR_KIND_NAMES[kind]).toBeGreaterThan(0);
      for (const item of goods) {
        const data = getItemData(item);

        expect(isMarketable(item)).toBe(true);
        // Nothing bought from him can be sold back at a profit, which
        // is what keeps a vendor from being a gold press
        expect(data.buy).toBeGreaterThan(0);
        expect(data.sell).toBeLessThan(data.buy);
      }

      // A staple is something the counter always has, so it has to be
      // on that counter's own shelf
      for (const staple of VENDOR_STAPLES[kind] ?? []) {
        expect(goods.has(staple), VENDOR_KIND_NAMES[kind]).toBe(true);
      }
    }

    // A crate never repeats and never runs past the counter's own
    // shelf. Three of the specialist shelves are shorter than a dozen,
    // so those counters do lay out everything they have
    for (const kind of VENDOR_KINDS) {
      expect(getVendorGoods(kind).length, VENDOR_KIND_NAMES[kind]).toBeGreaterThan(0);
    }

    // The two a player plans a walk around, and nothing else
    expect(VENDOR_STAPLES[VendorKind.Balls]).toEqual([Items.PokeBall]);
    expect(VENDOR_STAPLES[VendorKind.Medicine]).toEqual([Items.Potion]);
    for (const kind of [
      VendorKind.Vitamins,
      VendorKind.Incenses,
      VendorKind.BattleItems,
      VendorKind.Moves,
    ]) {
      expect(VENDOR_STAPLES[kind], VENDOR_KIND_NAMES[kind]).toBeUndefined();
    }
  });

  it('lays out a dozen machines on the machine stall', () => {
    // Every machine in the game is on its shelf, and nothing else is:
    // one per teachable move, which is where machines come from
    expect(new Set(getVendorGoods(VendorKind.Moves))).toEqual(
      new Set(getTeachableMoves().map((move) => getMachineItem(move))),
    );
    for (const item of getVendorGoods(VendorKind.Moves)) {
      expect(isMachineItem(item), getItemData(item).name).toBe(true);
    }

    // Twice the usual crate, drawn without repeats, and the same crate
    // for every player who walks up to that window's stall
    const rng = new AleaRNG('machine-stall');
    const crate = rollVendorStock(() => rng.random(), VendorKind.Moves);
    const elsewhere = new AleaRNG('another-stall');

    expect(crate).toHaveLength(VENDOR_STOCK_KINDS);
    expect(new Set(crate).size).toBe(VENDOR_STOCK_KINDS);
    expect(rollVendorStock(() => elsewhere.random(), VendorKind.Moves)).not.toEqual(crate);
    for (const item of crate) {
      expect(isMachineItem(item), getItemData(item).name).toBe(true);
    }

    // And a dozen is what every counter lays out now, the machine
    // stall included
    for (const kind of VENDOR_KINDS) {
      expect(vendorStockSize(kind), VENDOR_KIND_NAMES[kind]).toBe(VENDOR_STOCK_KINDS);
    }
  });

  it('stocks the other counters from their own shelves', () => {
    // Each kind carries its one shelf entire: nothing priced is left
    // off, and nothing from another shelf sneaks in
    expect(new Set(getVendorGoods(VendorKind.Vitamins))).toEqual(
      new Set([...VITAMIN_STATS.keys(), ...PP_ITEMS.keys()]),
    );
    expect(new Set(getVendorGoods(VendorKind.Incenses))).toEqual(new Set(INCENSES));
    expect(new Set(getVendorGoods(VendorKind.BattleItems))).toEqual(new Set(BATTLE_ITEMS));

    // The two battle items that are not X items ride the same shelf
    expect(new Set(getVendorGoods(VendorKind.BattleItems)).has(Items.DireHit)).toBe(true);
    expect(new Set(getVendorGoods(VendorKind.BattleItems)).has(Items.GuardSpec)).toBe(true);

    for (const kind of [VendorKind.Vitamins, VendorKind.Incenses, VendorKind.BattleItems]) {
      for (const item of getVendorGoods(kind)) {
        const data = getItemData(item);

        expect(isMarketable(item)).toBe(true);
        expect(data.buy).toBeGreaterThan(0);
        expect(data.sell).toBeLessThan(data.buy);
      }
    }
  });

  it('gives every nature worth having a mint of its own', () => {
    // One per nature that moves a stat, plus Serious for a pokemon
    // that should move none. The other four neutral natures have no
    // mint, since Serious already says what they say
    expect(MINT_NATURES.size).toBe(21);

    const made = new Set(MINT_NATURES.values());

    for (const nature of Object.keys(NATURE_EFFECTS).map(Number) as Natures[]) {
      expect(made.has(nature), NATURE_NAMES[nature]).toBe(true);
    }
    expect(made.has(Natures.Serious)).toBe(true);
    for (const neutral of [Natures.Hardy, Natures.Docile, Natures.Bashful, Natures.Quirky]) {
      expect(made.has(neutral), NATURE_NAMES[neutral]).toBe(false);
    }

    for (const [item, nature] of MINT_NATURES) {
      const data = getItemData(item);

      expect(isMint(item)).toBe(true);
      expect(getMintNature(item)).toBe(nature);
      expect(data.name).toBe(`${NATURE_NAMES[nature]} Mint`);
      expect(data.description).toBe(describeMint(nature));

      // A mint is drawn by the stat its nature raises, so a player
      // scanning the tray sees what the jar is for before the name
      const effect = NATURE_EFFECTS[nature];

      expect(data.icon.startsWith('mints/')).toBe(true);
      if (effect == null) {
        expect(data.icon).toBe('mints/neutral');
      } else {
        expect(data.icon).not.toBe('mints/neutral');
      }

      // Bought off the chef, never held, and gone once eaten
      expect(isMarketable(item)).toBe(true);
      expect(data.buy).toBeGreaterThan(0);
      expect(data.sell).toBeLessThan(data.buy);
      expect(data.flags & ItemFlags.Holdable).toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
    }

    // Two mints share a jar when they raise the same stat and never
    // when they do not, which is the whole of the rule
    for (const [left, leftNature] of MINT_NATURES) {
      for (const [right, rightNature] of MINT_NATURES) {
        const same = NATURE_EFFECTS[leftNature]?.up === NATURE_EFFECTS[rightNature]?.up;

        expect(getItemData(left).icon === getItemData(right).icon, NATURE_NAMES[leftNature]).toBe(
          same,
        );
      }
    }

    // The description says what the nature does rather than naming it
    // twice, and reads the engine's own factors
    expect(describeMint(Natures.Adamant)).toBe(
      'Makes it Adamant: 1.1x Attack, 0.9x Sp. Attack. Spent on use.',
    );
    expect(describeMint(Natures.Serious)).toBe(
      'Makes it Serious, which raises and lowers nothing. Spent on use.',
    );
  });

  it('buries every mint in the prized band', () => {
    // A nature is two stats for the rest of a pokemon's life, which is
    // what the prized band is for
    const prized = new Set(ITEM_POOL.prized.map((entry) => entry.item));

    for (const item of MINT_NATURES.keys()) {
      expect(prized.has(item), getItemData(item).name).toBe(true);
    }

    // And each is the thinnest thing in it, since there are 21 of them
    const thinnest = Math.min(...ITEM_POOL.prized.map((entry) => entry.weight));

    for (const entry of ITEM_POOL.prized.filter((one) => MINT_NATURES.has(one.item))) {
      expect(entry.weight).toBe(thinnest);
    }
  });

  it('fills the chef’s larder with the drinks, the treats and the mints', () => {
    const larder = getChefGoods();

    // Five drinks, nine treats and twenty-one mints, all of them his
    // and only his
    expect(new Set(larder)).toEqual(
      new Set([...DRINKS.keys(), ...TREATS.keys(), ...MINT_NATURES.keys()]),
    );
    expect(larder.length).toBe(DRINKS.size + TREATS.size + MINT_NATURES.size);

    for (const item of larder) {
      const data = getItemData(item);

      expect(isMarketable(item)).toBe(true);
      expect(data.buy).toBeGreaterThan(0);
      // Nothing bought off his counter sells back at a profit
      expect(data.sell).toBeLessThan(data.buy);
    }
  });

  it('sells herbal medicine cheaper than the bottle it competes with', () => {
    // Each herb undercuts its bottled counterpart and does more, and
    // the difference is charged to the pokemon instead
    const cheaper: [herb: Items, bottle: Items][] = [
      [Items.EnergyPowder, Items.SuperPotion],
      [Items.EnergyRoot, Items.HyperPotion],
      [Items.HealPowder, Items.FullHeal],
      [Items.RevivalHerb, Items.MaxRevive],
    ];

    for (const [herb, bottle] of cheaper) {
      expect(isHerbal(herb)).toBe(true);
      expect(isHerbal(bottle)).toBe(false);
      expect(getItemData(herb).buy).toBeLessThan(getItemData(bottle).buy);
      expect(bitterness(herb)).toBeGreaterThan(0);
    }

    // They grow where a walk goes, so the two powders are an everyday
    // find and the root and the herb are not
    for (const item of [Items.EnergyPowder, Items.HealPowder]) {
      expect(ITEM_POOL.base.some((entry) => entry.item === item)).toBe(true);
    }
    expect(ITEM_POOL.uncommon.some((entry) => entry.item === Items.EnergyRoot)).toBe(true);
    expect(ITEM_POOL.rare.some((entry) => entry.item === Items.RevivalHerb)).toBe(true);
  });

  it('packs a battle\u2019s limits the way a catch packs its slots', () => {
    // The two are compared, so they have to be the same shape: the
    // effective room is the smaller of them
    expect(getSlots(PVP_BATTLE_LIMITS, Slots.Ability)).toBe(1);
    expect(getSlots(PVP_BATTLE_LIMITS, Slots.Item)).toBe(1);
    expect(getSlots(PVP_BATTLE_LIMITS, Slots.Move)).toBe(4);

    // A raid adds no ceiling of its own, so each count sits at the
    // most that kind allows
    for (const kind of [Slots.Ability, Slots.Item, Slots.Move]) {
      expect(getSlots(UNLIMITED_BATTLE_LIMITS, kind)).toBe(mostSlots(kind));
    }
    // And a fight against the world adds none either: an expert is
    // built with two abilities and two items, and the player's belt
    // is the one they packed. Under the mainline's one of each, half
    // of both was thrown away before the fight started
    for (const kind of [Slots.Ability, Slots.Item, Slots.Move]) {
      expect(getSlots(NPC_BATTLE_LIMITS, kind)).toBe(mostSlots(kind));
    }

    // And a scenario is one packed number, which is why it can be
    // stored on the battle record
    const scenario = packSlots(1, 2, 4);

    expect(getSlots(scenario, Slots.Item)).toBe(2);
    expect(getSlots(scenario, Slots.Ability)).toBe(1);
  });

  it('holds a host\u2019s limits inside what a fight can be set to', () => {
    // A count below what the kind allows would field a pokemon that
    // cannot fight it, and one above it would wrap into its neighbour
    expect(getSlots(withLimit(PVP_BATTLE_LIMITS, Slots.Move, 0), Slots.Move)).toBe(
      leastSlots(Slots.Move),
    );
    expect(getSlots(withLimit(PVP_BATTLE_LIMITS, Slots.Move, 99), Slots.Move)).toBe(
      mostSlots(Slots.Move),
    );

    // And one count moves without disturbing the other two
    const set = withLimit(PVP_BATTLE_LIMITS, Slots.Item, 3);

    expect(getSlots(set, Slots.Item)).toBe(3);
    expect(getSlots(set, Slots.Ability)).toBe(1);
    expect(getSlots(set, Slots.Move)).toBe(4);
  });

  it('reads a lobby written before it had rules as the shape duels used to be', () => {
    expect(asDuelRules({})).toEqual(DEFAULT_DUEL_RULES);
    expect(asDuelRules({ limits: packSlots(2, 2, 2), teamSize: 3 })).toEqual({
      limits: packSlots(2, 2, 2),
      teamSize: 3,
    });
  });

  it('buries the Utility Belt with the things that change a pokemon', () => {
    const data = getItemData(Items.UtilityBelt);
    const prized = new Set(ITEM_POOL.prized.map((entry) => entry.item));

    expect(data.name).toBe('Utility Belt');
    // Used on a pokemon and gone. Never held: a belt in the grip
    // would be a held item taking up the slot it grants
    expect(data.type).toBe(ItemTypes.Training);
    expect(data.flags & ItemFlags.Usable).not.toBe(0);
    expect(data.flags & ItemFlags.Consumable).not.toBe(0);
    expect(data.flags & ItemFlags.Holdable).toBe(0);
    expect(data.flags & ItemFlags.Marketable).toBe(0);
    expect(isUtilityBelt(Items.UtilityBelt)).toBe(true);
    expect(isUtilityBelt(Items.ExpertBelt)).toBe(false);

    // What it widens, and where it is found: the band for things that
    // change a pokemon for good
    expect(UTILITY_BELT_SLOT).toBe(Slots.Item);
    expect(prized.has(Items.UtilityBelt)).toBe(true);
    expect(isPreciousItem(Items.UtilityBelt)).toBe(true);

    // One belt is one slot, and the field's own ceiling is the end of
    // it
    const roomier = withSlots(defaultSlots(), UTILITY_BELT_SLOT, 2);

    expect(getSlots(roomier, Slots.Item)).toBe(2);
    expect(getSlots(withSlots(roomier, UTILITY_BELT_SLOT, MAX_SLOTS + 1), Slots.Item)).toBe(
      MAX_SLOTS,
    );
  });

  it('buries the two that work on abilities beside it', () => {
    const prized = new Set(ITEM_POOL.prized.map((entry) => entry.item));

    for (const item of [Items.AbilityCapsule, Items.AbilityPatch]) {
      const data = getItemData(item);

      // Spent on a pokemon and gone, and found rather than sold: a
      // shop stocking either would sell every pokemon a wider record
      expect(data.type).toBe(ItemTypes.Training);
      expect(data.flags & ItemFlags.Usable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.flags & ItemFlags.Holdable).toBe(0);
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(prized.has(item)).toBe(true);
      expect(isPreciousItem(item)).toBe(true);
    }
    expect(isAbilityCapsule(Items.AbilityCapsule)).toBe(true);
    expect(isAbilityCapsule(Items.AbilityPatch)).toBe(false);
    expect(isAbilityPatch(Items.AbilityPatch)).toBe(true);

    // A capsule widens the one thing the Channeler fills, and stops
    // where the field does
    expect(ABILITY_CAPSULE_SLOT).toBe(Slots.Ability);
    expect(mostSlots(ABILITY_CAPSULE_SLOT)).toBe(4);
  });

  it('buries the bottle caps rather than stocking them', () => {
    for (const item of [Items.GoldenBottleCap, Items.BottleCap]) {
      const data = getItemData(item);

      // Spent on a pokemon and gone; never held, never sold, never
      // listed — what a cap is worth is what it does
      expect(data.type).toBe(ItemTypes.Training);
      expect(data.flags & ItemFlags.Usable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(data.flags & ItemFlags.Holdable).toBe(0);
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(data.sell).toBe(0);
      expect(isBottleCap(item)).toBe(true);
    }
    expect(getItemData(Items.GoldenBottleCap).name).toBe('Golden Bottle Cap');
    expect(getItemData(Items.BottleCap).name).toBe('Bottle Cap');
    expect(isBottleCap(Items.Nugget)).toBe(false);

    // The golden one perfects everything there is, the plain one a
    // single stat
    expect(BOTTLE_CAPS.get(Items.GoldenBottleCap)).toBe(STAT_ORDER.length);
    expect(BOTTLE_CAPS.get(Items.BottleCap)).toBe(1);

    // A one-per-world find and the band below it, each in one band
    // only: the plain cap fixes one stat and the golden one all six
    expect(ITEM_POOL.special.some((entry) => entry.item === Items.GoldenBottleCap)).toBe(true);
    expect(ITEM_POOL.prized.some((entry) => entry.item === Items.BottleCap)).toBe(true);
    for (const band of ['base', 'uncommon', 'rare', 'prized'] as const) {
      expect(ITEM_POOL[band].some((entry) => entry.item === Items.GoldenBottleCap)).toBe(false);
    }
    for (const band of ['base', 'uncommon', 'rare', 'special'] as const) {
      expect(ITEM_POOL[band].some((entry) => entry.item === Items.BottleCap)).toBe(false);
    }
  });

  it('puts a shadow right with a purifying gem', () => {
    const gem = getItemData(Items.PurifyingGem);

    expect(gem.name).toBe('Purifying Gem');
    expect(gem.type).toBe(ItemTypes.Training);
    expect(gem.flags & ItemFlags.Usable).toBeGreaterThan(0);
    expect(gem.flags & ItemFlags.Consumable).toBeGreaterThan(0);
    // Found, never stocked, and only ever in the prized band: taking
    // a shadow off a pokemon cannot be undone
    expect(gem.buy).toBe(0);
    expect(ITEM_POOL.prized.some((entry) => entry.item === Items.PurifyingGem)).toBe(true);
    for (const band of ['base', 'uncommon', 'rare', 'special'] as const) {
      expect(ITEM_POOL[band].some((entry) => entry.item === Items.PurifyingGem)).toBe(false);
    }
    expect(isPurifyingGem(Items.PurifyingGem)).toBe(true);
    expect(isPurifyingGem(Items.BottleCap)).toBe(false);

    // Only a shadow is worth spending one on
    expect(isPurifiable({ shadow: true })).toBe(true);
    expect(isPurifiable({ shadow: false })).toBe(false);

    // The shadow comes off, which is what puts the candy cost back
    // down
    expect(getCandyCost({ shadow: true })).toBe(CANDY_PER_LEVEL * SHADOW_CANDY_MULTIPLIER);
    expect(getCandyCost({ shadow: false })).toBe(CANDY_PER_LEVEL);

    // The ability is replaced where it stands; the rolled one is left
    // exactly where it was
    expect(purifyAbilities([Abilities.Overgrow, Abilities.Shadow])).toEqual([
      Abilities.Overgrow,
      Abilities.Purified,
    ]);
    expect(getAbilityData(Abilities.Purified).name).toBe('Purified');

    // Two on every stat, and never past the cap
    const values = purifyIVs(
      packIVs({
        [Stats.HP]: 0,
        [Stats.Attack]: 5,
        [Stats.Defense]: 30,
        [Stats.SpecialAttack]: MAX_IV,
        [Stats.SpecialDefense]: 15,
        [Stats.Speed]: 29,
      }),
    );

    expect(getIV(values, Stats.HP)).toBe(PURIFY_IV_BOOST);
    expect(getIV(values, Stats.Attack)).toBe(5 + PURIFY_IV_BOOST);
    expect(getIV(values, Stats.Defense)).toBe(MAX_IV);
    expect(getIV(values, Stats.SpecialAttack)).toBe(MAX_IV);
    expect(getIV(values, Stats.Speed)).toBe(MAX_IV);
    expect(purifyIVs(PERFECT_IVS)).toBe(PERFECT_IVS);
  });

  it('keeps everything a player carries in one bag', () => {
    // Two maps in one document: the items and the candies live beside
    // each other, so a screen showing both reads one document rather
    // than running two queries
    const bag = {
      items: { [Items.Potion]: 3, [Items.UltraBall]: 1 },
      candies: { [Families.Bulbasaur]: 12 },
    };

    expect(getStack(bag, ITEM_STACKS, Items.Potion)).toBe(3);
    expect(getStack(bag, CANDY_STACKS, Families.Bulbasaur)).toBe(12);

    // Each map is read on its own: a candy count is never mistaken
    // for an item count, whatever the two ids happen to be — and
    // Potion's id is not a family anybody has candy of
    expect(getStack(bag, CANDY_STACKS, Items.Potion)).toBe(0);
    expect(getStack(bag, ITEM_STACKS, Families.Bulbasaur)).toBe(0);

    // What is not carried is not there. A key that was never written,
    // a bag that never was, and a count of zero all read the same,
    // and none of them is listed
    expect(getStack(bag, ITEM_STACKS, Items.MasterBall)).toBe(0);
    expect(getStack(undefined, ITEM_STACKS, Items.Potion)).toBe(0);
    expect(getStack({ items: { [Items.Potion]: 0 } }, ITEM_STACKS, Items.Potion)).toBe(0);
    expect(listStacks({ items: { [Items.Potion]: 0 } }, ITEM_STACKS)).toEqual([]);

    // Listed as id-count pairs, which is what every picker wants
    expect(new Map(listStacks(bag, ITEM_STACKS))).toEqual(
      new Map([
        [Items.Potion, 3],
        [Items.UltraBall, 1],
      ]),
    );
    expect(listStacks(bag, CANDY_STACKS)).toEqual([[Families.Bulbasaur, 12]]);

    // And anything that is not a bag at all is an empty one rather
    // than a thrown error
    expect(listStacks({ items: 'nonsense' }, ITEM_STACKS)).toEqual([]);
    expect(listStacks(null, CANDY_STACKS)).toEqual([]);
  });

  it('reads a mark only where it was actually written', () => {
    // Five fields rather than five bits, so each can be asked of the
    // store — and a stored yes is a stored `true`, never a number or
    // a string that happens to be truthy
    expect(asBoolean(true)).toBe(true);
    expect(asBoolean(false)).toBe(false);
    expect(asBoolean(undefined)).toBe(false);
    expect(asBoolean(1)).toBe(false);
    expect(asBoolean('true')).toBe(false);
  });

  it('keeps what the player asked for apart from what the game decided', () => {
    // The two the player sets themselves answer different questions:
    // a favorite is about parting with a pokemon, a lock is about
    // disturbing it, and neither implies the other
    expect(isFavorite({ favorite: true })).toBe(true);
    expect(isGuarded({ guarded: false })).toBe(false);
    expect(isFavorite({ favorite: false })).toBe(false);
    expect(isGuarded({ guarded: true })).toBe(true);
  });

  it('gives every teachable move a machine of its own', () => {
    // The machines are generated from the learn sets rather than
    // written out, so a move any species can be taught has one — and
    // the item id is the move's own, lifted into the reserved range
    const teachable = getTeachableMoves();

    expect(teachable.length).toBeGreaterThan(0);
    for (const move of teachable) {
      const item = getMachineItem(move);

      expect(isMachineItem(item)).toBe(true);
      expect(getMachineMove(item)).toBe(move);
      expect(getItemData(item).name).toBe(`TM ${getMoveData(move).name}`);
      // A machine is used on a pokemon and spent teaching it, which is
      // what makes teaching a decision rather than a menu
      expect(getItemData(item).flags & ItemFlags.Consumable).not.toBe(0);
      expect(getItemData(item).flags & ItemFlags.Usable).not.toBe(0);
    }

    // Nothing hand-written strays into the machine range
    expect(isMachineItem(Items.Potion)).toBe(false);
    expect(getMachineMove(Items.Potion)).toBeNull();
  });

  it('names and colours every type and move kind', () => {
    // Both maps are read by the badges rather than matched on, so a
    // type added without either would draw as a blank chip. The enum
    // is const, so the keys of the name map stand in for it
    const types: Types[] = Object.keys(TYPE_NAMES).map(Number);

    expect(types.length).toBeGreaterThan(17);
    for (const type of types) {
      expect(TYPE_NAMES[type]).not.toBe('');
      expect(TYPE_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(TYPE_NAMES[Types.Water]).toBe('Water');

    // The three kinds a move can be, each with a mark of its own —
    // and the word beside it, so nothing rests on the colour alone
    for (const category of [
      MoveCategories.Physical,
      MoveCategories.Special,
      MoveCategories.Status,
    ]) {
      expect(MOVE_CATEGORY_NAMES[category]).not.toBe('');
      expect(MOVE_CATEGORY_COLORS[category]).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(new Set(Object.values(MOVE_CATEGORY_COLORS)).size).toBe(3);
  });

  it('holds each kind of room inside what the game allows', () => {
    // The width holds eight of everything; what a pokemon may have is
    // a rule rather than a consequence of the packing
    expect(SLOT_LIMITS[Slots.Ability]).toEqual([1, 4]);
    expect(SLOT_LIMITS[Slots.Item]).toEqual([1, 8]);
    expect(SLOT_LIMITS[Slots.Move]).toEqual([4, 8]);

    for (const kind of [Slots.Ability, Slots.Item, Slots.Move]) {
      expect(leastSlots(kind)).toBeGreaterThanOrEqual(1);
      expect(mostSlots(kind)).toBeLessThanOrEqual(MAX_SLOTS);
      expect(getSlots(withSlots(0, kind, 99), kind)).toBe(mostSlots(kind));
      expect(getSlots(withSlots(0, kind, 0), kind)).toBe(leastSlots(kind));
    }
  });

  it('packs how much room a pokemon has into three counts', () => {
    // Stored 0-based, so an unwritten field reads as the least of
    // each kind: one ability, one held item, and the four moves every
    // pokemon can already use
    expect(getSlots(0, Slots.Ability)).toBe(1);
    expect(getSlots(0, Slots.Item)).toBe(1);
    expect(getSlots(0, Slots.Move)).toBe(4);

    const usual = packSlots(1, 1, 4);

    expect(getSlots(usual, Slots.Ability)).toBe(1);
    expect(getSlots(usual, Slots.Item)).toBe(1);
    expect(getSlots(usual, Slots.Move)).toBe(4);
    // Three counts, three bits each: the whole field is nine bits
    expect(usual).toBeLessThan(1 << (3 * SLOT_BITS));

    // One count moves without disturbing the two beside it
    const roomier = withSlots(usual, Slots.Item, 2);

    expect(getSlots(roomier, Slots.Item)).toBe(2);
    expect(getSlots(roomier, Slots.Ability)).toBe(1);
    expect(getSlots(roomier, Slots.Move)).toBe(4);

    // And a count outside what the kind allows is brought inside it
    // rather than wrapping into its neighbour. Four abilities is the
    // ceiling even though three bits would hold eight
    const clamped = withSlots(usual, Slots.Ability, 99);

    expect(getSlots(clamped, Slots.Ability)).toBe(mostSlots(Slots.Ability));
    expect(mostSlots(Slots.Ability)).toBeLessThan(MAX_SLOTS);
    expect(getSlots(clamped, Slots.Move)).toBe(4);
    expect(getSlots(withSlots(usual, Slots.Move, 0), Slots.Move)).toBe(leastSlots(Slots.Move));

    // A record written while the ceiling was higher reads inside the
    // one that holds now, so nothing keeps room the game will not
    // honour
    expect(getSlots(packSlots(1, 1, 4) | (7 << 0), Slots.Ability)).toBe(mostSlots(Slots.Ability));

    // The special tier takes no room at all: a shadow arrives carrying
    // two abilities and still has its one slot free for the one it
    // rolled, purified or not
    expect(getSlots(defaultSlots([Abilities.Overgrow]), Slots.Ability)).toBe(1);
    expect(getSlots(defaultSlots([Abilities.Overgrow, Abilities.Shadow]), Slots.Ability)).toBe(1);
    expect(getSlots(defaultSlots([Abilities.Overgrow, Abilities.Purified]), Slots.Ability)).toBe(1);
    expect(getSlots(defaultSlots([Abilities.Boss, Abilities.Overgrow]), Slots.Ability)).toBe(1);
    expect(getSlots(defaultSlots(), Slots.Move)).toBe(4);

    // What does take room is an ordinary ability, and two of them
    // widen it
    expect(countAbilitySlots([Abilities.Overgrow, Abilities.Shadow, Abilities.Boss])).toBe(1);
    expect(countsAgainstSlots(Abilities.Overgrow)).toBe(true);
    expect(countsAgainstSlots(Abilities.Shadow)).toBe(false);
    expect(getSlots(defaultSlots([Abilities.Overgrow, Abilities.Blaze]), Slots.Ability)).toBe(2);
  });

  it('draws both of a pokemon\u2019s rolls as eight braille cells', () => {
    // Each cell is one byte of the roll, most significant first: the
    // Unicode block puts dot n at bit n − 1 of the offset, so the two
    // 32-bit numbers fit in eight characters with nothing dropped
    expect(getSigil(0, 0)).toBe('\u2800'.repeat(SIGIL_CELLS));
    expect(getSigil(0xff, 0)).toBe('\u2800\u2800\u2800\u28ff\u2800\u2800\u2800\u2800');
    expect(getSigil(0, 0xff)).toBe('\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u28ff');
    expect(getSigil(0xffff_ffff, 0xffff_ffff)).toBe('\u28ff'.repeat(SIGIL_CELLS));

    // Every cell is a real braille cell, and the individual value is
    // drawn before the trait value
    const sigil = getSigil(0x0102_0304, 0x0506_0708);

    expect(sigil.length).toBe(SIGIL_CELLS);
    expect([...sigil].map((cell) => cell.codePointAt(0)! - BRAILLE_BASE)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);

    // The same roll always draws the same, and a different roll does
    // not — which is the whole of what a sigil is for
    expect(getSigil(0x0102_0304, 0x0506_0708)).toBe(sigil);
    expect(getSigil(0x0102_0304, 0x0506_0709)).not.toBe(sigil);

    // A roll that arrived as a signed number, or as nothing at all, is
    // still eight cells rather than a thrown error
    expect(getSigil(-1, Number.NaN)).toBe(`${'\u28ff'.repeat(4)}${'\u2800'.repeat(4)}`);
  });

  it('packs the statuses a pokemon carries into one mask', () => {
    const carried = packStatuses([Statuses.Poisoned, Statuses.Burned]);

    // A set of named things is a bitfield: order does not matter,
    // and the same status twice is once
    expect(carried).toBe(packStatuses([Statuses.Burned, Statuses.Poisoned, Statuses.Burned]));
    expect(unpackStatuses(carried)).toEqual([Statuses.Poisoned, Statuses.Burned]);
    expect(packStatuses([])).toBe(0);
    expect(unpackStatuses(0)).toEqual([]);

    // What a fight leaves behind is one AND rather than a filtered
    // list, and a volatile status has no bit to be written with:
    // confusion cannot enter the mask at all
    expect(NON_VOLATILE_MASK & statusFlag(Statuses.Burned)).not.toBe(0);
    expect(statusFlag(Statuses.Confused)).toBe(0);
    expect(packStatuses([Statuses.Confused])).toBe(0);

    // The flags are their own numbering rather than shifts of the
    // battle engine's, so they start at the first bit and stay there
    // however the engine renumbers
    expect(statusFlag(Statuses.Poisoned)).toBe(StatusFlags.Poisoned);
    expect(StatusFlags.Poisoned).toBe(0b1);
    expect(flagStatus(StatusFlags.Frozen)).toBe(Statuses.Frozen);
    expect(NON_VOLATILE_MASK).toBe(0b11_1111);

    // Six flags, one per status, no two sharing a bit
    expect(NON_VOLATILE_STATUSES).toHaveLength(6);
    expect(new Set(NON_VOLATILE_STATUSES.map(statusFlag)).size).toBe(6);
    for (const status of NON_VOLATILE_STATUSES) {
      const flag = statusFlag(status);

      expect(flag & (flag - 1)).toBe(0);
      expect(flagStatus(flag)).toBe(status);
    }
  });

  it('packs the six individual values into one integer', () => {
    const spread = {
      [Stats.HP]: 31,
      [Stats.Attack]: 0,
      [Stats.Defense]: 17,
      [Stats.SpecialAttack]: 4,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 9,
    };
    const packed = packIVs(spread);

    // Thirty bits hold the lot, and every stat comes back the way it
    // went in
    expect(unpackIVs(packed)).toEqual(spread);
    for (const stat of STAT_ORDER) {
      expect(getIV(packed, stat)).toBe(spread[stat]);
    }
    expect(packed).toBeLessThan(2 ** 30);

    // Writing one stat leaves its neighbours alone, and nothing can
    // bleed past five bits
    const raised = setIV(packed, Stats.Attack, MAX_IV);

    expect(getIV(raised, Stats.Attack)).toBe(MAX_IV);
    expect(getIV(raised, Stats.HP)).toBe(31);
    expect(getIV(raised, Stats.Defense)).toBe(17);
    expect(getIV(setIV(packed, Stats.Speed, 99), Stats.Speed)).toBe(MAX_IV);
    expect(getIV(setIV(packed, Stats.Speed, -4), Stats.Speed)).toBe(0);

    // A perfect pokemon is one value, whichever way it is reached
    expect(PERFECT_IVS).toBe(packIVs(unpackIVs(PERFECT_IVS)));
    expect(isPerfectIVs(PERFECT_IVS)).toBe(true);
  });

  it('rates the six values coarsely, for a pokemon being offered', () => {
    const evenly = (value: number): number =>
      packIVs({
        [Stats.HP]: value,
        [Stats.Attack]: value,
        [Stats.Defense]: value,
        [Stats.SpecialAttack]: value,
        [Stats.SpecialDefense]: value,
        [Stats.Speed]: value,
      });

    // One star per MAX_IV points across all six: flawless is six,
    // hopeless is none, and average is half
    expect(getIVStars(PERFECT_IVS)).toBe(MAX_IV_STARS);
    expect(getIVStars(evenly(0))).toBe(0);
    expect(getIVStars(evenly(16))).toBe(3);

    // Lossy on purpose: where the points sit does not change the
    // rating, so a rating says how good rather than which stat
    const lopsided = packIVs({
      [Stats.HP]: MAX_IV,
      [Stats.Attack]: MAX_IV,
      [Stats.Defense]: MAX_IV,
      [Stats.SpecialAttack]: 0,
      [Stats.SpecialDefense]: 0,
      [Stats.Speed]: 0,
    });
    // The same ninety-three points, spread flat instead of stacked
    const spread = packIVs({
      [Stats.HP]: 16,
      [Stats.Attack]: 16,
      [Stats.Defense]: 16,
      [Stats.SpecialAttack]: 15,
      [Stats.SpecialDefense]: 15,
      [Stats.Speed]: 15,
    });

    expect(getIVStars(lopsided)).toBe(getIVStars(spread));
    // And it never overflows the row of stars it is drawn as
    expect(getIVStars(evenly(MAX_IV))).toBeLessThanOrEqual(MAX_IV_STARS);
  });

  it('polishes individual values with a bottle cap', () => {
    const evenly = (value: number): number =>
      packIVs({
        [Stats.HP]: value,
        [Stats.Attack]: value,
        [Stats.Defense]: value,
        [Stats.SpecialAttack]: value,
        [Stats.SpecialDefense]: value,
        [Stats.Speed]: value,
      });

    // A golden cap reaches every stat, whatever the stream says
    const golden = polishIVs(evenly(0), STAT_ORDER.length, () => 0);

    expect(golden).toBe(PERFECT_IVS);
    expect(isPerfectIVs(golden ?? 0)).toBe(true);

    // A plain cap raises exactly one, and leaves the rest as they were
    const plain = polishIVs(evenly(5), 1, () => 0) ?? 0;
    const raised = STAT_ORDER.filter((stat) => getIV(plain, stat) === MAX_IV);

    expect(raised).toHaveLength(1);
    for (const stat of STAT_ORDER) {
      expect(getIV(plain, stat)).toBe(raised[0] === stat ? MAX_IV : 5);
    }

    // Only the stats that need it are drawn from: a cap that could
    // land on a stat already at the cap would be spent on nothing,
    // and would get worse the closer a pokemon came to perfect
    const nearly = setIV(PERFECT_IVS, Stats.Speed, 0);

    for (const roll of [0, 0.5, 0.999]) {
      expect(polishIVs(nearly, 1, () => roll)).toBe(PERFECT_IVS);
    }

    // Nothing left to polish, so there is nothing to spend a cap on
    expect(polishIVs(PERFECT_IVS, STAT_ORDER.length, () => 0)).toBeNull();
    expect(isPerfectIVs(nearly)).toBe(false);
  });

  it('prices the valuables to sell and never to buy', () => {
    const nugget = getItemData(Items.Nugget);

    expect(nugget.type).toBe(ItemTypes.Valuable);
    expect(nugget.sell).toBeGreaterThan(0);
    expect(nugget.buy).toBe(0);

    // A found item carries no market listing, however well it sells
    for (const item of [
      Items.Nugget,
      Items.Pearl,
      Items.BigPearl,
      Items.Stardust,
      Items.StarPiece,
    ]) {
      expect(getItemData(item).flags & ItemFlags.Marketable).toBe(0);
    }
    expect(getItemData(Items.OranBerry).flags & ItemFlags.Marketable).toBe(0);
    expect(getItemData(Items.OranBerry).sell).toBeGreaterThan(0);

    // Balls and stones are what the market stocks
    expect(getItemData(Items.UltraBall).flags & ItemFlags.Marketable).not.toBe(0);
    expect(getItemData(Items.FireStone).buy).toBeGreaterThan(0);

    // The valuables are hidden in the overworld instead, a band
    // below what they are worth: gold trickles rather than drops
    expect(ITEM_POOL.base.some((entry) => entry.item === Items.Pearl)).toBe(true);
    expect(ITEM_POOL.uncommon.some((entry) => entry.item === Items.StarPiece)).toBe(true);
    expect(ITEM_POOL.rare.some((entry) => entry.item === Items.Nugget)).toBe(true);

    // The rarest band stays for what gold cannot buy
    expect(ITEM_POOL.special.map((entry) => entry.item)).toEqual([
      Items.MasterBall,
      Items.ShinyCharm,
      Items.CatchingCharm,
      Items.OldSeaMap,
      Items.GSBall,
      Items.AuroraTicket,
      Items.WishTag,
      Items.MemberCard,
      Items.ManaphyEgg,
      Items.OaksLetter,
      Items.AzureFlute,
      Items.ColtsPetal,
      Items.GoldenBottleCap,
      // The one thing in the band that is only gold, and there because
      // it is more of it than anything else in the game pays
      Items.RelicCrown,
    ]);
  });

  it('runs the valuables up one ladder, priced and placed together', () => {
    // Every valuable is the same kind of thing — gold with a picture
    // on it — so they share a shape: found, never stocked, and worth
    // exactly what a vendor pays
    for (const [item, sell] of VALUABLE_SELL) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Valuable);
      expect(data.sell).toBe(sell);
      expect(data.buy).toBe(0);
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      // A valuable that nothing hid would be a valuable nobody could
      // ever have
      expect(getItemBand(item)).not.toBeNull();
      expect(isValuable(item)).toBe(true);
    }
    expect(isValuable(Items.Potion)).toBe(false);

    // The ladder climbs, and the band each rung is hidden in climbs
    // with it. It is banded by what a find is worth, so a shell off a
    // beach is a common and a crown out of a ruin stands with the
    // Master Ball
    const bands = ['base', 'uncommon', 'rare', 'prized', 'special'];
    const rung = (item: Items): number => bands.indexOf(getItemBand(item) ?? '');

    expect(getItemBand(Items.TinyMushroom)).toBe('base');
    expect(getItemBand(Items.RelicCopper)).toBe('base');
    expect(getItemBand(Items.RelicSilver)).toBe('uncommon');
    expect(getItemBand(Items.BigNugget)).toBe('rare');
    expect(getItemBand(Items.CometShard)).toBe('prized');
    expect(getItemBand(Items.RelicCrown)).toBe('special');

    // Banded by worth throughout: nothing dear is hidden where
    // something cheap is, whichever pair is compared
    const ladder = [...VALUABLE_SELL].sort(([, one], [, other]) => one - other);

    for (const [at, [item, sell]] of ladder.entries()) {
      for (const [dearer, price] of ladder.slice(at + 1)) {
        if (price > sell) {
          expect(
            rung(item),
            `${getItemData(item).name} vs ${getItemData(dearer).name}`,
          ).toBeLessThanOrEqual(rung(dearer));
        }
      }
    }

    // And the dearest of them is the thinnest slot in the rarest
    // band: a Relic Crown is a story rather than an afternoon's income
    const crown = ITEM_POOL.special.find((entry) => entry.item === Items.RelicCrown);

    expect(crown?.weight).toBe(Math.min(...ITEM_POOL.special.map((entry) => entry.weight)));
    for (const entry of ITEM_POOL.special) {
      expect(getItemData(Items.RelicCrown).sell).toBeGreaterThanOrEqual(
        getItemData(entry.item).sell,
      );
    }
  });

  it('never lets a dearer valuable be the commoner find', () => {
    // The band check above is not enough on its own, and the crown is
    // why. A band eight times rarer, entered through a slot ten times
    // wider, is the commoner find in the end: at weight 5 the crown
    // outdrew the statue worth two thirds of it, and every assertion
    // about bands passed while it did.
    //
    // What holds instead is that the valuables' bands do not overlap:
    // whatever band a valuable is in, every valuable in a rarer band
    // is a rarer find than it. The rest of the pool is banded by what
    // a thing does rather than what it costs, so this is the ladder's
    // rule and not the pool's
    const bands = ['base', 'uncommon', 'rare', 'prized', 'special'];
    const rung = (item: Items): number => bands.indexOf(getItemBand(item) ?? '');

    for (const [item] of VALUABLE_SELL) {
      for (const [other] of VALUABLE_SELL) {
        if (rung(other) > rung(item)) {
          expect(
            getItemOdds(other),
            `${getItemData(other).name} against ${getItemData(item).name}`,
          ).toBeLessThan(getItemOdds(item));
        }
      }
    }

    // The ruins are a ladder inside one band as well as across two,
    // and there the price order is the whole order: each is dearer
    // than the last and each is scarcer than the last
    const ruins = [
      Items.RelicVase,
      Items.CometShard,
      Items.RelicBand,
      Items.RelicStatue,
      Items.RelicCrown,
    ];

    for (const [at, item] of ruins.slice(0, -1).entries()) {
      const next = ruins[at + 1];

      expect(getItemData(next).sell).toBeGreaterThan(getItemData(item).sell);
      expect(getItemOdds(next), getItemData(next).name).toBeLessThan(getItemOdds(item));
    }

    // And the dearest find in the game is the rarest find in the game,
    // against everything the ground hides rather than against the four
    // beside it
    const hidden = new Set(
      (['base', 'uncommon', 'rare', 'prized', 'special'] as const).flatMap((band) =>
        ITEM_POOL[band].map((entry) => entry.item),
      ),
    );

    for (const item of hidden) {
      if (item !== Items.RelicCrown) {
        expect(getItemOdds(item), getItemData(item).name).toBeGreaterThan(
          getItemOdds(Items.RelicCrown),
        );
      }
    }
  });

  it('lets the vendor buy anything priced, listing or no listing', () => {
    // What `Marketable` says is that the market **lists** it — that it
    // could be in a crate. What he takes off a player's hands is
    // anything with a price on it, which is the only thing a nugget
    // was ever for
    expect(sellPrice(Items.Nugget)).toBe(getItemData(Items.Nugget).sell);
    expect(sellPrice(Items.Nugget)).toBeGreaterThan(0);
    expect(isMarketable(Items.Nugget)).toBe(false);
    expect(sellPrice(Items.OranBerry)).toBeGreaterThan(0);
    expect(sellPrice(Items.UltraBall)).toBeGreaterThan(0);

    // Zero means he will not take it at all: what these are worth is
    // not gold
    expect(sellPrice(Items.HeartScale)).toBe(0);
    expect(sellPrice(Items.PortalKey)).toBe(0);
    expect(sellPrice(Items.WishTag)).toBe(0);
  });

  it('stocks the evolution items whose lines are registered, and holds the rest back', () => {
    // A stone or a token is sold and buried once something can spend
    // it. The four Sinnoh stones and the five tokens below them all
    // have a line asking now
    const stones = [Items.ShinyStone, Items.DuskStone, Items.DawnStone, Items.IceStone];
    const carried = [
      Items.DubiousDisc,
      Items.Protector,
      Items.Electirizer,
      Items.Magmarizer,
      Items.ReaperCloth,
      Items.RazorClaw,
      Items.RazorFang,
      Items.OvalStone,
    ];

    for (const item of [...stones, ...carried]) {
      const data = getItemData(item);

      expect(data.flags & ItemFlags.Marketable, data.name).not.toBe(0);
      expect(data.buy, data.name).toBeGreaterThan(0);
      expect(data.sell, data.name).toBeGreaterThan(0);
    }

    // The ones still waiting on a generation this game has not
    // registered are named, drawn and priceless rather than stocked
    const latent = [
      Items.KingsRock,
      Items.DragonScale,
      Items.UpGrade,
      Items.Sachet,
      Items.WhippedDream,
    ];

    for (const item of latent) {
      const data = getItemData(item);

      expect(data.type).toBe(ItemTypes.Evolution);
      expect(data.flags & ItemFlags.Marketable, data.name).toBe(0);
      expect(data.buy, data.name).toBe(0);
      expect(data.sell, data.name).toBe(0);
      expect(getItemBand(item)).toBeNull();
      expect(new Set(getVendorGoods()).has(item), data.name).toBe(false);
    }

    // A stone is spent on the pokemon, the way the five Kanto ones are
    for (const item of stones) {
      expect(getItemData(item).flags & ItemFlags.Usable, getItemData(item).name).not.toBe(0);
    }

    // Everything carried is held rather than spent: the evolution asks
    // what the pokemon is holding, and only a holdable item can be
    // handed to one at all
    for (const item of [...carried, ...latent]) {
      const data = getItemData(item);

      expect(data.flags & ItemFlags.Holdable, data.name).not.toBe(0);
      expect(data.flags & ItemFlags.Usable, data.name).toBe(0);
    }

    // A Razor Claw, a Razor Fang and an Oval Stone are not trade items
    // at all: what a Weavile, a Gliscor and a Chansey want is a level
    // with one in hand, so all three are held and none is ever spent
    for (const item of [Items.RazorClaw, Items.RazorFang, Items.OvalStone]) {
      expect(getItemData(item).type, getItemData(item).name).toBe(ItemTypes.Held);
    }

    // Metal Coat is not duplicated: the Steel booster already
    // registered is the id an evolution will read
    expect(getItemData(Items.MetalCoat).type).toBe(ItemTypes.Held);

    // The three whose lines are registered are the family's
    // exception: a Clamperl opens and a Feebas turns today, so all
    // three are stocked and priced like the cord
    for (const item of [Items.DeepSeaTooth, Items.DeepSeaScale, Items.PrismScale]) {
      const data = getItemData(item);

      expect(data.type, data.name).toBe(ItemTypes.Evolution);
      expect(data.flags & ItemFlags.Marketable, data.name).not.toBe(0);
      expect(data.buy, data.name).toBeGreaterThan(0);
      expect(data.sell, data.name).toBeGreaterThan(0);
    }
  });

  it('keeps every item an evolution asks to be held holdable', () => {
    // What broke a Kingdra: the evolution reads what the pokemon
    // holds, and a pokemon can only be handed a holdable item, so an
    // item that is asked for and cannot be held gates the line shut
    for (const species of getRegisteredSpecies()) {
      for (const evolution of getSpeciesData(species).evolvesInto ?? []) {
        if ((evolution.method & EvolutionMethod.HeldItem) === 0 || evolution.item == null) {
          continue;
        }
        const data = getItemData(evolution.item);

        expect(data.flags & ItemFlags.Holdable, data.name).not.toBe(0);
      }
    }
  });

  it('spends a portal key on the crossing', () => {
    const key = getItemData(Items.PortalKey);

    expect(key.name).toBe('Portal Key');
    expect(key.type).toBe(ItemTypes.KeyItem);
    // Used at a portal, and gone when it opens
    expect(key.flags & ItemFlags.Usable).not.toBe(0);
    expect(key.flags & ItemFlags.Consumable).not.toBe(0);
    // Nothing holds one into a fight, and nothing sells one
    expect(key.flags & ItemFlags.Holdable).toBe(0);
    expect(key.flags & ItemFlags.Marketable).toBe(0);
    expect(key.buy).toBe(0);
    expect(key.sell).toBe(0);
    expect(isPortalKey(Items.PortalKey)).toBe(true);
    expect(isPortalKey(Items.OldSeaMap)).toBe(false);

    // A portal is a landmark like any other, and the prized band is
    // the only place its key is found: rarer than a stone, commoner
    // than the things there is one of in the world
    expect(new Set(LANDMARKS).has(Landmark.Portal)).toBe(true);
    expect(LANDMARK_NAMES[Landmark.Portal]).toBe('Portal');
    expect(ITEM_POOL.prized.some((entry) => entry.item === Items.PortalKey)).toBe(true);
    for (const band of ['base', 'uncommon', 'rare', 'special'] as const) {
      expect(ITEM_POOL[band].some((entry) => entry.item === Items.PortalKey)).toBe(false);
    }
  });

  it('keeps the raid items to the special band and out of the market', () => {
    const relic = getItemData(Items.OldSeaMap);

    expect(relic.name).toBe('Old Sea Map');
    expect(relic.type).toBe(ItemTypes.KeyItem);
    // Used to call a mythical, and spent in the calling
    expect(relic.flags & ItemFlags.Usable).not.toBe(0);
    expect(relic.flags & ItemFlags.Consumable).not.toBe(0);
    // Nobody buys or sells one: found in the pool or not at all
    expect(relic.flags & ItemFlags.Marketable).toBe(0);
    expect(relic.buy).toBe(0);
    expect(relic.sell).toBe(0);

    for (const [item, species] of RAID_ITEMS) {
      // Every relic names a mythical, and only the special band
      // carries it
      expect(getRaidSpecies(item)).toBe(species);
      expect(isMythicalSpecies(species)).toBe(true);
      expect(ITEM_POOL.special.some((entry) => entry.item === item)).toBe(true);
      for (const band of ['base', 'uncommon', 'rare'] as const) {
        expect(ITEM_POOL[band].some((entry) => entry.item === item)).toBe(false);
      }
    }

    // A relic that named a legendary would call nothing: the world
    // stages those itself
    expect(getRaidSpecies(Items.MasterBall)).toBeNull();
  });

  it('paints an Arceus with every Plate it can hold', () => {
    // Multitype is not battle machinery: a Plate names one shape, and
    // the shape's own species data carries the type the Plate lifts
    for (const [plate, type] of PLATES) {
      const shapes = getItemForms(plate);

      expect(shapes.length, getItemData(plate).name).toBe(1);

      const shape = getSpeciesData(shapes[0]);

      expect(shape.types).toEqual([type]);
      expect(shape.dexNumber).toBe(493);
      expect(shape.baseForm).toBe(false);
      expect(shape.worn).toBe(true);
      // Every shape has the six numbers the bare one has
      expect(shape.stats).toEqual(getSpeciesData(Species.Arceus).stats);
    }

    // Seventeen Plates and the shape it is met in
    expect(ARCEUS_FORMS.length).toBe(PLATES.size + 1);
  });

  it('buries every form item, and no shop stocks one', () => {
    for (const [item, forms] of FORM_ITEMS) {
      const data = getItemData(item);
      const buried = (['base', 'uncommon', 'rare', 'prized', 'special'] as const).some((band) =>
        ITEM_POOL[band].some((entry) => entry.item === item),
      );

      // Held for the shape it puts its holder into, and nothing sells
      // one, so the pool is the only way to it
      expect(forms.length).toBeGreaterThan(0);
      expect(data.type).toBe(ItemTypes.Held);
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      expect(data.flags & ItemFlags.Marketable).toBe(0);
      expect(data.buy).toBe(0);
      expect(buried, data.name).toBe(true);
    }

    // A form item whose only use is the shape sits in the prized band,
    // where the rest of the once-in-a-run things are. A Plate is in
    // the rare band with the held items instead, since lifting a type
    // is what it does for everybody who is not an Arceus
    for (const item of [Items.AdamantOrb, Items.LustrousOrb, Items.Gracidea]) {
      expect(ITEM_POOL.prized.some((entry) => entry.item === item)).toBe(true);
    }
    for (const item of PLATES.keys()) {
      expect(ITEM_POOL.rare.some((entry) => entry.item === item)).toBe(true);
    }
  });

  it('registers every berry as a held, consumable berry', () => {
    // A berry the tables know about but the registry does not would
    // show in the bag as its own id
    const berries = [
      ...BERRY_STATUS_CURES.keys(),
      ...BERRY_RESIST_TYPES.keys(),
      ...BERRY_PINCH_STAGES.keys(),
      ...BERRY_NATURE_HEALS.keys(),
      ...BERRY_BRACE_STAGES.keys(),
      ...PINCH_BERRIES,
      Items.LeppaBerry,
      Items.OranBerry,
      Items.SitrusBerry,
      Items.EnigmaBerry,
      Items.JabocaBerry,
      Items.RowapBerry,
    ];

    for (const item of berries) {
      const data = getItemData(item);

      expect(isBerry(item)).toBe(true);
      expect(data.type).toBe(ItemTypes.Berry);
      expect(data.name.endsWith('Berry')).toBe(true);
      // Held to trigger on its own, and gone once it has
      expect(data.flags & ItemFlags.Holdable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      // Found in a patch, never stocked
      expect(data.buy).toBe(0);
      expect(data.sell).toBeGreaterThan(0);
    }
  });

  it('answers every attacking type with one resist berry', () => {
    const answered = [...BERRY_RESIST_TYPES.values()];

    // One berry per type and no type twice, Stellar aside — nothing
    // in this game throws a Stellar move
    expect(new Set(answered).size).toBe(answered.length);
    expect(answered.length).toBe(18);
    expect(new Set(answered).has(Types.Normal)).toBe(true);
  });

  it('grows every berry in a patch somewhere', () => {
    const grown = new Set(
      [...BERRY_POOL.base, ...BERRY_POOL.uncommon, ...BERRY_POOL.rare, ...BERRY_POOL.special].map(
        (entry) => entry.item,
      ),
    );

    // A berry nothing grows is a berry nobody can ever hold: they are
    // not stocked, dropped or given
    for (const item of [
      ...BERRY_STATUS_CURES.keys(),
      ...BERRY_RESIST_TYPES.keys(),
      ...BERRY_PINCH_STAGES.keys(),
      ...BERRY_NATURE_HEALS.keys(),
      ...BERRY_BRACE_STAGES.keys(),
      ...PINCH_BERRIES,
      Items.LeppaBerry,
      Items.OranBerry,
      Items.SitrusBerry,
      Items.EnigmaBerry,
      Items.JabocaBerry,
      Items.RowapBerry,
    ]) {
      expect(grown.has(item)).toBe(true);
    }
  });

  it('registers the flavour berries as bait, and nothing else', () => {
    for (const [item, name] of BAIT_BERRY_NAMES) {
      const data = getItemData(item);

      expect(isBerry(item)).toBe(true);
      expect(data.name).toBe(name);
      expect(data.type).toBe(ItemTypes.Berry);
      // Fed, never held: nothing in a battle reads one
      expect(data.flags & ItemFlags.Holdable).toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      expect(FEED_CATCH_BONUS[item]).toBe(BAIT_CATCH_BONUS);
      // Worth more fed than a berry that had another use
      expect(BAIT_CATCH_BONUS).toBeGreaterThan(FEED_CATCH_BONUS[Items.OranBerry] ?? 0);
    }
  });

  it('gives every prize berry one job, and a patch to grow in', () => {
    const jobs = [RAZZ_CATCH_BONUS, NANAB_FLEE_FACTOR, PINAP_CANDY_HELPINGS];
    const grown = new Set(BERRY_POOL.special.map((entry) => entry.item));

    for (const [item, name] of PRIZE_BERRY_NAMES) {
      const data = getItemData(item);

      expect(isBerry(item)).toBe(true);
      expect(data.name).toBe(name);
      expect(data.type).toBe(ItemTypes.Berry);
      // Fed, never held
      expect(data.flags & ItemFlags.Holdable).toBe(0);
      // Every grade is bait first, whatever else it buys
      expect(FEED_CATCH_BONUS[item]).toBeGreaterThanOrEqual(BAIT_CATCH_BONUS);
      // Exactly one of the three tables answers for it, so no berry
      // quietly does two things or nothing
      expect(jobs.filter((table) => table.has(item)).length, name).toBe(1);
      // The rarest band a patch has, which is where the user put them
      expect(grown.has(item), name).toBe(true);
      expect(describeBerry(item)).not.toBe('');
    }
  });

  it('makes each grade worth more than the one below it', () => {
    expect(RAZZ_CATCH_BONUS.get(Items.GoldenRazzBerry)).toBeGreaterThan(
      RAZZ_CATCH_BONUS.get(Items.SilverRazzBerry) ?? 0,
    );
    // Less left of the flee roll is the better berry here
    expect(NANAB_FLEE_FACTOR.get(Items.GoldenNanabBerry)).toBeLessThan(
      NANAB_FLEE_FACTOR.get(Items.SilverNanabBerry) ?? 1,
    );
    expect(PINAP_CANDY_HELPINGS.get(Items.GoldenPinapBerry)).toBeGreaterThan(
      PINAP_CANDY_HELPINGS.get(Items.SilverPinapBerry) ?? 0,
    );
    // A gold Razz alone is most of what feeding can ever achieve
    expect(RAZZ_CATCH_BONUS.get(Items.GoldenRazzBerry)).toBeLessThanOrEqual(MAX_CATCH_BONUS);
  });

  it('grows no flavour berry yet', () => {
    // They are cut, named and fed, and deliberately left out of the
    // patches: nothing in the world drops one until they are pooled
    const grown = new Set(
      [...BERRY_POOL.base, ...BERRY_POOL.uncommon, ...BERRY_POOL.rare, ...BERRY_POOL.special].map(
        (entry) => entry.item,
      ),
    );

    for (const item of BAIT_BERRY_NAMES.keys()) {
      expect(grown.has(item)).toBe(false);
    }
  });

  it('registers one wing per stat, and puts them where they can be found', () => {
    const stats = [...WING_STATS.values()];

    expect(new Set(stats).size).toBe(stats.length);
    expect(stats.length).toBe(STAT_ORDER.length);

    const pooled = new Set(
      [...ITEM_POOL.base, ...ITEM_POOL.uncommon, ...ITEM_POOL.rare, ...ITEM_POOL.special].map(
        (entry) => entry.item,
      ),
    );

    for (const item of WING_STATS.keys()) {
      const data = getItemData(item);

      expect(isWing(item)).toBe(true);
      expect(data.type).toBe(ItemTypes.Training);
      expect(data.name.endsWith('Wing')).toBe(true);
      // Spent on a pokemon, and gone once it is
      expect(data.flags & ItemFlags.Usable).not.toBe(0);
      expect(data.flags & ItemFlags.Consumable).not.toBe(0);
      // Found on the wind rather than stocked
      expect(data.buy).toBe(0);
      expect(pooled.has(item)).toBe(true);
    }
  });

  it('grows one bitter berry per stat', () => {
    const stats = [...BERRY_EFFORT_DROPS.values()];

    expect(new Set(stats).size).toBe(stats.length);
    expect(stats.length).toBe(STAT_ORDER.length);

    for (const item of BERRY_EFFORT_DROPS.keys()) {
      expect(isBerry(item)).toBe(true);
      expect(getItemData(item).type).toBe(ItemTypes.Berry);
    }
  });

  it('names every kind of item exactly once, in one order', () => {
    // The bag can be narrowed to one kind, and a kind with no name is
    // a shelf the filter cannot offer
    const named = Object.keys(ITEM_TYPE_NAMES).map(Number);

    expect([...ITEM_TYPE_ORDER].sort((left, right) => left - right)).toEqual(
      named.sort((left, right) => left - right),
    );
    expect(new Set(ITEM_TYPE_ORDER).size).toBe(ITEM_TYPE_ORDER.length);

    for (const type of ITEM_TYPE_ORDER) {
      expect(ITEM_TYPE_NAMES[type].length).toBeGreaterThan(0);
    }
  });

  it('registers the Shiny Charm as a holdable key item', () => {
    const charm = getItemData(Items.ShinyCharm);

    expect(charm.name).toBe('Shiny Charm');
    expect(charm.type).toBe(ItemTypes.KeyItem);

    // A buddy holds it; nothing ever consumes it
    expect(charm.flags & ItemFlags.Holdable).not.toBe(0);
    expect(charm.flags & ItemFlags.Consumable).toBe(0);
  });
});

describe('item icons', () => {
  /**
   * The shipped sheets, read once and asked about by every item.
   *
   * They are read off disk rather than mocked because the whole point
   * of the test is that the two halves agree: an item names a picture
   * in `src/data/items`, and the picture either exists under
   * `public/sprites/ui/items` or it does not. Several families derive
   * the name from the item's own — a berry from its name, a machine
   * from its move's type — so a new berry or a new type is exactly
   * the sort of thing that would name a picture nobody drew
   */
  const sheets = new Map<string, Set<string>>();

  function pictures(sheet: string): Set<string> {
    const known = sheets.get(sheet);

    if (known != null) {
      return known;
    }

    let names: Set<string>;

    try {
      const data = asBasicSpriteData(
        JSON.parse(readFileSync(`public/sprites/ui/items/${sheet}/data.json`, 'utf8')),
      );

      names = new Set(data.images.map((image) => image.name.replace(/\.png$/, '')));
    } catch {
      // A sheet that is not there answers as an empty one, so the
      // failure below names the item rather than throwing out of the
      // whole test
      names = new Set();
    }
    sheets.set(sheet, names);
    return names;
  }

  it('gives every registered item a picture that exists', () => {
    const items = ITEM_TYPE_ORDER.flatMap((type) => listItemsByType(type));

    expect(items.length).toBeGreaterThan(100);

    for (const item of items) {
      const data = getItemData(item);
      const cut = data.icon.lastIndexOf('/');

      expect(cut, `${data.name} names no sheet`).toBeGreaterThan(0);
      expect(
        pictures(data.icon.slice(0, cut)).has(data.icon.slice(cut + 1)),
        `${data.name} wants ${data.icon}, which is not on the sheet`,
      ).toBe(true);
    }
  });

  it('draws no two items with the same picture', () => {
    const drawn = new Map<string, string>();

    for (const item of ITEM_TYPE_ORDER.flatMap((type) => listItemsByType(type))) {
      // The machines are the deliberate exception: a TM is drawn by
      // the type of the move it teaches, so every Normal-type machine
      // is the same picture on purpose and the name on it is the news
      if (isMachineItem(item)) {
        continue;
      }
      // The mints are the other one: a mint is drawn by the stat its
      // nature raises, so the four that raise Attack share a jar and
      // the name on it is the news
      if (isMint(item)) {
        continue;
      }

      const data = getItemData(item);
      const first = drawn.get(data.icon);

      // The bag is a tray of pictures with the name on a card nobody
      // is reading while they scan it, so two items sharing one
      // picture are one item as far as a player can tell. Several
      // items have no art of their own and borrow — that is fine, so
      // long as each borrows something different
      expect(first, `${data.name} is drawn as ${first ?? ''} is: ${data.icon}`).toBeUndefined();
      drawn.set(data.icon, data.name);
    }
  });

  it('has every registered item say what it does', () => {
    const items = ITEM_TYPE_ORDER.flatMap((type) => listItemsByType(type));

    for (const item of items) {
      const data = getItemData(item);

      // A blank line is what a table-driven description falls back to
      // when nothing describes the item, so it is the failure worth
      // catching rather than a missing field
      expect(data.description, `${data.name} says nothing about itself`).not.toBe('');
      expect(data.description.endsWith('.'), `${data.name} does not end its line`).toBe(true);
    }
  });

  it('draws a machine in the colours of the move it teaches', () => {
    // The machines are generated rather than written out, so their
    // pictures are too: one per type, and a move of a type nothing
    // has drawn would be a machine with no picture
    for (const move of getTeachableMoves()) {
      expect(getItemData(getMachineItem(move)).icon).toBe(
        `tm/${TYPE_NAMES[getMoveData(move).type].toLowerCase()}`,
      );
    }
  });
});

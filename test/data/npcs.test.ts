import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import registerBiomeSpawns from '../../src/data/biome';
import registerAbilities from '../../src/data/abilities';
import Biome, { WILD_BIOMES } from '../../src/data/ids/biome';
import { Items } from '../../src/data/ids/items';
import { Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import registerItems from '../../src/data/items';
import { registerMoves } from '../../src/data/moves';
import { getExpertHeldItems, isBattleHeldItem } from '../../src/data/items/expert-loadout';
import Npc, {
  EXECUTIVE_CHARSETS,
  EXECUTIVE_HONORS,
  EXECUTIVE_NAMES,
  EXECUTIVE_QUOTES,
  NPCS,
  NPC_NAMES,
  REMINDER_FEE,
  getRecallableMoves,
  npcSheet,
  npcSheets,
} from '../../src/data/overworld/npc';
import {
  getBaseForms,
  getLevelUpMoves,
  getMovesLearnedAt,
  getSpeciesData,
  registerSpecies,
} from '../../src/data/species';
import { AWARD_NAMES } from '../../src/data/ids/awards';
import type Awards from '../../src/data/ids/awards';
import {
  SYNDICATES,
  SYNDICATE_BOSS_CHARSETS,
  SYNDICATE_BOSS_HONORS,
  SYNDICATE_BOSS_NAMES,
  SYNDICATE_BOSS_QUOTES,
  SYNDICATE_EXECUTIVES,
  SYNDICATE_GRUNT_CHARSETS,
  SYNDICATE_GRUNT_HONORS,
  SYNDICATE_GRUNT_QUOTES,
  SYNDICATE_HONORS,
  SYNDICATE_NAMES,
  Syndicate,
  bossName,
  executiveName,
  getSyndicate,
  gruntName,
} from '../../src/data/overworld/syndicate';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

describe('wandering NPCs', () => {
  it('names everyone who wanders', () => {
    expect(new Set(NPCS).size).toBe(NPCS.length);
    for (const npc of NPCS) {
      expect(NPC_NAMES[npc].length).toBeGreaterThan(0);
    }
    expect(new Set(NPCS).has(Npc.MoveReminder)).toBe(true);
    // The one wanderer whose price is not gold
    expect(REMINDER_FEE).toBe(Items.HeartScale);
  });

  it('names everyone their own charset', () => {
    expect(npcSheet(Npc.Vendor)).toBe('characters/frlg/shop-keeper');
    expect(npcSheet(Npc.NurseJoy)).toBe('characters/extra/nurse');
    expect(new Set(NPCS.map(npcSheet)).size).toBe(NPCS.length);
    // A role the packs drew twice has both styles to turn up in
    expect(npcSheets(Npc.MoveTutor)).toContain('characters/lgpe/gentleman');
    expect(npcSheets(Npc.RocketGrunt)).toContain('characters/hgss/rocket-m');
    expect(npcSheets(Npc.Trainer)).toContain('characters/lgpe/ace-trainer');
  });

  it('dresses every role only in sheets that ship', () => {
    // The three who stand at a landmark of their own are dressed the
    // same way the wanderers are, so they are checked beside them
    for (const npc of [...NPCS, Npc.RocketGrunt, Npc.Trainer, Npc.Vendor]) {
      for (const sheet of npcSheets(npc)) {
        expect(existsSync(`public/sprites/overworld/${sheet}/image.png`), sheet).toBe(true);
        expect(existsSync(`public/sprites/overworld/${sheet}/data.json`), sheet).toBe(true);
      }
    }
  });

  it('keeps no numbered npc sheet on disk', () => {
    // Every role names a charset, so the numbered Gen 4 folders they
    // used to fall back to belong to nobody
    for (const folder of readdirSync('public/sprites/overworld')) {
      expect(/^landmarks-npc-\d+$/.test(folder), folder).toBe(false);
    }
  });

  it('offers a level its own moves and no others', () => {
    // What a pokemon has just grown into is the entry for that level
    // exactly, in the order the entry lists it
    expect(getMovesLearnedAt(Species.Bulbasaur, 1)).toEqual([Moves.Tackle, Moves.Growl]);
    expect(getMovesLearnedAt(Species.Bulbasaur, 10)).toEqual([Moves.VineWhip]);
    // A level with nothing on it offers nothing — and the level below
    // one is not the level, which is what keeps growing up from being
    // a free Move Reminder
    expect(getMovesLearnedAt(Species.Bulbasaur, 12)).toEqual([]);

    // Every level's own moves are part of what it has learned by then
    for (const level of [1, 7, 10, 15, 20, 25]) {
      const learned = new Set(getLevelUpMoves(Species.Bulbasaur, level));

      for (const move of getMovesLearnedAt(Species.Bulbasaur, level)) {
        expect(learned.has(move)).toBe(true);
      }
    }
  });

  it('gives back the level-up moves a pokemon has lost and nothing else', () => {
    // Everything Bulbasaur has learned by 27, in the order it learned
    // them, the whole list rather than the four it would be carrying
    expect(getLevelUpMoves(Species.Bulbasaur, 27)).toEqual([
      Moves.Tackle,
      Moves.Growl,
      Moves.LeechSeed,
      Moves.VineWhip,
      Moves.PoisonPowder,
      Moves.SleepPowder,
      Moves.RazorLeaf,
      Moves.SweetScent,
    ]);
    // Nothing it has not reached yet
    expect(new Set(getLevelUpMoves(Species.Bulbasaur, 27)).has(Moves.Growth)).toBe(false);
    expect(getLevelUpMoves(Species.Bulbasaur, 6)).toEqual([Moves.Tackle, Moves.Growl]);

    // What the reminder can put back is that list minus what it still
    // knows: the four it is carrying are not offered back to it
    const carrying = [Moves.VineWhip, Moves.PoisonPowder, Moves.RazorLeaf, Moves.Growth];

    expect(getRecallableMoves(Species.Bulbasaur, 34, carrying)).toEqual([
      Moves.Tackle,
      Moves.Growl,
      Moves.LeechSeed,
      Moves.SleepPowder,
      Moves.SweetScent,
      Moves.WorrySeed,
    ]);
    // A pokemon that never dropped anything has nothing to remember
    expect(getRecallableMoves(Species.Bulbasaur, 6, [Moves.Tackle, Moves.Growl])).toEqual([]);
    // And a machine move it forgot stays forgotten: he only ever gives
    // back what levelling gave it
    expect(new Set(getRecallableMoves(Species.Bulbasaur, 48, carrying)).has(Moves.PetalDance)).toBe(
      false,
    );
  });
});

describe('what an expert hands its party', () => {
  it('gives a species the gear that is its own, best first', () => {
    // A relic nothing else can use: the whole of what makes a gym
    // leader's Pikachu worse news than one met in the grass
    expect(getExpertHeldItems(Species.Pikachu, 1)).toEqual([Items.LightBall]);
    expect(getExpertHeldItems(Species.Marowak, 1)).toEqual([Items.ThickClub]);
    expect(getExpertHeldItems(Species.Farfetchd, 1)).toEqual([Items.Stick]);

    // A second item is the next thing down rather than the same one
    // twice
    const pikachu = getExpertHeldItems(Species.Pikachu, 2);

    expect(pikachu).toHaveLength(2);
    expect(new Set(pikachu).size).toBe(2);
    expect(pikachu[0]).toBe(Items.LightBall);
    // Its relic first, then the thing that answers still being a
    // Pikachu rather than a Raichu
    expect(pikachu[1]).toBe(Items.Eviolite);
    expect(getExpertHeldItems(Species.Marowak, 2)[1]).toBe(Items.HardStone);
  });

  it('never hands out what does nothing in a fight', () => {
    // Chansey's own rarest is a Lucky Egg and Gengar's is a Smoke
    // Ball. Both are worth having and neither wins a fight
    expect(getExpertHeldItems(Species.Chansey, 2)).not.toContain(Items.LuckyEgg);
    expect(getExpertHeldItems(Species.Gengar, 2)).not.toContain(Items.SmokeBall);

    // Nor a berry, which is what most of the common slots are
    for (const species of getBaseForms()) {
      for (const item of getExpertHeldItems(species, 2)) {
        expect(isBattleHeldItem(item), getSpeciesData(species).name).toBe(true);
      }
    }
  });

  it('fills a legend’s three slots for every species there is', () => {
    // A legend hands out three, which is one more than any species'
    // own table is likely to hold: the tail of gear that suits
    // anybody is what keeps the third slot from coming up empty
    for (const species of getBaseForms()) {
      const held = getExpertHeldItems(species, 3);

      expect(held, getSpeciesData(species).name).toHaveLength(3);
      expect(new Set(held).size, getSpeciesData(species).name).toBe(3);
      // And the three are still that species': asking for fewer takes
      // them off the end rather than reshuffling
      expect(getExpertHeldItems(species, 2)).toEqual(held.slice(0, 2));
    }
  });

  it('answers for every species, and answers the same every time', () => {
    for (const species of getBaseForms()) {
      const held = getExpertHeldItems(species, 2);

      // Two, always: a champion's party is never short-handed, and a
      // species nothing else fits falls to Leftovers and a booster
      expect(held, getSpeciesData(species).name).toHaveLength(2);
      expect(new Set(held).size, getSpeciesData(species).name).toBe(2);
      expect(getExpertHeldItems(species, 2)).toEqual(held);
      // And the first of the two is what one item asks for
      expect(getExpertHeldItems(species, 1)).toEqual([held[0]]);
    }
    expect(getExpertHeldItems(Species.Pikachu, 0)).toEqual([]);
  });

  it('answers a half-grown one with the thing that answers being half-grown', () => {
    // The named middle stages an expert fields — Bruno's Onix, Bugsy's
    // Scyther, Falkner's Pidgeotto — are there because the trainer is
    // known for them, so what they carry is the item for having
    // somewhere left to go
    for (const species of [Species.Onix, Species.Scyther, Species.Pidgeotto]) {
      expect(getExpertHeldItems(species, 1), getSpeciesData(species).name).toEqual([
        Items.Eviolite,
      ]);
    }
    expect(getExpertHeldItems(Species.Steelix, 1)).not.toContain(Items.Eviolite);
  });
});

describe('the syndicates', () => {
  it('gives every team a boss, a uniform and executives of its own', () => {
    const marks = new Set<Awards>();
    const worn = new Set<string>();

    for (const syndicate of SYNDICATES) {
      const sheets = [
        ...SYNDICATE_BOSS_CHARSETS[syndicate],
        ...SYNDICATE_GRUNT_CHARSETS[syndicate],
        ...SYNDICATE_EXECUTIVES[syndicate].flatMap((one) => EXECUTIVE_CHARSETS[one]),
      ];
      const named = SYNDICATE_NAMES[syndicate];

      expect(named.length).toBeGreaterThan(0);
      expect(SYNDICATE_BOSS_QUOTES[syndicate].length).toBeGreaterThan(0);
      expect(SYNDICATE_GRUNT_QUOTES[syndicate].length).toBeGreaterThan(0);
      for (const executive of SYNDICATE_EXECUTIVES[syndicate]) {
        expect(EXECUTIVE_QUOTES[executive].length, EXECUTIVE_NAMES[executive]).toBeGreaterThan(0);
      }
      expect(SYNDICATE_EXECUTIVES[syndicate].length).toBeGreaterThan(0);

      // Every coat is shipped, and nobody in the world wears somebody
      // else's: a coat is what says which team put you down
      for (const sheet of sheets) {
        expect(existsSync(`public/sprites/overworld/${sheet}/image.png`), sheet).toBe(true);
        expect(existsSync(`public/sprites/overworld/${sheet}/data.json`), sheet).toBe(true);
        expect(worn.has(sheet), sheet).toBe(false);
        worn.add(sheet);
      }

      // And every mark is its own, so a shelf says which team as well
      // as which rank
      for (const award of [
        SYNDICATE_GRUNT_HONORS[syndicate],
        ...SYNDICATE_EXECUTIVES[syndicate].map((one) => EXECUTIVE_HONORS[one]),
        SYNDICATE_BOSS_HONORS[syndicate],
      ]) {
        expect(marks.has(award), AWARD_NAMES[award]).toBe(false);
        marks.add(award);
      }

      // A person is introduced team first, then rank, then name
      expect(bossName(syndicate).startsWith(named)).toBe(true);
      expect(bossName(syndicate).endsWith(SYNDICATE_BOSS_NAMES[syndicate])).toBe(true);
      expect(gruntName(syndicate)).toBe(`${named} Grunt`);
      for (const executive of SYNDICATE_EXECUTIVES[syndicate]) {
        expect(executiveName(syndicate, executive).startsWith(named)).toBe(true);
        expect(executiveName(syndicate, executive).endsWith(EXECUTIVE_NAMES[executive])).toBe(true);
      }
    }
    expect([...marks]).toEqual(SYNDICATE_HONORS);
  });

  it('gives every biome exactly one team, and leaves the rest to Rocket', () => {
    const seen = new Map<Syndicate, number>();

    for (const biome of WILD_BIOMES) {
      const syndicate = getSyndicate(biome);

      seen.set(syndicate, (seen.get(syndicate) ?? 0) + 1);
    }

    // All four are somewhere, and the water, the fire and the cold are
    // the three that were claimed
    for (const syndicate of SYNDICATES) {
      expect(seen.get(syndicate) ?? 0, SYNDICATE_NAMES[syndicate]).toBeGreaterThan(0);
    }
    expect(getSyndicate(Biome.Ocean)).toBe(Syndicate.Aqua);
    expect(getSyndicate(Biome.Volcano)).toBe(Syndicate.Magma);
    expect(getSyndicate(Biome.Glacier)).toBe(Syndicate.Galactic);
    expect(getSyndicate(Biome.Beyond)).toBe(Syndicate.Galactic);
    expect(getSyndicate(Biome.Grassland)).toBe(Syndicate.Rocket);
  });
});

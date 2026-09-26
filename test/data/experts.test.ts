import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import registerBiomeSpawns from '../../src/data/biome';
import registerAbilities from '../../src/data/abilities';
import Abilities from '../../src/data/ids/abilities';
import {
  TYPE_EFFECTIVENESS,
  TYPE_EFFECTIVENESS_FACTOR,
  Types,
} from '../../src/data/constants/types';
import Biome, { isOpenSea } from '../../src/data/ids/biome';
import { Items, getMachineMove } from '../../src/data/ids/items';
import { MoveCategories, Moves } from '../../src/data/ids/moves';
import { Species, getBaseFormSpecies } from '../../src/data/ids/species';
import registerItems, { getItemData } from '../../src/data/items';
import { getMoveData, registerMoves } from '../../src/data/moves';
import AleaRNG from '../../src/core/alea';
import { Stats } from '../../src/data/constants/stats';
import { getExpertHeldItems } from '../../src/data/items/expert-loadout';
import { TYPE_BOOSTERS } from '../../src/data/items/type-boosters';
import canMeetSpecies from '../../src/data/overworld/reach';
import {
  getGrowthRoads,
  getLearnableMoves,
  getSpeciesAbilityPools,
  getSpeciesData,
  registerSpecies,
} from '../../src/data/species';
import Awards, {
  AWARD_NAMES,
  FRONTIER_SYMBOLS,
  HOENN_BADGES,
  HOENN_HONORS,
  JOHTO_BADGES,
  JOHTO_HONORS,
  KANTO_BADGES,
  KANTO_HONORS,
  SINNOH_BADGES,
  SINNOH_HONORS,
} from '../../src/data/ids/awards';
import {
  ARCADE_PANELS,
  ARCADE_PANEL_NAMES,
  ARCADE_PANEL_WEATHER,
  ArcadePanel,
  BIOME_ELITE_MEMBERS,
  BIOME_GYM_LEADERS,
  CHAMPIONS,
  CHAMPION_CHARSETS,
  CHAMPION_HONORS,
  CHAMPION_NAMES,
  CHAMPION_PARTIES,
  CHAMPION_TITLES,
  Champion,
  ELITE_MEMBERS,
  ELITE_MEMBER_CHARSETS,
  ELITE_MEMBER_HONORS,
  ELITE_MEMBER_NAMES,
  ELITE_MEMBER_POOLS,
  ELITE_MEMBER_SIGNATURES,
  EXPERT_PARTY_SIZE,
  EliteMember,
  FRONTIER_BRAINS,
  FRONTIER_BRAIN_CHARSETS,
  FRONTIER_BRAIN_GOLD_PARTIES,
  FRONTIER_BRAIN_NAMES,
  FRONTIER_BRAIN_PARTIES,
  FRONTIER_BRAIN_RULES,
  FRONTIER_BRAIN_SYMBOLS,
  FRONTIER_BRAIN_TITLES,
  FRONTIER_FACILITY_NAMES,
  FRONTIER_RENTAL_OFFER,
  FRONTIER_TEAM_SIZE,
  FrontierBrain,
  FrontierRule,
  GYM_LEADERS,
  GYM_LEADER_BADGES,
  GYM_LEADER_CHARSETS,
  GYM_LEADER_NAMES,
  GYM_LEADER_SIGNATURES,
  GYM_LEADER_TYPES,
  GymLeader,
  LEGENDS,
  LEGEND_CHARSETS,
  LEGEND_HONORS,
  LEGEND_NAMES,
  LEGEND_PARTIES,
  LEGEND_PRIZE_CHARSETS,
  Legend,
  PIKE_CURTAINS,
  PIKE_CURTAIN_NAMES,
  PIKE_CURTAIN_STATUSES,
  PikeCurtain,
  arcadeCurtain,
  frontierTeamSize,
  getEliteBadges,
  getEliteMemberRoster,
  getFrontierParty,
  getGymLeaderRoster,
  getRentalPool,
  getWorldExpertPool,
  pickArcadePanel,
  pickPikeCurtain,
  rollGymMachine,
} from '../../src/data/overworld/experts';
import { FREE_CHARSETS } from '../../src/data/overworld/charsets';
import { counterParty, rentalOffer, rentedHand } from '../../src/overworld/stop';
import {
  BEST_MOVE_COUNT,
  BEST_MOVE_OVERRIDES,
  BuildRole,
  SETUP_MOVES,
  getBestMoves,
} from '../../src/data/species/best-moves';
import {
  CORE_COUNT,
  assignBuildRoles,
  getBestAbilities,
  getBestBuild,
  getBestNature,
  getBestParty,
} from '../../src/data/species/best-build';
import { NATURE_EFFECTS } from '../../src/data/ids/natures';
import { isRecoilMove } from '../../src/data/moves/recoil';

// Registry-only tests: no battle is involved, the data just has to
// be registered (re-registration is an idempotent map overwrite)
registerMoves();
registerAbilities();
registerSpecies();
registerItems();
registerBiomeSpawns();

describe('type experts', () => {
  it('gives every leader a name, a badge and a shipped wardrobe', () => {
    const badges = GYM_LEADERS.map((leader) => GYM_LEADER_BADGES[leader]);
    const cases = [...KANTO_BADGES, ...JOHTO_BADGES, ...HOENN_BADGES, ...SINNOH_BADGES];

    // Every leader carries a badge, and between the four regions the
    // leaders account for every badge there is. There is one leader
    // more than there are badges, because Mossdeep is kept by two
    // people who pay the same one
    expect(new Set(badges).size).toBe(cases.length);
    expect(badges.every((badge) => cases.includes(badge))).toBe(true);
    expect(GYM_LEADER_BADGES[GymLeader.Tate]).toBe(GYM_LEADER_BADGES[GymLeader.Liza]);

    for (const leader of GYM_LEADERS) {
      expect(GYM_LEADER_NAMES[leader].length).toBeGreaterThan(0);
      for (const sheet of GYM_LEADER_CHARSETS[leader]) {
        expect(existsSync(`public/sprites/overworld/${sheet}/image.png`), sheet).toBe(true);
        expect(existsSync(`public/sprites/overworld/${sheet}/data.json`), sheet).toBe(true);
      }
    }
    // Every gym is a fight about a type now that Giovanni keeps the
    // one Blue used to take all comers at, and no region runs the
    // same fight twice. Across regions they repeat: Roxanne's gym is
    // Brock's fight in another country
    for (const region of [KANTO_BADGES, JOHTO_BADGES, HOENN_BADGES, SINNOH_BADGES]) {
      const held = new Map<Awards, Set<Types>>();

      for (const leader of GYM_LEADERS.filter((one) => region.includes(GYM_LEADER_BADGES[one]))) {
        const badge = GYM_LEADER_BADGES[leader];

        held.set(badge, (held.get(badge) ?? new Set<Types>()).add(GYM_LEADER_TYPES[leader]));
      }
      // One badge is one type, whoever of its keepers a chunk seats
      for (const [badge, types] of held) {
        expect(types.size, AWARD_NAMES[badge]).toBe(1);
      }
      expect(new Set([...held.values()].flatMap((types) => [...types])).size).toBe(region.length);
    }
    expect(GYM_LEADER_TYPES[GymLeader.Giovanni]).toBe(Types.Ground);
    expect(GYM_LEADER_TYPES[GymLeader.Brock]).toBe(Types.Rock);
  });

  it('gives every elite a mark and the champion a title', () => {
    const honors = ELITE_MEMBERS.map((member) => ELITE_MEMBER_HONORS[member]);
    const marks = new Set([...KANTO_HONORS, ...JOHTO_HONORS, ...HOENN_HONORS, ...SINNOH_HONORS]);

    // Sixteen seats between four leagues, four apiece: Bruno keeps one
    // in each of the first two, and no mark is shared between them
    expect(new Set(honors).size).toBe(marks.size);
    expect(honors.every((honor) => marks.has(honor))).toBe(true);
    expect(marks.size).toBe(
      KANTO_HONORS.length + JOHTO_HONORS.length + HOENN_HONORS.length + SINNOH_HONORS.length,
    );

    for (const member of ELITE_MEMBERS) {
      expect(ELITE_MEMBER_NAMES[member].length).toBeGreaterThan(0);
      for (const sheet of ELITE_MEMBER_CHARSETS[member]) {
        expect(existsSync(`public/sprites/overworld/${sheet}/image.png`), sheet).toBe(true);
      }
    }
    for (const champion of CHAMPIONS) {
      for (const sheet of CHAMPION_CHARSETS[champion]) {
        expect(existsSync(`public/sprites/overworld/${sheet}/image.png`), sheet).toBe(true);
      }
    }
    // Every award reads as something on a shelf
    for (const award of [
      ...KANTO_BADGES,
      ...JOHTO_BADGES,
      ...HOENN_BADGES,
      ...SINNOH_BADGES,
      ...KANTO_HONORS,
      ...JOHTO_HONORS,
      ...HOENN_HONORS,
      ...SINNOH_HONORS,
      Awards.KantoChampion,
    ]) {
      expect(AWARD_NAMES[award].length).toBeGreaterThan(0);
    }
  });

  it('seats every leader and every elite in some walkable country', () => {
    // A leader no land biome maps to keeps a badge nobody can earn,
    // and an unseated elite locks the Champion for good. Open seas
    // never roll a people landmark, so they do not count as a seat
    const land = Object.entries(BIOME_GYM_LEADERS)
      .filter(([biome]) => !isOpenSea(Number(biome)))
      .flatMap(([, seated]) => seated);

    for (const leader of GYM_LEADERS) {
      expect(land, GYM_LEADER_NAMES[leader]).toContain(leader);
    }

    const seats = Object.entries(BIOME_ELITE_MEMBERS)
      .filter(([biome]) => !isOpenSea(Number(biome)))
      .flatMap(([, seated]) => seated);

    for (const member of ELITE_MEMBERS) {
      expect(seats, ELITE_MEMBER_NAMES[member]).toContain(member);
    }
    // And nobody's country is empty ground: every biome seats at
    // least one leader and one elite
    for (const seated of Object.values(BIOME_GYM_LEADERS)) {
      expect(seated.length).toBeGreaterThan(0);
    }
    for (const seated of Object.values(BIOME_ELITE_MEMBERS)) {
      expect(seated.length).toBeGreaterThan(0);
    }
  });

  it('pools every specialty from the region, half-grown and legendaries left out', () => {
    const open = getWorldExpertPool({ types: [] });

    // What an expert fields is fully evolved, or has nowhere to
    // evolve to until a later gen gives it one. A Rotom counts:
    // its roads lead to its own appliances, which is an address
    // rather than a stage
    for (const species of open) {
      expect(getGrowthRoads(species).length, getSpeciesData(species).name).toBe(0);
    }
    const psychic = getWorldExpertPool({ types: [Types.Psychic] });

    // Sabrina's pool holds no Mewtwo: lair species belong to raids
    expect(psychic).not.toContain(Species.Mewtwo);
    // ...nor the half-grown a walk turns up on its own
    expect(psychic).not.toContain(Species.Kadabra);
    // Blue's gym takes all comers, out of the whole band
    expect(open.length).toBeGreaterThan(50);
    expect(open).not.toContain(Species.Egg);

    // A gym leader reads every region rather than the one their gym
    // stands in, so a badge is never handed out by somebody with
    // nothing of their own type to field
    for (const leader of GYM_LEADERS) {
      const roster = getGymLeaderRoster(leader);

      expect(roster.length, GYM_LEADER_NAMES[leader]).toBeGreaterThan(0);
      // A leader is their type and nothing else; the wideners are the
      // league's
      for (const species of roster) {
        expect(getSpeciesData(species).types, getSpeciesData(species).name).toContain(
          GYM_LEADER_TYPES[leader],
        );
      }
    }
    // Jasmine's steel is Johto's, and she is seated in countries a
    // Kanto-only roster could only answer with Magneton
    expect(getGymLeaderRoster(GymLeader.Jasmine)).toContain(Species.Steelix);
  });

  it('leaves out what the world has nowhere to put yet', () => {
    // A line is written before it is staged: the art is unfinished,
    // or the counterpart it waits on does not exist. Nobody can meet
    // one, so nobody fields one either
    for (const species of getWorldExpertPool({ types: [] })) {
      expect(canMeetSpecies(species), getSpeciesData(species).name).toBe(true);
    }
    for (const leader of GYM_LEADERS) {
      for (const species of getGymLeaderRoster(leader)) {
        expect(canMeetSpecies(species), getSpeciesData(species).name).toBe(true);
      }
    }
    for (const member of ELITE_MEMBERS) {
      for (const species of getEliteMemberRoster(member)) {
        expect(canMeetSpecies(species), getSpeciesData(species).name).toBe(true);
      }
    }

    // What the rule reads: a fossil is brought back rather than met, a
    // honey tree is where a Heracross is, and a Phione hatches out of
    // a Manaphy and nowhere else
    expect(canMeetSpecies(Species.Kabutops)).toBe(true);
    expect(canMeetSpecies(Species.Heracross)).toBe(true);
    expect(canMeetSpecies(Species.Phione)).toBe(true);
    // And the three Unova still waiting on their sprites, next to the
    // line those sprites just let in
    expect(canMeetSpecies(Species.Throh)).toBe(false);
    expect(canMeetSpecies(Species.Sawk)).toBe(false);
    expect(canMeetSpecies(Species.Zebstrika)).toBe(false);
    expect(canMeetSpecies(Species.Unfezant)).toBe(true);
  });

  it('gives every leader a signature of their own type', () => {
    for (const leader of GYM_LEADERS) {
      const signature = GYM_LEADER_SIGNATURES[leader];

      // Registered, so the sixth slot is a pokemon rather than a hole
      expect(getSpeciesData(signature).name.length).toBeGreaterThan(0);
      expect(getSpeciesData(signature).types, GYM_LEADER_NAMES[leader]).toContain(
        GYM_LEADER_TYPES[leader],
      );
    }
    // The example the rule is written from: Onix is a middle stage now
    // that a Steelix exists, and Brock brings him anyway
    expect(GYM_LEADER_SIGNATURES[GymLeader.Brock]).toBe(Species.Onix);
    expect(getGymLeaderRoster(GymLeader.Brock)).not.toContain(Species.Onix);
  });

  it('takes Bruno for either league on its own, or for both', () => {
    // Bruno keeps a seat in each league, and each is its own fight
    // with its own mark. A challenger who has only walked Kanto's gyms
    // is taken by his Kanto seat and earns that mark alone; walking
    // Johto's earns the other; walking both earns both
    const kanto = ELITE_MEMBER_HONORS[EliteMember.Bruno];
    const johto = ELITE_MEMBER_HONORS[EliteMember.JohtoBruno];

    expect(kanto).not.toBe(johto);
    expect(KANTO_HONORS).toContain(kanto);
    expect(JOHTO_HONORS).toContain(johto);
    expect(KANTO_HONORS).not.toContain(johto);
    expect(JOHTO_HONORS).not.toContain(kanto);

    // Neither seat asks for the other league's gyms
    expect(getEliteBadges(EliteMember.Bruno)).toEqual(KANTO_BADGES);
    expect(getEliteBadges(EliteMember.JohtoBruno)).toEqual(JOHTO_BADGES);

    // He is the same man in both: one name, one type, one signature,
    // and only the coat and the mark differ
    expect(ELITE_MEMBER_NAMES[EliteMember.JohtoBruno]).toBe(ELITE_MEMBER_NAMES[EliteMember.Bruno]);
    expect(ELITE_MEMBER_SIGNATURES[EliteMember.JohtoBruno]).toBe(
      ELITE_MEMBER_SIGNATURES[EliteMember.Bruno],
    );
    expect(ELITE_MEMBER_CHARSETS[EliteMember.JohtoBruno]).toEqual(['characters/hgss/bruno']);

    // And every other seat asks for exactly its own league's gyms
    const leagues = [
      [KANTO_HONORS, KANTO_BADGES],
      [JOHTO_HONORS, JOHTO_BADGES],
      [HOENN_HONORS, HOENN_BADGES],
      [SINNOH_HONORS, SINNOH_BADGES],
    ] as const;

    for (const member of ELITE_MEMBERS) {
      const honor = ELITE_MEMBER_HONORS[member];
      const league = leagues.find(([marked]) => marked.includes(honor));

      expect(league, ELITE_MEMBER_NAMES[member]).toBeDefined();
      expect(getEliteBadges(member), ELITE_MEMBER_NAMES[member]).toEqual(league?.[1]);
    }
  });

  it('seats Hoenn’s four on Hoenn’s badges, with no crown above them', () => {
    for (const member of [
      EliteMember.Sidney,
      EliteMember.Phoebe,
      EliteMember.Glacia,
      EliteMember.Drake,
    ]) {
      expect(HOENN_HONORS).toContain(ELITE_MEMBER_HONORS[member]);
      expect(getEliteBadges(member), ELITE_MEMBER_NAMES[member]).toEqual(HOENN_BADGES);
    }
    // And Wallace stands above them, asking for all four
    expect(CHAMPION_HONORS[Champion.Wallace]).toEqual(HOENN_HONORS);
    expect(CHAMPION_TITLES[Champion.Wallace]).toBe(Awards.HoennChampion);
  });

  it('seats Sinnoh’s four on Sinnoh’s badges, with Cynthia above them', () => {
    for (const member of [
      EliteMember.Aaron,
      EliteMember.Bertha,
      EliteMember.Flint,
      EliteMember.Lucian,
    ]) {
      expect(SINNOH_HONORS).toContain(ELITE_MEMBER_HONORS[member]);
      expect(getEliteBadges(member), ELITE_MEMBER_NAMES[member]).toEqual(SINNOH_BADGES);
    }
    // And Cynthia stands above them, asking for all four
    expect(CHAMPION_HONORS[Champion.Cynthia]).toEqual(SINNOH_HONORS);
    expect(CHAMPION_TITLES[Champion.Cynthia]).toBe(Awards.SinnohChampion);
  });

  it('gives every Frontier Brain a house, a rule and a pair of symbols', () => {
    const symbols = FRONTIER_BRAINS.flatMap((brain) => FRONTIER_BRAIN_SYMBOLS[brain]);

    // Two apiece, and the only sharing is the Castle: its lady and
    // her valet keep one house between them and pay the one pair
    expect(FRONTIER_BRAIN_SYMBOLS[FrontierBrain.Caitlin]).toEqual(
      FRONTIER_BRAIN_SYMBOLS[FrontierBrain.Darach],
    );
    expect(new Set(symbols).size).toBe(symbols.length - 2);
    expect(symbols.every((symbol) => FRONTIER_SYMBOLS.includes(symbol))).toBe(true);

    for (const brain of FRONTIER_BRAINS) {
      expect(FRONTIER_BRAIN_NAMES[brain].length).toBeGreaterThan(0);
      expect(FRONTIER_FACILITY_NAMES[brain].length).toBeGreaterThan(0);
      // Three a side is the Frontier's shape, and what makes a house
      // rule bite rather than merely annoy. The Hall is the one that
      // fights one against one. Some houses name nobody: the Factory
      // draws out of the crate like the challenger, and the Dome and
      // the Hall wait to be shown a party before they answer one
      const named = FRONTIER_BRAIN_PARTIES[brain];
      const rules = FRONTIER_BRAIN_RULES[brain];
      const drawn =
        rules === FrontierRule.Rented ||
        rules === FrontierRule.Countered ||
        rules === FrontierRule.Singled;

      expect(frontierTeamSize(rules)).toBe(rules === FrontierRule.Singled ? 1 : FRONTIER_TEAM_SIZE);
      expect(named).toHaveLength(drawn ? 0 : FRONTIER_TEAM_SIZE);
      for (const species of named) {
        expect(getSpeciesData(species).name.length).toBeGreaterThan(0);
      }
      for (const sheet of FRONTIER_BRAIN_CHARSETS[brain]) {
        expect(existsSync(`public/sprites/overworld/${sheet}/image.png`), sheet).toBe(true);
      }
      // A Tower is the house that asks nothing, and it is what the
      // rest of its own Frontier is read against. Both regions keep one
      expect(FRONTIER_BRAIN_RULES[brain] === FrontierRule.None).toBe(
        brain === FrontierBrain.Anabel || brain === FrontierBrain.Palmer,
      );
      // And the Frontier stands past a league, so each asks for a crown
      expect(CHAMPIONS.map((champion) => CHAMPION_TITLES[champion])).toContain(
        FRONTIER_BRAIN_TITLES[brain],
      );
    }
    // No two houses of one Frontier run the same fight. Caitlin is
    // left out of the count: she keeps Darach's house, so she keeps
    // his rule
    const houses = [
      [
        FrontierBrain.Brandon,
        FrontierBrain.Greta,
        FrontierBrain.Lucy,
        FrontierBrain.Noland,
        FrontierBrain.Anabel,
        FrontierBrain.Spenser,
        FrontierBrain.Tucker,
      ],
      [
        FrontierBrain.Palmer,
        FrontierBrain.Thorton,
        FrontierBrain.Dahlia,
        FrontierBrain.Darach,
        FrontierBrain.Argenta,
      ],
    ];

    for (const frontier of houses) {
      const rules = frontier.map((one) => FRONTIER_BRAIN_RULES[one]);

      expect(new Set(rules).size).toBe(rules.length);
    }
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Caitlin]).toBe(
      FRONTIER_BRAIN_RULES[FrontierBrain.Darach],
    );
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Brandon]).toBe(FrontierRule.Bare);
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Greta]).toBe(FrontierRule.Timed);
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Lucy]).toBe(FrontierRule.Curtained);
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Noland]).toBe(FrontierRule.Rented);
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Spenser]).toBe(FrontierRule.Natured);
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Tucker]).toBe(FrontierRule.Countered);
    // The two houses that repeat across the regions, and only those:
    // a Tower asks nothing and a Factory rents, wherever it stands
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Thorton]).toBe(FrontierRule.Rented);
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Dahlia]).toBe(FrontierRule.Rolled);
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Darach]).toBe(FrontierRule.Unhealed);
    expect(FRONTIER_BRAIN_RULES[FrontierBrain.Argenta]).toBe(FrontierRule.Singled);
  });

  it('spins the Arcade onto both sides, and the same panel every watch', () => {
    // Every panel is drawn by some roll, and a roll at either end
    // lands inside the wheel rather than off it
    const drawn = new Set(Array.from({ length: 200 }, (_, at) => pickArcadePanel(at / 200)));

    expect(drawn.size).toBe(ARCADE_PANELS.length);
    expect(pickArcadePanel(0)).toBe(ARCADE_PANELS[0]);
    expect(pickArcadePanel(0.999999)).toBe(ARCADE_PANELS[ARCADE_PANELS.length - 1]);
    // Four panels are a sky, and the other three are what the parties
    // walk in as. A panel is one or the other, never both
    for (const panel of ARCADE_PANELS) {
      const sky = ARCADE_PANEL_WEATHER[panel];
      const room = arcadeCurtain(panel);

      expect(sky == null || room == null, ARCADE_PANEL_NAMES[panel]).toBe(true);
      expect(ARCADE_PANEL_NAMES[panel].length).toBeGreaterThan(0);
    }
    expect(arcadeCurtain(ArcadePanel.Poisoned)).toBe(PikeCurtain.Poisoned);
    expect(arcadeCurtain(ArcadePanel.Mended)).toBe(PikeCurtain.Healed);
    // The stripped panel bares both sides rather than mending or
    // hurting anybody, so it carries neither a sky nor a room
    expect(ARCADE_PANEL_WEATHER[ArcadePanel.Stripped]).toBeNull();
    expect(arcadeCurtain(ArcadePanel.Stripped)).toBeUndefined();
  });

  it('answers a party the Dome is shown with three drawn against it', () => {
    const stop = 'stop:dome:1';
    const brought = [Species.Charizard, Species.Blastoise, Species.Venusaur];
    const answer = counterParty(stop, brought);

    // One apiece, nobody twice, and the same three however many times
    // the challenge is looked at
    expect(answer).toHaveLength(brought.length);
    expect(new Set(answer.map(([species]) => species)).size).toBe(brought.length);
    expect(counterParty(stop, brought)).toEqual(answer);
    expect(counterParty('stop:dome:2', brought)).not.toEqual(answer);

    // And each of them is an answer: something it carries hits what it
    // was drawn against for more than neutral
    const crate = new Set(getRentalPool());

    answer.forEach(([species], at) => {
      expect(crate.has(species), getSpeciesData(species).name).toBe(true);

      const theirs = getSpeciesData(brought[at]).types;
      const best = Math.max(
        ...getSpeciesData(species).types.map((type) =>
          theirs.reduce((factor, against) => {
            const effect = TYPE_EFFECTIVENESS[type][against];

            return effect == null ? factor : factor * TYPE_EFFECTIVENESS_FACTOR[effect];
          }, 1),
        ),
      );

      expect(best, getSpeciesData(species).name).toBeGreaterThan(1);
    });
  });

  it('draws one of the Pike’s curtains for any roll there is', () => {
    const drawn = new Set<PikeCurtain>();

    // The whole range lands inside the list, the top of it included:
    // a roll of exactly 1 is the last curtain rather than nothing
    for (let at = 0; at <= 1000; at += 1) {
      drawn.add(pickPikeCurtain(at / 1000));
    }
    expect(drawn.size).toBe(PIKE_CURTAINS.length);
    expect(pickPikeCurtain(1)).toBe(PIKE_CURTAINS.at(-1));
    expect(pickPikeCurtain(0)).toBe(PIKE_CURTAINS[0]);

    // Four rooms cost something and one gives, which is what makes
    // walking in a gamble rather than a test
    const kind = PIKE_CURTAINS.filter((curtain) => PIKE_CURTAIN_STATUSES[curtain] == null);

    expect(kind).toEqual([PikeCurtain.Healed]);
    for (const curtain of PIKE_CURTAINS) {
      expect(PIKE_CURTAIN_NAMES[curtain].length).toBeGreaterThan(0);
    }
  });

  it('lays six on the Factory’s table and takes three off it', () => {
    const stop = 'stop:factory:1';
    const offer = rentalOffer(stop);

    // The same table every time it is looked at: walking away and
    // back is not a reroll
    expect(offer).toHaveLength(FRONTIER_RENTAL_OFFER);
    expect(rentalOffer(stop)).toEqual(offer);
    expect(rentalOffer('stop:factory:2')).not.toEqual(offer);

    // Everything on it is something an expert could field
    const crate = new Set(getRentalPool());

    for (const [species] of offer) {
      expect(crate.has(species), getSpeciesData(species).name).toBe(true);
    }

    // Three off the table, in the order they were taken
    expect(rentedHand(stop, ['4', '0', '2'])).toEqual([offer[4], offer[0], offer[2]]);

    // And nothing else is a hand: too few, too many, the same one
    // twice, or a place that is not on the table
    for (const picks of [['0'], ['0', '1', '2', '3'], ['1', '1', '2'], ['0', '1', '9']]) {
      expect(rentedHand(stop, picks), picks.join(',')).toBeNull();
    }
  });

  it('keeps a second three for whoever already took the house', () => {
    for (const brain of FRONTIER_BRAINS) {
      const first = FRONTIER_BRAIN_PARTIES[brain];
      const second = FRONTIER_BRAIN_GOLD_PARTIES[brain];

      // Both hands are the house's own shape, and a house that rents
      // names nobody either time
      expect(second).toHaveLength(first.length);
      expect(getFrontierParty(brain, false)).toEqual(first);
      expect(getFrontierParty(brain, true)).toEqual(second);
      for (const species of second) {
        expect(getSpeciesData(species).name.length).toBeGreaterThan(0);
      }
    }
    // The Pyramid brings the same three either time, which is the
    // mainline's own answer: what changes is the level and the
    // loadout rather than who is in the crate. Sinnoh's Tower is the
    // same, and for the same reason
    for (const brain of [FrontierBrain.Brandon, FrontierBrain.Palmer]) {
      expect(FRONTIER_BRAIN_GOLD_PARTIES[brain], FRONTIER_BRAIN_NAMES[brain]).toEqual(
        FRONTIER_BRAIN_PARTIES[brain],
      );
    }
    // Everybody else's second hand is a different fight
    for (const brain of FRONTIER_BRAINS) {
      if (
        brain === FrontierBrain.Brandon ||
        brain === FrontierBrain.Palmer ||
        FRONTIER_BRAIN_PARTIES[brain].length === 0
      ) {
        continue;
      }
      expect(FRONTIER_BRAIN_GOLD_PARTIES[brain], FRONTIER_BRAIN_NAMES[brain]).not.toEqual(
        FRONTIER_BRAIN_PARTIES[brain],
      );
    }
  });

  it('builds every species an expert can field with four moves it can learn', () => {
    for (const species of getRentalPool()) {
      const built = getBestMoves(species);
      const legal = new Set(getLearnableMoves(species));
      const name = getSpeciesData(species).name;

      expect(built.length, name).toBeLessThanOrEqual(BEST_MOVE_COUNT);
      expect(new Set(built).size, name).toBe(built.length);

      let quiet = 0;

      for (const move of built) {
        expect(legal.has(move), `${name}: ${getMoveData(move).name}`).toBe(true);

        if (getMoveData(move).category === MoveCategories.Status) {
          quiet += 1;
        }
      }
      // Four ways to do nothing is not a party: a core gives one slot
      // to a move that deals no damage, and takes more only where the
      // species has too few attacks to fill the sheet, which is what
      // a Wobbuffet is
      const hits =
        legal.size -
        [...legal].filter((move) => getMoveData(move).category === MoveCategories.Status).length;

      expect(quiet, name).toBeLessThanOrEqual(Math.max(1, BEST_MOVE_COUNT - hits));

      // And nothing that takes the pokemon off the field with it
      expect(built).not.toContain(Moves.Explosion);
      expect(built).not.toContain(Moves.SelfDestruct);
    }
  });

  it('builds the same set twice, and a different one for a different ability', () => {
    expect(getBestMoves(Species.Metagross)).toEqual(getBestMoves(Species.Metagross));

    // Huge Power doubles the attack stat, which is what decides which
    // half of the split is worth casting from
    expect(getBestMoves(Species.Azumarill, [Abilities.HugePower])).not.toEqual(
      getBestMoves(Species.Azumarill),
    );

    // A boost is worth what the stat it raises is worth: Latios never
    // swings, so it is never handed a Dragon Dance
    const latios = getBestMoves(Species.Latios);

    expect(latios).toContain(Moves.CalmMind);
    expect(latios).not.toContain(Moves.DragonDance);
  });

  it('prices gear above the league and orders it below', () => {
    const moves = getBestMoves(Species.Gengar, [Abilities.Levitate]);

    // A gym leader's Gengar is handed what suits a Gengar, off its own
    // table. An elite's is handed the best answer there is
    expect(getExpertHeldItems(Species.Gengar, 1, { moves })).not.toEqual(
      getExpertHeldItems(Species.Gengar, 1, { moves, best: true }),
    );
    expect(getExpertHeldItems(Species.Gengar, 1, { moves, best: true })).toEqual([Items.LifeOrb]);
  });

  it('hands an expert gear priced against what it actually is', () => {
    const hitter = getExpertHeldItems(Species.Gengar, 2, {
      moves: getBestMoves(Species.Gengar, [Abilities.Levitate]),
      best: true,
    });
    const wall = getExpertHeldItems(Species.Blissey, 2, {
      moves: getBestMoves(Species.Blissey, [Abilities.NaturalCure]),
      best: true,
    });

    // Health spent for damage suits something that hits hard enough
    // for the damage to be worth more than the health
    expect(hitter).toContain(Items.LifeOrb);
    expect(wall).not.toContain(Items.LifeOrb);

    // And an orb is a cost until an ability turns the status into a
    // gain, which is the only thing that ever asks for one
    const guts = getBestMoves(Species.Machamp, [Abilities.Guts]);

    expect(
      getExpertHeldItems(Species.Machamp, 1, {
        moves: guts,
        abilities: [Abilities.Guts],
        best: true,
      }),
    ).toEqual([Items.ToxicOrb]);
    expect(
      getExpertHeldItems(Species.Machamp, 3, {
        moves: guts,
        abilities: [Abilities.NoGuard],
        best: true,
      }),
    ).not.toContain(Items.ToxicOrb);
  });

  it('sells the orb to the two doing the attacking', () => {
    const moves = getBestMoves(Species.Gengar, [Abilities.Levitate]);
    const core = getExpertHeldItems(Species.Gengar, 2, { moves, best: true });
    const support = getExpertHeldItems(Species.Gengar, 2, {
      moves,
      role: BuildRole.Support,
      best: true,
    });

    // A Life Orb takes a tenth of its holder for every blow that
    // lands, which is a price the four behind the cores pay without
    // doing the attacking that earns it back
    expect(core).toContain(Items.LifeOrb);
    expect(support).not.toContain(Items.LifeOrb);
  });

  it('never locks a pokemon out of half its own sheet', () => {
    const locking = new Set([Items.ChoiceBand, Items.ChoiceSpecs, Items.ChoiceScarf]);
    // Two quiet moves and a lock is a pokemon that either never sets
    // its rain or never attacks
    const quiet = getExpertHeldItems(Species.Tentacruel, 3, {
      moves: [Moves.RainDance, Moves.Surf, Moves.Reflect, Moves.SludgeBomb],
      best: true,
    });

    for (const item of quiet) {
      expect(locking.has(item), getItemData(item).name).toBe(false);
    }
  });

  it('never hands out two of a kind of gear', () => {
    const locking = new Set([Items.ChoiceBand, Items.ChoiceSpecs, Items.ChoiceScarf]);
    const orbs = new Set([Items.FlameOrb, Items.ToxicOrb]);

    for (const species of getRentalPool()) {
      const held = getExpertHeldItems(species, 3, { moves: getBestMoves(species), best: true });
      const name = getSpeciesData(species).name;

      // Two Choice items lock twice and pay once, two orbs leave one
      // status, and a second booster is for the lesser type
      expect(held.filter((item) => locking.has(item)).length, name).toBeLessThanOrEqual(1);
      expect(held.filter((item) => orbs.has(item)).length, name).toBeLessThanOrEqual(1);
      expect(held.filter((item) => TYPE_BOOSTERS.has(item)).length, name).toBeLessThanOrEqual(1);
    }
  });

  it('builds a support out of the same species as a core', () => {
    for (const species of getRentalPool()) {
      const name = getSpeciesData(species).name;
      const legal = new Set(getLearnableMoves(species));
      const support = getBestMoves(species, [], { role: BuildRole.Support });
      const quiet = (moves: Moves[]): number =>
        moves.filter((move) => getMoveData(move).category === MoveCategories.Status).length;

      for (const move of support) {
        expect(legal.has(move), `${name}: ${move}`).toBe(true);
      }
      // Half a sheet of quiet moves at most: a support that cannot
      // hurt anybody is one the far side walks past. A species with
      // nothing to hit with is its own answer to that, and there is
      // exactly one of those
      const hits = [...legal].filter(
        (move) => getMoveData(move).category !== MoveCategories.Status,
      ).length;

      expect(quiet(support), name).toBeLessThanOrEqual(2);
      expect(support.length - quiet(support), name).toBeGreaterThanOrEqual(Math.min(2, hits));
    }

    // A wall asked to attack still attacks, and asked to hold the
    // fight open it reaches for what holds it open
    const core = getBestMoves(Species.Blissey, [Abilities.NaturalCure]);
    const support = getBestMoves(Species.Blissey, [Abilities.NaturalCure], {
      role: BuildRole.Support,
    });

    expect(support).not.toEqual(core);
    expect(support).toContain(Moves.SoftBoiled);
  });

  it('takes the sky and what waits under it together', () => {
    // Nobody casts a Sunny Day for its own sake: what pays for the
    // slot is the Chlorophyll behind it and the Solar Beam that stops
    // winding up
    const sun = getBestMoves(Species.Venusaur, [Abilities.Chlorophyll]);

    expect(sun).toContain(Moves.SunnyDay);
    expect(sun).toContain(Moves.SolarBeam);
    expect(getBestMoves(Species.Venusaur)).not.toContain(Moves.SunnyDay);

    // A sky an ability already brings is a sky nothing has to cast,
    // and Thunder under it stops missing
    const rain = getBestMoves(Species.Kyogre, [Abilities.Drizzle]);

    expect(rain).not.toContain(Moves.RainDance);
    expect(rain).toContain(Moves.Thunder);
  });

  it('pays for a move that cannot miss at all', () => {
    // Accuracy is rolled against evasion, so a written 100 is a
    // promise a Double Team breaks and a move with no accuracy is
    // not. Read flat the two tied, and the older move id won
    const scyther = getBestMoves(Species.Scyther, [Abilities.Swarm]);

    expect(scyther).toContain(Moves.AerialAce);
    expect(scyther).not.toContain(Moves.WingAttack);
  });

  it('does not hand the same move to half the party', () => {
    // Four Earthquakes answer one wall four times and everything else
    // never, so a repeat has to lose to the second-best move of its
    // own type. A move the pokemon gets its own bonus from is barely
    // docked: three Dragon types all carrying their own Dragon Claw
    // is three pokemon casting what they are best at
    for (const party of [...Object.values(CHAMPION_PARTIES), ...Object.values(LEGEND_PARTIES)]) {
      const carried = new Map<Moves, number>();
      const borrowed = new Map<Moves, number>();

      for (const [at, build] of getBestParty(party, 3).entries()) {
        const types = getSpeciesData(party[at]).types;

        for (const move of build.moves) {
          carried.set(move, (carried.get(move) ?? 0) + 1);
          if (!types.includes(getMoveData(move).type)) {
            borrowed.set(move, (borrowed.get(move) ?? 0) + 1);
          }
        }
      }
      for (const [move, count] of carried) {
        expect(count, getMoveData(move).name).toBeLessThanOrEqual(3);
      }
      for (const [move, count] of borrowed) {
        expect(count, getMoveData(move).name).toBeLessThanOrEqual(2);
      }
    }
  });

  it('lets the cores decide the sky', () => {
    const weatherMoves = new Set([Moves.SunnyDay, Moves.RainDance, Moves.Sandstorm, Moves.Hail]);
    const casts = (built: { moves: Moves[] }[]): number =>
      built.filter((one) => one.moves.some((move) => weatherMoves.has(move))).length;

    // Red's two cores are a Chlorophyll Venusaur and a Solar Power
    // Charizard, and what the sun costs is two Water pokemon standing
    // behind them. The cores carry the party, so the sun is called
    const red = getBestParty(LEGEND_PARTIES[Legend.Red], 3);

    expect(casts(red)).toBe(1);
    expect(red.some((build) => build.moves.includes(Moves.SunnyDay))).toBe(true);

    // Turn it around: the same want on a support, against a core that
    // loses half of what it is best at, and the sky is left alone
    const damped = getBestParty(
      [
        Species.Charizard,
        Species.Salamence,
        Species.Ludicolo,
        Species.Blastoise,
        Species.Blissey,
        Species.Skarmory,
      ],
      3,
    );

    expect(casts(damped)).toBe(0);
  });

  it('does not hand the same move to half the party', () => {
    // Four Earthquakes answer one wall four times and everything else
    // never, so a repeat has to lose to the second-best move of its
    // own type. A move the pokemon gets its own bonus from is barely
    // docked: three Dragon types all carrying their own Dragon Claw
    // is three pokemon casting what they are best at
    for (const party of [...Object.values(CHAMPION_PARTIES), ...Object.values(LEGEND_PARTIES)]) {
      const carried = new Map<Moves, number>();
      const borrowed = new Map<Moves, number>();

      for (const [at, build] of getBestParty(party, 3).entries()) {
        const types = getSpeciesData(party[at]).types;

        for (const move of build.moves) {
          carried.set(move, (carried.get(move) ?? 0) + 1);
          if (!types.includes(getMoveData(move).type)) {
            borrowed.set(move, (borrowed.get(move) ?? 0) + 1);
          }
        }
      }
      for (const [move, count] of carried) {
        expect(count, getMoveData(move).name).toBeLessThanOrEqual(3);
      }
      for (const [move, count] of borrowed) {
        expect(count, getMoveData(move).name).toBeLessThanOrEqual(2);
      }
    }
  });

  it('spends a support slot on the two in front of it', () => {
    // Every fight here stands the whole party up at once, so a move
    // aimed at an ally has somebody to aim at
    const support = getBestMoves(Species.Espeon, [], { role: BuildRole.Support });

    expect(support).toContain(Moves.HelpingHand);
    // A core spending a cast on somebody else's hit is a core not
    // taking its own
    expect(getBestMoves(Species.Espeon)).not.toContain(Moves.HelpingHand);

    // And nothing passes a baton with nothing raised to pass
    for (const species of getRentalPool()) {
      for (const role of [BuildRole.Core, BuildRole.Support]) {
        const built = getBestMoves(species, [], { role });

        if (built.includes(Moves.BatonPass)) {
          expect(
            built.some((move) => SETUP_MOVES.has(move)),
            getSpeciesData(species).name,
          ).toBe(true);
        }
      }
    }
  });

  it('never promises what the rest of the sheet cannot keep', () => {
    for (const species of getRentalPool()) {
      for (const role of [BuildRole.Core, BuildRole.Support]) {
        const built = getBestMoves(species, [], { role });
        const name = getSpeciesData(species).name;

        // Dream Eater against somebody awake is a wasted cast, so it
        // is only ever taken beside something that puts them to sleep
        if (built.includes(Moves.DreamEater)) {
          expect(
            built.some((move) =>
              [
                Moves.Spore,
                Moves.SleepPowder,
                Moves.Hypnosis,
                Moves.LovelyKiss,
                Moves.Sing,
                Moves.Yawn,
              ].includes(move),
            ),
            name,
          ).toBe(true);
        }
        if (built.includes(Moves.SleepTalk)) {
          expect(built, name).toContain(Moves.Rest);
        }
      }
    }
  });

  it('awakens the abilities the job asks for', () => {
    // The sky it brings with it is the whole of what a Groudon is
    expect(getBestAbilities(Species.Groudon, 1, BuildRole.Core)).toEqual([Abilities.Drought]);

    // The same species leans one way as a core and the other behind
    // one: what sharpens a hit against what survives one
    expect(getBestAbilities(Species.Salamence, 1, BuildRole.Core)).not.toEqual(
      getBestAbilities(Species.Salamence, 1, BuildRole.Support),
    );

    // A species with fewer than asked carries what it has, and never
    // the same one twice
    for (const species of getRentalPool()) {
      const pool = new Set([
        ...getSpeciesAbilityPools(species).regular,
        ...getSpeciesAbilityPools(species).hidden,
      ]);
      const held = getBestAbilities(species, 3, BuildRole.Support);

      expect(held.length, getSpeciesData(species).name).toBe(Math.min(3, pool.size));
      expect(new Set(held).size).toBe(held.length);
      for (const ability of held) {
        expect(pool.has(ability)).toBe(true);
      }
    }
  });

  it('docks a move that pays for the swing out of the swinger', () => {
    // Overheat halves the stat it just fired from, and a fight here is
    // cast after cast rather than turn after turn, so its face value
    // is a price paid once and collected once
    const arcanine = getBestMoves(Species.Arcanine, [Abilities.Intimidate]);

    expect(arcanine).toContain(Moves.FireBlast);
    expect(arcanine).not.toContain(Moves.Overheat);
  });

  it('reads what its own ability does to a move', () => {
    // Contrary turns every raise into a drop, so Latios stops calming its mind
    expect(getBestMoves(Species.Latios)).toContain(Moves.CalmMind);
    expect(getBestMoves(Species.Latios, [Abilities.Contrary])).not.toContain(Moves.CalmMind);

    // A rampage strikes every step, and Own Tempo takes away the confusion it ends in
    expect(getBestMoves(Species.Dratini)).not.toContain(Moves.Outrage);
    expect(getBestMoves(Species.Dratini, [Abilities.OwnTempo])).toContain(Moves.Outrage);
  });

  it('aims a move at the teammate its ability turns it into a gift for', () => {
    const tempo = {
      species: Species.Lickilicky,
      abilities: [Abilities.OwnTempo],
      role: BuildRole.Core,
    };
    const support = { role: BuildRole.Support };

    // A Swagger is 2 stages of Attack for a teammate that cannot be confused
    expect(getBestMoves(Species.Umbreon, [], support)).not.toContain(Moves.Swagger);
    expect(getBestMoves(Species.Umbreon, [], { ...support, allies: [tempo] })).toContain(
      Moves.Swagger,
    );
    expect(
      getBestMoves(Species.Umbreon, [], { ...support, allies: [{ ...tempo, abilities: [] }] }),
    ).not.toContain(Moves.Swagger);

    // And a Charm is 2 stages of Attack for one whose Contrary turns it round
    expect(getBestMoves(Species.Bulbasaur, [], support)).not.toContain(Moves.Charm);
    expect(
      getBestMoves(Species.Bulbasaur, [], {
        ...support,
        allies: [{ ...tempo, abilities: [Abilities.Contrary] }],
      }),
    ).toContain(Moves.Charm);
  });

  it('prices what a move really lands, not what its entry says', () => {
    // A recharge is a whole cast spent standing still, which is what
    // kept Giga Impact off a quarter of the dex
    expect(getBestMoves(Species.Gyarados, [Abilities.Intimidate])).not.toContain(Moves.GigaImpact);

    // A move whose power the engine works out at the cast is still
    // worth something: Snorlax throws its own weight
    expect(getBestMoves(Species.Snorlax, [Abilities.Immunity])).toContain(Moves.HeavySlam);

    // Every strike counts, and Skill Link lands the lot, which is what
    // makes five strikes of 25 worth a slot
    expect(getBestMoves(Species.Cloyster, [Abilities.ShellArmor])).not.toContain(Moves.SpikeCannon);
    expect(getBestMoves(Species.Cloyster, [Abilities.SkillLink])).toContain(Moves.SpikeCannon);
  });

  it('never awakens an ability the sheet never asks for', () => {
    // Reckless lifts a move that hurts its user, and a sheet with
    // none is a sheet it does nothing on. The two are picked apart,
    // so the abilities are priced again once the moves are known
    expect(
      getBestAbilities(Species.Arcanine, 1, BuildRole.Core, undefined, [Moves.DoubleEdge]),
    ).toEqual([Abilities.Reckless]);
    expect(
      getBestAbilities(Species.Arcanine, 1, BuildRole.Core, undefined, [Moves.Overheat]),
    ).not.toEqual([Abilities.Reckless]);

    // And what the builder actually fields agrees with its own sheet
    const built = getBestBuild(Species.Arcanine, BuildRole.Core, 2);

    if (built.abilities.includes(Abilities.Reckless)) {
      expect(built.moves.some((move) => isRecoilMove(move))).toBe(true);
    }
  });

  it('picks the nature the sheet it built actually wants', () => {
    const machamp = getBestBuild(Species.Machamp, BuildRole.Core, 1);
    const gengar = getBestBuild(Species.Gengar, BuildRole.Core, 1);

    // The drop belongs on the side it never casts from
    expect(NATURE_EFFECTS[machamp.nature]?.up).toBe(Stats.Attack);
    expect(NATURE_EFFECTS[machamp.nature]?.down).toBe(Stats.SpecialAttack);
    expect(NATURE_EFFECTS[gengar.nature]?.up).toBe(Stats.SpecialAttack);
    expect(NATURE_EFFECTS[gengar.nature]?.down).toBe(Stats.Attack);

    // A support is bought defence rather than power, and never pays
    // for it with the defence it is there for
    for (const species of getRentalPool()) {
      const nature = getBestNature(
        species,
        BuildRole.Support,
        getBestMoves(species, [], {
          role: BuildRole.Support,
        }),
      );
      const effect = NATURE_EFFECTS[nature];
      const name = getSpeciesData(species).name;

      expect(effect, name).toBeDefined();
      expect([Stats.Defense, Stats.SpecialDefense, Stats.Speed], name).toContain(effect?.up);
    }
    // And the same species answers the same way twice
    expect(getBestNature(Species.Machamp, BuildRole.Core)).toBe(
      getBestNature(Species.Machamp, BuildRole.Core),
    );
  });

  it('fields two cores behind four supports', () => {
    const six = [
      Species.Blissey,
      Species.Skarmory,
      Species.Salamence,
      Species.Metagross,
      Species.Milotic,
      Species.Gengar,
    ];
    const roles = assignBuildRoles(six);

    expect(roles.filter((role) => role === BuildRole.Core)).toHaveLength(CORE_COUNT);
    // Read off the species rather than the slot: the two that can
    // take something off the field are the two asked to
    expect(roles[six.indexOf(Species.Salamence)]).toBe(BuildRole.Core);
    expect(roles[six.indexOf(Species.Blissey)]).toBe(BuildRole.Support);

    // A house that fields three has one, since two attackers and one
    // support is not a plan
    expect(
      assignBuildRoles([Species.Blissey, Species.Salamence, Species.Skarmory]).filter(
        (role) => role === BuildRole.Core,
      ),
    ).toHaveLength(1);
  });

  it('keeps every written override to something its species can learn', () => {
    for (const [key, moves] of Object.entries(BEST_MOVE_OVERRIDES)) {
      const species: Species = Number(key);
      const legal = new Set(getLearnableMoves(species));

      expect(moves, getSpeciesData(species).name).toHaveLength(BEST_MOVE_COUNT);
      for (const move of moves) {
        expect(legal.has(move), `${getSpeciesData(species).name}: ${move}`).toBe(true);
      }
    }
  });

  it('gives every elite a signature of their own kind', () => {
    for (const member of ELITE_MEMBERS) {
      const signature = ELITE_MEMBER_SIGNATURES[member];
      const pool = ELITE_MEMBER_POOLS[member];
      const data = getSpeciesData(signature);

      // Their own by some rule of their pool: the type, the egg group
      // they widen with, or a name
      expect(
        data.types.some((type) => pool.types.includes(type)) ||
          data.eggGroups.some((group) => (pool.eggGroups ?? []).includes(group)) ||
          (pool.also ?? []).includes(signature),
        ELITE_MEMBER_NAMES[member],
      ).toBe(true);
    }
    // One man in two leagues brings the same Machamp to both
    expect(ELITE_MEMBER_SIGNATURES[EliteMember.Bruno]).toBe(Species.Machamp);
  });

  it('widens an elite past a type that would field one pokemon', () => {
    const pools = new Map<EliteMember, Species[]>(
      ELITE_MEMBERS.map((member) => [member, getEliteMemberRoster(member)]),
    );
    const poolOf = (member: EliteMember): Species[] => pools.get(member) ?? [];

    // Nobody fields six of the same pokemon: Ghost and Dragon run to
    // a couple of fully-grown species even across every region, which
    // is what the wideners are for
    for (const member of ELITE_MEMBERS) {
      expect(poolOf(member).length, ELITE_MEMBER_NAMES[member]).toBeGreaterThan(1);
    }

    // Named where no rule reaches, or where the band no longer does
    expect(poolOf(EliteMember.Lorelei)).toContain(Species.Slowbro);
    expect(poolOf(EliteMember.Bruno)).toContain(Species.Onix);
    expect(poolOf(EliteMember.Agatha)).toContain(Species.Golbat);
    expect(poolOf(EliteMember.Agatha)).toContain(Species.Arbok);
    expect(poolOf(EliteMember.Lance)).toContain(Species.Aerodactyl);

    // Kinship the type chart misses: a Gyarados is a dragon by
    // breeding, which is why one stands on Lance's team
    expect(poolOf(EliteMember.Lance)).toContain(Species.Gyarados);
    expect(getSpeciesData(Species.Gyarados).types).not.toContain(Types.Dragon);

    // Agatha is not a second Koga, who now sits in Johto's league
    // with the Poison type entire: hers is the group her ghosts
    // share. Counted by pokemon rather than by entry, since a Rotom
    // brings five addresses of itself to an Amorphous pool
    const distinct = (member: EliteMember): number =>
      new Set(poolOf(member).map(getBaseFormSpecies)).size;

    expect(distinct(EliteMember.Agatha)).toBeLessThan(distinct(EliteMember.Koga));
    expect(poolOf(EliteMember.Agatha)).not.toContain(Species.Venusaur);

    // A name is the one thing that reaches outside the band: Bruno's
    // Onix and Agatha's Golbat are middle stages now that a Steelix
    // and a Crobat exist, and both are still theirs. Everything else
    // a pool derives is fully grown
    for (const member of ELITE_MEMBERS) {
      const names = new Set(ELITE_MEMBER_POOLS[member].also ?? []);

      for (const named of names) {
        expect(poolOf(member), ELITE_MEMBER_NAMES[member]).toContain(named);
      }
      for (const species of poolOf(member)) {
        if (!names.has(species)) {
          expect(getGrowthRoads(species).length, getSpeciesData(species).name).toBe(0);
        }
      }
    }
  });

  it('gives each champion their own six rather than a draw', () => {
    // Blue's Fire Red line-up, the one he takes the Plateau with when
    // the player walked out with a Charmander
    expect(CHAMPION_PARTIES[Champion.Blue]).toEqual([
      Species.Pidgeot,
      Species.Alakazam,
      Species.Rhydon,
      Species.Arcanine,
      Species.Exeggutor,
      Species.Blastoise,
    ]);
    // Lance's, three Dragonite and all: a named party may repeat a
    // species where the character's own does
    expect(
      CHAMPION_PARTIES[Champion.Lance].filter((one) => one === Species.Dragonite),
    ).toHaveLength(3);

    for (const champion of CHAMPIONS) {
      // A full party, the same as every other expert, and a shipped
      // wardrobe to stand in
      expect(CHAMPION_PARTIES[champion], CHAMPION_NAMES[champion]).toHaveLength(EXPERT_PARTY_SIZE);
      expect(CHAMPION_NAMES[champion].length).toBeGreaterThan(0);

      for (const sheet of CHAMPION_CHARSETS[champion]) {
        expect(existsSync(`public/sprites/overworld/${sheet}/image.png`), sheet).toBe(true);
      }
      // Each asks for their own league's Elite Four and pays their own
      // league's title
      expect(CHAMPION_HONORS[champion]).toHaveLength(KANTO_HONORS.length);
      expect(AWARD_NAMES[CHAMPION_TITLES[champion]].length).toBeGreaterThan(0);
    }
    expect(CHAMPION_HONORS[Champion.Blue]).toEqual(KANTO_HONORS);
    expect(CHAMPION_HONORS[Champion.Lance]).toEqual(JOHTO_HONORS);
  });

  it('keeps the legends outside the league', () => {
    // Red's Mt. Silver line-up, the version made of Kanto species. He
    // stands above the league rather than at the top of it: no title
    // is his to pay and no badge case is asked for
    expect(LEGEND_PARTIES[Legend.Red]).toEqual([
      Species.Pikachu,
      Species.Lapras,
      Species.Snorlax,
      Species.Venusaur,
      Species.Charizard,
      Species.Blastoise,
    ]);

    for (const legend of LEGENDS) {
      expect(LEGEND_PARTIES[legend], LEGEND_NAMES[legend]).toHaveLength(EXPERT_PARTY_SIZE);
      expect(LEGEND_NAMES[legend].length).toBeGreaterThan(0);

      for (const sheet of LEGEND_CHARSETS[legend]) {
        expect(existsSync(`public/sprites/overworld/${sheet}/image.png`), sheet).toBe(true);
      }
    }
    // Nobody holds two seats: a legend is not one of the champions
    const crowned = new Set(CHAMPIONS.map((champion) => CHAMPION_NAMES[champion]));

    for (const legend of LEGENDS) {
      expect(crowned.has(LEGEND_NAMES[legend])).toBe(false);
    }
  });

  it('pays a legend’s mark in a name, a colour and coats worth wearing', () => {
    const spoken = new Set([
      ...KANTO_BADGES,
      ...JOHTO_BADGES,
      ...HOENN_BADGES,
      ...SINNOH_BADGES,
      ...KANTO_HONORS,
      ...JOHTO_HONORS,
      ...HOENN_HONORS,
      ...SINNOH_HONORS,
      ...CHAMPIONS.map((champion) => CHAMPION_TITLES[champion]),
    ]);

    for (const legend of LEGENDS) {
      const mark = LEGEND_HONORS[legend];

      // Its own award rather than a league's, and one that reads as
      // something on a shelf
      expect(spoken.has(mark)).toBe(false);
      expect(AWARD_NAMES[mark].length).toBeGreaterThan(0);

      // The coats it unlocks are shipped, and none of them is free
      // from the start: a mark that paid a starting look would pay
      // nothing
      expect(LEGEND_PRIZE_CHARSETS[legend].length).toBeGreaterThan(0);
      for (const sheet of LEGEND_PRIZE_CHARSETS[legend]) {
        expect(FREE_CHARSETS.includes(sheet), sheet).toBe(false);
        expect(existsSync(`public/sprites/overworld/${sheet}/image.png`), sheet).toBe(true);
      }
    }
  });

  it('gives Kanto’s eighth gym to Giovanni and its crown to Blue', () => {
    // The Viridian gym is a Ground gym now rather than the one gym
    // with no specialty, and it is still the Earth Badge that is won
    // there
    expect(GYM_LEADER_NAMES[GymLeader.Giovanni]).toBe('Giovanni');
    expect(GYM_LEADER_BADGES[GymLeader.Giovanni]).toBe(Awards.EarthBadge);
    expect(GYM_LEADER_SIGNATURES[GymLeader.Giovanni]).toBe(Species.Rhydon);
    // He keeps the countries his own type answers to
    for (const biome of [Biome.Desert, Biome.Badlands, Biome.Mountain]) {
      expect(BIOME_GYM_LEADERS[biome]).toContain(GymLeader.Giovanni);
    }
    // And no country is left with an empty gym by his taking Blue's
    for (const seated of Object.values(BIOME_GYM_LEADERS)) {
      expect(seated.length).toBeGreaterThan(0);
    }
    // Blue answers for Kanto's title, which is what his own six is
    // fielded for
    expect(CHAMPION_NAMES[Champion.Blue]).toBe('Blue');
    expect(CHAMPION_TITLES[Champion.Blue]).toBe(Awards.KantoChampion);
  });

  it('hands a beaten leader’s TM out of their own type’s case', () => {
    for (const leader of GYM_LEADERS) {
      const type = GYM_LEADER_TYPES[leader];
      const rng = new AleaRNG(`gym-machine-${leader}`);
      const seen = new Set<Items>();

      for (let roll = 0; roll < 64; roll++) {
        const item = rollGymMachine(leader, () => rng.random());

        expect(item).not.toBeNull();
        if (item == null) {
          continue;
        }
        seen.add(item);

        const move = getMachineMove(item);

        expect(move).not.toBeNull();
        if (move != null) {
          expect(getMoveData(move).type).toBe(type);
        }
      }
      // The case never comes up empty; a thin type may be one disc
      expect(seen.size).toBeGreaterThanOrEqual(1);
    }
  });
});

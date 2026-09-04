import { describe, expect, it } from 'vitest';
import registerGameData from '../../src/data';
import {
  DEMO_MAX_LEVEL,
  DEMO_MIN_LEVEL,
  DEMO_TEAMS,
  DEMO_TEAM_SIZE,
  createDemoRaidTeams,
} from '../../src/overworld/demo-raid';
import {
  BOSS_ALLIANCE,
  PLAYER_ALLIANCE,
  RAID_BOSS_LEVEL,
  canStageBoss,
} from '../../src/overworld/raid';
import { createRaidBattle } from '../../src/overworld/raid-battle';
import { Species } from '../../src/data/ids/species';
import { PERFECT_IVS } from '../../src/data/constants/stats';
import { isFullyEvolved } from '../../src/data/species';

// The demo rolls species out of the registry, so the registry has to
// be filled the way the page fills it
registerGameData();

describe('demo raid', () => {
  it('stages a boss against a lobby of parties', () => {
    const teams = createDemoRaidTeams('spectate');

    expect(teams).toHaveLength(DEMO_TEAMS + 1);

    const [boss, ...parties] = teams;

    // The boss stands alone in its own alliance and belongs to
    // nobody, exactly the way a real lobby publishes one
    expect(boss.alliance).toBe(BOSS_ALLIANCE);
    expect(boss.player).toBe('');
    expect(boss.catches).toHaveLength(1);
    expect(boss.catches[0].level).toBe(RAID_BOSS_LEVEL);
    expect(boss.catches[0].ivs).toBe(PERFECT_IVS);
    expect(boss.catches[0].moves.length).toBeGreaterThan(0);
    expect(canStageBoss(boss.catches[0].species)).toBe(true);

    // The parties share the other alliance, so the whole lobby is
    // allied against it
    expect(parties).toHaveLength(DEMO_TEAMS);
    for (const party of parties) {
      expect(party.alliance).toBe(PLAYER_ALLIANCE);
      expect(party.catches).toHaveLength(DEMO_TEAM_SIZE);

      for (const rolled of party.catches) {
        // Nothing stands for a record, which is what keeps the
        // aftermath machinery from having anything to say about it
        expect(rolled.caught).toBe('');
        expect(rolled.level).toBeGreaterThanOrEqual(DEMO_MIN_LEVEL);
        expect(rolled.level).toBeLessThanOrEqual(DEMO_MAX_LEVEL);
        expect(rolled.health).toBeGreaterThan(0);
        // A unit with nothing to cast would stand there for the whole
        // fight, which is the one thing a demo must not do
        expect(rolled.moves.length).toBeGreaterThan(0);
        expect(rolled.abilities).toHaveLength(1);
        // At level 70 a pokemon with somewhere left to evolve to is a
        // pokemon that would have got there long ago
        expect(isFullyEvolved(rolled.species)).toBe(true);
      }
    }

    // The placeholders at the front of the species list are not
    // pokemon and have no sheet worth drawing
    const fielded = teams.flatMap((team) => team.catches.map((rolled) => rolled.species));

    for (const placeholder of [Species.Missingno, Species.Egg, Species.Substitute]) {
      expect(fielded).not.toContain(placeholder);
    }
  });

  it('is the seed and nothing else', () => {
    // The point of the page is that a fight can be linked to, which
    // only holds if the seed decides the whole of it
    expect(createDemoRaidTeams('alpha')).toEqual(createDemoRaidTeams('alpha'));
    expect(createDemoRaidTeams('alpha')).not.toEqual(createDemoRaidTeams('beta'));
  });

  it('builds a battle the engine will actually run', () => {
    // A raid runs in real time, so starting one asks the browser for
    // a frame. There is no browser here: the pump is stubbed to
    // nothing and time is driven by hand, which is the same thing the
    // battle harness does by leaving the frame mechanic out
    const frames = globalThis.requestAnimationFrame;
    const cancel = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = () => 0;
    globalThis.cancelAnimationFrame = () => undefined;

    const built = createRaidBattle('demo:spectate', createDemoRaidTeams('spectate'));

    built.battle.initialize();
    built.battle.start();

    const boss = built.units.get(BOSS_ALLIANCE) ?? [];
    const parties = built.units.get(PLAYER_ALLIANCE) ?? [];

    expect(boss).toHaveLength(1);
    expect(parties).toHaveLength(DEMO_TEAMS * DEMO_TEAM_SIZE);
    expect(built.alliances.get(BOSS_ALLIANCE)?.boss).toBe(true);
    expect(built.alliances.get(PLAYER_ALLIANCE)?.boss).toBe(false);

    // A raid boss carries a health pool the fight is built around, so
    // it should outlast any one of the pokemon facing it
    for (const unit of parties) {
      expect(boss[0].health).toBeGreaterThan(unit.health);
    }

    // And it runs. This is the assertion the whole page exists for:
    // a battle that is built but in which nobody ever acts looks
    // exactly like a battle that is working, until somebody watches
    // one for five seconds
    const before = parties.reduce((total, unit) => total + unit.health, boss[0].health);

    // Stepped rather than jumped: a cast is set up on one tick and
    // runs down over the ones after it, so a single leap of five
    // seconds is one decision rather than five seconds of fighting
    for (let frame = 0; frame < 40; frame++) {
      built.battle.tick(250);
    }

    const after = parties.reduce((total, unit) => total + unit.health, boss[0].health);

    expect(after).toBeLessThan(before);

    built.battle.end();
    globalThis.requestAnimationFrame = frames;
    globalThis.cancelAnimationFrame = cancel;
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import { Metric } from '../../src/auth/quest-record';
import registerData from '../../src/data';
import { Quests } from '../../src/data/quests';
import { bumpProgress } from '../../src/server/quest-progress';
import { recordCaughtSpecies } from '../../src/server/pokedex';
import { claimQuest, listQuests } from '../../src/server/quests';

/**
 * Quests count from where they opened, not from the whole of a
 * player's history.
 *
 * The whole of this is a race between a counter and a claim row, so
 * none of it can be read off the code: it takes a real player with a
 * real history walking a real chain. The Raiding chain is the sharpest
 * case, since two of its three quests read the same counter.
 */

let player: Actor;

const NOW = 1_700_000_000_000;

beforeAll(async () => {
  // The rewards are real: a quest paying an Eevee needs the species
  registerData();
  await clearAll();
  player = await actor('quest-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from quest_baselines`;
  await sql`delete from quest_claims`;
  await sql`delete from quest_progress`;
  await sql`delete from pokedex_entries`;
});

/** Put `count` distinct species into the player's dex, from id 1 up */
async function metSpecies(count: number): Promise<void> {
  for (let species = 1; species <= count; species += 1) {
    await recordCaughtSpecies(player.uid, species, false);
  }
}

async function claim(quest: Quests): Promise<boolean> {
  return (await claimQuest(player.uid, quest, NOW, 0, 'en-US')) != null;
}

async function standing(quest: Quests): Promise<{ have: number; claimable: boolean } | null> {
  const found = (await listQuests(player.uid)).find((one) => one.quest === quest);

  return found == null ? null : { have: found.requirements[0].have, claimable: found.claimable };
}

describe('a quest at the head of its chain', () => {
  it('counts everything the player ever did', async () => {
    await bumpProgress(player.uid, [[Metric.RaidRuns, 0, 3]]);

    // Nothing was ever locked away from it, so its counter is its own
    // from the account's first step
    expect(await standing(Quests.RaidRookie)).toEqual({ have: 3, claimable: true });
    expect(await sql`select 1 from quest_baselines`).toHaveLength(0);
  });
});

describe('a quest behind a prerequisite', () => {
  it('starts from zero however long the player has been playing', async () => {
    // A veteran: ten raids won before the chain was ever opened
    await bumpProgress(player.uid, [
      [Metric.RaidRuns, 0, 1],
      [Metric.RaidWins, 0, 10],
    ]);

    // Locked, so it is not even on the board
    expect(await standing(Quests.BossDown)).toBeNull();
    expect(await claim(Quests.BossDown)).toBe(false);

    expect(await claim(Quests.RaidRookie)).toBe(true);

    // ...and on opening it asks for a win, not for one it already had
    expect(await standing(Quests.BossDown)).toEqual({ have: 0, claimable: false });
    expect(await claim(Quests.BossDown)).toBe(false);

    // The next win after the unlock is the one that counts
    await bumpProgress(player.uid, [[Metric.RaidWins, 0, 1]]);
    expect(await standing(Quests.BossDown)).toEqual({ have: 1, claimable: true });
    expect(await claim(Quests.BossDown)).toBe(true);
  });

  it('does not hand the whole chain over at once', async () => {
    await bumpProgress(player.uid, [
      [Metric.RaidRuns, 0, 1],
      [Metric.RaidWins, 0, 20],
    ]);
    await claim(Quests.RaidRookie);
    await bumpProgress(player.uid, [[Metric.RaidWins, 0, 1]]);
    await claim(Quests.BossDown);

    // Twenty-one wins on the ledger, and the quest asking for five
    // still asks for five: each link draws its own line
    expect(await standing(Quests.SirenVeteran)).toEqual({ have: 0, claimable: false });
    await bumpProgress(player.uid, [[Metric.RaidWins, 0, 5]]);
    expect(await standing(Quests.SirenVeteran)).toEqual({ have: 5, claimable: true });
  });

  it('draws the line on first sight for a quest unlocked before it had one', async () => {
    await bumpProgress(player.uid, [
      [Metric.RaidRuns, 0, 1],
      [Metric.RaidWins, 0, 7],
    ]);
    // Claimed the old way: the chain moved on and nothing was written
    await sql`
      insert into quest_claims (player, quest, claimed_at)
      values (${player.uid}, ${Quests.RaidRookie}, ${NOW})
    `;

    expect(await standing(Quests.BossDown)).toEqual({ have: 0, claimable: false });

    // Written once and kept: a second look does not move the line on
    await bumpProgress(player.uid, [[Metric.RaidWins, 0, 2]]);
    expect(await standing(Quests.BossDown)).toEqual({ have: 2, claimable: true });
  });
});

describe('a quest asking for a dex', () => {
  it('counts from the unlock where the quest before it asked for something else', async () => {
    // A collector: thirty species in the dex before the chain opened
    await metSpecies(30);
    await bumpProgress(player.uid, [[Metric.Catches, 0, 1]]);

    expect(await claim(Quests.FirstCatch)).toBe(true);

    // Growing Team counts its five from the unlock, the way every
    // chained counter does
    await bumpProgress(player.uid, [[Metric.Catches, 0, 5]]);
    expect(await claim(Quests.GrowingTeam)).toBe(true);

    // New Faces asks for five species, and thirty already met are not
    // five the player went and found
    expect(await standing(Quests.NewFaces)).toEqual({ have: 0, claimable: false });

    await metSpecies(35);
    expect(await standing(Quests.NewFaces)).toEqual({ have: 5, claimable: true });
  });

  it('keeps its total where the quest before it asked for a dex too', async () => {
    await metSpecies(30);
    await bumpProgress(player.uid, [[Metric.Catches, 0, 1]]);
    await claim(Quests.FirstCatch);
    await bumpProgress(player.uid, [[Metric.Catches, 0, 5]]);
    await claim(Quests.GrowingTeam);
    await metSpecies(35);
    await claim(Quests.NewFaces);

    // A ladder of dex rungs is a ladder of totals: Field Notes wants
    // ten in the dex altogether, and thirty-five is ten
    expect(await standing(Quests.FieldNotes)).toEqual({ have: 35, claimable: true });
  });
});

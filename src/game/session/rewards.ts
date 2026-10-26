import { claimRaidReward } from '../../auth/raids';
import { claimStopReward } from '../../auth/stops';
import { settleGymChallenge } from '../../auth/gym-seats';
import type { EncounterRecord } from '../../model/encounter-record';
import { type WritableStore, createStore } from '../store';
import { type ActiveBattle, NO_SPOILS, type PendingReward, type Spoils } from './types';

/**
 * The battle on the page and what it is owed.
 *
 * A prize is claimed here, the moment it is won, rather than by the
 * overworld: the overworld is not on screen while the battle has the
 * page, so the pokemon is standing there waiting by the time the
 * player arrives
 */
export interface Rewards {
  /** The battle in progress, which takes the whole page while set */
  battle: WritableStore<ActiveBattle | null>;
  /** Something won and not collected yet; setting one claims it */
  reward: WritableStore<PendingReward | null>;
  /** What the fight on screen paid, once it is claimed */
  spoils: WritableStore<Spoils | null>;
  /** What a cleared raid or a beaten stop left standing: the encounter the player is about to meet */
  encounter: WritableStore<EncounterRecord | null>;
}

export interface RewardEvents {
  /**
   * A claim that landed after the player left the battle screen, whose
   * summary is gone: the interface says what the fight was worth
   */
  paidInPassing: (paid: Spoils) => void;
  /** The first win over whoever hands out an award */
  trainerBeaten: () => void;
}

export function createRewards(events: RewardEvents): Rewards {
  const battle = createStore<ActiveBattle | null>(null);
  const reward = createStore<PendingReward | null>(null);
  const spoils = createStore<Spoils | null>(null);
  const encounter = createStore<EncounterRecord | null>(null);

  // A new fight, or none, starts with nothing paid yet
  battle.subscribe(() => {
    spoils.set(null);
  });

  /** Onto the summary while the battle has the page, in passing once it does not */
  const pay = (paid: Spoils): void => {
    if (battle.get() == null) {
      events.paidInPassing(paid);
      return;
    }
    spoils.set(paid);
  };

  const claim = (owed: PendingReward): void => {
    if (owed.seat != null) {
      settleGymChallenge(owed.seat)
        .then((settled) => {
          if (settled != null) {
            pay({
              ...NO_SPOILS,
              seat: settled.freed ? 'freed' : 'held',
              gold: settled.freed ? settled.gold : -settled.gold,
            });
          }
        })
        .catch(() => {
          // Nothing is lost: the challenge stays unsettled until
          // somebody reports it, and the seat has not moved
        });
      return;
    }

    if (owed.stop == null) {
      claimRaidReward(owed.raid)
        .then((collected) => {
          if (collected == null) {
            return;
          }
          pay({
            ...NO_SPOILS,
            gold: collected.gold,
            items: collected.items,
            waiting: collected.encounter?.species ?? null,
          });
          // A calmed Noble leaves items and gold, and nobody waiting
          if (collected.encounter != null) {
            encounter.set(collected.encounter);
          }
        })
        .catch(() => {
          // Nothing is lost by a claim that failed: the raid keeps
          // what it owes until somebody collects it
        });
      return;
    }
    claimStopReward(owed.stop)
      .then((collected) => {
        if (collected == null) {
          return;
        }
        // Only on the first win over whoever hands it out, which is
        // when the award is not null
        if (collected.award != null) {
          events.trainerBeaten();
        }
        pay({
          ...NO_SPOILS,
          gold: collected.gold,
          award: collected.award,
          items: collected.items,
          waiting: collected.encounter?.species ?? null,
        });
        // A duelling trainer pays a purse and leaves no pokemon, so
        // there is nothing to stand waiting in the overworld
        if (collected.encounter != null) {
          encounter.set(collected.encounter);
        }
      })
      .catch(() => {
        // Nothing is lost by a claim that failed: the stop keeps what
        // it owes until somebody collects it
      });
  };

  reward.subscribe((owed) => {
    if (owed == null) {
      return;
    }
    reward.set(null);
    claim(owed);
  });

  return { battle, reward, spoils, encounter };
}

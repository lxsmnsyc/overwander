import type Biome from '../data/ids/biome';
import AleaRNG from '../core/alea';
import { PVP_BATTLE_LIMITS, UNLIMITED_BATTLE_LIMITS } from '../data/constants/battle-limits';
import { type Slots, getSlots } from '../data/constants/slots';
import { EventEngine } from '../core/event-engine';
import { Weathers } from '../data/ids/status';
import type Alliance from './alliance';
import type { BattleEventMap } from './events';
import { BattleEvents } from './events';
import type Team from './team';
import type Unit from './unit';

export const enum BattleModes {
  PvP = 0,
  /**
   * Raid battles: weather changes only affect the changing unit's
   * own team, unless a Boss unit triggers them
   */
  Raid = 1,
  /**
   * A fight staged to be looked at rather than won.
   *
   * It runs every mechanic the others do — the same casting, the same
   * damage, the same animations — and leaves out the two things that
   * make a fight a fight: nothing decides an outcome, so it never
   * settles, and nobody chooses moves on their own, so what happens is
   * what somebody asked for. It stands for no record and is never
   * stored; the rules it fights under are the ordinary ones
   */
  Demo = 2,
  /**
   * A scripted trainer's fight — a Team Rocket grunt today, any
   * battle npc later. It runs under the PvP rules; what sets it
   * apart is that it settles an aftermath, which a fight between
   * players never will
   */
  Npc = 3,
}

export default class Battle extends EventEngine<BattleEventMap> {
  rng: AleaRNG;

  mode: BattleModes;

  /**
   * What this fight allows a unit to bring, packed the way a catch's
   * own `slots` are. A raid allows everything; a fight between players
   * is held to the mainline's shape unless the scenario says otherwise
   */
  limits: number;

  /**
   * The ground the fight is being had on, where the caller knows it.
   * Only the moves that read the ground care, and they fall back to
   * open ground for a fight staged nowhere in particular. It is what
   * the world put underfoot, not a field a move laid down: those are
   * the terrains, which are their own thing
   */
  biome?: Biome;

  constructor(seed: string, mode = BattleModes.PvP, limits?: number, biome?: Biome) {
    super();
    this.rng = new AleaRNG(seed);
    this.mode = mode;
    this.limits =
      limits ?? (mode === BattleModes.Raid ? UNLIMITED_BATTLE_LIMITS : PVP_BATTLE_LIMITS);
    this.biome = biome;
  }

  /**
   * How many of that kind this fight allows at most
   */
  checkLimit(kind: Slots): number {
    return getSlots(this.limits, kind);
  }

  random(): number {
    return this.rng.random();
  }

  randomRange(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  initialize(): void {
    this.emit(BattleEvents.Initialize, {
      id: 'Initialize',
      disabled: false,
    });
  }

  start(): void {
    this.emit(BattleEvents.Start, {
      id: 'Start',
      disabled: false,
    });
  }

  end(): void {
    this.emit(BattleEvents.End, {
      id: 'End',
      disabled: false,
    });
  }

  tick(duration: number): void {
    this.emit(BattleEvents.Tick, {
      id: 'Tick',
      disabled: false,
      duration,
    });
  }

  // Battle state
  weather = {
    current: Weathers.None,
    disabled: false,
  };

  /**
   * Put weather over the whole field. The duration is how long it
   * holds before the sky clears itself; zero leaves it out
   * indefinitely, which is what clearing to None does
   */
  setWeather(weather: Weathers, duration = 0): void {
    this.emit(BattleEvents.SetWeather, {
      id: 'Weather',
      disabled: false,
      weather,
      duration,
    });
  }

  /**
   * Whether the battle has reached its terminal state. The outcome
   * mechanics set it once nothing can act any more
   */
  settled = false;

  /**
   * The alliance left standing, once the battle settles. Null when
   * it settled with nobody standing (a mutual knockout) or with more
   * than one side still on the field (a stalemate)
   */
  winner: Alliance | null = null;

  alliances = new Set<Alliance>();

  addAlliance(alliance: Alliance): void {
    this.emit(BattleEvents.AddAlliance, {
      id: 'AddAlliance',
      disabled: false,
      alliance,
    });
  }

  removeAlliance(alliance: Alliance): void {
    this.emit(BattleEvents.RemoveAlliance, {
      id: 'RemoveAlliance',
      disabled: false,
      alliance,
    });
  }

  /**
   * Every team across all alliances, optionally excluding one
   * alliance (e.g. the unit's own, to reach only enemy teams)
   */
  *teams(exclude?: Alliance): IterableIterator<Team> {
    for (const alliance of this.alliances) {
      if (alliance !== exclude) {
        yield* alliance.teams;
      }
    }
  }

  /**
   * Every unit across all teams, optionally excluding one alliance
   */
  *units(exclude?: Alliance): IterableIterator<Unit> {
    for (const team of this.teams(exclude)) {
      yield* team.units;
    }
  }
}

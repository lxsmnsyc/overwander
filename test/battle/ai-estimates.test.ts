import { describe, expect, it } from 'vitest';
import { chooseMove, setupChooseMoveAI } from '../../src/battle/ai/choose-move';
import { withAIContext } from '../../src/battle/ai/context';
import type Battle from '../../src/battle/core';
import type Team from '../../src/battle/team';
import type Unit from '../../src/battle/unit';
import { DOOM_MARK_SCALE } from '../../src/battle/abilities/signature/spoink-to-deoxys';
import {
  BattleEvents,
  MoveTargetType,
  type UnitAttackEvent,
  type UnitAttackResolveAmountEvent,
} from '../../src/battle/events';
import { unitTarget } from '../../src/battle/utils';
import { EventPriority } from '../../src/core/event-emitter';
import { Stages } from '../../src/data/constants/stats';
import { DEFAULT_MOVE_SLOTS } from '../../src/data/constants/slots';
import { Types } from '../../src/data/constants/types';
import registerAbilities, { getRegisteredAbilities } from '../../src/data/abilities';
import Abilities from '../../src/data/ids/abilities';
import { ItemTypes, type Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { listItemsByType } from '../../src/data/items/__create';
import { MoveAttackFlags, MoveCategories, Moves } from '../../src/data/ids/moves';
import { getMoveData } from '../../src/data/moves';
import { Statuses, TeamStatuses } from '../../src/data/ids/status';
import { dealDamage } from './abilities/signature/helpers';
import { type BattleHarness, createBattle, createUnit, pinRandom } from './harness';

const NONE_TARGET = { type: MoveTargetType.None } as const;

function createAIBattle(): BattleHarness {
  const harness = createBattle();
  setupChooseMoveAI(harness.battle);
  pinRandom(harness.battle, 0.99);
  return harness;
}

// The AI weighs every move it carries against every target, through
// the engine's own resolvers. Asking must never change the fight
describe('the AI weighing its moves', () => {
  it('lets no Three Heads bite and no cue play', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const hydreigon = createUnit(battle, teamA, [Types.Dark, Types.Dragon]);
    const front = createUnit(battle, teamB);
    const side = createUnit(battle, teamB);

    hydreigon.addAbility(Abilities.ThreeHeads);
    hydreigon.addMove(Moves.DragonPulse);
    hydreigon.addMove(Moves.DarkPulse);
    for (const unit of [hydreigon, front, side]) {
      unit.enter();
    }

    let cues = 0;
    battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Post, () => {
      cues++;
    });

    const health = [front.health, side.health];

    chooseMove(battle, hydreigon);

    expect([front.health, side.health]).toEqual(health);
    expect(cues).toBe(0);
  });

  it('raises no Glidewake', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const emolga = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    emolga.addAbility(Abilities.Glidewake);
    emolga.addMove(Moves.Swift);
    emolga.enter();
    foe.enter();

    chooseMove(battle, emolga);

    expect(emolga.stages[Stages.Evasion]).toBe(0);
  });

  it('leaves a Bluff for the blow that lands', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const caster = createUnit(battle, teamA);
    const zorua = createUnit(battle, teamB, [Types.Grass]);

    zorua.addAbility(Abilities.Bluff);
    caster.addMove(Moves.Ember);
    caster.enter();
    zorua.enter();

    // Shown once, so the AI's fog lets its estimates see it
    zorua.triggerAbility(Abilities.Bluff);
    chooseMove(battle, caster);

    const whole = zorua.health;

    caster.attack(zorua, Moves.Ember, 40, Types.Fire, MoveCategories.Special, 0);
    expect(zorua.health).toBe(whole);
  });

  it('leaves a Doom Mark for the blow that lands', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const holder = createUnit(battle, teamA);
    const ally = createUnit(battle, teamA);
    const enemy = createUnit(battle, teamB);

    holder.addAbility(Abilities.DoomMark);
    ally.addMove(Moves.Pound);
    for (const unit of [holder, ally, enemy]) {
      unit.enter();
    }

    const clean = dealDamage(ally, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical);

    holder.attack(enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical, 0);
    chooseMove(battle, ally);

    expect(
      dealDamage(ally, enemy, Moves.Pound, 40, Types.Normal, MoveCategories.Physical),
    ).toBeCloseTo(clean * DOOM_MARK_SCALE, 5);
  });

  it('keeps a Lock-On for the move that is cast', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const sniper = createUnit(battle, teamA);
    const target = createUnit(battle, teamB);

    sniper.addMove(Moves.Blizzard);
    sniper.enter();
    target.enter();
    sniper.triggerMoveEffect(Moves.LockOn, unitTarget(target), 0);

    chooseMove(battle, sniper);

    expect(sniper.checkMoveAccuracy(Moves.Blizzard, unitTarget(target))).toBeUndefined();
  });

  it('breaks no guard by weighing a move that walks through it', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const striker = createUnit(battle, teamA);
    const guard = createUnit(battle, teamB);
    const mate = createUnit(battle, teamB);

    striker.addMove(Moves.Feint);
    for (const unit of [striker, guard, mate]) {
      unit.enter();
    }
    guard.triggerMoveEffect(Moves.Protect, NONE_TARGET, 0);
    mate.triggerMoveEffect(Moves.QuickGuard, NONE_TARGET, 0);

    chooseMove(battle, striker);

    expect(guard.status[Statuses.Protected]).toBeDefined();
    expect(mate.team.status[TeamStatuses.QuickGuard]).toBeDefined();
  });

  it('weighs a Flail at the power it works out to', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const desperate = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    desperate.addMove(Moves.Tackle);
    desperate.addMove(Moves.Flail);
    desperate.enter();
    foe.enter();
    // Its table carries no power, and on 1 HP it hits for the most
    desperate.setHealth(1);

    expect(chooseMove(battle, desperate)?.move).toBe(Moves.Flail);
  });

  it('draws nothing from the fight to guess a Magnitude', () => {
    const { battle, teamA, teamB } = createAIBattle();
    const quaker = createUnit(battle, teamA);
    const foe = createUnit(battle, teamB);

    let draws = 0;
    battle.random = () => {
      draws++;
      return 0.99;
    };

    withAIContext(battle, quaker, () => quaker.checkMovePower(Moves.Magnitude, unitTarget(foe)));
    expect(draws).toBe(0);

    quaker.checkMovePower(Moves.Magnitude, unitTarget(foe));
    expect(draws).toBe(1);
  });
});

// Every event a guess may raise is a question: a Check, a Resolve, or
// the decision itself. Anything else is something happening
const QUESTION =
  /^(Check|Resolve|UnitAttackResolve|UnitAttackCheck|UnitTriggerMoveResolve|UnitAIChooseMove)/;

/** A spread wide enough to reach most of what a listener answers */
const SWEEP_MOVES = [
  Moves.Tackle,
  Moves.QuickAttack,
  Moves.Feint,
  Moves.Ember,
  Moves.Surf,
  Moves.GigaDrain,
  Moves.Earthquake,
  Moves.Magnitude,
  Moves.Swift,
  Moves.ShadowBall,
  Moves.DragonPulse,
  Moves.Protect,
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.ThunderWave,
  Moves.Hypnosis,
];

/**
 * The spread cut into fields: a unit carries only so many moves, so
 * the caster and its mate each take a slice of one
 */
const FIELDS: Moves[][] = [];

for (let start = 0; start < SWEEP_MOVES.length; start += DEFAULT_MOVE_SLOTS * 2) {
  FIELDS.push(SWEEP_MOVES.slice(start, start + DEFAULT_MOVE_SLOTS * 2));
}

const SIDES = ['caster', 'mate', 'foe'] as const;

type Side = (typeof SIDES)[number];

interface Watched {
  happened: string[];
  draws: number;
  /** What the fight answered after the decisions that it did not before */
  changed: string[];
}

/** Record what the fight did and drew while the AI was only asking */
function watch(battle: Battle): Watched {
  const watched: Watched = { happened: [], draws: 0, changed: [] };
  const emit = battle.emit.bind(battle);
  const random = battle.random.bind(battle);

  battle.emit = (name, event) => {
    if (battle.estimating && !QUESTION.test(event.id)) {
      watched.happened.push(event.id);
    }
    emit(name, event);
  };
  battle.random = () => {
    if (battle.estimating) {
      watched.draws++;
    }
    return random();
  };
  return watched;
}

/**
 * A unit with a species, which an Eviolite reads, and the types asked
 * for in place of the species' own
 */
function fielded(battle: Battle, team: Team, types: Types[]): Unit {
  const unit = createUnit(battle, team);

  unit.setSpecies(Species.Pikachu);
  unit.removeType(Types.Electric);
  for (const type of types) {
    unit.addType(type);
  }
  return unit;
}

/**
 * What the field looks like and what it answers: every unit's state,
 * and what each move would do to each unit, asked as a guess. State a
 * listener keeps to itself (a Lock-On's aim, a spent Bluff) shows up
 * here even though no event says it changed
 */
function answers(battle: Battle, units: Unit[], movers: Unit[]): string[] {
  const lines: string[] = [];

  for (const unit of units) {
    lines.push(
      JSON.stringify([
        unit.health,
        unit.stages,
        Object.keys(unit.status),
        Object.keys(unit.items),
        Object.keys(unit.team.status),
      ]),
    );
  }
  for (const mover of movers) {
    withAIContext(battle, mover, () => {
      for (const state of Object.values(mover.moves)) {
        const move = state.move;
        const data = getMoveData(move);

        for (const unit of units) {
          const target = unitTarget(unit);
          const type = mover.checkMoveType(move, target);
          const parent: UnitAttackEvent = {
            id: 'UnitAttack',
            disabled: false,
            source: mover,
            target: unit,
            move,
            value: 40,
            category: data.category,
            type,
            flags: MoveAttackFlags.Simulated,
            success: false,
          };
          const damage: UnitAttackResolveAmountEvent = {
            id: 'UnitAttackResolveDamage',
            disabled: false,
            parent,
            value: parent.value,
          };
          battle.emit(BattleEvents.UnitAttackResolveDamage, damage);

          lines.push(
            JSON.stringify([
              move,
              mover.checkMoveImmunity(move, target, type),
              mover.checkMoveAccuracy(move, target),
              mover.checkMovePower(move, target),
              damage.value,
            ]),
          );
        }
      }
    });
  }
  return lines;
}

/** Two decisions on a field with the effect held on the given side */
function decide(hold: (unit: Unit) => void, side: Side, moves: Moves[]): Watched {
  const { battle, teamA, teamB } = createBattle();
  setupChooseMoveAI(battle);

  // Flying, so a spread Ground move is not refused for hitting a friend
  const caster = fielded(battle, teamA, [Types.Normal, Types.Flying]);
  const mate = fielded(battle, teamA, [Types.Water, Types.Flying]);
  const foe = fielded(battle, teamB, [Types.Grass]);
  const far = fielded(battle, teamB, [Types.Fire, Types.Flying]);
  const units = [caster, mate, foe, far];

  for (const move of moves.slice(0, DEFAULT_MOVE_SLOTS)) {
    caster.addMove(move);
  }
  for (const move of moves.slice(DEFAULT_MOVE_SLOTS)) {
    mate.addMove(move);
  }
  hold({ caster, mate, foe }[side]);
  for (const unit of units) {
    unit.enter();
  }
  // A guard up, so the moves that walk through one are weighed too
  far.triggerMoveEffect(Moves.Protect, NONE_TARGET, 0);
  // Low enough that a KO is on the table, which some listeners wait for
  foe.setHealth(foe.health / 3);
  caster.setHealth(caster.health / 2);

  const before = answers(battle, units, [caster, mate]);
  const watched = watch(battle);
  const decisions = [chooseMove(battle, caster), chooseMove(battle, mate)];
  const after = answers(battle, units, [caster, mate]);

  for (let index = 0; index < after.length; index++) {
    if (after[index] !== before[index]) {
      watched.changed.push(`${before[index]} -> ${after[index]}`);
    }
  }

  // A tie between equal picks is broken by a draw, once a decision.
  // That is a choice, not a guess, and anything past it is a leak
  let ties = 0;
  for (const choice of decisions) {
    if (choice != null) {
      ties++;
    }
  }
  watched.draws -= ties;
  return watched;
}

createBattle();
registerAbilities();

const ABILITIES = getRegisteredAbilities();
const HELD = [...listItemsByType(ItemTypes.Held), ...listItemsByType(ItemTypes.Berry)];

describe('the AI weighing its moves, whatever is on the field', () => {
  it.each(ABILITIES)('changes nothing around ability %i', (ability) => {
    for (const side of SIDES) {
      for (const moves of FIELDS) {
        const watched = decide(
          (unit) => {
            unit.addAbility(ability);
            // Shown, so the fog lets the estimates see it
            unit.triggerAbility(ability);
          },
          side,
          moves,
        );

        expect({ side, moves, ...watched }).toEqual({
          side,
          moves,
          happened: [],
          draws: 0,
          changed: [],
        });
      }
    }
  });

  it.each(HELD)('changes nothing around item %i', (item: Items) => {
    for (const side of SIDES) {
      for (const moves of FIELDS) {
        const watched = decide(
          (unit) => {
            unit.addItem(item);
            unit.triggerItem(item);
          },
          side,
          moves,
        );

        expect({ side, moves, ...watched }).toEqual({
          side,
          moves,
          happened: [],
          draws: 0,
          changed: [],
        });
      }
    }
  });
});

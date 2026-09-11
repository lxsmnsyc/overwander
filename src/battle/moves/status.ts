import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

export const STATUS_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.PoisonPowder]: Statuses.Poisoned,
  [Moves.PoisonGas]: Statuses.Poisoned,
  [Moves.LovelyKiss]: Statuses.Sleeping,
  [Moves.SleepPowder]: Statuses.Sleeping,
  [Moves.Toxic]: Statuses.BadlyPoisoned,
  [Moves.StunSpore]: Statuses.Paralyzed,
  [Moves.Supersonic]: Statuses.Confused,
  [Moves.ThunderWave]: Statuses.Paralyzed,
  [Moves.Glare]: Statuses.Paralyzed,
  [Moves.Sing]: Statuses.Sleeping,
  [Moves.ConfuseRay]: Statuses.Confused,
  [Moves.Spore]: Statuses.Sleeping,
  [Moves.Hypnosis]: Statuses.Sleeping,
  [Moves.SweetKiss]: Statuses.Confused,
  [Moves.Attract]: Statuses.Infatuated,
  [Moves.Swagger]: Statuses.Confused,
  [Moves.WillOWisp]: Statuses.Burned,
  [Moves.GrassWhistle]: Statuses.Sleeping,
  [Moves.TeeterDance]: Statuses.Confused,
  [Moves.Flatter]: Statuses.Confused,
  [Moves.Taunt]: Statuses.Taunted,
  [Moves.Torment]: Statuses.Tormented,
  [Moves.Yawn]: Statuses.Drowsy,
  [Moves.Imprison]: Statuses.Imprisoned,
  [Moves.HelpingHand]: Statuses.Helped,
};

export const SELF_STATUS_MOVES: { [key in Moves]?: Statuses } = {
  [Moves.FocusEnergy]: Statuses.FocusEnergy,
  [Moves.Minimize]: Statuses.Minimized,
  [Moves.FollowMe]: Statuses.Centered,
  [Moves.MagicCoat]: Statuses.Coated,
  [Moves.Snatch]: Statuses.Snatching,
  [Moves.Grudge]: Statuses.Grudging,
  [Moves.Ingrain]: Statuses.Rooted,
};

const EFFECT_STATUS_MOVES: {
  [key in Moves]?: { status: Statuses; chance: number };
} = {
  [Moves.BodySlam]: { status: Statuses.Paralyzed, chance: 30 },
  [Moves.Ember]: { status: Statuses.Burned, chance: 10 },
  [Moves.Flamethrower]: { status: Statuses.Burned, chance: 10 },
  [Moves.FireBlast]: { status: Statuses.Burned, chance: 10 },
  [Moves.FireSpin]: { status: Statuses.Trapped, chance: 100 },
  [Moves.Wrap]: { status: Statuses.Trapped, chance: 100 },
  [Moves.Clamp]: { status: Statuses.Trapped, chance: 100 },
  [Moves.Bind]: { status: Statuses.Trapped, chance: 100 },
  [Moves.RockSlide]: { status: Statuses.Flinched, chance: 30 },
  [Moves.Bite]: { status: Statuses.Flinched, chance: 30 },
  [Moves.IceBeam]: { status: Statuses.Frozen, chance: 10 },
  [Moves.Blizzard]: { status: Statuses.Frozen, chance: 10 },
  [Moves.Confusion]: { status: Statuses.Confused, chance: 10 },
  [Moves.Psybeam]: { status: Statuses.Confused, chance: 10 },
  [Moves.PoisonSting]: { status: Statuses.Poisoned, chance: 30 },
  [Moves.Twineedle]: { status: Statuses.Poisoned, chance: 20 },
  [Moves.SkyAttack]: { status: Statuses.Flinched, chance: 30 },
  [Moves.HyperFang]: { status: Statuses.Flinched, chance: 10 },
  [Moves.ThunderShock]: { status: Statuses.Paralyzed, chance: 10 },
  [Moves.Thunder]: { status: Statuses.Paralyzed, chance: 30 },
  [Moves.Thunderbolt]: { status: Statuses.Paralyzed, chance: 10 },
  [Moves.Stomp]: { status: Statuses.Flinched, chance: 30 },
  [Moves.Headbutt]: { status: Statuses.Flinched, chance: 30 },
  [Moves.Sludge]: { status: Statuses.Poisoned, chance: 30 },
  [Moves.Lick]: { status: Statuses.Paralyzed, chance: 30 },
  [Moves.BoneClub]: { status: Statuses.Flinched, chance: 10 },
  [Moves.FirePunch]: { status: Statuses.Burned, chance: 10 },
  [Moves.IcePunch]: { status: Statuses.Frozen, chance: 10 },
  [Moves.ThunderPunch]: { status: Statuses.Paralyzed, chance: 10 },
  [Moves.RollingKick]: { status: Statuses.Flinched, chance: 30 },
  [Moves.Smog]: { status: Statuses.Poisoned, chance: 40 },
  [Moves.DizzyPunch]: { status: Statuses.Confused, chance: 20 },
  [Moves.Waterfall]: { status: Statuses.Flinched, chance: 20 },
  [Moves.FlameWheel]: { status: Statuses.Burned, chance: 10 },
  [Moves.SacredFire]: { status: Statuses.Burned, chance: 50 },
  [Moves.PowderSnow]: { status: Statuses.Frozen, chance: 10 },
  [Moves.Spark]: { status: Statuses.Paralyzed, chance: 30 },
  [Moves.DragonBreath]: { status: Statuses.Paralyzed, chance: 30 },
  [Moves.SludgeBomb]: { status: Statuses.Poisoned, chance: 30 },
  [Moves.ZapCannon]: { status: Statuses.Paralyzed, chance: 100 },
  [Moves.DynamicPunch]: { status: Statuses.Confused, chance: 100 },
  [Moves.Twister]: { status: Statuses.Flinched, chance: 20 },
  [Moves.Snore]: { status: Statuses.Flinched, chance: 30 },
  [Moves.Whirlpool]: { status: Statuses.Trapped, chance: 100 },
  [Moves.FakeOut]: { status: Statuses.Flinched, chance: 100 },
  [Moves.HeatWave]: { status: Statuses.Burned, chance: 10 },
  [Moves.BlazeKick]: { status: Statuses.Burned, chance: 10 },
  [Moves.NeedleArm]: { status: Statuses.Flinched, chance: 30 },
  [Moves.Astonish]: { status: Statuses.Flinched, chance: 30 },
  [Moves.Extrasensory]: { status: Statuses.Flinched, chance: 10 },
  [Moves.PoisonFang]: { status: Statuses.BadlyPoisoned, chance: 50 },
  [Moves.SignalBeam]: { status: Statuses.Confused, chance: 10 },
  [Moves.WaterPulse]: { status: Statuses.Confused, chance: 20 },
  [Moves.PoisonTail]: { status: Statuses.Poisoned, chance: 10 },
  [Moves.VoltTackle]: { status: Statuses.Paralyzed, chance: 10 },
  [Moves.Bounce]: { status: Statuses.Paralyzed, chance: 30 },
  [Moves.SandTomb]: { status: Statuses.Trapped, chance: 100 },
};

/**
 * The moves that bind whatever they hit. It is read off the effect
 * table rather than written out again, so a binding move added there
 * is one a Binding Band and a Grip Claw already know about
 */
export const TRAPPING_MOVES = new Set<Moves>(
  Object.entries(EFFECT_STATUS_MOVES)
    .filter(([, effect]) => effect.status === Statuses.Trapped)
    // The table is keyed by the move enum, which comes back as a
    // string from Object.entries
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    .map(([move]) => Number(move) as Moves),
);

/**
 * A stage a move pushes on the side as it lands. `self` is which side:
 * a Metal Claw sharpens its own claws, an Iron Tail dents what it hit
 */
interface AttackStageEffect {
  stage: Stages | Stages[];
  value: number;
  chance: number;
  self?: boolean;
}

const EFFECT_STAGE_MOVES: { [key in Moves]?: AttackStageEffect } = {
  [Moves.Bubble]: { stage: Stages.Speed, value: -1, chance: 10 },
  [Moves.BubbleBeam]: { stage: Stages.Speed, value: -1, chance: 10 },
  [Moves.Psychic]: { stage: Stages.SpecialDefense, value: -1, chance: 10 },
  [Moves.Acid]: { stage: Stages.SpecialDefense, value: -1, chance: 10 },
  [Moves.Constrict]: { stage: Stages.Speed, value: -1, chance: 10 },
  [Moves.AuroraBeam]: { stage: Stages.Attack, value: -1, chance: 10 },
  [Moves.Crunch]: { stage: Stages.Defense, value: -1, chance: 20 },
  [Moves.IronTail]: { stage: Stages.Defense, value: -1, chance: 30 },
  [Moves.RockSmash]: { stage: Stages.Defense, value: -1, chance: 50 },
  [Moves.ShadowBall]: { stage: Stages.SpecialDefense, value: -1, chance: 20 },
  [Moves.MudSlap]: { stage: Stages.Accuracy, value: -1, chance: 100 },
  [Moves.Octazooka]: { stage: Stages.Accuracy, value: -1, chance: 50 },
  [Moves.IcyWind]: { stage: Stages.Speed, value: -1, chance: 100 },
  [Moves.MetalClaw]: { stage: Stages.Attack, value: 1, chance: 10, self: true },
  [Moves.SteelWing]: { stage: Stages.Defense, value: 1, chance: 10, self: true },
  [Moves.RapidSpin]: { stage: Stages.Speed, value: 1, chance: 100, self: true },
  [Moves.LusterPurge]: { stage: Stages.SpecialDefense, value: -1, chance: 50 },
  [Moves.MistBall]: { stage: Stages.SpecialAttack, value: -1, chance: 50 },
  [Moves.CrushClaw]: { stage: Stages.Defense, value: -1, chance: 50 },
  [Moves.RockTomb]: { stage: Stages.Speed, value: -1, chance: 100 },
  [Moves.MudShot]: { stage: Stages.Speed, value: -1, chance: 100 },
  [Moves.MuddyWater]: { stage: Stages.Accuracy, value: -1, chance: 30 },
  [Moves.MeteorMash]: { stage: Stages.Attack, value: 1, chance: 20, self: true },
  // Paid after it lands rather than before: the cost of swinging that
  // hard is taken out of the swinger
  [Moves.Superpower]: {
    stage: [Stages.Attack, Stages.Defense],
    value: -1,
    chance: 100,
    self: true,
  },
  [Moves.Overheat]: { stage: Stages.SpecialAttack, value: -2, chance: 100, self: true },
  [Moves.PsychoBoost]: { stage: Stages.SpecialAttack, value: -2, chance: 100, self: true },
  [Moves.SilverWind]: {
    stage: [
      Stages.Attack,
      Stages.Defense,
      Stages.SpecialAttack,
      Stages.SpecialDefense,
      Stages.Speed,
    ],
    value: 1,
    chance: 10,
    self: true,
  },
  [Moves.AncientPower]: {
    stage: [
      Stages.Attack,
      Stages.Defense,
      Stages.SpecialAttack,
      Stages.SpecialDefense,
      Stages.Speed,
    ],
    value: 1,
    chance: 10,
    self: true,
  },
};

/**
 * Whether the move carries a secondary attack effect (used by e.g.
 * Sheer Force)
 */
export function hasAttackEffect(move: Moves): boolean {
  return (
    EFFECT_STATUS_MOVES[move] != null ||
    EFFECT_STAGE_MOVES[move] != null ||
    // Tri Attack rolls its own three-way status in its move group
    move === Moves.TriAttack
  );
}

/**
 * The moves that flatter somebody into swinging harder while they are
 * too muddled to aim. Aimed at the far side they are a confusion worth
 * the stat they hand over; aimed at the player's own side they are the
 * stat alone, and only for a pokemon that cannot be confused at all
 * https://bulbapedia.bulbagarden.net/wiki/Swagger_(move)
 */
const FLATTERY_MOVES = new Set<Moves>([Moves.Swagger, Moves.Flatter]);

function setupFlatteryMoves(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      !event.usable ||
      !FLATTERY_MOVES.has(event.move) ||
      event.target.type !== MoveTargetType.Unit
    ) {
      return;
    }

    const target = event.target.unit;
    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;
    const muddled =
      target.status[Statuses.Confused] != null ||
      target.checkStatusImmunity(Statuses.Confused, cause);

    // A teammate is worth flattering only where the confusion cannot
    // land; anybody else is worth it only where it can
    event.usable = target.team.alliance === event.source.team.alliance ? muddled : !muddled;
  });
}

function setupUnitStatusMoves(battle: Battle): void {
  // A status move against somebody who already carries the status, or
  // who cannot take it at all, applies nothing: the AI is told so
  // before it picks one rather than after it has spent the cast
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const status = STATUS_MOVES[event.move];

    // Explicit null check: the first Statuses enum member is 0
    if (
      !event.usable ||
      status == null ||
      event.target.type !== MoveTargetType.Unit ||
      // The flattery moves raise a stat as well as muddling the head,
      // so whether they are worth casting is their own question
      FLATTERY_MOVES.has(event.move)
    ) {
      return;
    }

    const target = event.target.unit;

    if (
      target.status[status] != null ||
      target.checkStatusImmunity(status, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      })
    ) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const targetStatus = STATUS_MOVES[event.move];

    // Explicit null check: the first Statuses enum member is 0
    if (targetStatus != null && event.target.type === MoveTargetType.Unit) {
      event.target.unit.addStatus(targetStatus, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }

    const selfStatus = SELF_STATUS_MOVES[event.move];

    if (selfStatus != null) {
      event.source.addStatus(selfStatus, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    event.value =
      EFFECT_STATUS_MOVES[event.parent.move]?.chance ??
      EFFECT_STAGE_MOVES[event.parent.move]?.chance ??
      0;
  });

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    const cause = {
      type: EffectType.Move,
      move: event.parent.move,
      unit: event.parent.source,
    } as const;

    const status = EFFECT_STATUS_MOVES[event.parent.move];

    if (status) {
      event.parent.target.addStatus(status.status, cause);
    }

    const stage = EFFECT_STAGE_MOVES[event.parent.move];

    if (stage) {
      const receiver = stage.self ? event.parent.source : event.parent.target;

      for (const one of Array.isArray(stage.stage) ? stage.stage : [stage.stage]) {
        receiver.addStage(one, stage.value, cause);
      }
    }
  });
}

const TEAM_STATUS_MOVES: { [key in Moves]?: TeamStatuses } = {
  [Moves.Reflect]: TeamStatuses.Reflect,
  [Moves.LightScreen]: TeamStatuses.LightScreen,
  [Moves.Mist]: TeamStatuses.Mist,
  [Moves.Safeguard]: TeamStatuses.Safeguard,
};

function setupTeamStatusMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const targetStatus = TEAM_STATUS_MOVES[event.move];
    // Explicit null check: the first TeamStatuses enum member is 0
    if (targetStatus != null) {
      event.source.team.addStatus(targetStatus, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  // A veil already over the side changes nothing, the way calling up
  // a sky already out does not. The AI is told before it spends the
  // cast rather than after
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const status = TEAM_STATUS_MOVES[event.move];

    // Explicit null check: the first TeamStatuses enum member is 0
    if (event.usable && status != null && event.source.team.status[status] != null) {
      event.usable = false;
    }
  });
}

export function setupStatusMoves(battle: Battle): void {
  setupUnitStatusMoves(battle);
  setupTeamStatusMoves(battle);
  setupFlatteryMoves(battle);
}

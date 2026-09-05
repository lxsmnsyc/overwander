/**
 * Every event the battle bus carries, and what each one is asked or
 * announced for. The shapes they are carried with are beside this
 * file, one module per part of a fight
 */
const enum BattleEvents {
  // Core events
  Initialize = 0,
  Start = 1,
  End = 2,
  Tick = 3,

  // Cast events
  EnableMove = 4,
  DisableMove = 5,

  CheckUnitMoveType = 6,
  CheckUnitMoveImmunity = 7,
  CheckUnitMoveAccuracy = 8,
  CheckUnitMovePP = 9,
  CheckUnitMovePower = 10,
  CheckUnitMovePriority = 11,
  CheckUnitMoveCooldown = 12,
  CheckUnitMoveSteps = 13,

  CheckUnitMoveCastTime = 14,
  CheckUnitMoveChannelTime = 15,
  CheckUnitMoveDuration = 16,
  CheckUnitMoveDelay = 17,

  CheckUnitWeather = 18,
  CheckUnitStat = 19,
  CheckUnitStage = 20,

  CheckUnitEscape = 21,
  CheckUnitStatusImmunity = 22,
  CheckUnitRecoil = 23,

  CheckTypeEffectiveness = 24,

  ResolveUnitStat = 25,

  UnitInterrupt = 26,

  CheckUnitCanCast = 27,

  UnitCast = 28,
  UnitUpdateCast = 29,
  UnitFinishCast = 30,
  UnitStopCast = 31,

  UnitStartCooldown = 32,
  UnitFinishCooldown = 33,
  UnitUpdateCooldown = 34,

  CheckUnitCanChannel = 35,

  UnitChannel = 36,
  UnitUpdateChannel = 37,
  UnitFinishChannel = 38,
  UnitStopChannel = 39,

  UnitTriggerMove = 40,
  UnitTriggerMoveUpdate = 41,
  UnitTriggerMoveEnd = 42,
  UnitTriggerMoveTarget = 43,
  UnitTriggerMoveEffect = 44,

  UnitTriggerMoveResolveAccuracy = 45,
  UnitTriggerMoveRollHit = 46,

  UnitTriggerMoveMissed = 47,
  UnitTriggerMoveFailed = 48,
  UnitTriggerMoveEffectFailed = 49,

  // Damage events
  UnitAttack = 50,
  UnitAttackCheckCriticalRatio = 51,
  UnitAttackResolveCriticalChance = 52,
  UnitAttackResolveCriticalHit = 53,
  UnitAttackResolveDamage = 54,
  UnitAttackResolveStat = 55,
  UnitAttackResolveSTAB = 56,
  UnitAttackResolveCriticalMult = 57,
  UnitAttackResolveEffectiveness = 58,

  CheckUnitAttackEffect = 59,
  CheckUnitAttackEffectChance = 60,
  UnitAttackEffect = 61,

  UnitCure = 62,
  UnitHeal = 63,
  UnitDamage = 64,
  UnitFaints = 65,

  // Unit event
  UnitCreated = 66,

  UnitEntersField = 67,
  UnitLeavesField = 68,

  UnitSetStat = 69,
  UnitSetLevel = 70,
  UnitSetHealth = 71,
  UnitSetMaxHealth = 72,

  UnitAddType = 73,
  UnitRemoveType = 74,

  UnitAddStatus = 75,
  UnitRemoveStatus = 76,
  UnitTriggerStatus = 77,

  UnitAddStage = 78,
  UnitRemoveStage = 79,
  UnitCheckStage = 80,

  UnitAddMove = 81,
  UnitRemoveMove = 82,
  UnitEnableMove = 83,
  UnitDisableMove = 84,

  UnitAddItem = 85,
  UnitRemoveItem = 86,
  UnitTriggerItem = 87,
  UnitEnableItem = 88,
  UnitDisableItem = 89,

  UnitAddAbility = 90,
  UnitRemoveAbility = 91,
  UnitTriggerAbility = 92,
  UnitEnableAbility = 93,
  UnitDisableAbility = 94,

  UnitSwitch = 95,

  UnitSetSpecies = 96,
  UnitSetAppearance = 97,

  // Field events
  SetWeather = 98,
  SetTerrain = 99,

  // Side events
  TeamAddUnit = 100,
  TeamRemoveUnit = 101,
  TeamAddStatus = 102,
  TeamRemoveStatus = 103,
  TeamSetWeather = 104,

  CheckTeamStatusImmunity = 105,

  AllianceAddTeam = 106,
  AllianceRemoveTeam = 107,

  AddAlliance = 108,
  RemoveAlliance = 109,

  // AI events
  CheckUnitAIMoveScore = 110,
  UnitAIChooseMove = 111,
  CheckUnitAIRating = 112,
  CheckTeamAIUnit = 113,

  CheckUnitCanConsumeItem = 114,
  UnitSetGender = 115,
  UnitResetStages = 116,
  /**
   * A real status application was blocked by an immunity; unlike the
   * speculative CheckUnitStatusImmunity, this only fires on actual
   * attempts, so visual cues can hook it safely
   */
  UnitAddStatusFailed = 117,
  CheckUnitItemThreshold = 118,
  CheckUnitDrain = 119,
  /**
   * Whether a stage change may land at all: the verdict every guard
   * against being weakened answers — Clear Body, a Mist, a Guard Spec.
   * A drop is a negative on the add side and a positive on the remove
   * one, which is the same difference the applied events carry.
   *
   * Asked only on real attempts, never speculatively, so an item may
   * be spent answering one
   */
  CheckUnitCanAddStage = 120,
  CheckUnitCanRemoveStage = 121,
  CheckUnitStatusDuration = 122,
  UnitUpdateStatusTimer = 123,
  CheckUnitMoveHits = 124,
  CheckUnitGrounded = 125,
  CheckUnitMoveTargeting = 126,
  UnitSetWeather = 127,
  CheckUnitAbility = 128,
  UnitSetNature = 129,
  UnitSetHeight = 130,
  UnitSetWeight = 131,
  /**
   * Whether damage may land on the unit at all. It is the question a
   * blanket immunity answers — a Boss shrugging off everything
   * indirect, Magic Guard, an ability that ignores its weather's chip
   * — asked once before the damage is emitted, so an immunity is a
   * verdict rather than a race to disable the event first
   */
  CheckUnitCanDamage = 132,
  /**
   * Whether a move the AI is considering would actually do something
   * against a given target. It is asked before the move is scored, so
   * a move whose prerequisite is unmet (Dream Eater on somebody awake,
   * Counter with nothing to return) is never picked at all rather than
   * picked and then failed on trigger
   */
  CheckUnitAIMoveUsable = 133,
  /**
   * How many points have been spent on one of the unit's moves — what
   * a PP Up bought. It is set when the unit is fielded, from the
   * record it was copied out of, and read by `CheckUnitMovePP` to say
   * how quickly the move comes back
   */
  UnitSetMovePoints = 134,

  /**
   * How long a team status holds, the team-wide twin of
   * CheckUnitStatusDuration: it is what a Light Clay lengthens a
   * screen by
   */
  CheckTeamStatusDuration = 135,

  /**
   * How long weather a unit calls up stays out. It is what the
   * weather rocks lengthen
   */
  CheckUnitWeatherDuration = 136,

  /**
   * What a unit weighs right now, in kilograms. The stored weight is
   * the individual's own; this is what anything reading it sees, so a
   * Float Stone lightens its holder without touching the record
   */
  CheckUnitWeight = 137,

  /**
   * Whether a blow counts as contact against the one it lands on. It
   * is what every reaction to being touched reads — a Rocky Helmet, a
   * Static, a Sticky Barb — so a pair of Protective Pads answers all
   * of them once
   */
  CheckUnitMoveContact = 138,

  /**
   * A fainted unit put back on its feet. The only thing that does it
   * is a Sacred Ash, and it is an event rather than a flag flipped
   * from outside so the field can be told: `value` is the health it
   * comes back on
   */
  UnitRevives = 139,

  /**
   * How much room the unit has for abilities, items and moves, packed
   * as the catch record packs it. It is fielded from the record rather
   * than decided by the battle
   */
  UnitSetSlots = 140,
  /**
   * Whether health may go back on the unit at all. The mirror of
   * `CheckUnitCanDamage`, asked once before the heal is emitted: a
   * raid boss whose pool is the fight's timer answers no, and so would
   * a Heal Block or a wound that will not close
   */
  CheckUnitCanHeal = 141,
  UnitUpdateSwitch = 142,
  UnitFinishSwitch = 143,
  /**
   * Whether the unit may use a held item at all. The item mirror of
   * `CheckUnitAbility`: the grip is the baseline, and a suppressor
   * (a Frisk that pocketed it) answers no without touching the record
   */
  CheckUnitItem = 144,
  /**
   * Whether a move that has come round fires at all. It is asked once
   * when the move is triggered, before the delay it spends in the
   * air, so a condition the move itself carries (asleep for a Snore,
   * a guard already spent) refuses the whole cast rather than racing
   * to disable the event
   */
  CheckUnitTriggerMove = 145,
  /**
   * Whether the move resolves on the one in front of it. It is asked
   * once per target a move reached, after the accuracy roll and
   * before the effect, which is where a prerequisite about the target
   * belongs: Dream Eater against somebody awake, a parcel that turned
   * out to be food
   */
  CheckUnitTriggerMoveEffect = 146,
  /**
   * Whether the move goes ahead against the one it has just been
   * pointed at. It is asked once per target the move reached, before
   * the immunity and the accuracy roll, which is where a refusal
   * about **this pairing** belongs: whatever the move would have done
   * to somebody else it still does
   */
  CheckUnitTriggerMoveTarget = 147,
}

export default BattleEvents;

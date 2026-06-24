export const enum Types {
  Unknown = 0,
  Normal = 1,
  Fighting = 2,
  Flying = 3,
  Poison = 4,
  Ground = 5,
  Rock = 6,
  Bug = 7,
  Ghost = 8,
  Steel = 9,
  Fire = 10,
  Water = 11,
  Grass = 12,
  Electric = 13,
  Psychic = 14,
  Ice = 15,
  Dragon = 16,
  Dark = 17,
  Fairy = 18,
  Stellar = 19,
}

export const enum TypeEffectiveness {
  Effective = 0,
  Resistant = 1,
  Immune = 2,
}

export const TYPE_EFFECTIVENESS_FACTOR: Record<TypeEffectiveness, number> = {
  [TypeEffectiveness.Effective]: 2.0,
  [TypeEffectiveness.Resistant]: 0.5,
  [TypeEffectiveness.Immune]: 0,
};

export const TYPE_EFFECTIVENESS: Record<
  Types,
  { [type in Types]?: TypeEffectiveness }
> = {
  [Types.Normal]: {
    [Types.Ghost]: TypeEffectiveness.Immune,

    [Types.Rock]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
  },
  [Types.Fighting]: {
    [Types.Ghost]: TypeEffectiveness.Immune,

    [Types.Normal]: TypeEffectiveness.Effective,
    [Types.Ice]: TypeEffectiveness.Effective,
    [Types.Rock]: TypeEffectiveness.Effective,
    [Types.Dark]: TypeEffectiveness.Effective,
    [Types.Steel]: TypeEffectiveness.Effective,

    [Types.Flying]: TypeEffectiveness.Resistant,
    [Types.Psychic]: TypeEffectiveness.Resistant,
    [Types.Fairy]: TypeEffectiveness.Resistant,
  },
  [Types.Flying]: {
    [Types.Fighting]: TypeEffectiveness.Effective,
    [Types.Flying]: TypeEffectiveness.Effective,
    [Types.Bug]: TypeEffectiveness.Effective,

    [Types.Rock]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Electric]: TypeEffectiveness.Resistant,
  },
  [Types.Poison]: {
    [Types.Steel]: TypeEffectiveness.Immune,

    [Types.Grass]: TypeEffectiveness.Effective,
    [Types.Fairy]: TypeEffectiveness.Effective,

    [Types.Poison]: TypeEffectiveness.Resistant,
    [Types.Ground]: TypeEffectiveness.Resistant,
    [Types.Rock]: TypeEffectiveness.Resistant,
    [Types.Ghost]: TypeEffectiveness.Resistant,
  },
  [Types.Ground]: {
    [Types.Flying]: TypeEffectiveness.Immune,

    [Types.Poison]: TypeEffectiveness.Effective,
    [Types.Electric]: TypeEffectiveness.Effective,
    [Types.Rock]: TypeEffectiveness.Effective,
    [Types.Steel]: TypeEffectiveness.Effective,
    [Types.Fire]: TypeEffectiveness.Effective,

    [Types.Bug]: TypeEffectiveness.Resistant,
    [Types.Grass]: TypeEffectiveness.Resistant,
  },
  [Types.Rock]: {
    [Types.Flying]: TypeEffectiveness.Effective,
    [Types.Bug]: TypeEffectiveness.Effective,
    [Types.Fire]: TypeEffectiveness.Effective,
    [Types.Ice]: TypeEffectiveness.Effective,

    [Types.Fighting]: TypeEffectiveness.Resistant,
    [Types.Ground]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
  },
  [Types.Bug]: {
    [Types.Psychic]: TypeEffectiveness.Effective,
    [Types.Fairy]: TypeEffectiveness.Effective,
    [Types.Dark]: TypeEffectiveness.Effective,

    [Types.Fighting]: TypeEffectiveness.Resistant,
    [Types.Flying]: TypeEffectiveness.Resistant,
    [Types.Poison]: TypeEffectiveness.Resistant,
    [Types.Ghost]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
  },
  [Types.Ghost]: {
    [Types.Normal]: TypeEffectiveness.Immune,

    [Types.Ghost]: TypeEffectiveness.Effective,
    [Types.Psychic]: TypeEffectiveness.Effective,

    [Types.Dark]: TypeEffectiveness.Resistant,
  },
  [Types.Steel]: {
    [Types.Rock]: TypeEffectiveness.Effective,
    [Types.Ice]: TypeEffectiveness.Effective,
    [Types.Fairy]: TypeEffectiveness.Effective,

    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
    [Types.Water]: TypeEffectiveness.Resistant,
    [Types.Electric]: TypeEffectiveness.Resistant,
  },
  [Types.Fire]: {
    [Types.Bug]: TypeEffectiveness.Effective,
    [Types.Steel]: TypeEffectiveness.Effective,
    [Types.Grass]: TypeEffectiveness.Effective,
    [Types.Ice]: TypeEffectiveness.Effective,

    [Types.Rock]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
    [Types.Water]: TypeEffectiveness.Resistant,
    [Types.Dragon]: TypeEffectiveness.Resistant,
  },
  [Types.Water]: {
    [Types.Rock]: TypeEffectiveness.Effective,
    [Types.Ground]: TypeEffectiveness.Effective,
    [Types.Fire]: TypeEffectiveness.Effective,

    [Types.Water]: TypeEffectiveness.Resistant,
    [Types.Grass]: TypeEffectiveness.Resistant,
    [Types.Dragon]: TypeEffectiveness.Resistant,
  },
  [Types.Grass]: {
    [Types.Rock]: TypeEffectiveness.Effective,
    [Types.Ground]: TypeEffectiveness.Effective,
    [Types.Water]: TypeEffectiveness.Effective,

    [Types.Flying]: TypeEffectiveness.Resistant,
    [Types.Poison]: TypeEffectiveness.Resistant,
    [Types.Bug]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
    [Types.Grass]: TypeEffectiveness.Resistant,
    [Types.Dragon]: TypeEffectiveness.Resistant,
  },
  [Types.Electric]: {
    [Types.Ground]: TypeEffectiveness.Immune,

    [Types.Flying]: TypeEffectiveness.Effective,
    [Types.Water]: TypeEffectiveness.Effective,

    [Types.Grass]: TypeEffectiveness.Resistant,
    [Types.Electric]: TypeEffectiveness.Resistant,
    [Types.Dragon]: TypeEffectiveness.Resistant,
  },
  [Types.Psychic]: {
    [Types.Dark]: TypeEffectiveness.Immune,

    [Types.Fighting]: TypeEffectiveness.Effective,
    [Types.Ghost]: TypeEffectiveness.Effective,

    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Fairy]: TypeEffectiveness.Resistant,
  },
  [Types.Ice]: {
    [Types.Flying]: TypeEffectiveness.Effective,
    [Types.Ground]: TypeEffectiveness.Effective,
    [Types.Grass]: TypeEffectiveness.Effective,
    [Types.Dragon]: TypeEffectiveness.Effective,

    [Types.Steel]: TypeEffectiveness.Resistant,
    [Types.Fire]: TypeEffectiveness.Resistant,
    [Types.Water]: TypeEffectiveness.Resistant,
    [Types.Ice]: TypeEffectiveness.Resistant,
  },
  [Types.Dragon]: {
    [Types.Fairy]: TypeEffectiveness.Immune,

    [Types.Dragon]: TypeEffectiveness.Effective,

    [Types.Steel]: TypeEffectiveness.Resistant,
  },
  [Types.Dark]: {
    [Types.Psychic]: TypeEffectiveness.Effective,
    [Types.Ghost]: TypeEffectiveness.Effective,

    [Types.Fighting]: TypeEffectiveness.Effective,
    [Types.Dragon]: TypeEffectiveness.Effective,
    [Types.Fairy]: TypeEffectiveness.Effective,
  },
  [Types.Fairy]: {
    [Types.Fighting]: TypeEffectiveness.Effective,
    [Types.Dragon]: TypeEffectiveness.Effective,
    [Types.Dark]: TypeEffectiveness.Effective,

    [Types.Poison]: TypeEffectiveness.Resistant,
    [Types.Ghost]: TypeEffectiveness.Resistant,
    [Types.Steel]: TypeEffectiveness.Resistant,
  },
  [Types.Stellar]: {},
  [Types.Unknown]: {},
};

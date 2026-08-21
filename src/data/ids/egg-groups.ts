export const enum EggGroups {
  Monster = 0,
  Water1 = 1,
  Bug = 2,
  Flying = 3,
  Field = 4,
  Fairy = 5,
  Grass = 6,
  HumanLike = 7,
  Water3 = 8,
  Mineral = 9,
  Amorphous = 10,
  Water2 = 11,
  Ditto = 12,
  Dragon = 13,
  NoEggsDiscovered = 14,
}

/**
 * What each group is called. Two of them read oddly as an enum member
 * and plainly as a word: the three water groups are numbered in the
 * games, and a species with nothing to breed with is "undiscovered"
 */
export const EGG_GROUP_NAMES: Record<EggGroups, string> = {
  [EggGroups.Monster]: 'Monster',
  [EggGroups.Water1]: 'Water 1',
  [EggGroups.Bug]: 'Bug',
  [EggGroups.Flying]: 'Flying',
  [EggGroups.Field]: 'Field',
  [EggGroups.Fairy]: 'Fairy',
  [EggGroups.Grass]: 'Grass',
  [EggGroups.HumanLike]: 'Human-Like',
  [EggGroups.Water3]: 'Water 3',
  [EggGroups.Mineral]: 'Mineral',
  [EggGroups.Amorphous]: 'Amorphous',
  [EggGroups.Water2]: 'Water 2',
  [EggGroups.Ditto]: 'Ditto',
  [EggGroups.Dragon]: 'Dragon',
  [EggGroups.NoEggsDiscovered]: 'Undiscovered',
};

export default EggGroups;

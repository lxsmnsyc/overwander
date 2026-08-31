import type { CommandParameter, CommandVocabulary } from '../../../core/command';
import {
  GENDER_KEYS,
  SLOT_KEYS,
  STAT_KEYS,
  abilityEntries,
  ballEntries,
  biomeEntries,
  itemEntries,
  moveEntries,
  nameList,
  natureEntries,
  speciesEntries,
  weatherEntries,
} from './names';

/**
 * What the bar can be asked, and what each of those takes.
 *
 * It is read by the suggestion list and nothing else: the server
 * checks what it is handed on its own authority, so a command missing
 * from here would be refused rather than obeyed
 */

/**
 * The word that means whoever is typing. Written out rather than left
 * to be guessed, since it is the value nearly every line wants and the
 * only one there is a list of
 */
const SELF = 'self';

/** The word that puts a gift on every shelf rather than on one */
export const EVERYBODY = 'everybody';

/** What a pokemon can be asked to come as */
export const SHINY = 'shiny';
export const SHADOW = 'shadow';

export const TELEPORT = 'tp';
export const LOCATE = 'locate';
export const GIFT_ITEM = 'gift-item';
export const GIFT_CATCH = 'gift-catch';
export const GIFT_ENCOUNTER = 'gift-encounter';
export const BAN = 'ban';
export const UNBAN = 'unban';
export const VIEW = 'view';

/** Who a command acts on, named however staff have them */
const player: CommandParameter = {
  name: 'player',
  hint: 'self, a nickname, an address or a friend code',
  values: () => [SELF],
};

/** Who a gift is for, which may be nobody in particular */
const recipient: CommandParameter = {
  name: 'to',
  hint: 'A trainer, or everybody',
  values: () => [SELF, EVERYBODY],
};

const reason: CommandParameter = {
  name: 'reason',
  hint: 'The only line on the card saying where it came from',
};

const expires: CommandParameter = {
  name: 'expires',
  hint: 'The last day it can be taken, as 2026-12-31',
};

/**
 * Everything a hand-written pokemon may be pinned to. What is left
 * out is whatever the roll produced, which is what every gift the
 * game gives itself does
 */
const POKEMON_PARAMETERS: CommandParameter[] = [
  { name: 'species', hint: 'What it is', values: () => nameList(speciesEntries()) },
  { name: 'level', hint: 'What it comes at, 1 to 100' },
  { name: 'is', hint: 'shiny or shadow', values: () => [SHINY, SHADOW], repeatable: true },
  {
    name: 'nature',
    hint: 'Which one, rather than a rolled one',
    values: () => nameList(natureEntries()),
  },
  {
    name: 'gender',
    hint: 'Which one, rather than a rolled one',
    values: () => nameList(GENDER_KEYS),
  },
  {
    name: 'iv',
    hint: 'One value, as iv:speed:31',
    values: () => nameList(STAT_KEYS),
    repeatable: true,
    chained: true,
  },
  {
    name: 'slots',
    hint: 'How much room it walks in with, as slots:move:4',
    values: () => nameList(SLOT_KEYS),
    repeatable: true,
    chained: true,
  },
  {
    name: 'move',
    hint: 'One it walks in knowing',
    values: () => nameList(moveEntries()),
    repeatable: true,
  },
  {
    name: 'ability',
    hint: 'One it walks in with',
    values: () => nameList(abilityEntries()),
    repeatable: true,
  },
  {
    name: 'item',
    hint: 'One it walks in holding',
    values: () => nameList(itemEntries()),
    repeatable: true,
  },
  { name: 'location', hint: 'What the record says the place was called' },
];

const COMMAND_VOCABULARY: CommandVocabulary = {
  commands: [
    {
      name: TELEPORT,
      hint: 'Move a player',
      parameters: [
        player,
        { name: 'x', hint: 'Chunk across, drawn when left out' },
        { name: 'y', hint: 'Chunk down, drawn when left out' },
        { name: 'to', hint: 'Stand where somebody else is', values: () => [SELF] },
      ],
    },
    {
      name: LOCATE,
      hint: 'Find the nearest chunk answering to something',
      parameters: [
        { name: 'species', hint: 'Where one can be met', values: () => nameList(speciesEntries()) },
        { name: 'biome', hint: 'Where the ground is this', values: () => nameList(biomeEntries()) },
        {
          name: 'weather',
          hint: 'Where the sky is this',
          values: () => nameList(weatherEntries()),
        },
      ],
    },
    {
      name: GIFT_ITEM,
      hint: 'Put an item on a shelf',
      parameters: [
        recipient,
        { name: 'item', hint: 'What it is', values: () => nameList(itemEntries()) },
        { name: 'amount', hint: 'How many, one when left out' },
        reason,
        expires,
      ],
    },
    {
      name: GIFT_CATCH,
      hint: 'Put a finished pokemon on a shelf',
      parameters: [
        recipient,
        ...POKEMON_PARAMETERS,
        { name: 'ball', hint: 'What it arrives in', values: () => nameList(ballEntries()) },
        { name: 'trainer', hint: 'Who had it before them' },
        reason,
        expires,
      ],
    },
    {
      name: GIFT_ENCOUNTER,
      hint: 'Put a meeting on a shelf, to be thrown at',
      parameters: [recipient, ...POKEMON_PARAMETERS, reason, expires],
    },
    {
      name: BAN,
      hint: 'Shut a player out of the game',
      parameters: [
        player,
        { name: 'reason', hint: 'What they are told, and what an appeal answers' },
      ],
    },
    { name: UNBAN, hint: 'Let a player back in', parameters: [player] },
    { name: VIEW, hint: "Open somebody's profile", parameters: [player] },
  ],
};

export default COMMAND_VOCABULARY;

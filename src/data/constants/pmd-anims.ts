/**
 * The animations a PMD sprite archive is worth keeping.
 *
 * An archive holds every animation the sprite was ever drawn for, and
 * a sheet holding all of them is a sheet of pixels the game never
 * draws. This is the list the packer tool shipped with — everything a
 * move might ask a pokemon to do — and the processor page offers it as
 * the starting point rather than the law: the box it fills is editable.
 *
 * It lives outside the processor itself because both sides need it and
 * only one of them runs on the server.
 */
const DEFAULT_PMD_ANIMS = [
  'Idle',
  'Sleep',
  'Hurt',
  'Attack',
  'Charge',
  'Shoot',
  'Double',
  'Hop',
  'Rotate',
  'Walk',
  'Swing',
  'SpAttack',
  'Shock',
  'QuickStrike',
  'Strike',
  'Jab',
  'Punch',
  'Kick',
  'MultiStrike',
  'Slam',
  'Withdraw',
  'Twirl',
  'RearUp',
  'Shake',
  'Lick',
  'Dance',
  'Uppercut',
  'Gas',
  'Stomp',
  'Emit',
  'Swell',
  'Ricochet',
  'MultiScratch',
  'Bite',
  'Slice',
];

export default DEFAULT_PMD_ANIMS;

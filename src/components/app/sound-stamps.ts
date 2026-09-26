// Written by scripts/sound-stamps.ts; run it rather than editing this

/** The digest each sound under `public/sounds/effects` is asked for with */
const SOUND_STAMPS: Readonly<Partial<Record<string, string>>> = {
  ability_learned: 'a73abb3a',
  ball_shake: 'ebdd23cd',
  ball_throw: '2d27cd79',
  battle_draw: '2a46b1fe',
  battle_lost: 'de30ae49',
  battle_start: 'e7baab58',
  battle_won: 'b1624162',
  catch_failed: 'b2599b42',
  catch_success: 'b6fe08a8',
  dex_entry: '4b680f38',
  egg_hatch: 'fe0a386f',
  evolution: '11f7a4ed',
  fossil_revive: 'bb320981',
  honey_lather: '7bb75181',
  item_slot: 'cc392987',
  legendary_appears: '171b807c',
  level_up: 'd1377b61',
  move_learned: 'f1264179',
  mythical_appears: 'd536d0cf',
  portal_cross: '1a8a105d',
  prized_item: 'ea932303',
  purified: '0c2ed6c8',
  quest_complete: '3ee4fdca',
  shiny_sparkle: 'd802bea3',
  shop_buy: '7fb23561',
  shop_sell: 'b5bca552',
  signature_learned: '39b7b850',
  special_item: '8feddba8',
  trade_complete: '69d99b2e',
  trainer_beaten: '5ec243e4',
};

export default SOUND_STAMPS;

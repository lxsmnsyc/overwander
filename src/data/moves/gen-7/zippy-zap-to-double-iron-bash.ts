import { Types } from '../../constants/types';
import { MoveAffects, MoveCategories, MoveFlags, MoveTargets, Moves } from '../../ids/moves';
import { SpriteAnim } from '../../ids/sprite-anims';
import { PROJECTILE_DELAY, registerMove } from '../__create';

/** From Zippy Zap to Double Iron Bash: the partner moves, and Melmetal's */
export default function registerZippyZapToDoubleIronBash(): void {
  registerMove(Moves.ZippyZap, {
    name: 'Zippy Zap',
    description:
      "Winds up far faster than an ordinary move, and raises the user's evasion a stage.",
    type: Types.Electric,
    category: MoveCategories.Physical,
    power: 80,
    pp: 10,
    accuracy: 100,
    priority: 2,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.QuickStrike, SpriteAnim.Shock, SpriteAnim.Attack],
  });
  registerMove(Moves.SplishySplash, {
    name: 'Splishy Splash',
    description: 'Hits everything opposite. 30% to paralyse.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 90,
    pp: 15,
    accuracy: 100,
    target: MoveTargets.None,
    affects: MoveAffects.Unit | MoveAffects.Enemy,
    flags: 0,
    cast: [SpriteAnim.Emit, SpriteAnim.Swell, SpriteAnim.Charge],
  });
  registerMove(Moves.FloatyFall, {
    name: 'Floaty Fall',
    description: '30% to make the target flinch.',
    type: Types.Flying,
    category: MoveCategories.Physical,
    power: 90,
    pp: 15,
    accuracy: 95,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Hop, SpriteAnim.Slam, SpriteAnim.Attack],
  });
  registerMove(Moves.PikaPapow, {
    name: 'Pika Papow',
    description:
      'The fonder of you the user is, the harder it hits, up to 102 power. Never misses.',
    type: Types.Electric,
    category: MoveCategories.Special,
    pp: 20,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.SpAttack, SpriteAnim.Charge],
  });
  registerMove(Moves.BouncyBubble, {
    name: 'Bouncy Bubble',
    description: 'Heals the user for all the damage dealt.',
    type: Types.Water,
    category: MoveCategories.Special,
    power: 60,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    delay: PROJECTILE_DELAY,
    cast: [SpriteAnim.Shoot, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.BuzzyBuzz, {
    name: 'Buzzy Buzz',
    description: 'Always paralyses.',
    type: Types.Electric,
    category: MoveCategories.Special,
    power: 60,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: 0,
    cast: [SpriteAnim.Shock, SpriteAnim.Emit, SpriteAnim.Charge],
  });
  registerMove(Moves.SizzlySlide, {
    name: 'Sizzly Slide',
    description: 'Always burns.',
    type: Types.Fire,
    category: MoveCategories.Physical,
    power: 60,
    pp: 20,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Strike, SpriteAnim.Attack],
  });
  registerMove(Moves.VeeveeVolley, {
    name: 'Veevee Volley',
    description:
      'The fonder of you the user is, the harder it hits, up to 102 power. Never misses.',
    type: Types.Normal,
    category: MoveCategories.Physical,
    pp: 20,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Slam, SpriteAnim.Hop, SpriteAnim.Attack],
  });
  registerMove(Moves.DoubleIronBash, {
    name: 'Double Iron Bash',
    description: 'Strikes twice. 30% to make the target flinch each time.',
    type: Types.Steel,
    category: MoveCategories.Physical,
    power: 60,
    pp: 5,
    accuracy: 100,
    target: MoveTargets.Unit,
    flags: MoveFlags.Contact,
    cast: [SpriteAnim.Punch, SpriteAnim.MultiStrike, SpriteAnim.Attack],
  });
}

import { type MoveVisualBuilder, cue } from './moves/__shapes';
import Abilities from '../../data/ids/abilities';

/**
 * What an ability looks like when it fires.
 *
 * An ability is the quietest thing in a fight: it has no cast, no
 * flight and no line in the log, and the only sign of one is a number
 * that came out different. The engine already says when one goes off —
 * every ability that does anything worth seeing calls
 * `triggerAbility` for exactly this — so the field can answer it.
 *
 * **Every** trigger draws something, which is why the default is
 * small: a sparkle over the holder says "that was the ability" without
 * claiming to say which. The table below is only for the ones where a
 * sheet says something truer — sparks for the one that paralyzes,
 * hearts for the one that infatuates, a menace for the ones that
 * weigh on the other side.
 */

/** What an ability with nothing of its own shows: it fired, and no more. */
const DEFAULT_CUE = 'effects/211';

/**
 * How big any of them are drawn, in pixels before the field's scale.
 * Smaller than a status, because an ability is an aside
 */
const CUE_SIZE = 26;

const CUES: Partial<Record<Abilities, string>> = {
  // Contact ailments: what the toucher catches
  [Abilities.Static]: 'effects/198',
  [Abilities.FlameBody]: 'effects/205',
  [Abilities.PoisonPoint]: 'effects/22',
  [Abilities.PoisonTouch]: 'effects/22',
  [Abilities.LiquidOoze]: 'effects/22',
  [Abilities.Stench]: 'effects/22',
  [Abilities.EffectSpore]: 'effects/209',
  [Abilities.CuteCharm]: 'effects/217',
  // Two orbs pulsing together, which is the ability itself
  [Abilities.Synchronize]: 'effects/101',
  // The same look the move of that name is drawn with
  [Abilities.Intimidate]: 'effects/77',

  // Something rose: the bars going up
  [Abilities.AngerPoint]: 'effects/202',
  [Abilities.Moxie]: 'effects/202',
  [Abilities.Justified]: 'effects/202',
  [Abilities.Defiant]: 'effects/202',
  [Abilities.Competitive]: 'effects/202',
  [Abilities.Download]: 'effects/202',

  // Something got faster
  [Abilities.Rattled]: 'effects/71',
  [Abilities.Steadfast]: 'effects/71',
  [Abilities.Unburden]: 'effects/71',
  [Abilities.WeakArmor]: 'effects/71',
  [Abilities.RunAway]: 'effects/71',

  // Something mended
  [Abilities.Regenerator]: 'effects/183',
  [Abilities.RainDish]: 'effects/183',
  [Abilities.IceBody]: 'effects/183',
  [Abilities.DrySkin]: 'effects/183',
  [Abilities.ShedSkin]: 'effects/183',
  [Abilities.NaturalCure]: 'effects/183',
  [Abilities.Healer]: 'effects/183',

  // Something was noticed before it happened
  [Abilities.Anticipation]: 'effects/66',
  [Abilities.Forewarn]: 'effects/66',
  [Abilities.Frisk]: 'effects/66',
  [Abilities.Trace]: 'effects/66',
  // Something was found
  [Abilities.Pickup]: 'effects/69',
  [Abilities.Harvest]: 'effects/69',

  // Something weighs on the other side of the field
  [Abilities.Pressure]: 'effects/220',
  [Abilities.Unnerve]: 'effects/220',
  [Abilities.NeutralizingGas]: 'effects/220',
  [Abilities.MoldBreaker]: 'effects/220',
  [Abilities.Boss]: 'effects/220',

  // Fire and lightning, drawn as themselves
  [Abilities.FlashFire]: 'effects/206',
  [Abilities.SolarPower]: 'effects/250',
  [Abilities.LightningRod]: 'effects/204',
  [Abilities.Aftermath]: 'effects/196',
};

export default function abilityCueFor(ability: Abilities): MoveVisualBuilder {
  return cue(CUES[ability] ?? DEFAULT_CUE, { size: CUE_SIZE, lift: true });
}

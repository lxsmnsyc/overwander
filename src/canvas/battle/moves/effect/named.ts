import { Moves } from '../../../../data/ids/moves';
import { Types } from '../../../../data/constants/types';
import type { EffectShape } from './shapes';

/**
 * Which shape a type reaches for when the move has not asked for one.
 * A special move's picture is mostly its element, and this is what
 * each element does when it arrives
 */
export const BY_TYPE: Partial<Record<Types, EffectShape>> = {
  [Types.Fire]: 'Flame',
  [Types.Water]: 'Splash',
  [Types.Ice]: 'Frost',
  [Types.Electric]: 'Zap',
  [Types.Grass]: 'Leafy',
  [Types.Poison]: 'Haze',
  [Types.Ground]: 'Quake',
  [Types.Rock]: 'Impact',
  [Types.Flying]: 'Leafy',
};

/**
 * What each move looks like where the shape should say the **name**.
 *
 * The rules underneath answer with the move's element and category,
 * which is honest but wide: every Normal physical move landed as the
 * same burst, so Bite, Scratch and Wrap were one picture in three
 * sizes. A player watching should be able to say which move that was,
 * so anything with a shape of its own is named here — teeth close,
 * claws rake, coils tighten, sound washes over, a drill turns.
 *
 * Moves that share a shape are still told apart by what the shape is
 * given: Scratch rakes three thin marks and Slash one heavy one,
 * because the count and the width come off the move's power
 */
export const NAMED: Partial<Record<Moves, EffectShape>> = {
  // Beams: the picture is the line between the two of them
  [Moves.HyperBeam]: 'Beam',
  [Moves.SolarBeam]: 'Beam',
  [Moves.Psybeam]: 'Beam',
  [Moves.IceBeam]: 'Beam',
  [Moves.AuroraBeam]: 'Beam',
  [Moves.Flamethrower]: 'Beam',
  [Moves.HydroPump]: 'Beam',

  // Not beams. A bubble move is a spray of them in the mainline, and
  // this was drawing a solid jet after a thrown orb — two pictures,
  // neither of them the move
  [Moves.Bubble]: 'Bubbles',
  [Moves.BubbleBeam]: 'Bubbles',

  // Teeth
  [Moves.Bite]: 'Jaws',
  [Moves.HyperFang]: 'Jaws',
  [Moves.SuperFang]: 'Jaws',
  [Moves.Crabhammer]: 'Jaws',
  [Moves.ViceGrip]: 'Jaws',
  [Moves.Clamp]: 'Jaws',
  [Moves.Guillotine]: 'Jaws',

  // Claws and blades, which differ by how many marks and how big
  [Moves.Scratch]: 'Claw',
  [Moves.FurySwipes]: 'Claw',
  [Moves.Slash]: 'Claw',
  [Moves.Cut]: 'Claw',
  [Moves.RazorWind]: 'Claw',
  [Moves.WingAttack]: 'Claw',

  // Wound round it
  [Moves.Wrap]: 'Coil',
  [Moves.Bind]: 'Coil',
  [Moves.Constrict]: 'Coil',
  [Moves.FireSpin]: 'Coil',
  [Moves.LeechSeed]: 'Coil',

  // Heard rather than felt, without carrying the sound flag: a boom
  // is a shockwave and a face is pulled
  [Moves.SonicBoom]: 'Wave',

  // A point driven in
  [Moves.Peck]: 'Spike',
  [Moves.HornAttack]: 'Spike',
  [Moves.PoisonSting]: 'Spike',
  [Moves.Absorb]: 'Drain',
  [Moves.MegaDrain]: 'Drain',
  [Moves.LeechLife]: 'Drain',
  [Moves.DreamEater]: 'Drain',

  // The same point, turning
  [Moves.HornDrill]: 'Drill',
  [Moves.DrillPeck]: 'Drill',

  // What the mainline draws for these, rather than what their type
  // and category would have picked
  [Moves.Fissure]: 'Chasm',
  [Moves.RazorLeaf]: 'Leaves',
  [Moves.Swift]: 'Stars',
  [Moves.ThunderWave]: 'Wave',
  [Moves.Whirlwind]: 'Blow',
  [Moves.Haze]: 'Haze',
  [Moves.Mist]: 'Haze',

  // Wind
  [Moves.Gust]: 'Swirl',

  // Weather, which arrives over the field rather than on whoever
  // called for it
  [Moves.Sandstorm]: 'Sky',
  [Moves.RainDance]: 'Sky',
  [Moves.SunnyDay]: 'Sky',
  [Moves.Hail]: 'Sky',

  // Something turning in front of its eyes
  [Moves.Hypnosis]: 'Trance',
  [Moves.ConfuseRay]: 'Trance',
  [Moves.Confusion]: 'Trance',
  [Moves.Psywave]: 'Trance',
  [Moves.LovelyKiss]: 'Trance',
  [Moves.Spore]: 'Trance',
  [Moves.SleepPowder]: 'Trance',

  // Rock and earth arriving from above
  [Moves.RockSlide]: 'Rocks',
  [Moves.RockThrow]: 'Rocks',
  [Moves.Barrage]: 'Volley',
  [Moves.SeismicToss]: 'Rocks',

  // The air bending
  [Moves.Psychic]: 'Warp',
  [Moves.NightShade]: 'Warp',
  [Moves.Teleport]: 'Warp',

  // Reaching out and striking with something long
  [Moves.VineWhip]: 'Lash',
  [Moves.Slam]: 'Lash',
  [Moves.Lick]: 'Lash',

  // Thrown and coming back. Nothing else in the game does this, and
  // as a lash it read as a whip rather than as a bone in the air
  [Moves.Bonemerang]: 'Boomerang',

  // Something lobbed that goes off where it lands, rather than debris
  // falling out of the sky onto it
  [Moves.EggBomb]: 'Blast',

  // Steadying itself rather than raising a stat, which is why it is
  // not drawn as one
  [Moves.FocusEnergy]: 'Nerve',

  // The rest: moves whose one picture the data cannot describe
  [Moves.Thunder]: 'Strike',
  [Moves.Explosion]: 'Blast',
  [Moves.SelfDestruct]: 'Blast',
  [Moves.Earthquake]: 'Quake',
  [Moves.Recover]: 'Mend',
  [Moves.Rest]: 'Mend',
  [Moves.SoftBoiled]: 'Mend',
  [Moves.Reflect]: 'Screen',
  [Moves.LightScreen]: 'Screen',
  [Moves.Safeguard]: 'Screen',
  [Moves.Substitute]: 'Ward',
  [Moves.Surf]: 'Splash',
  [Moves.Blizzard]: 'Frost',
  [Moves.FireBlast]: 'Flame',

  // Johto. Most of them are answered by the rules underneath: what is
  // named here is what those rules would have drawn wrong
  [Moves.Aeroblast]: 'Beam',
  [Moves.DragonBreath]: 'Beam',
  [Moves.Twister]: 'Swirl',
  [Moves.RapidSpin]: 'Swirl',
  [Moves.Whirlpool]: 'Coil',
  [Moves.SpiderWeb]: 'Coil',
  [Moves.Megahorn]: 'Spike',
  [Moves.CrossChop]: 'Claw',
  [Moves.IronTail]: 'Lash',
  [Moves.ExtremeSpeed]: 'Strike',
  [Moves.Spark]: 'Zap',
  [Moves.AncientPower]: 'Rocks',
  [Moves.MudSlap]: 'Haze',
  [Moves.Octazooka]: 'Blast',
  [Moves.SludgeBomb]: 'Blast',
  [Moves.Present]: 'Blast',
  [Moves.GigaDrain]: 'Drain',
  [Moves.PainSplit]: 'Drain',
  [Moves.MilkDrink]: 'Mend',
  [Moves.MorningSun]: 'Mend',
  [Moves.Synthesis]: 'Mend',
  [Moves.Moonlight]: 'Mend',
  [Moves.HiddenPower]: 'Dazzle',

  // Ghost: something closing on it rather than something thrown
  [Moves.ShadowBall]: 'Shade',
  [Moves.Nightmare]: 'Shade',
  [Moves.Curse]: 'Shade',
  [Moves.DestinyBond]: 'Shade',
  [Moves.Spite]: 'Shade',

  // What the target is feeling
  [Moves.Attract]: 'Hearts',
  [Moves.SweetKiss]: 'Hearts',

  // Laid on the ground for whatever walks in next
  [Moves.Spikes]: 'Caltrops',

  // Something the pokemon itself did. The stat moves are drawn by
  // what they do to the stat, so what is left here is the three whose
  // picture is the act
  [Moves.BellyDrum]: 'Drum',
  [Moves.BatonPass]: 'Relay',

  // Something turning in front of its eyes, or behind them
  [Moves.MeanLook]: 'Trance',
  [Moves.SleepTalk]: 'Trance',
  [Moves.PsychUp]: 'Trance',
  [Moves.FutureSight]: 'Warp',
  [Moves.Conversion2]: 'Warp',

  // Hoenn. As with Johto, what is named is what the rules underneath
  // would have drawn wrong
  [Moves.Eruption]: 'Spout',
  [Moves.WaterSpout]: 'Spout',
  [Moves.Ingrain]: 'Roots',
  [Moves.FrenzyPlant]: 'Roots',

  // Jets and light, which the type alone would have drawn as a cloud
  [Moves.HydroCannon]: 'Beam',
  [Moves.SignalBeam]: 'Beam',
  [Moves.LusterPurge]: 'Dazzle',
  [Moves.DoomDesire]: 'Dazzle',
  [Moves.Extrasensory]: 'Warp',
  [Moves.PsychoBoost]: 'Blast',
  [Moves.SpitUp]: 'Blast',

  // Fire that is fire wherever it comes from
  [Moves.WillOWisp]: 'Flame',
  [Moves.BlazeKick]: 'Flame',

  // Water spread about rather than shot: a pulse washes over, and a
  // sport wets the whole field
  [Moves.WaterPulse]: 'Wave',
  [Moves.WaterSport]: 'Splash',
  [Moves.MudSport]: 'Splash',
  [Moves.MudShot]: 'Splash',

  // Edges and points
  [Moves.BrickBreak]: 'Claw',
  [Moves.KnockOff]: 'Claw',
  [Moves.CrushClaw]: 'Claw',
  [Moves.DragonClaw]: 'Claw',
  [Moves.NeedleArm]: 'Spike',
  [Moves.PoisonTail]: 'Lash',
  [Moves.MagicalLeaf]: 'Leaves',

  // Arriving faster than it can be seen coming
  [Moves.FakeOut]: 'Strike',
  [Moves.SkyUppercut]: 'Strike',

  // Carried on the air
  [Moves.SilverWind]: 'Blow',

  // Ground closing round it, and rock coming down on it
  [Moves.SandTomb]: 'Coil',
  [Moves.RockTomb]: 'Rocks',

  // Ghost and dark, which close on it rather than strike it
  [Moves.ShadowPunch]: 'Shade',
  [Moves.Astonish]: 'Shade',
  [Moves.Grudge]: 'Shade',
  [Moves.Snatch]: 'Shade',
  [Moves.Torment]: 'Shade',

  // Said to it rather than done to it
  [Moves.Taunt]: 'Wave',
  [Moves.Covet]: 'Hearts',

  // Something turning in front of its eyes
  [Moves.Yawn]: 'Trance',
  [Moves.TeeterDance]: 'Trance',

  // Held between the two of them: an item, an ability, a move
  [Moves.Trick]: 'Warp',
  [Moves.RolePlay]: 'Warp',
  [Moves.SkillSwap]: 'Warp',
  [Moves.Imprison]: 'Warp',

  // Health coming back, whenever it arrives
  [Moves.Swallow]: 'Mend',
  [Moves.SlackOff]: 'Mend',
  [Moves.Refresh]: 'Mend',
  [Moves.Aromatherapy]: 'Mend',
  [Moves.Wish]: 'Mend',

  // Something the pokemon did for itself that moves no stat, so the
  // stat rule above never sees it
  [Moves.HelpingHand]: 'Boost',
  [Moves.Recycle]: 'Boost',
};

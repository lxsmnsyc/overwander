import { Moves } from '../../../data/ids/moves';
import {
  type MoveVisualBuilder,
  charged,
  onField,
  onTarget,
  onUser,
  struckOn,
  thrownAt,
} from './__shapes';
import absorb from './absorb';
import hydroPump from './hydro-pump';
import supersonic from './supersonic';

/**
 * Which moves have a picture of their own, and what it is.
 *
 * A move with nothing here goes off unseen: the caster plays its cast
 * clip, the health bars move, and nothing is drawn in between. That is
 * the whole of what a missing entry costs, which is why this is a
 * table rather than a requirement — a move is playable long before
 * anybody has decided what it looks like.
 *
 * Most entries name a **shape** and a sheet, and the shapes are in
 * [`__shapes.ts`](./__shapes.ts): on whatever it hit, on whoever cast
 * it, or over the whole field. Which sheet is which subject was worked
 * out by watching the frames, and that reading is written down in
 * `scripts/effect-atlas-readings.ts` — so a move claimed here and a
 * sheet described there should agree.
 *
 * A move whose picture is a running order rather than a single sheet
 * gets a file of its own: a jet that has to be continuous, a drain
 * whose whole point is where the energy ends up.
 *
 * The entries are **builders** rather than performances: a performance
 * carries a playhead, and two pokemon using Ember in the same frame
 * are two of them. What they share is underneath, in the sheet cache —
 * the second cast of a move is a clone rather than a download. Each is
 * handed the window the engine is holding this cast in the air for, so
 * a thrown move arrives when it actually lands
 */
const VISUALS: Partial<Record<Moves, MoveVisualBuilder>> = {
  [Moves.Absorb]: absorb,
  [Moves.Acid]: onTarget('effects/63'),
  [Moves.Bind]: onTarget('effects/92'),
  [Moves.Bite]: onTarget('effects/26'),
  [Moves.Bubble]: onTarget('effects/222'),
  [Moves.BubbleBeam]: onTarget('effects/212'),
  [Moves.Counter]: onUser('effects/158'),
  [Moves.Cut]: onTarget('effects/227'),
  [Moves.DizzyPunch]: onTarget('effects/108'),
  [Moves.DoubleSlap]: onTarget('effects/185'),
  [Moves.Earthquake]: onField('effects/120'),
  [Moves.Ember]: onTarget('effects/195'),
  [Moves.Explosion]: onUser('effects/12'),
  [Moves.FireBlast]: onTarget('effects/30'),
  [Moves.FirePunch]: onTarget('effects/4'),
  [Moves.FireSpin]: onTarget('effects/53'),
  [Moves.Flash]: onField('effects/32'),
  [Moves.FurySwipes]: onTarget('effects/24'),
  [Moves.Guillotine]: onTarget('effects/48'),
  [Moves.Gust]: onTarget('effects/225'),
  [Moves.Hail]: onField('effects/218'),
  [Moves.Haze]: onField('effects/103'),
  [Moves.HydroPump]: hydroPump,
  [Moves.Hypnosis]: onTarget('effects/65'),
  [Moves.KarateChop]: onTarget('effects/113'),
  [Moves.Kinesis]: onTarget('effects/132'),
  [Moves.LeechLife]: onTarget('effects/46'),
  [Moves.LeechSeed]: onTarget('effects/122'),
  [Moves.Leer]: onTarget('effects/77'),
  [Moves.LightScreen]: onUser('effects/104'),
  [Moves.LovelyKiss]: onTarget('effects/117'),
  [Moves.MegaDrain]: onTarget('effects/247'),
  [Moves.MegaPunch]: onTarget('effects/243'),
  [Moves.Metronome]: onUser('effects/75'),
  [Moves.Mist]: onField('effects/119'),
  [Moves.NightShade]: onTarget('effects/215'),
  [Moves.PetalDance]: onTarget('effects/33'),
  [Moves.PoisonGas]: onTarget('effects/164'),
  [Moves.PoisonPowder]: onTarget('effects/99'),
  [Moves.Pound]: onTarget('effects/216'),
  [Moves.Psychic]: onTarget('effects/80'),
  [Moves.RainDance]: onField('effects/173'),
  [Moves.RazorWind]: onTarget('effects/240'),
  [Moves.Recover]: onUser('effects/237'),
  [Moves.RockSlide]: onTarget('effects/2'),
  [Moves.RockThrow]: onTarget('effects/199'),
  [Moves.SandAttack]: onTarget('effects/40'),
  [Moves.Scratch]: onTarget('effects/242'),
  [Moves.Screech]: onUser('effects/19'),
  [Moves.SelfDestruct]: onUser('effects/11'),
  [Moves.Sing]: onUser('effects/7'),
  [Moves.Slash]: onTarget('effects/55'),
  [Moves.SleepPowder]: onTarget('effects/100'),
  [Moves.Smog]: onTarget('effects/57'),
  [Moves.SmokeScreen]: onTarget('effects/34'),
  [Moves.SolarBeam]: charged('effects/60', 'effects/129'),
  [Moves.Splash]: onUser('effects/235'),
  [Moves.Spore]: onTarget('effects/47'),
  [Moves.Stomp]: onTarget('effects/112'),
  [Moves.StunSpore]: onTarget('effects/98'),
  [Moves.SunnyDay]: onField('effects/31'),
  [Moves.Supersonic]: supersonic,
  // The crown of water is pinned at its foot — the part touching
  // whatever it landed on — and thrown back at whoever sent it
  [Moves.Surf]: struckOn('directional/2', { pivot: [16, 32], scale: 1.6 }),
  [Moves.SwordsDance]: onUser('effects/140'),
  [Moves.Tackle]: onTarget('effects/1'),
  [Moves.Teleport]: onUser('effects/62'),
  // Struck straight down at its own orientation, standing on the body
  // it hit rather than centred on it
  [Moves.Thunder]: onTarget('directional/3', { anchor: 'foot' }),
  [Moves.ThunderPunch]: onTarget('effects/91'),
  [Moves.ThunderShock]: onTarget('effects/18'),
  [Moves.ThunderWave]: thrownAt('directional/7'),
  [Moves.Thunderbolt]: onTarget('effects/43'),
  [Moves.Toxic]: onTarget('effects/219'),
  [Moves.Transform]: onUser('effects/16'),
  [Moves.ViceGrip]: onTarget('effects/114'),
  [Moves.Waterfall]: onTarget('effects/83'),
  [Moves.Whirlwind]: onTarget('effects/143'),
  [Moves.WingAttack]: onTarget('effects/201'),
  [Moves.Wrap]: onTarget('effects/107'),
};

export default function moveVisualFor(move: Moves): MoveVisualBuilder | null {
  return VISUALS[move] ?? null;
}

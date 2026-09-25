import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import { settle } from '../effect/stats';
import {
  BALLOON,
  BELLY,
  CATASTROPIKA_LANDS,
  DISGUISE,
  DUST,
  EEVEELUTIONS,
  EVOBOOST_FIRE,
  EVOBOOST_FLARE,
  FLAME,
  MAT,
  MEGAVOLT_FIRE,
  MEGAVOLT_HITS,
  MEGAVOLT_TONES,
  MOONSAULT_SLAMS,
  MOONSAULT_SPRING,
  NOTE_TONES,
  OPERETTA_BURSTS,
  OPERETTA_DROPS,
  PANCAKE_LANDS,
  PANCAKE_LEAPS,
  PASTELS,
  PIKA,
  POST,
  PSYCHIC,
  RAICHU,
  RAID_FINAL,
  RAID_GHOST,
  RAID_SHADE,
  RAID_SHAFT,
  RAID_STRIKES,
  ROPE,
  SHADOW,
  SNORLAX,
  SNUGGLE_CLOUD,
  SPARKSURF_HITS,
  SPOTLIGHT,
  UMBREON,
  UMBREON_RING,
  leapLift,
  surfLift,
  within,
} from '../effect/z-partners';
import { TAU, bolt, chevron, debris, sickle, sparks } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, late, reachOf, toward } from './shapes';
import { Z_GOLD, unleashed, zPower } from './z-power';

/** An arrow along a line, head at `to` */
function arrow(
  kit: EffectBatch,
  from: Spot,
  to: Spot,
  width: number,
  colour: string,
  alpha: number,
): void {
  const angle = kit.angleOn(from, to);
  const head = width * 3;

  kit.trail(from, to, width, colour, alpha);
  kit.ribbon(
    [
      aside(kit, to, -Math.cos(angle - 0.5) * head, -Math.sin(angle - 0.5) * head),
      to,
      aside(kit, to, -Math.cos(angle + 0.5) * head, -Math.sin(angle + 0.5) * head),
    ],
    width,
    colour,
    alpha,
    0,
    { add: 0.3 },
  );
}

/** A quaver: a round head, a stem and a flag */
function note(kit: EffectBatch, at: Spot, size: number, colour: string, alpha: number): void {
  const stem = aside(kit, at, size * 0.36, size * 1.3);

  kit.puff(at, size * 0.4, colour, alpha, { add: 0.3 });
  kit.ribbon([aside(kit, at, size * 0.36), stem], size * 0.12, colour, alpha, 0, { add: 0.3 });
  kit.ribbon(
    [stem, aside(kit, stem, size * 0.35, -size * 0.2), aside(kit, stem, size * 0.54, -size * 0.5)],
    size * 0.14,
    colour,
    alpha,
    0,
    { add: 0.3 },
  );
}

/** A shadow lying on the floor */
function shadow(kit: EffectBatch, floor: Spot, radius: number, alpha: number): void {
  kit.pool(floor, radius, '#000000', alpha, { add: 0 });
}

const zPartners = {
  // Pikachu wrapped in lightning leaping high and belly-flopping onto it in a huge electric blast
  Catastropika(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const hot = lighten(PIKA, 0.6);
    const flick = Math.floor(share * 24);

    if (done < CATASTROPIKA_LANDS) {
      const leap = done / CATASTROPIKA_LANDS;
      const place = (along: number): Spot =>
        aside(kit, toward(stage.source, at, along), 0, reach * 9 * leapLift(along));
      const head = place(leap);

      shadow(kit, floor, reach * (0.6 + leap * 1.8), leap * 0.4);
      for (let trail = 1; trail <= 5; trail += 1) {
        kit.glow(
          place(Math.max(0, leap - trail * 0.05)),
          reach * (1.2 - trail * 0.15),
          PIKA,
          (1 - trail / 6) * 0.5,
          0.3,
        );
      }
      kit.glow(head, reach * 1.6, PIKA, 0.7, 0.4);
      kit.glow(head, reach * 0.9, hot, 1);
      for (let arc = 0; arc < 4; arc += 1) {
        const angle = noise(seed + flick, arc) * TAU;

        bolt(
          kit,
          head,
          aside(kit, head, Math.cos(angle) * reach * 2, Math.sin(angle) * reach * 2),
          seed + flick * 7 + arc,
          reach * 0.5,
          reach * 0.07,
          hot,
          flick % 3 === 2 ? 0.5 : 1,
        );
      }
      return;
    }
    const hit = (done - CATASTROPIKA_LANDS) / (1 - CATASTROPIKA_LANDS);
    const bright = decay(hit) * (flick % 3 === 2 ? 0.6 : 1);

    kit.pool(floor, reach * (2 + hit * 4), PIKA, decay(hit) * 0.8, { add: 0.5 });
    kit.glow(at, reach * (1.5 + hit * 4.5), PIKA, decay(hit) * 0.55, 0.4);
    kit.glow(at, reach * (2 + hit * 3), hot, decay(Math.min(1, hit * 1.3)));
    for (let wave = 0; wave < 3; wave += 1) {
      const held = within(hit, wave * 0.18, wave * 0.18 + 0.6);

      if (held > 0) {
        kit.ripple(floor, reach * (1 + held * 6), 0.1, PIKA, decay(held) * 0.9);
      }
    }
    kit.ring(at, reach * (1 + hit * 5), 0.1, hot, decay(hit));
    for (let arc = 0; arc < many(8, weight); arc += 1) {
      const angle = (arc / many(8, weight)) * TAU + noise(seed + flick, arc) * 0.6;
      const out = reach * (2.5 + hit * 3);

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8),
        seed + flick * 5 + arc,
        reach * 0.6,
        reach * 0.09,
        hot,
        bright,
      );
    }
    sparks(kit, at, reach * (3 + hit * 3), 16, seed, hit, '#ffffff', decay(Math.min(1, hit * 2)));
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach * 1.4,
      many(10, weight),
      seed,
      hit,
      mix(PIKA, '#5b4636', 0.6),
      late(hit, 0.5),
    );
  },

  // A dark forest-green barrage of ghostly arrows raining in from above, then one great arrow
  ArrowRaid(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const glow = lighten(RAID_GHOST, 0.3);

    if (done < 0.22) {
      const up = done / 0.22;

      for (let shaft = 0; shaft < 8; shaft += 1) {
        const tip = aside(
          kit,
          stage.source,
          spread(seed, shaft) * reach * 1.5,
          reach * (1 + up * 9 * (0.7 + noise(seed, shaft + 5) * 0.5)),
          spread(seed, shaft + 40) * reach * 0.6,
        );

        arrow(kit, aside(kit, tip, 0, -reach * 1.4), tip, reach * 0.08, glow, decay(up));
      }
    }
    const shade = within(done, 0.08, 0.3) * late(done, 0.8);

    kit.glow(at, reach * 3.2, RAID_SHADE, shade * 0.6, 0, { add: 0 });
    kit.pool(floor, reach * 3, RAID_GHOST, shade * 0.4);
    kit.ripple(floor, reach * 2.6, 0.1, RAID_GHOST, shade * 0.6);
    for (let shaft = 0; shaft < many(22, weight); shaft += 1) {
      const start = 0.1 + noise(seed, shaft) * 0.45;
      const flight = within(done, start, start + 0.14);
      const spot = aside(
        kit,
        at,
        spread(seed, shaft + 90) * reach * 0.9,
        spread(seed, shaft + 120) * reach * 0.6,
      );

      if (flight > 0 && flight < 1) {
        const from = aside(
          kit,
          at,
          spread(seed, shaft + 30) * reach * 7,
          reach * (7 + noise(seed, shaft + 60) * 3),
          spread(seed, shaft + 150) * reach * 3,
        );
        const tip = toward(from, spot, flight);
        const tail = toward(from, spot, Math.max(0, flight - 0.25));

        kit.trail(tail, tip, reach * 0.3, RAID_GHOST, 0.35);
        arrow(kit, tail, tip, reach * 0.07, RAID_SHAFT, 1);
      }
      const after = within(done, start + 0.14, start + 0.3);

      if (after > 0 && after < 1) {
        kit.ring(spot, reach * (0.2 + after * 1.2), 0.15, glow, decay(after));
      }
    }
    const from = aside(kit, at, -reach * 4, reach * 12);
    const big = within(done, RAID_FINAL, RAID_STRIKES);

    if (big > 0 && big < 1) {
      const tip = toward(from, at, big);
      const tail = toward(from, at, Math.max(0, big - 0.45));

      kit.trail(tail, tip, reach * 1.2, RAID_GHOST, 0.5);
      arrow(kit, tail, tip, reach * 0.3, lighten(RAID_GHOST, 0.4), 1);
    }
    const hit = within(done, RAID_STRIKES, 1);

    if (hit > 0) {
      // The great arrow stays standing in it
      arrow(kit, toward(from, at, 0.75), at, reach * 0.3, RAID_SHAFT, late(hit, 0.5));
      kit.glow(at, reach * (1.4 + hit * 2.4), glow, decay(hit), 0.6);
      kit.ring(at, reach * (1 + hit * 3.6), 0.1, RAID_GHOST, decay(hit));
      kit.ripple(floor, reach * (1 + hit * 4), 0.1, RAID_GHOST, decay(hit) * 0.8);
      sparks(kit, at, reach * (2.6 + hit * 2), 14, seed, hit, glow, decay(hit));
      debris(
        kit,
        aside(kit, floor, 0, reach * 0.3),
        reach * 1.4,
        many(12, weight),
        seed,
        hit,
        RAID_SHAFT,
        decay(hit),
      );
    }
  },

  // A wrestling ring rising round it, the caster springing off the ropes and body-slamming it in flames
  Moonsault(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const hot = mix(FLAME, '#ffe070', 0.6);
    const rise = settle(within(done, 0, 0.2));
    const kept = late(done, 0.8);
    const tall = reach * 2.6 * rise;
    const pull = swell(within(done, MOONSAULT_SPRING - 0.12, MOONSAULT_SPRING + 0.1));
    const half = reach * 3;
    // Back left, back right, front right, front left
    const posts: [Spot, Spot, Spot, Spot] = [
      aside(kit, floor, -half, 0, half),
      aside(kit, floor, half, 0, half),
      aside(kit, floor, half, 0, -half),
      aside(kit, floor, -half, 0, -half),
    ];

    kit.panel(posts, MAT, rise * kept * 0.35);
    for (const post of posts) {
      kit.ribbon([post, [post[0], tall, post[2]]], reach * 0.22, POST, kept, 0, { add: 0 });
    }
    for (let side = 0; side < 4; side += 1) {
      const from = posts[side];
      const to = posts[(side + 1) % 4];

      for (let strand = 1; strand <= 3; strand += 1) {
        const height = (tall * strand) / 3.2;
        const middle = toward(from, to, 0.5);

        kit.ribbon(
          [
            [from[0], height, from[2]],
            aside(kit, [middle[0], height, middle[2]], side === 3 ? -pull * reach * 1.4 : 0),
            [to[0], height, to[2]],
          ],
          reach * 0.1,
          ROPE,
          kept * (side === 2 ? 0.5 : 1),
          0,
          { add: 0 },
        );
      }
    }
    const rope = aside(kit, floor, -half - pull * reach * 1.4, tall * 0.55);

    if (done < MOONSAULT_SLAMS) {
      const place = (when: number): Spot => {
        if (when < MOONSAULT_SPRING) {
          return toward(stage.source, rope, settle(within(when, 0.08, MOONSAULT_SPRING)));
        }
        const flight = within(when, MOONSAULT_SPRING, MOONSAULT_SLAMS);

        return aside(kit, toward(rope, at, flight), 0, reach * 8 * Math.sin(Math.PI * flight));
      };
      const body = place(done);

      for (let trail = 1; trail <= 4; trail += 1) {
        kit.glow(
          place(Math.max(0, done - trail * 0.025)),
          reach * (1 - trail * 0.15),
          FLAME,
          (1 - trail / 5) * 0.5,
          0.3,
        );
      }
      kit.glow(body, reach * 1.3, FLAME, 0.85, 0.5);
      if (done > MOONSAULT_SPRING) {
        // The backflip: a flaming hoop turning round the body
        const turn = -within(done, MOONSAULT_SPRING, MOONSAULT_SLAMS) * Math.PI * 3;

        sickle(kit, body, reach * 1.6, turn, turn - 2.4, reach * 0.45, hot, 0.9);
      }
      return;
    }
    const hit = within(done, MOONSAULT_SLAMS, 1);

    kit.pool(floor, reach * (2 + hit * 3), FLAME, decay(hit) * 0.7, { add: 0.5 });
    kit.glow(at, reach * (1.6 + hit * 3), FLAME, decay(hit) * 0.7, 0.4);
    kit.glow(at, reach * (1.2 + hit * 1.6), hot, decay(Math.min(1, hit * 1.6)));
    for (let lick = 0; lick < many(14, weight); lick += 1) {
      const up = (share * 1.8 + noise(seed, lick)) % 1;

      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, lick + 20) * reach * 2.4,
          up * reach * 4.5,
          spread(seed, lick + 30) * reach,
        ),
        reach * 0.7 * (1 - up * 0.5),
        up < 0.4 ? hot : FLAME,
        swell(up) * decay(hit),
        up < 0.4 ? 0.5 : 0.1,
      );
    }
    kit.ripple(floor, reach * (1 + hit * 4.5), 0.12, FLAME, decay(hit));
    kit.ring(at, reach * (1 + hit * 3.4), 0.1, hot, decay(hit));
    sparks(kit, at, reach * (2.6 + hit * 2.4), 16, seed, hit, hot, decay(Math.min(1, hit * 1.5)));
  },

  // A giant water balloon gathered under a spotlight among music notes, dropped and bursting over it
  Operetta(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const top = aside(kit, at, 0, reach * 5.5);
    const foam = lighten(BALLOON, 0.55);
    const grow = settle(within(done, 0, OPERETTA_DROPS));
    const drop = within(done, OPERETTA_DROPS, OPERETTA_BURSTS);
    const hit = within(done, OPERETTA_BURSTS, 1);
    const spot = within(done, 0, 0.15) * late(done, 0.85);

    kit.panel(
      [
        aside(kit, floor, -reach * 0.6, reach * 12),
        aside(kit, floor, reach * 0.6, reach * 12),
        aside(kit, floor, reach * 3),
        aside(kit, floor, -reach * 3),
      ],
      SPOTLIGHT,
      spot * 0.2,
    );
    kit.pool(floor, reach * 3, SPOTLIGHT, spot * 0.5);

    const radius = reach * (0.6 + grow * 2.6);
    const centre = hit > 0 ? at : toward(top, at, drop * drop);

    if (hit <= 0) {
      for (let stream = 0; stream < many(8, weight); stream += 1) {
        const from = aside(
          kit,
          floor,
          spread(seed, stream) * reach * 5,
          0,
          spread(seed, stream + 20) * reach * 2,
        );
        const held = (share * 2 + noise(seed, stream + 10)) % 1;

        kit.glow(toward(from, top, held), reach * 0.35, BALLOON, swell(held) * (1 - drop), 0.5);
      }
      kit.glow(centre, radius * 0.85, BALLOON, 0.4, 0.3);
      kit.bubble(centre, radius, foam, 1);
    } else {
      kit.pool(floor, reach * (2 + hit * 3), BALLOON, decay(hit) * 0.7, { add: 0.4 });
      kit.glow(at, reach * (2 + hit * 2.5), foam, decay(Math.min(1, hit * 1.4)), 0.6);
      for (let wave = 0; wave < 3; wave += 1) {
        const held = within(hit, wave * 0.2, wave * 0.2 + 0.6);

        if (held > 0) {
          kit.ripple(floor, reach * (1 + held * 5), 0.1, BALLOON, decay(held) * 0.9);
        }
      }
      kit.ring(at, reach * (1.6 + hit * 3.4), 0.1, foam, decay(hit));
      for (let bead = 0; bead < many(18, weight); bead += 1) {
        kit.bubble(
          aside(
            kit,
            at,
            spread(seed, bead) * reach * (1 + hit * 3.5),
            spread(seed, bead + 30) * reach * (1 + hit * 2.5),
          ),
          reach * 0.25 * (0.6 + noise(seed, bead + 60)),
          foam,
          decay(hit),
        );
      }
      for (let spout = 0; spout < many(6, weight); spout += 1) {
        const angle = (spout / many(6, weight)) * TAU + noise(seed, spout) * 0.4;
        const base: Spot = [
          floor[0] + Math.cos(angle) * reach * 2,
          0,
          floor[2] + Math.sin(angle) * reach * 2,
        ];
        const high = reach * (2.4 + noise(seed, spout + 10) * 2) * Math.min(1, hit * 3);

        kit.ribbon(
          [base, [base[0], high, base[2]]],
          reach * 0.35 * decay(hit),
          BALLOON,
          decay(hit),
          share * 12,
        );
      }
    }
    // The notes circle the balloon, then scatter when it bursts
    const notes = many(6, weight);

    for (let index = 0; index < notes; index += 1) {
      const angle = (index / notes) * TAU + share * 3;
      const out = hit > 0 ? reach * (3 + hit * 3) : radius * 1.4;

      note(
        kit,
        aside(kit, centre, Math.cos(angle) * out, Math.sin(angle) * out * 0.7),
        reach * 0.7,
        NOTE_TONES[index % NOTE_TONES.length],
        within(done, 0, 0.1) * decay(hit),
      );
    }
  },

  // The caster surfing its tail on a rolling track of lightning, riding it into the target
  Sparksurfer(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const hot = lighten(PIKA, 0.6);
    const flick = Math.floor(share * 24);
    const ride = within(done, 0, SPARKSURF_HITS);
    const hit = within(done, SPARKSURF_HITS, 1);
    const kept = decay(hit);
    const place = (along: number): Spot =>
      aside(kit, toward(stage.source, at, along), 0, reach * (surfLift(along) - 0.8));
    const drawn = Math.min(1, ride + 0.15);
    const path: Spot[] = [];

    for (let step = 0; step <= 24; step += 1) {
      path.push(place((step / 24) * drawn));
    }
    kit.ribbon(path, reach * 0.8, PIKA, kept * 0.4, share * 10);
    kit.ribbon(path, reach * 0.2, hot, kept, share * 14);
    for (let segment = 0; segment < 8; segment += 1) {
      const end = (segment + 1) / 8;

      if (end <= drawn) {
        bolt(
          kit,
          place(segment / 8),
          place(end),
          seed + flick * 9 + segment,
          reach * 0.4,
          reach * 0.05,
          segment % 2 === 0 ? PSYCHIC : hot,
          kept * (flick % 3 === 2 ? 0.5 : 1),
        );
      }
    }
    if (ride < 1) {
      const head = place(ride);
      const rider = aside(kit, head, 0, reach * 1.1);

      kit.ribbon(
        [
          aside(kit, head, -reach * 2, -reach * 0.3),
          aside(kit, head, -reach * 0.4, reach * 0.3),
          aside(kit, head, reach * 1.2, reach * 0.2),
        ],
        reach * 0.7,
        PIKA,
        0.6,
        share * 10,
      );
      kit.ribbon(
        [aside(kit, head, -reach * 1.1, reach * 0.1), aside(kit, head, reach * 1.1, reach * 0.3)],
        reach * 0.3,
        RAICHU,
        1,
        0,
        { add: 0 },
      );
      kit.glow(rider, reach * 1.1, RAICHU, 0.9, 0.4);
      kit.ring(rider, reach * 1.4, 0.1, PSYCHIC, 0.8);
      sparks(kit, head, reach * 2, many(10, weight), seed + flick, 0.5, hot, 0.9);
      return;
    }
    kit.pool(floor, reach * (2 + hit * 3), PIKA, decay(hit) * 0.7, { add: 0.5 });
    kit.glow(at, reach * (1.4 + hit * 3.4), PIKA, decay(hit) * 0.6, 0.4);
    kit.glow(at, reach * (1.4 + hit * 1.8), hot, decay(Math.min(1, hit * 1.4)));
    kit.ring(at, reach * (1 + hit * 4), 0.1, PSYCHIC, decay(hit));
    kit.ring(at, reach * (0.6 + hit * 3), 0.08, hot, decay(hit));
    for (let arc = 0; arc < many(7, weight); arc += 1) {
      const angle = (arc / many(7, weight)) * TAU + noise(seed + flick, arc) * 0.6;
      const out = reach * (2.2 + hit * 2.4);

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8),
        seed + flick * 5 + arc,
        reach * 0.5,
        reach * 0.08,
        hot,
        decay(hit),
      );
    }
    sparks(kit, at, reach * (2.6 + hit * 2), 14, seed, hit, '#ffffff', decay(Math.min(1, hit * 2)));
  },

  // The ground shaking as the caster rolls in and leaps, then flattens it with a vast shockwave
  Pancake(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const middle = toward(stage.source, at, 0.5);
    const roll = within(done, 0, PANCAKE_LEAPS);
    const leap = within(done, PANCAKE_LEAPS, PANCAKE_LANDS);
    const hit = within(done, PANCAKE_LANDS, 1);
    const bulk = reach * 2.2;

    for (let wave = 0; wave < 2; wave += 1) {
      const held = (done * 4 + wave * 0.5) % 1;

      kit.ripple(
        floorOf(stage.source),
        reach * (1 + held * 3),
        0.1,
        DUST,
        decay(held) * (1 - hit) * 0.6,
      );
    }
    if (hit <= 0) {
      let body: Spot;
      let radius = bulk;

      if (leap <= 0) {
        body = toward(stage.source, middle, settle(roll));
        for (let puff = 0; puff < 5; puff += 1) {
          const behind = toward(stage.source, middle, Math.max(0, settle(roll) - puff * 0.08));

          kit.puff(
            aside(kit, behind, 0, -bulk * 0.6),
            reach * (0.6 + puff * 0.2),
            DUST,
            (1 - puff / 5) * 0.5,
          );
        }
      } else {
        body = aside(kit, toward(middle, at, leap), 0, reach * 11 * Math.sin(Math.PI * leap));
        radius = bulk * (1 + swell(leap) * 0.4 + leap * 0.3);
        shadow(kit, floor, reach * (1 + leap * 2.6), leap * 0.5);
      }
      kit.puff(body, radius, SNORLAX, 1);
      kit.near(radius * 0.5);
      kit.puff(aside(kit, body, 0, -radius * 0.25), radius * 0.65, BELLY, 1);
      if (leap <= 0) {
        // Rolling: the lines of the body turning over
        const turn = roll * Math.PI * 6;

        for (let line = 0; line < 3; line += 1) {
          const from = turn + (line / 3) * TAU;

          sickle(
            kit,
            body,
            radius * 0.85,
            from,
            from + 1,
            reach * 0.18,
            lighten(SNORLAX, 0.4),
            0.8,
            0,
          );
        }
      }
      kit.near(0);
      return;
    }
    const kept = late(hit, 0.3);

    kit.oval(aside(kit, floor, 0, reach * 0.4), bulk * 1.8, bulk * 0.5, 0, 1, SNORLAX, kept);
    kit.oval(aside(kit, floor, 0, reach * 0.55), bulk * 1.3, bulk * 0.28, 0, 1, BELLY, kept);
    for (let wave = 0; wave < 4; wave += 1) {
      const held = within(hit, wave * 0.12, wave * 0.12 + 0.6);

      if (held > 0) {
        kit.ripple(
          floor,
          reach * (1.4 + held * 9),
          0.12,
          wave % 2 === 0 ? DUST : lighten(paint.color, 0.4),
          decay(held),
        );
      }
    }
    kit.ripple(floor, reach * (2 + hit * 6), 0.08, '#ffffff', decay(Math.min(1, hit * 2)));
    for (let puff = 0; puff < many(12, weight); puff += 1) {
      const angle = (puff / many(12, weight)) * TAU;
      const out = reach * (2 + hit * 5);

      kit.puff(
        [floor[0] + Math.cos(angle) * out, reach * 0.5, floor[2] + Math.sin(angle) * out],
        reach * (0.8 + hit * 0.8),
        DUST,
        decay(hit) * 0.7,
      );
    }
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach * 2,
      many(14, weight),
      seed,
      hit,
      mix(DUST, '#5b4636', 0.5),
      decay(hit),
    );
    sparks(kit, at, reach * (3 + hit * 3), 18, seed, hit, '#ffffff', decay(Math.min(1, hit * 1.6)));
  },

  // Eight lights in the eeveelutions' colours circling Eevee and beaming into it, then it flares with its stats rising
  Evoboost(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = stage.source;
    const reach = reachOf(stage, weight);
    const appear = within(done, 0, 0.2);
    const fire = within(done, EVOBOOST_FIRE, EVOBOOST_FLARE);
    const flare = within(done, EVOBOOST_FLARE - 0.05, 1);
    const circle = reach * (3.4 - settle(fire) * 1.2);
    const shown = appear * late(done, 0.7);

    for (const [index, tone] of EEVEELUTIONS.entries()) {
      const angle = (index / EEVEELUTIONS.length) * TAU + done * Math.PI * 1.2;
      const spot: Spot = [
        at[0] + Math.cos(angle) * circle,
        at[1] + reach * 0.4,
        at[2] + Math.sin(angle) * circle,
      ];

      if (fire > 0) {
        kit.ribbon(
          [spot, toward(spot, at, settle(Math.min(1, fire * 1.5)))],
          reach * 0.4 * swell(fire),
          tone,
          shown,
          share * 10,
        );
      }
      if (index === UMBREON) {
        kit.puff(spot, reach * 0.9, tone, shown);
        kit.ring(spot, reach * 0.55, 0.2, UMBREON_RING, shown);
      } else {
        kit.glow(spot, reach * 0.95, tone, shown, 0.6);
      }
    }
    if (flare <= 0) {
      return;
    }
    kit.pool(floorOf(at), reach * (2 + flare * 2), Z_GOLD, decay(flare) * 0.6, { add: 0.5 });
    kit.glow(at, reach * (1.4 + swell(flare) * 1.4), lighten(Z_GOLD, 0.4), decay(flare));
    kit.star(at, reach * 2.6 * swell(flare), flare * 2, '#ffffff', decay(flare) * 0.8);
    for (const [index, tone] of EEVEELUTIONS.entries()) {
      const held = within(flare, index * 0.04, index * 0.04 + 0.6);

      if (held > 0 && index !== UMBREON) {
        kit.ring(at, reach * (1 + held * 4), 0.08, tone, decay(held) * 0.8);
      }
    }
    // One column of rising arrows per stat it raises
    for (let column = 0; column < 5; column += 1) {
      const tone = EEVEELUTIONS[column + (column >= UMBREON ? 1 : 0)];

      for (let mark = 0; mark < 3; mark += 1) {
        const held = (share * 1.4 + mark / 3) % 1;

        chevron(
          kit,
          aside(kit, at, (column - 2) * reach * 0.9, reach * (0.6 - 1.2 + held * 2.4)),
          reach * 1.2,
          1,
          tone,
          swell(flare),
          reach * 0.12,
        );
      }
    }
    sparks(kit, at, reach * 3, many(14, weight), seed, flare, Z_GOLD, decay(flare));
  },

  // Pikachu charged in a rainbow aura firing seven coloured bolts that converge on the target
  Megavolt(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const flick = Math.floor(share * 24);
    const charge = within(done, 0, MEGAVOLT_FIRE);
    const fire = within(done, MEGAVOLT_FIRE * 0.6, MEGAVOLT_HITS);
    const hit = within(done, MEGAVOLT_HITS, 1);
    const aura = settle(charge) * late(done, 0.6);

    kit.glow(stage.source, reach * (1.2 + charge * 0.8), PIKA, aura * 0.7, 0.5);
    for (const [index, tone] of MEGAVOLT_TONES.entries()) {
      const pulse = swell((share * 3 + index / 7) % 1);

      kit.ring(stage.source, reach * (1.2 + index * 0.22 + pulse * 0.3), 0.06, tone, aura * 0.8);
    }
    if (fire > 0 && hit < 1) {
      const kept = decay(Math.min(1, hit * 2));

      for (const [index, tone] of MEGAVOLT_TONES.entries()) {
        const angle = Math.PI / 2 - (index / 6 - 0.5) * Math.PI * 0.9;
        const origin = aside(
          kit,
          stage.source,
          Math.cos(angle) * reach * 2.2,
          Math.sin(angle) * reach * 2.2,
        );

        kit.glow(origin, reach * 0.55, tone, kept, 0.5);
        bolt(
          kit,
          origin,
          toward(origin, at, settle(fire)),
          seed + flick * 11 + index,
          reach * 0.8,
          reach * 0.14,
          tone,
          kept,
        );
      }
    }
    if (hit <= 0) {
      return;
    }
    kit.pool(floor, reach * (2 + hit * 3), PIKA, decay(hit) * 0.7, { add: 0.5 });
    kit.glow(at, reach * (1.6 + hit * 3), '#ffffff', decay(Math.min(1, hit * 1.3)));
    for (const [index, tone] of MEGAVOLT_TONES.entries()) {
      const held = within(hit, index * 0.05, index * 0.05 + 0.6);

      if (held > 0) {
        kit.ring(at, reach * (0.8 + held * 4.4), 0.08, tone, decay(held));
      }
      const angle = (index / 7) * TAU + noise(seed + flick, index) * 0.5;
      const out = reach * (2.4 + hit * 2);

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8),
        seed + flick * 3 + index,
        reach * 0.5,
        reach * 0.08,
        lighten(tone, 0.4),
        decay(hit),
      );
    }
    sparks(kit, at, reach * (3 + hit * 2.4), 21, seed, hit, lighten(PIKA, 0.5), decay(hit));
  },

  // Mimikyu dragging it into a pastel dust cloud, a flurry of hits, stars and hearts, and shadow claws raking
  Snuggle(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const run = within(done, 0, SNUGGLE_CLOUD);
    const cloud = within(done, SNUGGLE_CLOUD * 0.5, SNUGGLE_CLOUD + 0.05) * late(done, 0.85);
    const fight = within(done, SNUGGLE_CLOUD, 0.88);

    if (run < 1) {
      const runner = toward(stage.source, at, settle(run));

      for (let puff = 1; puff <= 5; puff += 1) {
        const behind = toward(stage.source, at, Math.max(0, settle(run) - puff * 0.06));

        kit.puff(
          aside(kit, behind, 0, -reach * 0.6),
          reach * (0.5 + puff * 0.15),
          PASTELS[puff % 2],
          (1 - puff / 6) * 0.6,
        );
      }
      shadow(kit, floorOf(runner), reach * 0.9, 0.5);
      kit.glow(runner, reach * 1.1, DISGUISE, 0.9, 0.3);
    }
    for (let puff = 0; puff < many(14, weight); puff += 1) {
      const angle = noise(seed, puff) * TAU + share * (1 + noise(seed, puff + 7)) * 4;
      const out = reach * (1.2 + noise(seed, puff + 14) * 1.6) * cloud;

      kit.puff(
        [
          at[0] + Math.cos(angle) * out,
          at[1] + spread(seed, puff + 28) * reach * cloud,
          at[2] + Math.sin(angle) * out,
        ],
        reach * (1.1 + noise(seed, puff + 21) * 0.8) * cloud,
        PASTELS[puff % 2],
        cloud * 0.75,
      );
    }
    kit.near(reach * 2);
    const blows = many(10, weight);

    for (let blow = 0; blow < blows; blow += 1) {
      const when = (blow / blows) * 0.86;
      const pop = within(fight, when, when + 0.14);

      if (pop <= 0 || pop >= 1) {
        continue;
      }
      const spot = aside(
        kit,
        at,
        spread(seed, blow + 40) * reach * 2,
        spread(seed, blow + 50) * reach * 1.2,
      );
      const flung = aside(kit, spot, spread(seed, blow + 60) * reach * pop, reach * 1.6 * pop);

      sparks(kit, spot, reach * (0.6 + pop * 1.4), 8, seed + blow, pop, '#ffffff', decay(pop));
      if (blow % 2 === 0) {
        kit.star(flung, reach * 0.55, pop * 3, '#fff08a', decay(pop));
      } else {
        kit.heart(flung, reach * 0.5, 0, PASTELS[0], decay(pop));
      }
    }
    // The disguise's shadow claws, three fingers raking across it
    for (let claw = 0; claw < 3; claw += 1) {
      const when = 0.15 + claw * 0.26;
      const swipe = within(fight, when, when + 0.2);

      if (swipe <= 0 || swipe >= 1) {
        continue;
      }
      const from = 2.6 - claw * 0.9;

      for (let finger = 0; finger < 3; finger += 1) {
        const radius = reach * (1.8 + finger * 0.4);

        sickle(
          kit,
          at,
          radius,
          from,
          from - settle(swipe) * 2,
          reach * 0.5,
          SHADOW,
          decay(swipe) * 0.9,
          0,
        );
        sickle(
          kit,
          at,
          radius,
          from,
          from - settle(swipe) * 2,
          reach * 0.16,
          PASTELS[0],
          decay(swipe),
        );
      }
    }
    kit.near(0);
    const end = within(done, 0.85, 1);

    if (end > 0) {
      kit.pool(floor, reach * (1.5 + end * 2.5), PASTELS[1], decay(end) * 0.6);
      kit.glow(at, reach * (1 + end * 2.4), PASTELS[0], decay(end), 0.5);
      kit.ring(at, reach * (1 + end * 3.4), 0.1, PASTELS[1], decay(end));
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default zPartners;

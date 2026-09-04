import { Stats } from '../../data/constants/stats';
import { DamageFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { EffectType } from '../events';
import { onUnitActs } from '../utils';

/**
 * What the curse takes every time the cursed unit acts
 */
const CURSE_FRACTION = 0.25;

/**
 * Cursed: a quarter of its health every time it would act, for as
 * long as it stays on the field. Nothing lifts it, which is what the
 * caster paid half its own health for
 * https://bulbapedia.bulbagarden.net/wiki/Curse_(move)
 */
export default function setupCursedStatus(battle: Battle): void {
  onUnitActs(battle, (unit) => {
    const cause = unit.status[Statuses.Cursed];

    if (cause == null) {
      return;
    }

    unit.triggerStatus(Statuses.Cursed, cause);

    const amount = unit.checkStat(Stats.HP, 0) * CURSE_FRACTION;
    const source = cause.type === EffectType.None ? unit : cause.unit;

    source.damage(cause, unit, amount, DamageFlags.Indirect | DamageFlags.HealthScaled);
  });
}

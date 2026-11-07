import { RaidKind } from '../../../model/raid-record';
import { TYPE_COLORS, TYPE_NAMES, Types } from '../../../data/constants/types';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * What the raid banner says about the kind of raid it is: the badge
 * beside the title, and the callout when the boss passes a tick.
 */

/** Where the boss meter is marked: three quarters, half and a quarter */
export const BOSS_TICKS = [0.75, 0.5, 0.25] as const;

/** The badge's fill, and the type colour a Tera raid wears instead */
export interface KindBadge {
  label: string;
  /** Tailwind classes for the fill and the words on it */
  tone: string;
  /** An inline fill, for a Tera type's own colour */
  color?: string;
}

const KIND_TONES: Record<RaidKind, string> = {
  [RaidKind.Legendary]: 'bg-tide text-on-accent',
  [RaidKind.Shadow]: 'bg-shade text-white',
  [RaidKind.Mythical]: 'bg-arcane text-on-accent',
  [RaidKind.Totem]: 'bg-leaf text-on-accent',
  [RaidKind.Max]: 'bg-ember text-on-accent',
  [RaidKind.Alpha]: 'bg-arcane text-on-accent',
  [RaidKind.Noble]: 'bg-gold text-on-gold',
  [RaidKind.Tera]: 'bg-tide text-on-accent',
};

function describeKindName(kind: RaidKind, tera: Types): string {
  switch (kind) {
    case RaidKind.Shadow:
      return m.battle_kind_shadow();
    case RaidKind.Mythical:
      return m.battle_kind_mythical();
    case RaidKind.Totem:
      return m.battle_kind_totem();
    case RaidKind.Max:
      return m.battle_kind_max();
    case RaidKind.Alpha:
      return m.battle_kind_alpha();
    case RaidKind.Noble:
      return m.battle_kind_noble();
    case RaidKind.Tera:
      // The type is the point of a Tera raid, so the badge names it
      return tera === Types.Unknown
        ? m.battle_kind_tera_plain()
        : m.battle_kind_tera({ type: TYPE_NAMES[tera] });
    case RaidKind.Legendary:
    default:
      return m.battle_kind_legendary();
  }
}

export function describeKind(kind: RaidKind, tera: Types): KindBadge {
  return {
    label: describeKindName(kind, tera),
    tone: KIND_TONES[kind],
    color: kind === RaidKind.Tera && tera !== Types.Unknown ? TYPE_COLORS[tera] : undefined,
  };
}

/**
 * What the banner calls out when the boss's health passes a tick. A
 * Noble staggers and an Alpha calls its kind back at each of the three,
 * and a Totem calls its ally at half; any other boss is told by how
 * much is left
 */
export function describeTick(kind: RaidKind | null, tick: number): string {
  if (kind === RaidKind.Noble) {
    return m.battle_callout_stagger();
  }
  if (kind === RaidKind.Alpha) {
    return m.battle_callout_kind();
  }
  if (kind === RaidKind.Totem && tick === 0.5) {
    return m.battle_callout_ally();
  }
  if (tick === 0.75) {
    return m.battle_callout_quarter();
  }
  if (tick === 0.5) {
    return m.battle_callout_half();
  }
  return m.battle_callout_last();
}

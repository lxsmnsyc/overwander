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

/**
 * Whether a `#rrggbb` fill is light enough that white words on it are
 * hard to read (Electric, Ice, Normal), by its relative luminance
 */
function isLightFill(color: string): boolean {
  const channels: number[] = [];

  for (let at = 1; at < 7; at += 2) {
    const value = Number.parseInt(color.slice(at, at + 2), 16) / 255;
    channels.push(value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  }
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];

  // Where dark ink and white words on the fill have equal contrast
  return luminance > 0.179;
}

export function describeKind(kind: RaidKind, tera: Types): KindBadge {
  if (kind === RaidKind.Tera && tera !== Types.Unknown) {
    const color = TYPE_COLORS[tera];

    return {
      label: describeKindName(kind, tera),
      // A type's own fill takes dark words when it is light
      tone: isLightFill(color) ? 'text-on-gold' : 'text-on-accent',
      color,
    };
  }
  return { label: describeKindName(kind, tera), tone: KIND_TONES[kind] };
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

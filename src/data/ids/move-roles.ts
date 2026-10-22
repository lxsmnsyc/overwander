/**
 * What a move is cast for, as the AI weighs it. A move may hold several:
 * Fly is damage, a wind-up and a way out of the next hit all at once
 */
export const enum MoveRole {
  // What a status move is cast for
  /** Keeps the damage off: Protect, Substitute, Fly, Wide Guard */
  Shield = 0,
  /** A veil or tempo over the caster's side: screens, Tailwind */
  TeamSetup = 1,
  /** Lies on the foe's side and bites whoever acts there */
  Hazard = 2,
  /** Changes the whole field: weather, terrain, rooms, Gravity */
  Field = 3,
  /** Puts a lasting affliction on a foe: sleep, poison, burn */
  Status = 4,
  /** Takes an option away from a foe: Taunt, Disable, Mean Look */
  Disruption = 5,
  /** Raises the caster's own stages */
  SelfBoost = 6,
  /** Lowers a foe's stages */
  FoeDrop = 7,
  /** Puts health back or clears statuses on the caster's side */
  Heal = 8,
  /** Helps a teammate rather than the caster: Helping Hand, Follow Me */
  Support = 9,
  /** Leaves the field, or ends with the user gone */
  Pivot = 10,
  /** Everything else a move may be cast for: callers, copies, swaps */
  Utility = 11,

  // What a damaging move is, beside the damage itself
  Damage = 12,
  Spread = 13,
  Priority = 14,
  MultiHit = 15,
  /** Spends a step winding up before it lands */
  Charge = 16,
  Recharge = 17,
  Recoil = 18,
  Drain = 19,
  /** Costs the user its life */
  Sacrifice = 20,
  OneHitKO = 21,
  /** Damage set by a formula rather than power */
  FixedDamage = 22,
  /** Locks the user into repeating it */
  LockIn = 23,
  /** Lands later than it is cast */
  Delayed = 24,
  /** May leave a status on what it hits */
  Afflicts = 25,
  /** May lower a stage on what it hits */
  Weakens = 26,
  /** Binds its target for a while */
  Trapping = 27,
}

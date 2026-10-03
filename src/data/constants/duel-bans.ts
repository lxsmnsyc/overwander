/**
 * What a duel host may bar from the fight, as flags packed into one
 * number on the lobby: the one-per-world kinds, and the shapes a held
 * item puts a pokemon into
 */
export const enum DuelBan {
  Legendary = 0b001,
  Mythical = 0b010,
  ItemForms = 0b100,
}

/** Every ban there is, which a stored value is held inside */
export const DUEL_BANS = DuelBan.Legendary | DuelBan.Mythical | DuelBan.ItemForms;

/** The base stat totals a host may cap a fight at, with 0 for no cap */
export const BST_CAPS = [0, 400, 450, 500, 540, 580, 600, 680] as const;

/** The highest cap a lobby may hold */
export const MAX_BST_CAP = 680;

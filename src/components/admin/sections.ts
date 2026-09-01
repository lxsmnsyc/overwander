import { runsTheGame } from '../../auth/staff';

/**
 * What the dashboard is divided into.
 *
 * One list, read by the sidebar for its links and by the header for
 * the title over whatever is open: a section named twice is a section
 * whose two names drift apart.
 */
export interface AdminSection {
  href: string;
  /** What the sidebar calls it, which is one word wherever it can be */
  label: string;
  title: string;
  /** The sentence under the title saying what the section is for */
  lede: string;
  /**
   * Whether it is a screen rather than a section: one opened from
   * another screen, which names the header but is not somewhere the
   * sidebar offers to go
   */
  hidden?: boolean;
  /**
   * Whether it runs the game rather than keeping order in it. A
   * moderator is not offered these and is refused them on the server:
   * handing out legendaries is not what the rank is for
   */
  runs?: boolean;
  /**
   * Whether it is a tool rather than a screen: something that only
   * works on a developer's own machine, and is left off the sidebar
   * of anything built for deployment
   */
  dev?: boolean;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    href: '/admin',
    label: 'Overview',
    title: 'Overview',
    lede: 'What the dashboard reaches, and the account it is being read by.',
  },
  {
    href: '/admin/world',
    label: 'World',
    title: 'World',
    lede: 'The map. Pick a chunk to read what it holds and what its windows rolled.',
  },
  {
    href: '/admin/players',
    label: 'Players',
    title: 'Players',
    lede: 'Every account, newest first. Search by name or address.',
  },
  {
    href: '/admin/raids',
    label: 'Raids',
    title: 'Raids',
    lede: 'Every lobby ever opened, newest window first. Search by the lair it stands in.',
    runs: true,
  },
  {
    href: '/admin/auctions',
    label: 'Auctions',
    title: 'Auctions',
    lede: 'The board as a player reads it, with nothing on it to press.',
    runs: true,
  },
  {
    href: '/admin/gifts',
    label: 'Gifts',
    title: 'Gifts',
    lede: "What is waiting on your own shelf, and the way to put something on somebody else's.",
    runs: true,
  },
  {
    href: '/admin/sprite-processor',
    label: 'Sprites',
    title: 'Sprite Processor',
    lede: 'Pack loose images, a charset or a tileset into a sheet, written straight into public/.',
    runs: true,
    dev: true,
  },
  {
    href: '/admin/player',
    label: 'Player',
    title: 'Player',
    lede: 'One account, as the game holds it and as the player sees it.',
    hidden: true,
  },
];

/**
 * The sections this account is offered. What a moderator cannot use
 * is left off rather than shown and refused: a sidebar of doors that
 * open onto a refusal is a worse answer than a shorter sidebar
 */
export function linksFor(role: string): AdminSection[] {
  return ADMIN_SECTIONS.filter(
    (entry) =>
      entry.hidden !== true &&
      (entry.runs !== true || runsTheGame(role)) &&
      // A tool that writes into the working tree is a door onto
      // nothing anywhere else, so it is not offered there
      (entry.dev !== true || import.meta.env.DEV),
  );
}

/**
 * The section a path is standing in. The longest matching href wins,
 * so `/admin/players` is Players rather than Overview — every section
 * lives under the overview's own path. A screen opened from another
 * one matches by prefix, since `/admin/player/{uid}` is a page of the
 * Player screen rather than a section of its own
 */
export function sectionFor(path: string): AdminSection {
  const trimmed = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  let found = ADMIN_SECTIONS[0];

  for (const section of ADMIN_SECTIONS) {
    const stands = trimmed === section.href || trimmed.startsWith(`${section.href}/`);

    if (stands && section.href.length >= found.href.length) {
      found = section;
    }
  }
  return found;
}

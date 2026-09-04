import type { Component } from 'solid-js';

/**
 * The release pages, newest first.
 *
 * The pages are the ones under `docs/update`, compiled into components
 * at build time: the same words a reader gets on the repository, drawn
 * through the game's own markup rather than parsed in the browser.
 *
 * Their order and the line under each name are `docs/update.md`'s own.
 * That page is already written newest first for somebody arriving from
 * the README, and a second list here is a second thing to forget when
 * a release lands.
 */

import index from '../../../docs/update.md?raw';

const PAGES = import.meta.glob<{ default: Component }>('../../../docs/update/*.md', {
  eager: true,
});

/** One release, as the feed reads it. */
export interface Release {
  /** The page's own file name, which is what the index links to. */
  id: string;
  name: string;
  /** The index's one line on what the release brought. */
  brought: string;
  /** The page itself, compiled. */
  page: Component;
}

/** A row of the index's table: the name, the page it links to, and the line. */
const ROW = /\[([^\]]+)]\(update\/([a-z0-9-]+)\.md\)\s*\|\s*([^|]+?)\s*\|/g;

function read(): Release[] {
  const pages = new Map<string, Component>();

  for (const [path, page] of Object.entries(PAGES)) {
    pages.set(path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, ''), page.default);
  }

  const listed: Release[] = [];

  for (const [, name, id, brought] of index.matchAll(ROW)) {
    const page = pages.get(id);

    if (page == null) {
      continue;
    }
    pages.delete(id);
    listed.push({ id, name, brought, page });
  }

  // A page the index has not been told about still ships, at the end:
  // where it belongs in the order is exactly what is missing, and
  // dropping it would hide the omission rather than show it
  for (const [id, page] of pages) {
    listed.push({ id, name: id, brought: '', page });
  }

  return listed;
}

/** Every release there is, newest first. */
export const RELEASES: Release[] = read();

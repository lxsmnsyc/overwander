import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Dynamic, renderToString } from 'solid-js/web';
import { MDXProvider } from 'solid-marked';
import BUILTINS from '../src/components/news/markdown';
import { RELEASES } from '../src/components/news/releases';

/**
 * The news feed is the release pages under `docs/update`, compiled at
 * build time and ordered by the index that lists them. What these
 * check is that the two agree, and that a page is drawn through the
 * game's own components rather than as bare markup.
 */

const INDEX = readFileSync('docs/update.md', 'utf8');

describe('the news feed', () => {
  it('carries every release page there is', () => {
    const pages = readdirSync('docs/update')
      .filter((file) => file.endsWith('.md'))
      .map((file) => file.replace(/\.md$/, ''))
      .sort();

    expect([...RELEASES.map((release) => release.id)].sort()).toEqual(pages);
  });

  it('reads in the order the releases page lists them, which is newest first', () => {
    const listed = [...INDEX.matchAll(/\(update\/([a-z0-9-]+)\.md\)/g)].map((found) => found[1]);

    expect(RELEASES.slice(0, listed.length).map((release) => release.id)).toEqual(listed);
  });

  it('takes each name and the line under it from the index', () => {
    for (const release of RELEASES) {
      expect(INDEX, release.id).toContain(`[${release.name}](update/${release.id}.md)`);
      expect(INDEX, release.id).toContain(release.brought);
    }
  });
});

describe('a page of a release', () => {
  /** What the feed would draw for one of them. */
  function drawn(page: (typeof RELEASES)[number]['page']): string {
    return renderToString(() => (
      <MDXProvider builtins={BUILTINS}>
        <Dynamic component={page} />
      </MDXProvider>
    ));
  }

  it('draws each construct through the components the game supplies', () => {
    const html = drawn(RELEASES[0].page);

    // A heading keeps the slug it is linked by
    expect(html).toContain('<h1');
    expect(html).toContain('id="');
    // The game's own lists drop their markers, and prose wants them back
    expect(html).toContain('list-disc');
    expect(html).toContain('<strong');
    // Drawn rather than dumped in: nothing here is set as raw HTML
    expect(html).not.toContain('&lt;');
  });
});

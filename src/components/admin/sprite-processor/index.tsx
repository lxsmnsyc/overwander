import { type JSX, Show } from 'solid-js';

import { Status, TabBar, TabButton, TabGroup, TabPane } from '../../styled';
import { canProcessSprites } from '../../../auth/sprites';

import { BiomeForm } from './biome';
import ExtrasForm from './extras';
import GraftForm from './graft';
import PmdForm from './pmd';
import PokengineForm from './pokengine';
import RecolorForm from './recolor';

/**
 * The sprite processor: a PMD archive, loose images or a character
 * sheet packed on the server and written straight into `public/`.
 *
 * A **development tool** rather than a staff screen: a deployed build
 * serves `public/` from a bundle, and a server that could write its
 * own asset root is a hole. The server refuses either way and the page
 * says so rather than offering a button that cannot work.
 *
 * Each half is an ordinary form, so the files ride in a multipart
 * body: the server functions take `FormData`
 */

/** Which of the three the page is on. */
const enum Mode {
  Pmd = 0,
  Extras = 1,
  Pokengine = 2,
  Tileset = 3,
  Recolor = 4,
  Graft = 5,
}

export default function SpriteProcessor(): JSX.Element {
  return (
    <Show
      when={canProcessSprites()}
      fallback={
        <Status
          message="The sprite processor only runs on a development build: it writes into public/,
            which a deployed build serves out of a bundle."
          tone="alert"
        />
      }
    >
      <TabGroup horizontal defaultValue={Mode.Pmd} class="flex flex-col gap-3">
        <TabBar>
          <TabButton value={Mode.Pmd}>PMD</TabButton>
          <TabButton value={Mode.Extras}>Loose images</TabButton>
          <TabButton value={Mode.Pokengine}>Pokengine</TabButton>
          <TabButton value={Mode.Tileset}>Biome</TabButton>
          <TabButton value={Mode.Recolor}>Palette swap</TabButton>
          <TabButton value={Mode.Graft}>Borrow a wall</TabButton>
        </TabBar>
        <TabPane value={Mode.Pmd}>
          <PmdForm />
        </TabPane>
        <TabPane value={Mode.Extras}>
          <ExtrasForm />
        </TabPane>
        <TabPane value={Mode.Pokengine}>
          <PokengineForm />
        </TabPane>
        <TabPane value={Mode.Tileset}>
          <BiomeForm />
        </TabPane>
        <TabPane value={Mode.Recolor}>
          <RecolorForm />
        </TabPane>
        <TabPane value={Mode.Graft}>
          <GraftForm />
        </TabPane>
      </TabGroup>
    </Show>
  );
}

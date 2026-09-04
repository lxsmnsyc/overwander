import { useSearchParams } from '@solidjs/router';
import { type JSX, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import { MoveTargetType } from '../../battle/events';
import {
  type DemoRules,
  type MoveDemo as Staged,
  aimFor,
  createMoveDemo,
} from '../../battle/demo-move';
import BattleField from '../battle/BattleField';
import { Badge, Button, Combobox, Meta, Note, Row, Switch } from '../styled';
import { MOVE_CATEGORY_NAMES, type Moves } from '../../data/ids/moves';
import { TYPE_NAMES } from '../../data/constants/types';
import { getMoveData, getRegisteredMoves } from '../../data/moves';

/**
 * One move, on demand.
 *
 * The whole of it runs in the browser — the route loads it with
 * `clientOnly` — because everything on the page is a live thing: an
 * engine ticking, a canvas drawing, sheets arriving. There is nothing
 * here a server could usefully render and nothing for it to match.
 *
 * A move is the hardest thing in the game to watch on purpose. It has
 * to be known by a pokemon that is standing in a fight, chosen over
 * everything else that pokemon could do, and aimed at somebody who is
 * still up — which is three unrelated accidents between wanting to
 * see Fire Blast and seeing it. This page removes all three: pick the
 * move, press the button, watch it.
 *
 * The fight is a **demo** battle — no outcome, no AI — so nothing
 * happens except what is asked for and nothing ends. Everything else
 * is the engine as it ships, which is the only thing that makes a
 * page like this worth having: what is being watched has to be what
 * the game does.
 *
 * The move is in the address, so a link is a demonstration.
 */

/**
 * How often the readout re-reads the units the engine mutates. Short
 * enough to catch a cooldown ending: a move cools in a second or so,
 * and a button that stays grey for a quarter of it afterwards reads as
 * a button that does not work
 */
const POLL_INTERVAL = 120;

/**
 * What a bare `/demo/move` opens on: the plainest move there is, so
 * the page has something staged before anybody has chosen anything
 */
const DEFAULT_MOVE = 'Tackle';

export default function MoveDemo(): JSX.Element {
  const [params, setParams] = useSearchParams<{ move?: string }>();

  /**
   * Every move there is, by name. Built once: the registry is fixed at
   * boot and the list is long enough that rebuilding it per keystroke
   * would be felt
   */
  const moves = createMemo(() =>
    getRegisteredMoves()
      .map((move) => ({ value: move, label: getMoveData(move).name }))
      .sort((left, right) => left.label.localeCompare(right.label)),
  );

  /**
   * Which move is being looked at. It comes out of the address by
   * name rather than by id, so a link says what it demonstrates
   */
  const chosen = (): Moves | null => {
    const wanted = params.move ?? DEFAULT_MOVE;

    return moves().find((entry) => entry.label === wanted)?.value ?? null;
  };

  /**
   * What the demo bends, handed to every battle this page stages.
   * One object rather than a signal read while staging: turning a
   * switch should change the next cast, not tear the fight down and
   * build it again
   */
  const rules: DemoRules = { alwaysHits: true };
  const [hits, setHits] = createSignal(rules.alwaysHits);

  const [staged, setStaged] = createSignal<Staged | null>(null);
  const [revision, setRevision] = createSignal(0);
  const [restaged, setRestaged] = createSignal(0);

  createEffect(() => {
    const move = chosen();

    // Read so pressing Reset stages the same move again
    restaged();
    if (move == null) {
      setStaged(null);
      return;
    }

    const demo = createMoveDemo(move, rules);

    // Initialized but not started: the field starts it once every
    // sheet has arrived, the way a real fight waits
    demo.battle.initialize();
    setStaged(demo);

    // A battle left running would go on ticking behind whatever
    // replaced it — another move, or the page being left
    onCleanup(() => {
      demo.battle.end();
    });
  });

  createEffect(() => {
    if (staged() == null) {
      return;
    }

    const timer = setInterval(() => {
      setRevision((count) => count + 1);
    }, POLL_INTERVAL);

    onCleanup(() => {
      clearInterval(timer);
    });
  });

  /**
   * What the move is, in the terms the engine resolves it in. It is
   * the description a player reads plus the numbers a demo is for
   */
  const detail = (): JSX.Element => {
    const move = chosen();

    if (move == null) {
      return <Note>No such move.</Note>;
    }

    const data = getMoveData(move);

    return (
      <>
        <Row>
          <Badge tone="tide">{TYPE_NAMES[data.type]}</Badge>
          <Badge>{MOVE_CATEGORY_NAMES[data.category]}</Badge>
          <Show when={data.power != null}>
            <Badge tone="ember">{data.power} power</Badge>
          </Show>
          {/* Said as the move has it, and again as the page is
              currently resolving it: a switch that quietly makes the
              number above it wrong is worse than no switch */}
          <Badge tone="gold">
            {data.accuracy == null
              ? 'never misses'
              : `${data.accuracy}% accurate${hits() ? ', forced' : ''}`}
          </Badge>
          <Meta>{data.pp} PP</Meta>
        </Row>
        <Note>{data.description}</Note>
      </>
    );
  };

  /** Where this move goes, in a line under the buttons */
  const aiming = (demo: Staged): string => {
    const move = chosen();
    const aim = move == null ? null : aimFor(demo, move);

    if (aim?.type === MoveTargetType.Team) {
      return demo.allied
        ? 'Aimed at its own team: the dummies stand together.'
        : 'Aimed at the other team: the dummies stand apart.';
    }
    if (aim?.type === MoveTargetType.Unit && aim.unit === demo.caster) {
      return 'Aimed at itself: the other dummy is only standing there.';
    }
    return demo.allied
      ? 'Aimed along its own side: the dummies stand together.'
      : 'Aimed across the field: the dummies stand apart.';
  };

  /** Whether the dummies are up to being cast at again */
  const standing = (): boolean => {
    revision();

    const demo = staged();

    return demo?.caster.alive === true && demo.target.alive;
  };

  /**
   * Whether pressing Cast would do anything.
   *
   * Asked of the engine rather than guessed at, because the engine is
   * what refuses: a caster part-way through a cast, or one whose move
   * has not cooled, drops the cast on the floor. Without this the
   * button looked broken — the second press did nothing and said
   * nothing about why
   */
  const ready = (): boolean => {
    revision();

    const demo = staged();
    const move = chosen();

    return demo != null && move != null && demo.caster.checkCanCast(move, aimFor(demo, move));
  };

  /** What it is waiting for, when it is not ready. */
  const waiting = (): string | null => {
    revision();

    const demo = staged();

    if (demo == null || ready() || !standing()) {
      return null;
    }
    if (demo.caster.casting != null || demo.caster.channeling != null) {
      return 'Casting…';
    }
    return 'Cooling down…';
  };

  const cast = (): void => {
    const demo = staged();
    const move = chosen();

    if (demo == null || move == null) {
      return;
    }
    // Aimed by hand rather than by the AI that is not here, and aimed
    // the way the move's own flags say: across the field, along it, or
    // at the caster itself
    demo.caster.cast(move, aimFor(demo, move));
  };

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      <div class="flex flex-wrap items-end gap-2">
        <h1 class="grow">Move demo</h1>
        <Combobox
          label="Move"
          class="w-64"
          value={chosen()}
          options={moves()}
          placeholder="Search moves"
          onChange={(move) => {
            setParams({ move: getMoveData(move).name });
          }}
        />
      </div>

      {detail()}

      <Switch
        label="Always hits"
        description="Every cast passes its accuracy roll. A Fissure lands three casts in ten, which is
          a lottery rather than a demonstration."
        checked={hits()}
        onChange={(on) => {
          rules.alwaysHits = on;
          setHits(on);
        }}
      />

      <Row>
        <Button tone="primary" disabled={!standing() || !ready()} onClick={cast}>
          Cast
        </Button>
        <Button
          onClick={() => {
            setRestaged((count) => count + 1);
          }}
        >
          Stage it again
        </Button>
        <Show when={staged()}>{(demo) => <Meta>{aiming(demo())}</Meta>}</Show>
        <Show when={waiting()}>{(said) => <Meta>{said()}</Meta>}</Show>
        <Show when={staged() != null && !standing()}>
          <Meta>Somebody is down. Stage it again to carry on.</Meta>
        </Show>
      </Row>

      {/* Keyed, and it has to be: the field binds to the battle it was
          mounted with — its listeners and its roster are hung on that
          one — so another move needs another field. Left unkeyed, the
          old battle ends and the page goes on drawing it, which looks
          exactly like a demo that has frozen */}
      <Show keyed when={staged()} fallback={<Note>Staging the move…</Note>}>
        {(demo) => (
          <div class="h-[60vh] w-full overflow-hidden rounded-panel border-4 border-tide shadow-pop">
            {/* The caster's own side is drawn at the bottom, which is
                where a player's is: what is being watched is the move
                going out rather than coming in */}
            <BattleField
              battle={demo.battle}
              player="caster"
              onReady={() => {
                demo.battle.start();
              }}
            />
          </div>
        )}
      </Show>

      <Meta>
        Two dummies, no AI and no outcome: nothing acts on its own and nothing here is won. The move
        in the address is what is staged, so a link is a demonstration.
      </Meta>
    </main>
  );
}

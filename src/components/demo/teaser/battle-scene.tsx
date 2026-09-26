import { type JSX, onCleanup } from 'solid-js';
import BattleField from '../../battle/BattleField';
import BattleTopBar from '../../battle/BattleTopBar';
import { EventPriority } from '../../../core/event-emitter';
import { BattleEvents } from '../../../battle/events';
import type { StagedFight } from './staging';

/**
 * A staged fight laid out the way the battle view lays one out: the
 * field as the page and the top bar over it. It starts as soon as the
 * field has its sheets, skipping the view's countdown
 */
export default function BattleScene(props: {
  fight: StagedFight;
  onStart: () => void;
  /** Said whenever the side nobody plays, a boss or a stop, starts a move */
  onFoeCast: () => void;
}): JSX.Element {
  const { battle } = props.fight.built;

  battle.initialize();
  battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
    if (event.source.team.player === '') {
      props.onFoeCast();
    }
  });

  onCleanup(() => {
    battle.end();
  });

  return (
    <section class="absolute inset-0 flex flex-col overflow-hidden">
      <div class="relative min-h-0 grow">
        <BattleField
          battle={battle}
          biome={props.fight.biome}
          player={props.fight.player}
          onReady={() => {
            battle.start();
            props.onStart();
          }}
        />
        <BattleTopBar battle={battle} player={props.fight.player} title={props.fight.title} />
      </div>
    </section>
  );
}

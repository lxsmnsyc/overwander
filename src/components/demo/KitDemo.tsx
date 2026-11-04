import { useSearchParams } from '@solidjs/router';
import { For, type JSX, createSignal, onMount } from 'solid-js';
import {
  Badge,
  type BadgeTone,
  Button,
  type ButtonTone,
  Card,
  Dialog,
  DialogActions,
  DialogSection,
  HoverCard,
  Menu,
  RadioGroup,
  Row,
  Select,
  Slider,
  StatTile,
  Switch,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
  TextField,
  Tooltip,
  createPager,
  useToast,
} from '../styled';

/**
 * Every styled primitive on one page, with nothing read from an
 * account, so the design system can be captured and compared with the
 * Field Kit board. `?dialog` opens the dialog and `?toast` pushes a
 * toast that stays.
 */

const TONES: ButtonTone[] = ['primary', 'ghost', 'danger', 'accent', 'caution', 'quiet', 'pressed'];

const BADGES: BadgeTone[] = ['neutral', 'leaf', 'ember', 'gold', 'tide', 'arcane'];

const PAGED: number[] = [];

for (let at = 0; at < 60; at += 1) {
  PAGED.push(at);
}

/** A menu entry that does nothing, since nothing here is real */
function stay(): void {
  // Picking one only closes the menu
}

export default function KitDemo(): JSX.Element {
  const [search] = useSearchParams();
  const toast = useToast();
  const [open, setOpen] = createSignal(search.dialog != null);
  const [tab, setTab] = createSignal(0);
  const [on, setOn] = createSignal(true);
  const [pick, setPick] = createSignal('walk');
  const [volume, setVolume] = createSignal(0.6);
  const [name, setName] = createSignal('Red');
  const [ball, setBall] = createSignal<string | null>('great');
  const pager = createPager(() => PAGED, 20);
  const [opener, setOpener] = createSignal<HTMLButtonElement>();

  onMount(() => {
    if (search.toast != null) {
      toast.push({
        title: 'Item cache',
        message: 'Three Poke Balls went into the bag.',
        tone: 'leaf',
        duration: 600_000,
      });
    }
  });

  return (
    <main class="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <h1>Field Kit primitives</h1>

      <Card title="Buttons">
        <Row>
          <For each={TONES}>{(tone) => <Button tone={tone}>{tone}</Button>}</For>
          <Button disabled>disabled</Button>
        </Row>
      </Card>

      <Card title="Badges and tiles">
        <Row>
          <For each={BADGES}>{(tone) => <Badge tone={tone}>{tone} 412</Badge>}</For>
        </Row>
        <div class="grid w-64 grid-cols-3 gap-1.5">
          <StatTile label="HP">46</StatTile>
          <StatTile label="Atk">112</StatTile>
          <StatTile label="Spe">98</StatTile>
        </div>
      </Card>

      <Card title="Tabs">
        <TabGroup
          value={tab()}
          onChange={(value) => {
            setTab(value);
          }}
          horizontal
        >
          <TabBar>
            <TabButton value={0}>Level</TabButton>
            <TabButton value={1}>Machines</TabButton>
            <TabButton value={2}>Egg</TabButton>
          </TabBar>
          <TabPane value={0}>Moves learnt by level.</TabPane>
          <TabPane value={1}>Moves taught by machine.</TabPane>
          <TabPane value={2}>Moves passed down in an egg.</TabPane>
        </TabGroup>
      </Card>

      <Card title="Controls">
        <div class="grid gap-4 sm:grid-cols-2">
          <Switch
            label="Reduce motion"
            checked={on()}
            onChange={(value) => {
              setOn(value);
            }}
          />
          <Slider
            label="Music"
            value={volume()}
            onChange={(value) => {
              setVolume(value);
            }}
          />
          <TextField
            label="Trainer name"
            value={name()}
            onChange={(value) => {
              setName(value);
            }}
          />
          <Select
            label="Ball"
            value={ball()}
            onChange={(value) => {
              setBall(value);
            }}
            options={[
              { value: 'poke', label: 'Poke Ball' },
              { value: 'great', label: 'Great Ball' },
              { value: 'ultra', label: 'Ultra Ball' },
            ]}
          />
          <RadioGroup
            label="Pace"
            value={pick()}
            onChange={(value) => {
              setPick(value);
            }}
            options={[
              { value: 'walk', label: 'Walk' },
              { value: 'run', label: 'Run', description: 'Faster, and louder' },
            ]}
          />
        </div>
      </Card>

      <Card title="Floating">
        <Row>
          <Menu
            label="Actions"
            heading="Move to"
            actions={[
              { label: 'Box 1', checked: true, onSelect: stay },
              { label: 'Box 2', note: '12', onSelect: stay },
              { label: 'Release', tone: 'danger', separated: true, onSelect: stay },
            ]}
          />
          <HoverCard
            title="Great Ball"
            kind="Item"
            description="A good ball, better than a Poke Ball."
            trigger={
              <span class="kit-hover rounded-xl border-2 border-line bg-paper p-3">Hover</span>
            }
          >
            <p class="m-0">In the bag: 12</p>
          </HoverCard>
          <Button
            tone="accent"
            onClick={() => {
              toast.push({ title: 'Berry patch', message: 'Two Oran Berries picked.' });
            }}
          >
            Toast
          </Button>
          <button
            ref={(element) => {
              setOpener(element);
            }}
            type="button"
            class="kit-open"
            onClick={() => {
              setOpen(true);
            }}
          >
            Open dialog
          </button>
        </Row>
        <Tooltip
          name="Overgrow"
          kind="ability"
          description="Grass moves hit harder below a third."
        />
      </Card>

      <Card title="Pager">
        <Row>
          <For each={pager.shown()}>{(at) => <Badge>{at}</Badge>}</For>
        </Row>
        {pager.controls({ range: true })}
      </Card>

      <Dialog
        isOpen={open()}
        onClose={() => {
          setOpen(false);
        }}
        origin={opener()}
        title="Pokédex"
        description="Every species met on the road."
        width="wide"
      >
        <DialogSection title="Base stats">
          <p class="m-0">Its tail flame flares when it lands a critical hit.</p>
        </DialogSection>
        <DialogActions>
          <Button tone="primary">Throw</Button>
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}

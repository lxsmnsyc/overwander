import {
  type Accessor,
  type JSX,
  type ParentProps,
  createContext,
  createEffect,
  onCleanup,
  useContext,
} from 'solid-js';
import { useAuth } from '../../auth/context';
import type Weather from '../../data/overworld/weather';
import type { EncounterRecord } from '../../model/encounter-record';
import type { Notice } from '../../auth/notifications';
import type { PositionRecord } from '../../model/position-record';
import type { Species } from '../../data/ids/species';
import type { WalkReport } from '../../auth/eggs';
import { AWARD_NAMES } from '../../data/awards';
import { getItemData } from '../../data/items';
import type { WritableStore } from '../../game/store';
import createSession, {
  type ActiveBattle,
  type AuctionSubject,
  type FieldMoveOffer,
  GameDialog,
  type OpenSheet,
  type PendingReward,
  type Spoils,
} from '../../game/session';
import type ProfileSection from '../../game/session/profile-section';
import type { Depth } from '../../overworld/depth';
import ItemSprite from '../items/ItemSprite';
import playEffect, { Effect, playEffectAfter } from './sound';
import createStoreSignal from './store-signal';
import { useToast } from '../styled';

export {
  type ActiveBattle,
  type FieldMoveOffer,
  GameDialog,
  type OpenSheet,
  type PendingReward,
  type Spoils,
};

export interface GameState {
  dialog: Accessor<GameDialog>;
  setDialog: (value: GameDialog) => void;
  /**
   * Where the player is standing, or null while it is still being
   * found out.
   *
   * It lives above the overworld because the map dialog needs it too
   * and a dialog is not mounted until it is opened. It is read once
   * here, and the overworld publishes every step back to it
   */
  position: Accessor<PositionRecord | null>;
  setPosition: (value: PositionRecord | null) => void;
  /**
   * Where the walk went when it went to another screen, or null while
   * this one still has it.
   *
   * A player signed in twice writes one row from two boards. Rather
   * than let the two drag each other back and forth, the screen that
   * finds the row standing in a chunk it is not in stands down: it
   * stops walking and says so, and stays that way until somebody takes
   * the walk back here
   */
  elsewhere: Accessor<PositionRecord | null>;
  /**
   * Take the walk back onto this screen. Writes where it stands, which
   * is what stands the other screen down in turn
   */
  takeWalk: () => void;
  /**
   * Stand where the row already says this player is.
   *
   * A staff teleport writes the row from the server, and a screen
   * that read it as a second screen's walk would fence itself off
   * instead of moving. The stamp is taken as this screen's own, so
   * the news of it arriving changes nothing
   */
  standHere: (at: PositionRecord) => void;
  /**
   * The last place the player was put by something other than a walk.
   *
   * The board keeps its own coordinates once it has been placed, so
   * being moved has to reach it as news rather than through the
   * position alone
   */
  moved: Accessor<PositionRecord | null>;
  /**
   * Write down where the player is standing. It goes through here
   * rather than straight to the store so the stamp is kept: a device
   * that could not recognise its own writes coming back around the
   * subscription would stand itself down mid-walk
   */
  saveWalk: (chunkX: number, chunkY: number, cellX: number, cellY: number, depth: Depth) => void;
  /** `saveWalk` with the paces walked since the last step report, resolving what they came to */
  settleWalk: (
    chunkX: number,
    chunkY: number,
    cellX: number,
    cellY: number,
    depth: Depth,
    steps: number,
  ) => Promise<WalkReport | null>;
  /**
   * Where that is, in words: the country and the chunk's coordinates.
   *
   * It was painted into the corner of the map, which is the one place
   * on the screen the map cannot spare — a caption over the board sits
   * on top of whatever cell is under it, and the board is the game. It
   * belongs in the menu with the rest of the furniture, and the menu
   * is a sibling of the overworld rather than a child of it, so the
   * words travel through here.
   *
   * Null while the chunk is still being read
   */
  place: Accessor<string | null>;
  setPlace: (value: string | null) => void;
  /**
   * What the sky over that place is doing, travelling the same way the
   * words for the place do and for the same reason. Null while the
   * chunk is still being read
   */
  weather: Accessor<Weather | null>;
  setWeather: (value: Weather | null) => void;
  /**
   * The buddy's field moves usable right here, travelling from the board
   * to the menu bar the way the place's name does. Empty off the board
   */
  fieldMoves: Accessor<FieldMoveOffer[]>;
  setFieldMoves: (value: FieldMoveOffer[]) => void;
  /**
   * The raid lobby the player is in, shown inside the raids dialog
   */
  raid: Accessor<string | null>;
  setRaid: (value: string | null) => void;
  /**
   * The battle lobby the player is in, shown inside the battles
   * dialog the same way a raid lobby fills the raids one
   */
  duel: Accessor<string | null>;
  setDuel: (value: string | null) => void;
  /**
   * The battle in progress. While one is set, it takes the whole
   * page — world, bar and all
   */
  battle: Accessor<ActiveBattle | null>;
  setBattle: (value: ActiveBattle | null) => void;
  reward: Accessor<PendingReward | null>;
  setReward: (value: PendingReward | null) => void;
  /** What the fight on screen paid, once it is claimed */
  spoils: Accessor<Spoils | null>;
  setSpoils: (value: Spoils | null) => void;
  /**
   * What a cleared raid or a beaten grunt left standing, once it has
   * been collected: the encounter the player is about to meet.
   *
   * It is claimed here rather than in the overworld because the
   * overworld is not on screen when it is won — the battle has the
   * page — and an effect that only runs once its component mounts
   * turns "the moment you leave the fight" into "a moment after the
   * world has drawn itself again"
   */
  encounter: Accessor<EncounterRecord | null>;
  setEncounter: (value: EncounterRecord | null) => void;
  /**
   * The catch sheet, which is a screen rather than a panel.
   *
   * It lives here because of where it is opened from: a list inside
   * the profile dialog, and another inside the auctions dialog. A
   * sheet rendered where it was opened is a dialog inside a dialog —
   * a panel on a panel, boxed into whatever room the one underneath
   * left it. Opened from here it is the only thing on the screen,
   * which is what a whole record needs
   */
  sheet: Accessor<OpenSheet | null>;
  setSheet: (value: OpenSheet | null) => void;
  /**
   * A lot being put up, from wherever it was chosen
   */
  listing: Accessor<AuctionSubject | null>;
  setListing: (value: AuctionSubject | null) => void;
  /**
   * Somebody else's profile, by uid, or null when nobody's is open.
   *
   * It lives here for the reason the catch sheet does: a trainer is
   * met in the middle of something — a lobby they have joined, a lot
   * they listed — and their profile opens over the panel that named
   * them rather than inside it. It is never the reader's own uid; the
   * player's own profile is the menu's, with everything that can be
   * pressed still on it
   */
  visiting: Accessor<string | null>;
  setVisiting: (value: string | null) => void;
  /**
   * Which part of the player's **own** profile to open at, or null to
   * open it where it always opens.
   *
   * A notice about a trade says "Open trades", and the profile is
   * where trades are answered: without this it opened on the battles
   * tab and the button read as one that had done nothing
   */
  profileAt: Accessor<ProfileSection | null>;
  setProfileAt: (value: ProfileSection | null) => void;
  /**
   * The friend a trade is being offered to, or null when none is.
   *
   * It lives here for the reason `visiting` does: the offer starts
   * wherever the friend was found — their row in the list, their
   * profile — and the dialog opens over that rather than inside it
   */
  trading: Accessor<string | null>;
  setTrading: (value: string | null) => void;
  /**
   * The species whose dex entry is open, or null when none is.
   *
   * It travels the same road the catch sheet does and for the same
   * reason: an entry is a screen rather than a panel, and it is opened
   * from the dex — which is itself a dialog — so drawn where it was
   * asked for it would be a panel boxed inside another panel's room
   */
  dexEntry: Accessor<Species | null>;
  setDexEntry: (value: Species | null) => void;
  /**
   * The species whose **forms** are being looked through, if any.
   *
   * A pokemon with forms has one row in the printed dex, so pressing
   * that row opens the forms rather than an entry: which of the
   * twenty-eight is meant has not been said yet, and each of them has
   * a page of its own on the other side of this one
   */
  dexForms: Accessor<Species | null>;
  setDexForms: (value: Species | null) => void;
  /**
   * Bumped whenever a record changes under a list that is showing:
   * an evolution renames a row, a release takes one away, a listing
   * puts one in escrow. Lists watch it rather than being handed a
   * callback through every dialog between them and the change
   */
  records: Accessor<number>;
  touchRecords: () => void;
  /**
   * Everything waiting on the player: invitations, requests, offers
   * and whatever the auction house owes them.
   *
   * It is followed here rather than in the panel that lists it, for
   * the reason `position` is: a panel that is not open watches
   * nothing, and an invitation nobody is told about is one nobody
   * answers. The menu reads the count off it and the notifications
   * panel draws it
   */
  notices: Accessor<Notice[]>;
}

const GameContext = createContext<GameState>();

/** How long after one quest's tune another is held back, in milliseconds */
const QUEST_SOUND_GAP = 3000;

export function useGame(): GameState {
  const state = useContext(GameContext);

  if (state == null) {
    throw new Error('useGame must be used inside GameProvider');
  }
  return state;
}

/** A store's value and its setter, the way a component reads and writes it */
function storeSignal<T>(store: WritableStore<T>): [Accessor<T>, (value: T) => void] {
  return [createStoreSignal(store), store.set];
}

/**
 * The game's session (`src/game/session`) as Solid signals, for the
 * components below. The session holds the state and the rules; this
 * says and plays what it asks for, and starts it for whoever signs in
 */
export default function GameProvider(
  props: ParentProps<{
    /**
     * Mounted by the staff dashboard for the game's panels alone. Staff
     * there are managing, not playing: nothing is walked, chimed or
     * claimed on their behalf
     */
    managing?: boolean;
  }>,
): JSX.Element {
  const auth = useAuth();
  const toast = useToast();
  // One tune for a sweep however many quests came due in it: several
  // at once would be the same sound over itself
  let questSoundedAt = 0;

  const session = createSession({
    questDue: (name) => {
      toast.push({ title: 'Quest complete', message: `${name} is ready to claim.`, tone: 'leaf' });
      if (Date.now() - questSoundedAt > QUEST_SOUND_GAP) {
        questSoundedAt = Date.now();
        playEffect(Effect.QuestComplete);
      }
    },
    notice: () => {
      playEffect(Effect.Notice);
    },
    // The claim lands while the win's own fanfare is still going, so the march waits for it
    trainerBeaten: () => {
      playEffectAfter(Effect.TrainerBeaten, Effect.BattleWon);
    },
    paidInPassing: (paid) => {
      if (paid.seat === 'freed') {
        toast.push({
          title: 'The seat is open',
          message:
            paid.gold > 0 ? `You beat them off it. +${paid.gold} gold` : 'You beat them off it.',
          tone: 'leaf',
        });
      } else if (paid.seat === 'held') {
        toast.push({
          message:
            paid.gold < 0
              ? `Their line-up held. −${-paid.gold} gold`
              : 'Their line-up held. The seat stays theirs.',
          tone: 'ember',
        });
      } else if (paid.gold > 0) {
        toast.push({ message: `The purse is yours. +${paid.gold} gold`, tone: 'leaf' });
      }
      if (paid.award != null) {
        toast.push({ title: AWARD_NAMES[paid.award], message: 'Yours, for good.', tone: 'leaf' });
      }
      for (const { item: won, amount } of paid.items) {
        toast.push({
          title: amount > 1 ? `${getItemData(won).name} ×${amount}` : getItemData(won).name,
          message: 'Left behind by the fight.',
          art: () => <ItemSprite item={won} size={24} label="" />,
          tone: 'leaf',
        });
      }
    },
  });

  createEffect(() => {
    // Who is playing on this screen, which on the dashboard is nobody
    const user = props.managing === true ? null : auth.user();

    if (user != null) {
      onCleanup(session.start(user));
    }
  });

  const [dialog, setDialog] = storeSignal(session.dialog);
  const [position, setPosition] = storeSignal(session.position);
  const [place, setPlace] = storeSignal(session.place);
  const [weather, setWeather] = storeSignal(session.weather);
  const [fieldMoves, setFieldMoves] = storeSignal(session.fieldMoves);
  const [raid, setRaid] = storeSignal(session.raid);
  const [duel, setDuel] = storeSignal(session.duel);
  const [battle, setBattle] = storeSignal(session.battle);
  const [reward, setReward] = storeSignal(session.reward);
  const [spoils, setSpoils] = storeSignal(session.spoils);
  const [encounter, setEncounter] = storeSignal(session.encounter);
  const [sheet, setSheet] = storeSignal(session.sheet);
  const [listing, setListing] = storeSignal(session.listing);
  const [visiting, setVisiting] = storeSignal(session.visiting);
  const [profileAt, setProfileAt] = storeSignal(session.profileAt);
  const [trading, setTrading] = storeSignal(session.trading);
  const [dexEntry, setDexEntry] = storeSignal(session.dexEntry);
  const [dexForms, setDexForms] = storeSignal(session.dexForms);

  return (
    <GameContext.Provider
      value={{
        dialog,
        setDialog,
        position,
        setPosition,
        elsewhere: createStoreSignal(session.elsewhere),
        standHere: session.standHere,
        moved: createStoreSignal(session.moved),
        takeWalk: session.takeWalk,
        saveWalk: session.saveWalk,
        settleWalk: session.settleWalk,
        place,
        setPlace,
        weather,
        setWeather,
        fieldMoves,
        setFieldMoves,
        raid,
        setRaid,
        duel,
        setDuel,
        battle,
        setBattle,
        reward,
        setReward,
        spoils,
        setSpoils,
        encounter,
        setEncounter,
        sheet,
        setSheet,
        listing,
        setListing,
        visiting,
        setVisiting,
        profileAt,
        setProfileAt,
        trading,
        setTrading,
        dexEntry,
        setDexEntry,
        dexForms,
        setDexForms,
        records: createStoreSignal(session.records),
        touchRecords: session.touchRecords,
        notices: createStoreSignal(session.notices),
      }}
    >
      {props.children}
    </GameContext.Provider>
  );
}

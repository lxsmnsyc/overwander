import Npc from '../../../data/overworld/npc';
import breeder from './scripts/breeder';
import channeler from './scripts/channeler';
import daycare from './scripts/daycare';
import dojo from './scripts/dojo';
import groomer from './scripts/groomer';
import hyper from './scripts/hyper';
import kurt from './scripts/kurt';
import maniac from './scripts/maniac';
import nurse from './scripts/nurse';
import reminder from './scripts/reminder';
import scientist from './scripts/scientist';
import shop from './scripts/shop';
import trader from './scripts/trader';
import tutor from './scripts/tutor';
import type { NpcScript } from './visit';

/**
 * What each role does when walked up to. The grunt and the trainer are
 * left out: they are met through a challenge rather than a conversation
 */
const NPC_SCRIPTS: Partial<Record<Npc, NpcScript>> = {
  [Npc.Breeder]: breeder,
  [Npc.DaycareLady]: daycare,
  [Npc.NurseJoy]: nurse,
  [Npc.Groomer]: groomer,
  [Npc.Vendor]: shop,
  [Npc.MoveReminder]: reminder,
  [Npc.FossilManiac]: maniac,
  [Npc.FossilScientist]: scientist,
  [Npc.MoveTutor]: tutor,
  [Npc.Chef]: shop,
  [Npc.Channeler]: channeler,
  [Npc.Kurt]: kurt,
  [Npc.Geologist]: shop,
  [Npc.DojoMaster]: dojo,
  [Npc.Trader]: trader,
  [Npc.HyperTrainer]: hyper,
};

export default NPC_SCRIPTS;

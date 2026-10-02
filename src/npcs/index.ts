import Npc from '../data/ids/npcs';
import type { NpcDefinition } from './create';
import breeder from './breeder';
import daycareLady from './daycare-lady';
import nurseJoy from './nurse-joy';
import groomer from './groomer';
import vendor from './vendor';
import moveReminder from './move-reminder';
import rocketGrunt from './rocket-grunt';
import fossilManiac from './fossil-maniac';
import fossilScientist from './fossil-scientist';
import moveTutor from './move-tutor';
import trainer from './trainer';
import chef from './chef';
import channeler from './channeler';
import kurt from './kurt';
import geologist from './geologist';
import dojoMaster from './dojo-master';
import trader from './trader';
import hyperTrainer from './hyper-trainer';

export { type NpcDefinition, type NpcScript, type NpcVisit, createNpc } from './create';

/**
 * Every role, each defined in its own folder: who they are in its
 * `index.ts`, what they do in the script it loads. A `Record` so a role
 * cannot be added without one
 */
const NPC_DEFINITIONS: Record<Npc, NpcDefinition> = {
  [Npc.Breeder]: breeder,
  [Npc.DaycareLady]: daycareLady,
  [Npc.NurseJoy]: nurseJoy,
  [Npc.Groomer]: groomer,
  [Npc.Vendor]: vendor,
  [Npc.MoveReminder]: moveReminder,
  [Npc.RocketGrunt]: rocketGrunt,
  [Npc.FossilManiac]: fossilManiac,
  [Npc.FossilScientist]: fossilScientist,
  [Npc.MoveTutor]: moveTutor,
  [Npc.Trainer]: trainer,
  [Npc.Chef]: chef,
  [Npc.Channeler]: channeler,
  [Npc.Kurt]: kurt,
  [Npc.Geologist]: geologist,
  [Npc.DojoMaster]: dojoMaster,
  [Npc.Trader]: trader,
  [Npc.HyperTrainer]: hyperTrainer,
};

/** Who a role is, what they say, what they wear and what they do */
export function getNpc(npc: Npc): NpcDefinition {
  return NPC_DEFINITIONS[npc];
}

/** Every role, in id order */
export function npcDefinitions(): NpcDefinition[] {
  const all: NpcDefinition[] = [];

  for (const definition of Object.values(NPC_DEFINITIONS)) {
    all.push(definition);
  }
  return all;
}

/**
 * Everyone who wanders, for uniform rolls over the variants, in id
 * order. The roll is world generation: who stands on a wandering cell
 * is an index into this list
 */
export const NPCS: Npc[] = [];

/** The people who keep a crate to buy from, and take what a player sells */
export const TRADERS = new Set<Npc>();

/** The wanderers who serve a player once a window, and the visit marker the server takes for it */
export const NPC_VISIT_TAGS = new Map<Npc, string>();

for (const definition of npcDefinitions()) {
  if (definition.wanders === true) {
    NPCS.push(definition.id);
  }
  if (definition.shop === true) {
    TRADERS.add(definition.id);
  }
  if (definition.visit != null) {
    NPC_VISIT_TAGS.set(definition.id, definition.visit);
  }
}

/** What a role is called */
export function npcName(npc: Npc): string {
  return getNpc(npc).name;
}

/** Every charset a wanderer of this role may be drawn with */
export function npcSheets(npc: Npc): string[] {
  return getNpc(npc).sprites;
}

/** The role's first style, for anywhere that has no window to roll one */
export function npcSheet(npc: Npc): string {
  return npcSheets(npc)[0];
}

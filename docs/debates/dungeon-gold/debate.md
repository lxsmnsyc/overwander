---
goal: Set the gold each dungeon kind pays, in line with today's stop and raid purses
date: 2026-10-29
rounds: 1 of 1
status: proposed
roadmap: none (feeds docs/strategy/dungeons.md, Prizes, and batch 12 of docs/roadmaps/overwander)
supersedes: none
decision: none
---

# Debate: Set the gold each dungeon kind pays, in line with today's stop and raid purses

A short debate: one round, claims and rulings written by the orchestrator, no subagents. The ledger is `ledger.json` beside this file.

## Settled structure

- **A fight pays what the same foe pays as a stop** (P1). A grunt in a hideout pays a grunt's purse, an elite in the tower pays an elite's. The run's end pays its boss's purse.
- **Once per window** (P6). Each fight's purse is keyed by the dungeon, the window, the floor, the room and the player, the way a stop's purse is. A run restarted after a loss refights for nothing it was already paid.
- **At most 2 paying fights in the rooms of a floor**, plus the stairs' guard (ruling on O1), so a floor's purse stays near one executive's.
- **Lair hordes** (P2) pay 10k to 25k, the stairs' horde 25k to 60k, and the legendary 80k, the Legendary raid's purse.
- **The Endless Stair pays no gold per floor** (P7). Each 8th floor pays once per account, the first time it is reached: 2,500 gold times the floor, so 20k at floor 8 and 200k at floor 80.
- **Companion Trail trainers** (P4) pay half the type-trainer band, 2,500 to 7,500.
- **Luck Incense** doubles each purse, as it does every purse today (J6).

| Kind | Rooms (each fight) | Stairs guard | End | A run's mean |
| --- | --- | --- | --- | --- |
| Hideout, 3 to 5 floors | Grunt, 5k to 15k | Executive, 40k to 90k | Boss, 120k to 250k | 440k to 610k |
| Legendary lair, 3 to 7 floors | Horde, 10k to 25k | Horde, 25k to 60k | Legendary, 80k | 310k to 620k |
| Elite Four tower, 4 floors | Ace trainer, 25k to 60k | Member, 50k to 110k | Champion, 150k to 300k (a legend seat 250k to 500k) | about 885k |
| Victory Road, 3 to 5 floors | Ace trainer, 25k to 60k | Ace trainer, 25k to 60k | Nothing: the tower's gate | 380k to 640k |
| Battle Frontier, 7 floors | None | Factory trainer, 25k to 60k | Brain, 200k to 400k | about 600k |
| Endless Stair | None | None | None | 2,500 × floor, once per account on each 8th floor |
| Companion Trail, 3 to 5 floors | Trainer, 2,500 to 7,500 | Trainer, 2,500 to 7,500 | The partner's gift | 45k to 75k |

## Budget

- economy: a cleared run pays between a Giovanni stop and a few of them, never more than the 1M a trade carries (O1, J1, J5). A hard run's own medicine takes 15k to 40k of it back (O5).

## Rejected

- Endless Stair gold on every floor: the Stair has no window, so its easy floors would be farmed without limit (P3, by O2).
- One flat purse on the clear, as raids and PR #141 pay: a loss on the last floor would pay nothing for every fight before it (P5, by O3).

## Proofs

- None. Nothing here is a feasibility question.

## Prior art

- PR #141 (`cca72e31c`): hideout 120k to 250k, lair 80k, Frontier 200k to 400k, on the clear alone. It was never played, so it shows the shape that was tried, not how it felt (J7).

## Open risks

- The numbers have not met players (accepted, because nothing can measure that before release). Each purse should go through `grantGold` with its own reason, `dungeon-reward` and `stair-milestone`, so the ledger can show after release what dungeons pay beside stops and raids.

## Answers from the user

- None asked. The user left the gold judgment to the orchestrator.

## Overruled

- None.

## Cost of this debate

- 1 round, about 60k tokens.

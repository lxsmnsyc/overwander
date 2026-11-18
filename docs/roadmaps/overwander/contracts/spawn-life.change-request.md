# Change request: spawn-life v1 to v2

- From node: spawn-lifetimes-core
- Status: accepted, with a different change (v2)

## Problem

The contract gives the mean live fraction of a slot as 240 / 330 = 0.727 and asks for a test "within 2 percent of 0.727". The hour cut ("about 7 percent of cycles are shortened by it") is not in that figure. Measured over 30 chunk keys, 12 slots, one day: 0.703. The cut costs about 8 s of every 240 s present, so 0.703 is the true mean and the gap to 0.727 is 0.024.

Two related facts follow from the same cut:

- At every local hour boundary all slots rest, since each cycle that straddled it ends there and the next starts up to 5.5 min later. The board is empty for a few minutes each hour.
- Density on the board is about 3 percent thinner than the table says (7.6 against 7.9 ordinary).

## Proposed change

Replace 0.727 with 0.703 (mean live fraction including the hour cut) in "Tests the build adds" and the density table. No interface change. Optionally decide whether the empty boundary is wanted (a cycle could instead start at the hour).

## Affected nodes

spawn-lifetimes, spawn-radius, spawn-roaming (test expectations and docs only).

## Workaround in place

`test/overworld/spawn-life.test.ts` asserts the fraction is within 0.02 of 0.703 and below 0.727.

## Decision

Accepted on 2026-11-18, with the maintainer's choice of fix. The empty board at each hour mark is not wanted. Contract v2 lets a cycle run past the hour when its start cell (and, once roaming lands, its whole roam area) is open in the next hour's closed-cell set, and ends it at the mark otherwise. The mean live fraction returns to about 0.727, so the 0.727 figure and its 2 percent test stand; the test asserts the measured value. spawn-lifetimes-core builds the rule with the start cell; spawn-roaming widens it to the roam area.

---
name: spawn-life
version: 1
status: draft
defined_by: spawn-life-design
---

# Contract: spawn-life

## Purpose

How a wild pokemon's life on the board is derived: when it appears, where it stands at a given moment, when it leaves, and how many a chunk and a player may see at once. spawn-lifetimes, spawn-radius and spawn-roaming build on it.

## Interface

Written by `spawn-life-design` before it freezes. It must name:

- the spawn's identity, which today is `x,y@window:individualValue` (`spawnKey` in `src/overworld/safari/index.ts`) and breaks once a spawn moves;
- a pure function from world seed, chunk, spawn and time to the spawn's cell, or to absent;
- the caps and radii as named constants.

## Behavior

- Everything is derived from the world seed, the coordinates and the clock. Two clients at the same moment see the same pokemon in the same cells. Nothing about a spawn's position is stored or sent.
- The server checks a meeting against the same function at the moment of the meeting.

## Changes

- v1: initial.

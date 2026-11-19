# Log: solid-2-build-times

Raw output. Each block starts with the uptime line before the batch and ends with the one after.

## Build batch 1 (also ran while a browser renderer used about 280 percent CPU)
```
 1:27  up 12:28, 4 users, load averages: 5.35 15.28 18.48
pnpm exec vite build  (5 runs each, 1 warmup, unit: seconds)
  base         median 60.44  min 53.62  max 83.67  mad 6.82
  solid2       median 19.25  min 18.17  max 24.35  mad 1.07  -68.2% vs base: better
 1:35  up 12:36, 4 users, load averages: 4.78 7.91 13.17
```

## Build batch 2
```
 1:36  up 12:37, 4 users, load averages: 3.09 6.77 12.35
pnpm exec vite build  (5 runs each, 1 warmup, unit: seconds)
  base         median 53.73  min 53.09  max 59.86  mad 0.639
  solid2       median 18.22  min 16.76  max 20.11  mad 0.56  -66.1% vs base: better
 1:43  up 12:44, 4 users, load averages: 4.86 5.69 9.63
```

## Suite batch (stdout of each run went to a file; failures listed per run below)
```
 1:44  up 12:45, 4 users, load averages: 3.46 5.15 9.16
 44.2 /System/Library/PrivateFrameworks/SkyLight.framework/Resources/WindowServer
 39.9 /Applications/Dia.app/Contents/Frameworks/ArcCore.framework/Helpers/Browser Helper (Aperitif Renderer).app/Contents/MacOS/Browser Helper (Aperitif Renderer)
 12.6 claude
sh -c pnpm exec vitest run > /private/tmp/claude-501/-Users-alexis-Documents-GitHub-poketerra/4022f33b-a667-462c-80a4-6955bcaf7289/scratchpad/vitest-$(date +%s)-$(basename $PWD).out 2>&1; exit 0  (2 runs each, 0 warmup, unit: seconds)
  base         median 371.1  min 367.9  max 374.2  mad 3.17
  solid2       median 376.5  min 365.2  max 387.7  mad 11.2  +1.4% vs base: within noise
 2:09  up 13:10, 4 users, load averages: 14.51 29.48 30.70
```

Run order: base, solid2, base, solid2.

### base-1x.out
```
      Tests  5 failed | 5946 passed (5951)
   Duration  362.44s (tests 56%, import 36%, transform 8%)
 FAIL  test/battle/moves/damaging-moves.test.ts > damaging moves > lower a neutral target when they land, at any level
 FAIL  test/data/experts.test.ts > type experts > hands a beaten leader’s TM out of their own type’s case
 FAIL  test/overworld/spawn-life.test.ts > slot clocks > crosses an hour mark only where its whole roam area stays open, and ends there when it closes
 FAIL  test/overworld/world/raid-sites.test.ts > raid sites > keeps every lair its own legendary or shadow, with no Totem in it
 FAIL  test/overworld/world/tera-sites.test.ts > Tera crystals > takes only rolls that were caches, so every other landmark stands where it did
 Test Files  5 failed | 293 passed (298)
Error: Test timed out in 20000ms.
Error: Test timed out in 90000ms.
```

### poketerra.out
```
      Tests  5 failed | 5954 passed (5959)
   Duration  379.22s (tests 60%, import 32%, transform 7%)
 FAIL  |server| test/battle/moves/damaging-moves.test.ts > damaging moves > lower a neutral target when they land, at any level
 FAIL  |server| test/data/experts.test.ts > type experts > hands a beaten leader’s TM out of their own type’s case
 FAIL  |server| test/overworld/spawn-life.test.ts > slot clocks > crosses an hour mark only where its whole roam area stays open, and ends there when it closes
 FAIL  |server| test/overworld/world/tera-sites.test.ts > Tera crystals > takes only rolls that were caches, so every other landmark stands where it did
 FAIL  |server| test/overworld/world/world-windows.test.ts > world > charters a centre in every town and none in the country
 Test Files  5 failed | 293 passed (298)
Error: Test timed out in 20000ms.
Error: Test timed out in 90000ms.
```

### base-1x.out
```
      Tests  7 failed | 5944 passed (5951)
   Duration  372.51s (tests 62%, import 35%, transform 3%)
 FAIL  test/battle/moves/damaging-moves.test.ts > damaging moves > lower a neutral target when they land, at any level
 FAIL  test/canvas/sprites/species-sprite-animation.test.ts > sprite metadata > gives every animation anchors and pictures to go with them
 FAIL  test/data/experts.test.ts > type experts > hands a beaten leader’s TM out of their own type’s case
 FAIL  test/overworld/spawn-life.test.ts > slot clocks > crosses an hour mark only where its whole roam area stays open, and ends there when it closes
 FAIL  test/overworld/world/noble-sites.test.ts > Noble Arenas > is never cut underground
 FAIL  test/overworld/world/placement-invariants.test.ts > placement invariants > puts nobody who needs ground on a lake
 FAIL  test/overworld/world/tera-sites.test.ts > Tera crystals > takes only rolls that were caches, so every other landmark stands where it did
 Test Files  7 failed | 291 passed (298)
Error: Test timed out in 20000ms.
Error: Test timed out in 60000ms.
Error: Test timed out in 90000ms.
```

### poketerra.out
```
      Tests  5 failed | 5954 passed (5959)
   Duration  363.48s (tests 63%, import 34%, transform 3%)
 FAIL  |server| test/battle/moves/damaging-moves.test.ts > damaging moves > lower a neutral target when they land, at any level
 FAIL  |server| test/data/experts.test.ts > type experts > hands a beaten leader’s TM out of their own type’s case
 FAIL  |server| test/overworld/spawn-life.test.ts > slot clocks > crosses an hour mark only where its whole roam area stays open, and ends there when it closes
 FAIL  |server| test/overworld/world/tera-sites.test.ts > Tera crystals > takes only rolls that were caches, so every other landmark stands where it did
 FAIL  |server| test/overworld/world/world-windows.test.ts > world > charters a centre in every town and none in the country
 Test Files  5 failed | 293 passed (298)
Error: Test timed out in 20000ms.
Error: Test timed out in 90000ms.
```

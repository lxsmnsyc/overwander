---
'overwander': patch
---

Two loads that were signals filled in by hand are resources, and the utility
that did it longhand is gone.

A `createSignal` with a `createEffect` that only fetches something and puts it
in the signal is `createResource` written out: the loading state is kept by
hand, and so is the guard that drops an answer arriving after the question
changed. The profile's own lots and the raid title over a battle were both
written that way, each with its own copy of that guard, and the profile had a
counter beside it standing in for a refetch.

Both are resources now, each with its source gated so nothing is fetched while
the page is still being drawn, and each read in a way that does not hold its
screen up: a profile stands while its lots arrive, and a raid is named after
what kind of fight it is until its lair lands.

`createAsyncMemo` is deleted. It was `createResource` reimplemented, down to the
pending, success and failure states and a refetch of its own, without the guard
against a late answer overwriting a newer one, and nothing ever imported it.

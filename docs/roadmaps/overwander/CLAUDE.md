# Roadmap: overwander

This folder is a parallel roadmap. `GOAL.md` has the outcome and milestones (`now`, `next`, `later`). Each node is a folder under `nodes/`; `inbox.md` holds work that is blocked on art or not committed to.

Rules for agents working on a node:

- Work only on your own node. Edit files inside your brief's owned paths and your own `nodes/<id>/` folder.
- Do not edit other briefs, `status` fields, contracts or `GOAL.md`. The orchestrator owns them.
- If a contract is wrong, write `contracts/<name>.change-request.md` and adapt locally. Do not edit the contract.
- Use only the numbers reserved in your brief for migrations and other numbered files.
- Keep notes in your `log.md`. Finish by writing `outcome.md` from the template.
- Read the outcomes of your direct dependencies. Do not read other nodes' logs.

Script: `python3 <parallel-roadmap skill>/scripts/plan.py docs/roadmaps/overwander context <id>` lists the files to load for a node.

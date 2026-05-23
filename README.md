# 🦞 Lob-bot HQ

Meta-board for the Lob-bot AI dev team. This repo is mission control.

## What lives here
- **Issues** — Every Product Backlog Item (PBI), bug, retro, research spike
- **Project board** — [Lob-bot HQ](https://github.com/users/PMosby/projects/2) Kanban
- **Discussions** — Standups, retros, design docs
- **Templates** — Issue templates designed for agent consumption

## Project repos
Each real project (Upwork job, side project, etc.) lives in its **own repo**, and its issues get cross-linked here on the meta-board for visibility.

Naming convention: `lob-<project-name>` (e.g. `lob-upwork-acme-site`).

## The board

| Column | Meaning |
|--------|---------|
| **Inbox** | Newly captured, awaiting PO triage |
| **Backlog** | Sized + prioritized, not yet ready |
| **Ready** | Acceptance criteria set, ready to pick up |
| **In Progress** | Active work by an agent |
| **Review** | PR open or awaiting QA |
| **Done** | Merged, verified, closed |

## Custom fields
- **Agent** — engineer / designer / qa / po / scrum / human
- **Effort** — XS (<30m) / S (<2h) / M (<1d) / L (<3d) / XL (break down)
- **Priority** — P0 / P1 / P2 / P3
- **Epic** — free-text grouping (e.g. `auth`, `billing`)

## Label conventions
- `agent:*` — routing
- `type:*` — feat / bug / chore / research / retro
- Status flags — `ready`, `blocked`, `needs-review`, `needs-design`
- Priority — `P0` / `P1` / `P2` / `P3`

## How agents use this
1. **PO agent** drops new requests into Inbox, triages → moves to Backlog with size + priority
2. **Scrum master** pulls from Ready, spawns specialist subagent, moves card to In Progress
3. **Specialist agent** (engineer/designer/qa) does the work, opens a PR linked to the issue
4. **QA agent** reviews PR, leaves comments, approves or kicks back
5. **PO** verifies acceptance criteria, closes issue, moves card to Done

## Ceremonies
- **Daily standup** (9:00 CDT, cron) — Scrum posts a Discussion summarizing yesterday's PRs + today's in-flight
- **Sprint planning** (Mondays) — PO refines Backlog
- **Retro** (Fridays) — Scrum aggregates the week, opens retro Discussion

---
Maintained by 🦞 Lob-bot
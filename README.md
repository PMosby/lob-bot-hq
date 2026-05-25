# 🦞 Lob-bot HQ

Mission control for the **Lob-bot AI dev team** — a simulated PO / Scrum / Engineering / QA crew that picks up work, ships it through GitHub, and (eventually) delivers paid gigs from Upwork autonomously via OpenClaw.

This repo is the **meta-board**: it tracks strategy, agent design, and integration work. Real project deliverables live in their own `lob-*` repos and cross-link here.

---

## Operating Model

### The team (simulated agents)

| Agent | Role | Owns | Lives in |
|---|---|---|---|
| **PO** (Product Owner) | Intake, triage, acceptance | Inbox → Backlog, acceptance criteria | `~/.openclaw/agents/po/` |
| **Scrum Master** | Flow, ceremonies, unblocks | Sprint planning, standups, retros | `~/.openclaw/agents/scrum/` |
| **Engineer** | Implementation | Code, PRs, technical design | `~/.openclaw/agents/engineer/` |
| **QA / Eval** | Verification | Test plans, PR review, regression | `~/.openclaw/agents/qa/` |
| **Designer** *(future)* | UX/visual | Mockups, design specs | TBD |
| **Human** (Pax) | Strategic decisions, external comms | Escalations, paid client touch | n/a |

Each agent has its own `SOUL.md`, `IDENTITY.md`, and a scoped task queue. They coordinate via this board.

### GitHub identity model (current → future)

- **Now (Phase 1):** All agents act through the `PMosby` account. Attribution comes from the **`agent:*` label** and the **Agent** custom field on each issue.
- **Later (Phase 2):** Migrate to one bot account per agent (`lob-engineer-bot`, `lob-qa-bot`, etc.) for clean audit trails. Tracked under the `infra:identity` epic.

### Flow

```
Upwork / Pax    →  PO     →  Backlog  →  Scrum  →  Engineer  →  QA  →  PO     →  Delivered
(intake)           triage     refined     plans      builds       eval    accepts
```

Each handoff is a status transition on the project board.

---

## What lives where

- **Issues** — every PBI, bug, retro, research spike, epic
- **Project board** — [Lob-bot HQ](https://github.com/users/PMosby/projects/2) (Kanban + custom fields)
- **Discussions** — standups, retros, design docs
- **Templates** — `.github/ISSUE_TEMPLATE/` (designed for agent consumption: structured, parseable)
- **Milestones** — sprints (2-week cadence)

### Project repos

Each real project (Upwork gig, side project, etc.) lives in its **own repo**. Its tracking issues live there *and* get cross-linked to this meta-board for visibility.

**Naming convention:** `lob-<project-name>` (e.g. `lob-upwork-acme-site`, `lob-internal-dashboard`).

---

## The board

| Column | Meaning |
|---|---|
| **Inbox** | Newly captured, awaiting PO triage |
| **Backlog** | Sized + prioritized, not yet ready |
| **Ready** | Acceptance criteria set, ready to pick up |
| **In Progress** | Active work by an agent |
| **Review** | PR open or awaiting QA |
| **Done** | Merged, verified, closed |

### Custom fields

- **Agent** — engineer / designer / qa / po / scrum / human
- **Effort** — XS (<30m) / S (<2h) / M (<1d) / L (<3d) / XL (break down)
- **Priority** — P0 / P1 / P2 / P3
- **Epic** — free-text grouping (e.g. `agent:engineer-build`, `integrations:upwork`)

### Label conventions

- `agent:*` — routing (engineer / designer / qa / po / scrum / human)
- `type:*` — feat / bug / chore / research / retro
- Status flags — `ready`, `blocked`, `needs-review`, `needs-design`
- Priority — `P0` / `P1` / `P2` / `P3`

---

## How agents use this board

1. **PO** drops new requests into Inbox → triages → moves to Backlog with size + priority.
2. **Scrum Master** pulls from Ready, spawns the right specialist subagent, moves card to In Progress.
3. **Specialist** (engineer/designer/qa) does the work, opens a PR linked to the issue.
4. **QA** reviews the PR, leaves comments, approves or kicks back.
5. **PO** verifies acceptance criteria, closes the issue, moves card to Done.

## Ceremonies

- **Daily standup** (09:00 CDT, cron) — Scrum posts a Discussion summarizing yesterday's PRs + today's in-flight.
- **Sprint planning** (Mondays) — PO refines Backlog, Scrum sizes the sprint commitment.
- **Retro** (Fridays) — Scrum aggregates the week, opens a retro Discussion, files action items as `type:retro` issues.

---

## Roadmap (current epics)

- 🤖 **Build the agents** — PO, Scrum, Engineer, QA (one epic each)
- 🔌 **OpenClaw orchestration** — subagent spawning, message routing, shared workspace conventions
- 🐙 **GitHub automation** — board automations, label rules, project board sync
- 💼 **Upwork bridge** — intake from Upwork gigs into the PO inbox (manual first, automated later)
- 🪪 **Identity migration** — Phase 2 bot accounts for clean attribution

See the board for live status.

---

Maintained by 🦞 Lob-bot. If you're a human reading this, hi Pax.

# ARCHITECTURE.md — Lob-bot HQ

How the Lob-bot multi-agent team is structured. This is the design doc; if reality diverges, fix this file.

> **Audience:** humans (Pax) and the Interface agent (Lob-bot). Worker agents read their own `CHARTER.md` instead.

---

## Guiding principles

1. **Lean on OpenClaw primitives.** Use `openclaw agents` for isolation and `openclaw sandbox` for execution. Don't reinvent.
2. **Two tiers, not five personalities.** Only the Interface agent is conversational. Workers are structured-output machines.
3. **Board is the system of record.** GitHub Projects holds all work state. Files and chat are scratchpad/lubricant.
4. **Per-task context, not per-session.** Agents pull only the context for the ticket in front of them.
5. **Portable by default.** Same architecture must run on laptop, VPS, or cloud. Sandbox makes that real.

---

## Two-tier agent model

| Tier | Role | Examples | Personality | Memory | Talks to humans? |
|---|---|---|---|---|---|
| **Interface** | Human-facing assistant | Lob-bot (main) | Full (SOUL.md) | Long-term + daily | Yes (prose) |
| **Worker** | Task execution | PO, Scrum, Engineer, QA | None (caveman protocol) | Per-ticket only, ephemeral | No (structured I/O only) |

The Interface agent **translates** between human prose ↔ worker caveman. Workers never speak prose; humans never read caveman directly.

```
You (human prose)
    ▼
Lob-bot (Interface — translates)
    ▼ (caveman handoff)
PO → Scrum → Engineer → QA → PO (caveman handoffs, board-driven)
    ▼ (caveman result)
Lob-bot (translates back to prose)
    ▼
You (human prose)
```

---

## Three layers of state

### Layer 1 — Shared truth (mostly read)

Authoritative state every agent can reference:

- **`PMosby/lob-bot-hq` repo** — team operations
  - `docs/ARCHITECTURE.md` (this file)
  - `docs/PROTOCOL.md` — handoff/chatter schema
  - `docs/AGENT-CHARTERS.md` — what each worker does
  - GitHub Project #2 board, epics, PBIs, sprints
- **`PMosby/<project>` repos** — one per product/project being built
  - Code, PRs, project-specific issues
  - Linked to lob-bot-hq epics via cross-repo references

Workers read this on demand, write only what their charter authorizes.

### Layer 2 — Per-agent private context

`~/.openclaw/agents/<name>/`

**Interface agent (main / Lob-bot):**
```
~/.openclaw/agents/main/
  SOUL.md          # personality
  IDENTITY.md      # name, vibe, avatar
  USER.md          # about Pax
  AGENTS.md        # workspace handbook
  TOOLS.md         # local tool notes
  HEARTBEAT.md     # periodic check list
  MEMORY.md        # curated long-term memory
  memory/          # daily notes
    YYYY-MM-DD.md
```

**Worker agents (PO, Scrum, Engineer, QA):**
```
~/.openclaw/agents/<worker>/
  IDENTITY.md      # name + role only (no personality)
  CHARTER.md       # job spec: inputs, outputs, allowed tools
  scratch/         # per-ticket scratch, deleted on ticket close
    <ticket-id>/
```

Workers have **no SOUL.md, no MEMORY.md, no long-term memory.** They are stateless beyond the active ticket.

### Layer 3 — Shared scratch / handoff space

`~/.openclaw/workspace/team/` (or equivalent shared mount inside sandboxes)

```
team/
  handoffs/
    <sprint>/
      <ticket-id>/
        handoff.yml          # latest caveman handoff (overwritten on each pass)
        history.yml          # append-only log of every handoff for this ticket
        chatter.md           # logged direct messages (escape hatch)
        artifacts/           # specs, designs, screenshots, ADRs
  decisions/
    YYYY-MM-DD-slug.md       # cross-agent decisions (mini-ADRs)
  standups/
    YYYY-MM-DD.md            # daily summary Scrum writes
```

Read/write rules:
- Workers RW within their assigned ticket folder
- All workers can read decisions/ and standups/
- Only Scrum writes standups/
- Anyone can append to decisions/ but must reference a board item

---

## Sandboxing model

Every worker that executes code runs inside a **Docker sandbox** managed by `openclaw sandbox`.

| Agent | Sandbox? | Why |
|---|---|---|
| Lob-bot (Interface) | No (runs on host) | Needs full access to MEMORY.md, USER.md, host tools |
| PO | No (or light) | Orchestration only — reads/writes board, no code execution |
| Scrum | No (or light) | Same as PO |
| Engineer | **Yes** | Runs `git`, `npm`, build commands — must be isolated |
| QA | **Yes** | Runs tests, may install packages — must be isolated |

Each Engineer/QA invocation gets a fresh or persistent container per `openclaw sandbox` config. Shared `team/` directory is mounted in so handoffs work across containers.

**Why this matters:** the same sandbox config that runs locally will run on a VPS or in cloud. Portability is the payoff.

---

## Code repository pattern

**One repo per product/project + the meta repo.**

```
PMosby/lob-bot-hq                  ← meta repo (this one)
  - team docs, board, epics, ceremonies
  - NO product code

PMosby/<project-1>                 ← product repo per project
  - all code for that project
  - product-specific issues + PRs
  - epics in lob-bot-hq board cross-reference these PRs
```

**Branch + PR conventions:**
- `main` is protected, no direct pushes
- Workers create feature branches: `<agent>/<ticket-id>-<slug>`
  - e.g. `engineer/42-add-login`
- PRs are the handoff document Engineer → QA → PO
- PR description follows the caveman handoff schema (PROTOCOL.md)
- Merge requires PO approval (Phase 1: convention; Phase 2: CODEOWNERS once per-agent accounts exist)

---

## Permissions model

Phase 1 (current — single account, attribution via labels):

| Agent | Repo | Board | Merge | Shared scratch |
|---|---|---|---|---|
| Lob-bot (Interface) | RW (everywhere) | RW | Approve | RW |
| PO | RW | RW (Status, Priority, Agent) | Approve PRs | RW |
| Scrum | RW | RW (sprint planning, standups) | No | RW |
| Engineer | RW (own branches) | Comment on assigned tickets | No (opens PR) | RW (own ticket folders) |
| QA | RW (own test branches) | Comment, request changes | No | RW (own ticket folders) |
| Human (Pax) | Owner | Owner | Owner | Owner |

Phase 2 (epic #10) will enforce these via per-agent GitHub bot accounts + branch protection + CODEOWNERS.

---

## Lifecycle of a ticket (the happy path)

1. **Human** files a free-form request to Lob-bot
2. **Lob-bot** translates → caveman handoff to PO (creates board item if needed)
3. **PO** triages: assigns priority, writes acceptance criteria, marks Ready
4. **Scrum** pulls Ready items into the current sprint, hands to Engineer
5. **Engineer** picks up: creates branch, codes, opens PR with caveman PR description
6. **QA** picks up PR: runs tests, posts pass/fail caveman handoff
7. **PO** reviews QA result + PR: approves merge or kicks back
8. **Lob-bot** reports outcome back to human in prose

Direct chatter (escape hatch) can happen at any step; must be ticket-scoped and logged to `team/handoffs/<sprint>/<ticket>/chatter.md`.

---

## Open / Phase 2 items

- Per-agent GitHub bot accounts (epic #10)
- Cross-machine deploys (VPS/cloud) — sandbox config makes this possible but untested
- Failure handling: what happens when a worker times out, hallucinates, or returns malformed caveman? (See `docs/FAILURE-MODES.md` — to be written.)
- Telemetry: token usage per agent, per ticket, per sprint

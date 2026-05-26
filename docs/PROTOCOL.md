# PROTOCOL.md — Caveman Handoff Schema

The wire format workers use to talk to each other. Strict, structured, terse.

> **Rule:** if you are a worker agent, every message you emit MUST conform to one of the schemas below. No prose. No commentary outside the schema's `notes` field.

---

## Two message types

| Type | When | Trigger | Logged where |
|---|---|---|---|
| `handoff` | Formal handoff between workflow stages | Board event (status change, assignment) | `team/handoffs/<sprint>/<ticket>/history.yml` (appended), `handoff.yml` (overwritten) |
| `chatter` | Quick clarifying question | Direct, ticket-scoped | `team/handoffs/<sprint>/<ticket>/chatter.md` (appended) |

If it changes scope, acceptance, or priority → **handoff via board**.
If it's "what did you mean by X" or "can I assume Y" → **chatter is fine, log it**.
If chatter goes more than ~3 exchanges → escalate to board (PO/Scrum comment).

---

## Schema: `handoff`

```yaml
type: handoff
schema_version: 1
ticket: 42                       # GitHub issue number in lob-bot-hq or project repo
ticket_repo: PMosby/project-x    # which repo the ticket lives in
from: engineer                   # agent name (lowercase)
to: qa                           # agent name (lowercase)
status: ready-for-test           # see status vocabulary below
timestamp: 2026-05-26T19:42:00Z  # ISO-8601 UTC
title: "Add login form"
fields:                          # type-specific fields, see below
  ...
notes: "Free-form, max 500 chars. For context QA/PO/Scrum might need."
```

### Status vocabulary

Always one of:

- `triage` — PO is looking at it
- `ready` — PO accepted, scoped, ready for Scrum
- `in-sprint` — Scrum pulled it into current sprint
- `assigned` — Scrum assigned to a worker
- `in-progress` — worker started
- `ready-for-test` — Engineer done, awaiting QA
- `qa-pass` — QA approved
- `qa-fail` — QA rejected, back to Engineer
- `ready-for-review` — awaiting PO sign-off
- `done` — merged + verified
- `blocked` — needs human or external dependency

### Type-specific `fields`

**PO → Scrum (`status: ready`):**
```yaml
fields:
  acceptance:
    - "Criterion 1 (testable)"
    - "Criterion 2 (testable)"
  effort: S | M | L | XL
  priority: P0 | P1 | P2 | P3
  dependencies: [ticket_number, ...]  # optional
```

**Scrum → Engineer (`status: assigned`):**
```yaml
fields:
  sprint: 1
  pr_target_branch: main
  branch_name: "engineer/42-add-login"
  due: 2026-06-07  # optional, sprint end date
```

**Engineer → QA (`status: ready-for-test`):**
```yaml
fields:
  pr: https://github.com/PMosby/project-x/pull/87
  branch: engineer/42-add-login
  changed_files: [src/routes/login.ts, src/lib/validate.ts]
  test_command: "npm test -- --grep login"
  self_test: passed | failed | skipped
  setup_required: false  # or describe
```

**QA → PO (`status: qa-pass` or `qa-fail`):**
```yaml
fields:
  pr: https://github.com/PMosby/project-x/pull/87
  acceptance_results:
    - criterion: "Criterion 1"
      result: pass | fail
      evidence: "test output / screenshot path"
  regressions: []  # list of broken existing behavior, if any
  recommendation: approve | reject | needs-changes
```

**Any → PO (`status: blocked`):**
```yaml
fields:
  blocker: "What's blocking"
  needs: human | external | dependency
  details: "Specifics"
```

---

## Schema: `chatter`

```yaml
type: chatter
schema_version: 1
ticket: 42
ticket_repo: PMosby/project-x
from: engineer
to: po
timestamp: 2026-05-26T19:42:00Z
question: "Auth lib expects email or username — which?"
# response added by recipient:
response: "email only"
responded_by: po
responded_at: 2026-05-26T19:44:00Z
```

Chatter is appended (one block per exchange) to `team/handoffs/<sprint>/<ticket>/chatter.md` as a YAML code block under a `## YYYY-MM-DD HH:MM` heading.

Rules:
- Max 3 exchanges per chatter thread. After that, escalate to board.
- No multi-recipient chatter (one-to-one only). If broader, file a board comment.
- Workers MUST log chatter before continuing work.

---

## Worker output rules

1. **One message at a time.** Workers emit exactly one `handoff` or one `chatter` per turn. No commentary outside the schema.
2. **No prose explanations.** If something needs explaining, put it in `notes` (handoff) or `question` (chatter), under 500 chars.
3. **Failure mode:** if a worker can't produce a valid handoff (malformed input, missing context, ambiguous spec), emit `status: blocked` with `needs: human` and stop.
4. **Validation:** the Interface agent (or a small validator script) checks every worker output against this schema before it's persisted. Malformed = rejected, worker re-prompted.

---

## Example end-to-end (ticket #42: "Add login")

```yaml
# 1. PO triages
type: handoff
ticket: 42
ticket_repo: PMosby/project-x
from: po
to: scrum
status: ready
timestamp: 2026-05-26T18:00:00Z
title: "Add login form"
fields:
  acceptance:
    - "POST /login returns 200 with valid creds"
    - "POST /login returns 401 with bad creds"
    - "Email validated client-side"
  effort: M
  priority: P2
  dependencies: []
notes: "Use existing auth lib in src/lib/auth.ts"
```

```yaml
# 2. Scrum assigns
type: handoff
ticket: 42
ticket_repo: PMosby/project-x
from: scrum
to: engineer
status: assigned
timestamp: 2026-05-26T18:15:00Z
title: "Add login form"
fields:
  sprint: 1
  pr_target_branch: main
  branch_name: "engineer/42-add-login"
  due: 2026-06-07
notes: ""
```

```yaml
# 3. Engineer asks a quick question
type: chatter
ticket: 42
ticket_repo: PMosby/project-x
from: engineer
to: po
timestamp: 2026-05-26T18:30:00Z
question: "auth lib expects email or username — which?"
response: "email only"
responded_by: po
responded_at: 2026-05-26T18:32:00Z
```

```yaml
# 4. Engineer hands to QA
type: handoff
ticket: 42
ticket_repo: PMosby/project-x
from: engineer
to: qa
status: ready-for-test
timestamp: 2026-05-26T19:42:00Z
title: "Add login form"
fields:
  pr: https://github.com/PMosby/project-x/pull/87
  branch: engineer/42-add-login
  changed_files: [src/routes/login.ts, src/lib/validate.ts, tests/login.test.ts]
  test_command: "npm test -- --grep login"
  self_test: passed
  setup_required: false
notes: "Added 5/min rate limit per IP. Email validation uses RFC5322 regex."
```

```yaml
# 5. QA verifies
type: handoff
ticket: 42
ticket_repo: PMosby/project-x
from: qa
to: po
status: qa-pass
timestamp: 2026-05-26T20:10:00Z
title: "Add login form"
fields:
  pr: https://github.com/PMosby/project-x/pull/87
  acceptance_results:
    - criterion: "POST /login returns 200 with valid creds"
      result: pass
      evidence: "tests/login.test.ts:14 — passed"
    - criterion: "POST /login returns 401 with bad creds"
      result: pass
      evidence: "tests/login.test.ts:31 — passed"
    - criterion: "Email validated client-side"
      result: pass
      evidence: "manual: invalid email blocks submit"
  regressions: []
  recommendation: approve
notes: "Rate limit also tested, works."
```

---

## Schema versioning

`schema_version: 1` on every message. When this doc changes in a breaking way, bump the version and update all worker charters in the same PR.

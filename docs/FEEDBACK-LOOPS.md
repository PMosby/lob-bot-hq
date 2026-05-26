# FEEDBACK-LOOPS.md — How Work Gets Fixed

Companion to `ARCHITECTURE.md`, `PROTOCOL.md`, `AGENT-CHARTERS.md`. Defines what happens when something is wrong.

> **Core principle:** every loop terminates. No infinite ping-pong. Loops have explicit bounce limits; exceeding them escalates to PO, then to human via `lob-bot`.

---

## Loop 1 — QA → Engineer (the rework loop)

**Trigger:** QA verifies and finds at least one failure (acceptance criterion not met, or functional regression).

**Mechanic:**
```
Engineer →(ready-for-test)→ QA →(qa-fail)→ Engineer
                                          ↓
                                  (fix, re-test, re-hand-off)
                                          ↓
Engineer →(ready-for-test)→ QA
```

**Required fields in `qa-fail` handoff:**
- `acceptance_results` — every criterion listed with pass/fail/evidence (not just the failing ones)
- `recommendation: needs-changes` (for partial fixes) or `reject` (for fundamental rework)
- `notes` — specific guidance for Engineer (which file? which test? expected vs actual?)

**Bounce limit:** 3 QA-fail cycles per ticket.

**On 3rd failure:** QA does NOT bounce again. Instead, QA emits:
```yaml
type: handoff
to: po
status: blocked
fields:
  blocker: "Engineer cannot satisfy acceptance after 3 attempts"
  needs: human
  details: |
    Summary of all 3 attempts and what went wrong each time.
```

This escalates to **Loop 2** (PO triage).

---

## Loop 2 — PO triages Engineer/QA disputes (the arbitration loop)

**Trigger:** Any of:
- 3rd QA-fail bounce (from Loop 1)
- Engineer disputes an acceptance criterion (`chatter` to PO escalates if 3rd chatter without resolution)
- QA flags an untestable criterion
- Acceptance criterion turns out to be ambiguous or conflicting

**Mechanic:**
```
Engineer ←→ QA  (stuck)
           ↓
       (one party emits blocked → PO)
           ↓
PO reads: original ready handoff, history.yml, chatter.md, current dispute
           ↓
PO decides:
  A. Revise acceptance criterion → new `status: ready` handoff to Scrum,
     who re-assigns to Engineer with updated criterion. (Loop 1 restarts.)
  B. Confirm criterion as-is → `chatter` to both parties, return to Loop 1
     with bounce counter RESET to 0.
  C. Cannot decide alone → `handoff` to lob-bot, `status: blocked`,
     `needs: human`. Wait for Pax.
```

**Required fields in PO's triage handoff:**
- Reference original ready handoff (`fields.dependencies` or `notes`)
- New / clarified acceptance criteria (full list, not just diff)
- `notes` — explain the call: "Criterion #2 was ambiguous about X. New wording: ..."

**PO triage limit:** 2 triage cycles per ticket. After 2, PO must escalate to human (`lob-bot`).

---

## Loop 3 — Scrum keeps everyone on method (the process loop)

Scrum is the process cop, not a content cop. Scrum doesn't decide *what* to build (PO) or *how* (Engineer/QA), only *how the team is working together*.

**Scrum intervenes when:**

| Symptom | Intervention |
|---|---|
| Worker emits prose instead of caveman | `chatter` to worker: `question: "schema violation: <reason>. Re-emit per PROTOCOL.md."` |
| Worker handles >1 ticket simultaneously | `chatter` to worker: stop work on later ticket until first is done |
| Chatter thread exceeds 3 exchanges | `handoff` to PO: dispute needs board-level resolution (push into Loop 2) |
| Ticket stuck `in-progress` >48h with no chatter / no commits | `chatter` to worker; if no response in 24h, `handoff` to PO |
| Loop 1 bounces hit 3 (Loop 2 entry) | Note in next standup. Scrum doesn't arbitrate — that's PO. Scrum just tracks it. |
| Loop 2 triages hit 2 (escalation imminent) | Note in standup; `handoff` to PO confirming the next bounce will escalate to human |
| Sprint slipping >50% behind day-X target | `handoff` to PO, `status: blocked`, propose descope |

**What Scrum does NOT do:**
- Decide acceptance criteria (PO)
- Approve or reject code (QA / PO)
- Write code (Engineer)
- Block work over personal preference (process violations only)

**Scrum's daily standup MUST track:**
- All currently-active loops (which tickets, which loop, current count)
- Any worker who violated protocol that day (with link to chatter)

---

## Bounce counter persistence

Loop counters are tracked in `team/handoffs/<sprint>/<ticket>/history.yml` as a top-level field:

```yaml
ticket: 42
loops:
  loop_1_qa_fail_count: 0    # incremented by QA on each qa-fail
  loop_2_po_triage_count: 0  # incremented by PO on each triage
  loop_3_scrum_violations: 0 # incremented by Scrum on each process violation
history:
  - <handoff 1>
  - <handoff 2>
  - ...
```

Workers MUST read `loops` before deciding whether to bounce or escalate.

The YAML validator (separate doc) is responsible for incrementing these counters when it persists a matching handoff.

---

## Escalation ladder (one-page summary)

```
              ┌─────────────────────────────────────┐
              │            HUMAN (Pax)              │
              │            via lob-bot              │
              └─────────────────▲───────────────────┘
                                │ escalate
              ┌─────────────────┴───────────────────┐
              │   PO  (acceptance + triage owner)   │
              │   Loop 2 limit: 2 triages           │
              └─────────────────▲───────────────────┘
                                │ escalate
              ┌─────────────────┴───────────────────┐
              │  Engineer ↔ QA  (rework loop)       │
              │  Loop 1 limit: 3 qa-fail bounces    │
              └─────────────────────────────────────┘

  Scrum sits beside, watches all loops, enforces process,
  not content. Daily standup is the dashboard.
```

---

## Anti-patterns (what NOT to do)

1. **Silent disagreement.** Engineer thinks acceptance is wrong but ships anyway. NO — use chatter or block.
2. **PO punts to human on first dispute.** PO must attempt at least 1 triage cycle before escalating.
3. **QA approves to "get unstuck."** NO — qa-pass means criteria genuinely met, not "I'm tired of bouncing."
4. **Scrum overrides PO/QA decisions.** NO — Scrum enforces *how*, not *what*.
5. **Workers ignoring loops counters.** Always read `loops` before bouncing.

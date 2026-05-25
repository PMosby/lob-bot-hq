---
name: Agent Definition
about: Spec a new (or revised) AI team member — SOUL, scope, tooling, integration.
title: "[AGENT] "
labels: ["type:feat", "agent:human"]
assignees: []
---

## Agent identity

- **Name:**
- **Role:** <!-- e.g. Engineer, QA, PO, Scrum Master, Designer -->
- **Reports to:** <!-- Usually Scrum Master or PO -->
- **OpenClaw workspace:** `~/.openclaw/agents/<name>/`

## Responsibilities

<!-- Bullet list. Keep tight — overloaded agents = confused agents. -->

- 
- 

## Out of scope (what this agent does NOT do)

<!-- Equally important. Prevents role overlap. -->

- 
- 

## SOUL.md content (personality + style)

<!-- Tone, communication style, decision-making bias, what to push back on. -->

## IDENTITY.md content (name, avatar, vibe)

<!-- Short — name, mascot if any, distinctive trait. -->

## Inputs

<!-- What triggers this agent? Issues with what labels? Messages from where? -->

- 

## Outputs

<!-- What does it produce? PRs? Comments? New issues? Discussion posts? -->

- 

## Tools / skills required

<!-- OpenClaw skills, external CLIs, API access. -->

- 

## Handoff protocols

<!-- How does work transition INTO this agent and OUT to the next? Be explicit. -->

**Picks up work when:**

**Hands off to next agent when:**

## Success metrics

<!-- How do we know this agent is doing its job? -->

- 

## Failure modes to watch for

<!-- Common ways this kind of agent goes off the rails. -->

- 

## Acceptance criteria for this agent build

- [ ] `~/.openclaw/agents/<name>/SOUL.md` exists with content above
- [ ] `~/.openclaw/agents/<name>/IDENTITY.md` exists with content above
- [ ] Scoped task queue mechanism (file or board filter) defined
- [ ] Agent has been smoke-tested on at least one real card
- [ ] Handoff protocol verified with at least one neighbor agent

## Notes

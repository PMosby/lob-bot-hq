# Caveman Protocol Validator

Validates `handoff` and `chatter` messages against the schemas in `lob-bot-hq/docs/PROTOCOL.md`.

## Install (once)

```powershell
cd ~/.openclaw/workspace/team/validator
npm install
```

## Usage

```powershell
# Validate a file
node validate.mjs path/to/handoff.yml

# Validate from stdin
Get-Content path/to/handoff.yml | node validate.mjs

# Force a specific type (skips reading the doc's "type" field)
node validate.mjs --type handoff path/to/file.yml
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Valid |
| 1 | Schema validation failed (see stderr for details) |
| 2 | Unparseable YAML/JSON |
| 3 | Unknown / missing `type` field |
| 4 | Usage / IO error |

## When workers MUST use this

Per `PROTOCOL.md § Worker output rules`, every `handoff` or `chatter` message MUST be validated before being persisted to `team/handoffs/<sprint>/<ticket>/`.

Standard pattern (Engineer example):

```powershell
# 1. Worker writes draft handoff to scratch
$draft = "~/.openclaw/agents/engineer/scratch/42/handoff-draft.yml"

# 2. Validate
node ~/.openclaw/workspace/team/validator/validate.mjs $draft
if ($LASTEXITCODE -ne 0) {
  Write-Error "Handoff invalid; do not persist"
  exit 1
}

# 3. Persist
Copy-Item $draft "~/.openclaw/workspace/team/handoffs/sprint-1/42/handoff.yml"
Add-Content "~/.openclaw/workspace/team/handoffs/sprint-1/42/history.yml" -Value (Get-Content $draft)
```

## Schemas

- `schemas/common.json` — shared definitions (agent names, statuses, priorities, etc.)
- `schemas/handoff.json` — full handoff schema with per-status field requirements
- `schemas/chatter.json` — chatter schema (rejects `from: lob-bot`)

When `PROTOCOL.md` changes, schemas here must be updated in the same commit. Bump `schema_version` in both places on breaking changes.

## Fixtures

`fixtures/` contains canonical valid + invalid examples used as a regression test. Run all of them:

```powershell
cd ~/.openclaw/workspace/team/validator
Get-ChildItem fixtures -Filter *.yml | ForEach-Object {
  $expected = if ($_.Name.StartsWith("valid-")) { 0 } else { 1 }
  node validate.mjs $_.FullName *> $null
  $result = if ($LASTEXITCODE -eq $expected) { "PASS" } else { "FAIL" }
  Write-Output "$result  $($_.Name)"
}
```

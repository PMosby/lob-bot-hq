#!/usr/bin/env node
// Caveman protocol validator. Reads YAML/JSON from a file or stdin, validates
// against the PROTOCOL.md schemas. Exits 0 if valid, non-zero otherwise.
//
// Usage:
//   node validate.mjs [path]
//   cat handoff.yml | node validate.mjs
//   node validate.mjs --type handoff [path]
//
// Exit codes:
//   0  valid
//   1  schema validation failed
//   2  unparseable input (bad YAML/JSON)
//   3  unknown message type / missing required `type` field
//   4  usage / IO error

import { readFileSync } from "node:fs";
import { argv, stdin, exit } from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";

// Walk the parsed tree and convert any Date instances back to ISO strings.
// js-yaml's default schema auto-converts ISO timestamps to JS Date objects,
// which breaks Ajv's format="date-time" check.
function normalizeDates(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeDates);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalizeDates(v);
    return out;
  }
  return value;
}
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const here = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(here, "schemas");

function loadSchema(name) {
  return JSON.parse(readFileSync(join(schemasDir, name), "utf8"));
}

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  schemas: [loadSchema("common.json")],
});
addFormats(ajv);

const validators = {
  handoff: ajv.compile(loadSchema("handoff.json")),
  chatter: ajv.compile(loadSchema("chatter.json")),
};

async function readStdin() {
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function parse(text) {
  // Try JSON first (subset of YAML, fast path), fall back to YAML.
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through
    }
  }
  return normalizeDates(yaml.load(text));
}

function formatErrors(errors) {
  return errors
    .map((err) => {
      const path = err.instancePath || "(root)";
      const params = JSON.stringify(err.params);
      return `  - ${path} ${err.message} ${params}`;
    })
    .join("\n");
}

async function main() {
  const args = argv.slice(2);
  let explicitType = null;
  let path = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--type") {
      explicitType = args[++i];
    } else if (a === "-h" || a === "--help") {
      console.log(
        "Usage: validate.mjs [--type handoff|chatter] [path]\n  Reads YAML/JSON from path or stdin.",
      );
      exit(0);
    } else if (!a.startsWith("-")) {
      path = a;
    } else {
      console.error(`Unknown option: ${a}`);
      exit(4);
    }
  }

  let raw;
  try {
    raw = path ? readFileSync(path, "utf8") : await readStdin();
  } catch (err) {
    console.error(`IO error: ${err.message}`);
    exit(4);
  }

  let doc;
  try {
    doc = parse(raw);
  } catch (err) {
    console.error(`Parse error: ${err.message}`);
    exit(2);
  }

  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    console.error("Top-level must be an object");
    exit(2);
  }

  const type = explicitType || doc.type;
  if (!type || !(type in validators)) {
    console.error(
      `Unknown or missing message type: ${type}. Expected handoff or chatter.`,
    );
    exit(3);
  }

  const validate = validators[type];
  const ok = validate(doc);
  if (ok) {
    console.log(`OK: ${type} message is valid.`);
    exit(0);
  }
  console.error(`INVALID ${type}:`);
  console.error(formatErrors(validate.errors || []));
  exit(1);
}

main();

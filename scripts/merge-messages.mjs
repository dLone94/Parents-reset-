#!/usr/bin/env node
/**
 * Merges new strings into locale message files, keeping everything already
 * there. Used when a milestone adds strings to all 26 locales at once.
 *
 *   node scripts/merge-messages.mjs patch.json en de fr
 *   node scripts/merge-messages.mjs --multi patches.json
 *
 * Patches may use nested objects or flat dotted keys ("pause.done.title"),
 * whichever is easier to write. With --multi the file is keyed by locale.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const multi = args[0] === "--multi";
const [patchPath, ...locales] = multi ? args.slice(1) : args;

if (!patchPath || (!multi && locales.length === 0)) {
  console.error("usage: node scripts/merge-messages.mjs [--multi] <patch.json> [locale...]");
  process.exit(1);
}

const patchFile = JSON.parse(readFileSync(resolve(patchPath), "utf8"));

/** Expands flat dotted keys into nested objects. */
function expand(source) {
  const out = {};
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = expand(value);
      continue;
    }
    if (!key.includes(".")) {
      out[key] = value;
      continue;
    }
    const parts = key.split(".");
    let node = out;
    for (const part of parts.slice(0, -1)) {
      if (!node[part] || typeof node[part] !== "object") node[part] = {};
      node = node[part];
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}

function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== "object") target[key] = {};
      merge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function apply(locale, patch) {
  const file = resolve(`messages/${locale}.json`);
  const messages = JSON.parse(readFileSync(file, "utf8"));
  merge(messages, expand(patch));
  writeFileSync(file, `${JSON.stringify(messages, null, 2)}\n`);
  console.log(`merged into ${locale}`);
}

if (multi) {
  for (const [locale, patch] of Object.entries(patchFile)) apply(locale, patch);
} else {
  for (const locale of locales) apply(locale, patchFile);
}

// Prints translation status and missing keys per locale.
// Usage: npm run i18n:status
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = new URL("../messages/", import.meta.url).pathname;
const en = JSON.parse(readFileSync(join(dir, "en.json"), "utf8"));

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    k.startsWith("_") ? [] : typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
const enKeys = flatten(en);

const rows = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const locale = file.replace(".json", "");
  const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const keys = new Set(flatten(data));
  const missing = enKeys.filter((k) => !keys.has(k));
  rows.push({ locale, status: data._meta?.status ?? "unknown", keys: keys.size, missing: missing.length });
  if (missing.length) console.log(`${locale}: missing ${missing.join(", ")}`);
}
console.table(rows);

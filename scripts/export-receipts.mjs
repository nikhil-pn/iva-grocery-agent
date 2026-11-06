#!/usr/bin/env node
// Export Iva's public receipt trail for the website: data/events.jsonl → web/public/receipts.json.
//
// Privacy: an explicit allow-list of fields. Telegram chat ids, payer addresses ("from"),
// refund recipients ("to") and anything else are never written. Only money moves and
// 0G inference receipts are exported.
//
//   node scripts/export-receipts.mjs [path/to/events.jsonl] [path/to/out.json]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2] || join(process.env.IVA_DATA_DIR || join(ROOT, 'data'), 'events.jsonl');
const out = process.argv[3] || join(ROOT, 'web', 'public', 'receipts.json');

const TYPES = new Set(['income', 'deposit', 'dividend', 'inference', 'hunt']);
const FIELDS = ['type', 'at', 'tx', 'amount0G', 'requestId', 'model', 'cost0G', 'tier', 'sealed'];

if (!existsSync(src)) {
  console.error(`no events file at ${src}`);
  process.exit(1);
}

const events = [];
for (const line of readFileSync(src, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  let e;
  try { e = JSON.parse(line); } catch { continue; }
  if (!TYPES.has(e.type)) continue;
  const o = {};
  for (const k of FIELDS) if (e[k] !== undefined && e[k] !== null) o[k] = e[k];
  events.push(o);
}

const sum = (t, k) => events.filter((e) => e.type === t).reduce((a, e) => a + (Number(e[k]) || 0), 0);
const summary = {
  income0G: +sum('income', 'amount0G').toFixed(6),
  deposited0G: +sum('deposit', 'amount0G').toFixed(6),
  inferences: events.filter((e) => e.type === 'inference').length,
  inferenceCost0G: +sum('inference', 'cost0G').toFixed(6),
  sealedInferences: events.filter((e) => e.type === 'inference' && e.sealed).length,
  hunts: events.filter((e) => e.type === 'hunt').length,
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ exportedAt: new Date().toISOString(), summary, events: events.reverse() }, null, 1) + '\n');
console.log(`wrote ${events.length} events to ${out}`, summary);

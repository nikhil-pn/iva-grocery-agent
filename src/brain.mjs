// Iva decides how to think based on what she can afford.
//   rich     → strongest private (TEE) model, photos and voice on
//   lean     → cheap flash models, shorter answers
//   survival → no LLM at all: plain keyword matching and price sorting
// She also drops to survival when today's spend reaches her cap, and for a few
// minutes after 0G refuses a call (402 / 429), instead of crashing.
import { cfg } from './config.mjs';
import { funds } from './zg/account.mjs';
import { walletBalance0G } from './chain.mjs';
import { spentToday } from './ledger.mjs';
import { toOG } from './zg/router.mjs';

let cached = null, cachedAt = 0, refusedUntil = 0, refusedWhy = '';

export function markRefused(code) { refusedUntil = Date.now() + 3 * 60_000; refusedWhy = code; cached = null; }
export function invalidate() { cached = null; }

export async function brainState({ fresh = false } = {}) {
  if (!fresh && cached && Date.now() - cachedAt < 15_000) return cached;
  const [f, wallet] = await Promise.all([funds(), walletBalance0G().catch(() => null)]);
  const spent = toOG(spentToday());
  let tier, why;
  if (!cfg.zgApiKey) { tier = 'survival'; why = 'no 0G key yet'; }
  else if (Date.now() < refusedUntil) { tier = 'survival'; why = `0G said ${refusedWhy}`; }
  else if (spent >= cfg.dailySpendCap) { tier = 'survival'; why = `daily cap of ${cfg.dailySpendCap} 0G reached`; }
  else if (f.spendable >= cfg.richMin) { tier = 'rich'; why = `${f.spendable.toFixed(3)} 0G ≥ ${cfg.richMin}`; }
  else if (f.spendable >= cfg.leanMin) { tier = 'lean'; why = `${f.spendable.toFixed(3)} 0G ≥ ${cfg.leanMin}`; }
  else { tier = 'survival'; why = `only ${f.spendable.toFixed(3)} 0G of compute left`; }
  cached = {
    tier, why, models: cfg.models[tier] || null,
    compute: f.spendable, vault: f.vault, router: f.router, wallet,
    spentToday: spent, cap: cfg.dailySpendCap, fundsErr: f.err,
  };
  cachedAt = Date.now();
  return cached;
}

export const TIER_BADGE = { rich: '🟢 rich', lean: '🟡 lean', survival: '🔴 survival' };

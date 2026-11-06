// /watch: Iva re-checks your saved list every morning and tells you today's cheapest
// basket and whether it got cheaper. Each daily check is a normal hunt (same 0G brain,
// same budget tier) and costs the user 1 hunt credit, which keeps funding her brain.
//
// Store: data/watches.json (atomic tmp + rename, like ledger.mjs)
//   watches[chatId]  = { list, lat, lng, createdAt, lastRunAt, lastTotal, lastBest,
//                        history: [{ at, total, best, missing }] (last 14),
//                        triedDay, paused, pausedAt }
//   lastList[chatId] = { text, lat, lng, at, total, best, missing }  (last text hunt, for bare /watch)
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { cfg, ROOT } from './config.mjs';
import { hunt as realHunt } from './hunt.mjs';
import { SHOPS } from './shops/index.mjs';
import { receiptLine } from './format.mjs';
import { user, updateUser, logEvent } from './ledger.mjs';

const FILE = join(cfg.dataDir, 'watches.json');
export const MAX_ITEMS = 8;
const MAX_CHARS = 400;
const KEEP = 14;
const LABEL = Object.fromEntries(SHOPS.map((s) => [s.id, s.label]));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const WATCH_COMMANDS = [
  { command: 'watch', description: 'Re-check your list every morning' },
  { command: 'watches', description: 'Your watch and its recent totals' },
  { command: 'watchnow', description: 'Run your watch now' },
  { command: 'unwatch', description: 'Stop the daily watch' },
];

// ---- settings: IVA_WATCH_HOUR (IST, "08:30" / "8" / "8.5"), IVA_WATCH_GAP_S ----
function setting(key, dflt) {
  if (process.env[key]) return process.env[key];
  // the systemd unit has no EnvironmentFile, so also read the same env files config.mjs reads
  for (const f of [process.env.IVA_ENV_FILE || join(homedir(), '.config/pi/iva-agent.env'), join(ROOT, '.env')]) {
    try {
      const m = readFileSync(f, 'utf8').match(new RegExp(`^\\s*${key}\\s*=\\s*['"]?([^'"\\n#]+?)['"]?\\s*$`, 'm'));
      if (m) return m[1];
    } catch {}
  }
  return dflt;
}
function parseHour(s) {
  const m = String(s).trim().match(/^(\d{1,2})(?:[:.](\d{1,2}))?$/);
  if (!m) return 8 * 60 + 30;
  // "8.5" means 8:30, "8:05" means 8:05
  const min = m[2] == null ? 0 : String(s).includes('.') && m[2].length === 1 ? Number(m[2]) * 6 : Number(m[2]);
  return Math.min(23, Number(m[1])) * 60 + Math.min(59, min);
}
export const RUN_AT_MIN = parseHour(setting('IVA_WATCH_HOUR', '08:30'));
const GAP_MS = Number(setting('IVA_WATCH_GAP_S', '60')) * 1000;
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const RUN_AT = hhmm(RUN_AT_MIN);

// ---- IST clock ----
const IST_MS = 330 * 60_000;
export const istDay = (t) => new Date(new Date(t).getTime() + IST_MS).toISOString().slice(0, 10);
const istMinutes = (t) => { const d = new Date(new Date(t).getTime() + IST_MS); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
const shortDay = (t) => new Date(new Date(t).getTime() + IST_MS).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// ---- store ----
const fresh = () => ({ watches: {}, lastList: {} });
let store = fresh();
try { if (existsSync(FILE)) store = { ...fresh(), ...JSON.parse(readFileSync(FILE, 'utf8')) }; }
catch (e) { console.error('[watch] could not read watches.json, starting empty:', e.message); }

function save() {
  writeFileSync(FILE + '.tmp', JSON.stringify(store, null, 1));
  renameSync(FILE + '.tmp', FILE);
}

/** Same split rule as hunt.mjs's plain parser: one item per line / comma / ";" / " and ". */
export function countItems(text) {
  return String(text || '').split(/\n|,|;| and /i).map((s) => s.trim()).filter(Boolean).length;
}

export const getWatch = (chatId) => store.watches[String(chatId)] || null;
export const allWatches = () => Object.entries(store.watches);
export const lastList = (chatId) => store.lastList[String(chatId)] || null;

/** Hook for doHunt: remember the last typed list (and its result) so a bare /watch can save it. */
export function rememberHunt(chatId, text, r, loc) {
  try {
    const b = r?.basket;
    store.lastList[String(chatId)] = {
      text: String(text).slice(0, MAX_CHARS), lat: loc?.lat ?? null, lng: loc?.lng ?? null, at: new Date().toISOString(),
      total: b?.bestSum ?? null, best: b?.best ?? null, missing: b ? b.totals[b.best].missing : null,
    };
    save();
  } catch (e) { console.error('[watch] rememberHunt', e.message); }
}

/** Save (or replace) the chat's one watch. Returns { ok, watch } or { ok: false, error }. */
export function setWatch(chatId, list, loc, now = Date.now()) {
  list = String(list || '').trim();
  if (!list) return { ok: false, error: 'empty' };
  const n = countItems(list);
  if (n > MAX_ITEMS) return { ok: false, error: `That's ${n} items — a watch can hold up to ${MAX_ITEMS}.` };
  if (list.length > MAX_CHARS) return { ok: false, error: `That list is too long — keep it under ${MAX_CHARS} characters.` };
  const at = new Date(now).toISOString();
  const w = {
    list, lat: loc.lat, lng: loc.lng, createdAt: at, lastRunAt: null, lastTotal: null, lastBest: null, history: [],
    // the first scheduled check is the next morning, never minutes after you save it
    triedDay: istDay(now), paused: false, pausedAt: null,
  };
  // If you just hunted this exact list here, that hunt is the baseline for tomorrow's comparison.
  const last = lastList(chatId);
  if (last && last.text === list && last.total != null && last.lat === loc.lat && last.lng === loc.lng) {
    w.lastRunAt = last.at; w.lastTotal = last.total; w.lastBest = last.best;
    w.history.push({ at: last.at, total: last.total, best: last.best, missing: last.missing ?? 0 });
  }
  store.watches[String(chatId)] = w;
  save();
  return { ok: true, watch: w };
}

export function removeWatch(chatId) {
  const had = !!store.watches[String(chatId)];
  delete store.watches[String(chatId)];
  if (had) save();
  return had;
}

function patchWatch(chatId, patch) {
  const w = getWatch(chatId);
  if (!w) return null;
  Object.assign(w, patch);
  save();
  return w;
}

/** Is this watch due at time `now`? Past today's run time, not run today, not tried today
 *  (a paused watch is retried the same day as soon as the user has credits again). */
export function isDue(chatId, now = Date.now()) {
  const w = getWatch(chatId);
  if (!w) return false;
  const today = istDay(now);
  if (istMinutes(now) < RUN_AT_MIN) return false;
  if (w.lastRunAt && istDay(w.lastRunAt) === today) return false;
  if (w.triedDay === today && !(w.paused && user(chatId).credits > 0)) return false;
  return true;
}

// ---- charging (mirrors doHunt: charge first, refund on failure) ----
function charge(chatId, allowFree) {
  const u = user(chatId);
  if (u.credits > 0) { updateUser(chatId, { credits: u.credits - 1 }); return 'credit'; }
  if (allowFree && u.freeUsed < cfg.freeHunts) { updateUser(chatId, { freeUsed: u.freeUsed + 1 }); return 'free'; }
  return null;
}
function refund(chatId, paidWith) {
  const u = user(chatId);
  if (paidWith === 'credit') updateUser(chatId, { credits: u.credits + 1 });
  else if (paidWith === 'free') updateUser(chatId, { freeUsed: Math.max(0, u.freeUsed - 1) });
}

// One watch check at a time (shops are slow and rate-sensitive).
let chain = Promise.resolve();
const serial = (fn) => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };

const rs = (n) => `₹${Math.round(Math.abs(n))}`;

function deltaLine(w, total, missing, now) {
  if (w.lastTotal == null) return `🆕 First check — from tomorrow I'll tell you if it got cheaper.`;
  const prev = w.history[w.history.length - 1];
  const yesterday = istDay(new Date(now).getTime() - 86_400_000);
  const when = istDay(w.lastRunAt) === yesterday ? 'yesterday' : istDay(w.lastRunAt) === istDay(now) ? 'your last check' : `last check (${shortDay(w.lastRunAt)})`;
  const caveat = prev && (prev.missing ?? 0) !== missing ? ' (not all items were found both times)' : '';
  const d = total - w.lastTotal;
  if (d < 0) return `📉 <b>${rs(d)} cheaper</b> than ${when} 🎉${caveat}`;
  if (d > 0) return `📈 ${rs(d)} more than ${when}${caveat}`;
  return `➖ Same as ${when}${caveat}`;
}

/** Build the watch message for a hunt result. Exported for the test. */
export function watchMessage(w, r, now = Date.now(), { credits = null } = {}) {
  const b = r.basket;
  const missing = b.totals[b.best].missing;
  const L = [];
  L.push(`👀 <b>Your daily watch</b> · ${r.items.length} item${r.items.length > 1 ? 's' : ''}`);
  const others = SHOPS.filter((s) => s.id !== b.best)
    .map((s) => `${LABEL[s.id]} ₹${b.totals[s.id].sum}${b.totals[s.id].missing ? ` (${b.totals[s.id].missing} missing)` : ''}`).join(' · ');
  L.push(`🏆 Cheapest today: <b>${LABEL[b.best]} ₹${b.bestSum}</b>${missing ? ` (${missing} item${missing > 1 ? 's' : ''} missing)` : ''}`);
  L.push(`    ${others}`);
  L.push(deltaLine(w, b.bestSum, missing, now));
  L.push('');
  r.items.forEach((it, i) => {
    const opts = SHOPS.map((s) => ({ id: s.id, x: r.picks[i]?.[s.id] })).filter((o) => o.x)
      // ties go to today's cheapest app, so the lines agree with the basket above
      .sort((a, c) => a.x.p.price * a.x.packs - c.x.p.price * c.x.packs || (c.id === b.best) - (a.id === b.best));
    const name = esc(it.want || it.query);
    if (!opts.length) { L.push(`• ${name} — not found nearby`); return; }
    const o = opts[0];
    L.push(`• ${name} — ${LABEL[o.id]} <a href="${o.x.p.url}">₹${Math.round(o.x.p.price * o.x.packs)}</a>`);
  });
  if (b.split < b.bestSum) L.push(`✂️ Split across apps: ₹${b.split}`);
  L.push('\n' + receiptLine(r));
  L.push(`\n1 hunt used${credits != null ? ` · ${credits} left` : ''} · /watches · /unwatch to stop`);
  return L.join('\n');
}

/**
 * Run one watch check. Never sends anything itself; returns { status, text }.
 *   status: 'ok' | 'none' | 'paused' | 'skipped' | 'failed'
 * opts: manual (allow a free hunt, ignore schedule), now, onProgress, huntFn (test stub)
 */
export function checkWatch(chatId, opts = {}) {
  return serial(() => checkWatchNow(chatId, opts));
}

async function checkWatchNow(chatId, { manual = false, now = Date.now(), onProgress = () => {}, huntFn = realHunt } = {}) {
  const w = getWatch(chatId);
  if (!w) return { status: 'none', text: 'You have no watch yet. Send <code>/watch 12 eggs, 1 kg onion</code> (or just /watch after a hunt).' };
  const today = istDay(now);

  const paidWith = charge(chatId, manual);
  if (!paidWith) {
    if (manual) return { status: 'skipped', text: `💸 A watch check costs 1 hunt (${cfg.huntFee} 0G) and you have none left. /pay to get more — it keeps my brain running.` };
    const first = !w.paused;
    patchWatch(chatId, { triedDay: today, paused: true, pausedAt: w.pausedAt || new Date(now).toISOString() });
    // tell the user once; stay quiet on later days until they top up
    return first
      ? { status: 'paused', text: `⏸ Your daily watch is paused — you're out of hunts. /pay to keep it alive (${cfg.huntFee} 0G per day).` }
      : { status: 'paused', text: null };
  }
  patchWatch(chatId, { triedDay: today, paused: false, pausedAt: null });

  let r;
  try {
    r = await huntFn({ kind: 'text', text: w.list }, { lat: w.lat, lng: w.lng }, onProgress);
    const b = r.basket;
    if (!SHOPS.some((s) => b.totals[s.id].missing < r.items.length)) throw new Error('none of the shops answered');
  } catch (e) {
    console.error('[watch]', chatId, e.message);
    refund(chatId, paidWith);
    logEvent('watch_run', { chat: String(chatId), ok: false, error: String(e.message).slice(0, 120), manual, paidWith: null });
    return { status: 'failed', text: `😕 I couldn't check your watch today (${esc(e.message)}). You were not charged.${manual ? '' : ' I\'ll try again tomorrow, or send /watchnow.'}` };
  }

  const b = r.basket;
  const missing = b.totals[b.best].missing;
  const text = watchMessage(w, r, now, { credits: paidWith === 'credit' ? user(chatId).credits : null });
  const delta = w.lastTotal == null ? null : b.bestSum - w.lastTotal;
  const at = new Date(now).toISOString();
  const history = [...(w.history || []), { at, total: b.bestSum, best: b.best, missing }].slice(-KEEP);
  patchWatch(chatId, { lastRunAt: at, lastTotal: b.bestSum, lastBest: b.best, history });
  const u = user(chatId);
  updateUser(chatId, { hunts: (u.hunts || 0) + 1 });
  logEvent('watch_run', { chat: String(chatId), ok: true, manual, items: r.items.length, tier: r.brain.tier,
    calls: r.receipts.map((x) => x.requestId), cost0G: r.receipts.reduce((a, x) => a + x.cost0G, 0),
    best: b.best, total: b.bestSum, delta, paidWith });
  return { status: 'ok', text, result: r };
}

// ---- Telegram commands (bot.mjs passes send/edit in) ----
function watchSummary(chatId) {
  const w = getWatch(chatId);
  if (!w) return 'You have no watch. Send <code>/watch 12 eggs, 1 kg onion</code>, or /watch right after a hunt to save that list.';
  const L = [`👀 <b>Your watch</b>`, `🧺 ${esc(w.list)}`,
    `📍 ${w.lat.toFixed(3)}, ${w.lng.toFixed(3)} · every day after ${RUN_AT} IST · 1 hunt (${cfg.huntFee} 0G) per check`];
  if (w.paused) L.push('⏸ Paused — you are out of hunts. /pay and it resumes.');
  const h = (w.history || []).slice(-7);
  if (h.length) L.push(`📊 ${h.map((x) => `${shortDay(x.at)} ${LABEL[x.best] || x.best} ₹${x.total}`).join(' → ')}`);
  else L.push('📊 No checks yet.');
  L.push('/watchnow to check now · /unwatch to stop');
  return L.join('\n');
}

export async function watchCommand(chatId, cmd, arg, { send, edit }) {
  if (cmd === '/watches') return send(chatId, watchSummary(chatId));
  if (cmd === '/unwatch') return send(chatId, removeWatch(chatId) ? '🗑 Watch removed. I won\'t check your list any more.' : 'You have no watch.');
  if (cmd === '/watchnow') {
    if (!getWatch(chatId)) return send(chatId, watchSummary(chatId));
    const m = await send(chatId, '👀 Checking your watch on Blinkit, Instamart and Zepto…');
    const res = await checkWatch(chatId, { manual: true, onProgress: (t) => edit(chatId, m.message_id, t) });
    return edit(chatId, m.message_id, res.text);
  }
  // /watch [list]
  const u = user(chatId);
  const loc = { lat: u.lat ?? cfg.defaultLat, lng: u.lng ?? cfg.defaultLng };
  let list = arg.trim();
  if (!list) {
    const last = lastList(chatId);
    if (!last) return send(chatId, getWatch(chatId) ? watchSummary(chatId)
      : 'Send <code>/watch 12 eggs, 1 kg onion, amul butter 500g</code> — or hunt a list first, then send /watch to save it.');
    list = last.text;
  }
  const res = setWatch(chatId, list, loc);
  if (!res.ok) return send(chatId, `⚠️ ${esc(res.error)}`);
  const w = res.watch;
  return send(chatId, `👀 <b>Watching:</b> ${esc(w.list)}
Every morning after ${RUN_AT} IST I'll re-check it on Blinkit, Instamart and Zepto and tell you the cheapest basket and whether it got cheaper${w.lastTotal != null ? ` (today: ₹${w.lastTotal})` : ''}.
Each check costs 1 hunt (${cfg.huntFee} 0G) — that pays for my 0G brain. You have ${u.credits} paid hunts.
/watchnow to check now · /watches · /unwatch`);
}

// ---- scheduler ----
let ticking = false;
/** One scheduler pass: run every due watch, one after another, with a gap between users. */
export async function watchTick({ send, now = () => Date.now(), gapMs = GAP_MS, huntFn } = {}) {
  if (ticking) return 0;
  ticking = true;
  let ran = 0;
  try {
    for (const [chatId] of allWatches()) {
      if (!isDue(chatId, now())) continue;
      if (ran > 0 && gapMs) await new Promise((r) => setTimeout(r, gapMs));
      ran++;
      try {
        const res = await checkWatch(chatId, { now: now(), huntFn });
        if (res.text) await send(chatId, res.text);
      } catch (e) { console.error('[watch] run', chatId, e.message); }
    }
  } finally { ticking = false; }
  return ran;
}

export function startWatchScheduler({ send, everyMs = 10 * 60_000 }) {
  const go = () => watchTick({ send }).catch((e) => console.error('[watch] tick', e.message));
  setTimeout(go, 60_000).unref();
  setInterval(go, everyMs).unref();
  console.log(`[watch] daily checks after ${RUN_AT} IST · ${allWatches().length} watches`);
}

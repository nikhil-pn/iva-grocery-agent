// Test the /watch daily alert without Telegram: a fake `send` collects messages.
//   IVA_DATA_DIR=/tmp/iva-watch-test node scripts/watch-test.mjs            # store + stubbed runs + 1 real check
//   IVA_DATA_DIR=/tmp/iva-watch-test node scripts/watch-test.mjs --offline  # skip the real shops/0G check
// It uses its own data dir (default /tmp/iva-watch-test, wiped first), so the live bot's data is never touched.
import { rmSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

process.env.IVA_DATA_DIR ||= '/tmp/iva-watch-test';
const DIR = process.env.IVA_DATA_DIR;
assert.ok(DIR.startsWith('/tmp/'), 'refusing to wipe a data dir outside /tmp');
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });

const W = await import('../src/watch.mjs');
const { user, updateUser, recentEvents } = await import('../src/ledger.mjs');
const { basket } = await import('../src/hunt.mjs');
const { closeAll } = await import('../src/shops/browser.mjs');
const { cfg } = await import('../src/config.mjs');

const plain = (h) => String(h ?? '').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const sent = [];
const send = async (chatId, text) => { sent.push({ chatId, text }); return { message_id: sent.length }; };
const edit = async (chatId, id, text) => { sent.push({ chatId, text, edit: id }); };
const ok = (m) => console.log(`  ✓ ${m}`);

// IST helpers for fake clocks: "today at HH:MM IST"
const istAt = (dayOffset, hh, mm) => {
  const d = new Date(Date.now() + 330 * 60_000);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hh, mm) - 330 * 60_000;
};
const RUN_H = Math.floor(W.RUN_AT_MIN / 60), RUN_M = W.RUN_AT_MIN % 60;
const before = (day) => istAt(day, RUN_H, RUN_M) - 60_000;
const after = (day) => istAt(day, RUN_H, RUN_M) + 5 * 60_000;

// A stub hunt: fixed prices (scaled by `k`), no shops and no 0G.
function fakeHunt(k = 1, { fail = false, empty = false } = {}) {
  return async (input, loc) => {
    if (fail) throw new Error('shops timed out');
    const items = [{ query: 'eggs', want: '12 eggs' }, { query: 'onion', want: '1 kg onion' }];
    const P = (price, name) => ({ p: { price: Math.round(price * k), name, pack: '1 pc', url: 'https://example.com/p' }, packs: 1 });
    const picks = empty ? items.map(() => ({ blinkit: null, instamart: null, zepto: null }))
      : [{ blinkit: P(96, 'Eggs 12'), instamart: P(90, 'Eggs 12'), zepto: P(99, 'Eggs 12') },
         { blinkit: P(45, 'Onion 1kg'), instamart: P(52, 'Onion 1kg'), zepto: P(41, 'Onion 1kg') }];
    return { items, picks, tip: '', degraded: '', brain: { tier: 'lean', why: 'stub' },
      receipts: [{ requestId: 'stub-req-1', model: 'stub', cost0G: 0 }], basket: basket(items, picks) };
  };
}

console.log(`data dir ${DIR} · daily run after ${W.RUN_AT} IST`);

// ---------- 1. store ----------
console.log('\n1. store');
const A = 900000001, B = 900000002, C = 900000003;
const loc = { lat: cfg.defaultLat, lng: cfg.defaultLng };
assert.equal(W.countItems('12 eggs, 1 kg onion\namul butter 500g; bread and jam'), 5);
assert.equal(W.setWatch(A, 'a,b,c,d,e,f,g,h,i', loc).ok, false); ok('a 9-item list is refused');
assert.equal(W.setWatch(A, '   ', loc).ok, false); ok('an empty list is refused');
W.rememberHunt(A, '12 eggs, 1 kg onion', { basket: { bestSum: 138, best: 'zepto', totals: { zepto: { missing: 0 } } } }, loc);
assert.equal(W.lastList(A).text, '12 eggs, 1 kg onion'); ok('rememberHunt keeps the last typed list');
await W.watchCommand(A, '/watch', '', { send, edit });
assert.equal(W.getWatch(A).list, '12 eggs, 1 kg onion');
assert.equal(W.getWatch(A).lastTotal, 138, 'the same-list hunt seeds the baseline'); ok('bare /watch saves the last hunted list, with that hunt as baseline');
await W.watchCommand(A, '/watches', '', { send, edit });
assert.match(sent.at(-1).text, /Your watch/); ok('/watches shows it');
await W.watchCommand(B, '/watch', 'milk 1 l, bread', { send, edit });
assert.equal(W.getWatch(B).list, 'milk 1 l, bread'); ok('/watch <list> saves the list');
await W.watchCommand(B, '/unwatch', '', { send, edit });
assert.equal(W.getWatch(B), null); ok('/unwatch removes it');
const disk = JSON.parse(readFileSync(join(DIR, 'watches.json'), 'utf8'));
assert.ok(disk.watches[A] && !disk.watches[B] && !existsSync(join(DIR, 'watches.json.tmp'))); ok('watches.json written atomically');

// ---------- 2. schedule ----------
console.log('\n2. schedule');
assert.equal(W.isDue(A, after(0)), false); ok('not due the day it was created');
assert.equal(W.isDue(A, before(1)), false); ok(`not due tomorrow before ${W.RUN_AT}`);
assert.equal(W.isDue(A, after(1)), true); ok(`due tomorrow after ${W.RUN_AT}`);

// ---------- 3. stubbed runs: charging, delta, pause, refund ----------
console.log('\n3. stubbed runs (no shops, no 0G)');
updateUser(A, { credits: 2 });
let n = await W.watchTick({ send, now: () => after(1), gapMs: 0, huntFn: fakeHunt(1) });
assert.equal(n, 1);
let msg = plain(sent.at(-1).text);
assert.equal(user(A).credits, 1); ok('a scheduled run costs 1 credit');
assert.match(msg, /Cheapest today: Zepto ₹140/);
assert.match(msg, /₹2 more than yesterday/); ok('delta vs the seeded baseline: "₹2 more than yesterday"');
assert.equal(W.isDue(A, after(1) + 60_000), false); ok('not due again the same day');
n = await W.watchTick({ send, now: () => after(2), gapMs: 0, huntFn: fakeHunt(0.9) });
msg = plain(sent.at(-1).text);
assert.match(msg, /cheaper than yesterday 🎉/); ok(`next day, cheaper: "${msg.split('\n').find((l) => /cheaper/.test(l))}"`);
assert.equal(user(A).credits, 0);
const sentBefore = sent.length;
n = await W.watchTick({ send, now: () => after(3), gapMs: 0, huntFn: fakeHunt(1) });
assert.equal(sent.length, sentBefore + 1); assert.match(sent.at(-1).text, /paused/);
assert.equal(W.getWatch(A).paused, true); ok('0 credits → not run, "paused" sent once');
await W.watchTick({ send, now: () => after(3) + 20 * 60_000, gapMs: 0, huntFn: fakeHunt(1) });
await W.watchTick({ send, now: () => after(4), gapMs: 0, huntFn: fakeHunt(1) });
assert.equal(sent.length, sentBefore + 1); ok('no repeat of the pause message later that day or the next');
updateUser(A, { credits: 1 });
assert.equal(W.isDue(A, after(4) + 30 * 60_000), true); ok('paused watch is due again as soon as credits arrive');
await W.watchTick({ send, now: () => after(4) + 30 * 60_000, gapMs: 0, huntFn: fakeHunt(1, { fail: true }) });
assert.equal(user(A).credits, 1); assert.match(sent.at(-1).text, /not charged/); ok('a failed run is refunded');
updateUser(C, { credits: 1 });
W.setWatch(C, 'eggs, onion', loc);
const r = await W.checkWatch(C, { manual: true, huntFn: fakeHunt(1, { empty: true }) });
assert.equal(r.status, 'failed'); assert.equal(user(C).credits, 1); ok('no shop answered → failed and refunded');
assert.equal(W.getWatch(A).history.length, 3); ok('history kept (baseline + 2 runs)');
W.removeWatch(C);

if (process.argv.includes('--offline')) { console.log('\nOFFLINE: skipped the real check'); process.exit(0); }

// ---------- 4. one real check: shops + 0G ----------
console.log('\n4. real /watchnow check against Blinkit, Instamart, Zepto and the 0G Router');
const REAL = 900000099;
updateUser(REAL, { credits: 3 });
await W.watchCommand(REAL, '/watch', process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || '12 eggs, 1 kg onion, amul butter 500g', { send, edit });
const t0 = Date.now();
const startLen = sent.length;
await W.watchCommand(REAL, '/watchnow', '', { send, edit: async (c, id, text) => { sent.push({ c, text }); if (!/👀 <b>Your daily watch/.test(text)) console.log('  …', plain(text)); } });
const final = sent.slice(startLen).map((x) => x.text).filter((t) => /Your daily watch|couldn't check/.test(t)).at(-1);
console.log('\n----- message the user gets -----\n' + plain(final) + '\n---------------------------------');
const ev = recentEvents('watch_run', 1)[0];
console.log(`\nwatch_run event: ok=${ev.ok} tier=${ev.tier} best=${ev.best} total=${ev.total} calls=${JSON.stringify(ev.calls)} cost0G=${ev.cost0G}`);
assert.equal(ev.ok, true, 'real check failed');
assert.equal(user(REAL).credits, 2); ok('real check charged exactly 1 credit');
assert.equal(W.getWatch(REAL).history.length, 1); ok(`history saved: ${JSON.stringify(W.getWatch(REAL).history[0])}`);
console.log(`\n${Date.now() - t0} ms · ALL WATCH TESTS PASSED`);
await closeAll();
process.exit(0);

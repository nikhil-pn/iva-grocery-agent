// Iva on Telegram. Anyone can use her; she charges per hunt in 0G and funds her
// own brain with it. She has no tools beyond hunting prices: no shell, no files,
// no ordering, so a stranger's message can't make her do anything else.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cfg } from './config.mjs';
import { tg, send, edit, download, poll } from './telegram.mjs';
import { hunt } from './hunt.mjs';
import { huntMessage, brainMessage } from './format.mjs';
import { brainState, TIER_BADGE } from './brain.mjs';
import { verifyPayment, ivaAddress } from './chain.mjs';
import { startTreasury, treasuryTick } from './treasury.mjs';
import { closeAll } from './shops/browser.mjs';
import { user, updateUser, txUsed, markTx, logEvent, recentEvents, totals, recordIncome } from './ledger.mjs';
import { txUrl } from './config.mjs';
import { watchCommand, rememberHunt, startWatchScheduler, WATCH_COMMANDS } from './watch.mjs'; // /watch daily alert
import { publishDeals, dealsReply } from './arkiv.mjs';
import { CITIES, cityOf } from './cities.mjs';
import { zeptoConnected, prepareZeptoOrder, hasPending, confirmZeptoOrder, cancelPending, trackZeptoOrder, friendlyZeptoError } from './zepto/order.mjs'; // Zepto: "order" -> YES -> COD order // Arkiv: expiring public deal feed

const run = promisify(execFile);


const fmt0G = (x) => `${Number(x).toFixed(Number(x) < 1 ? 2 : 1)} 0G`;

function payLink(chatId, amount) {
  const p = new URLSearchParams({ to: ivaAddress, amount: String(amount), bot: cfg.botUsername });
  return `${cfg.payPageUrl}?${p}`;
}

const EXAMPLE = '12 eggs, 1 kg onion, 1 litre milk';
const INR_PER_0G = Number(process.env.IVA_0G_INR || 12.5); // rough, for display only
const rs = (og) => `≈ ₹${Math.max(1, Math.round(og * INR_PER_0G))}`;

// Buttons under the chat box, so nobody has to remember commands.
const BTN = { example: `🧺 Try: ${EXAMPLE}`, deals: '🏷 Live deals', brain: "🧠 Iva's brain", pay: '💳 Pay', me: '🙋 Me', watch: '⏰ Daily check' };
const KEYBOARD = { reply_markup: { resize_keyboard: true, is_persistent: true, keyboard: [
  [{ text: BTN.example }],
  [{ text: '📍 Share my location', request_location: true }, { text: BTN.deals }],
  [{ text: BTN.pay }, { text: BTN.me }, { text: BTN.brain }],
] } };

const WELCOME = (u) => `👋 <b>Hi, I'm Iva.</b> Send me your shopping list and I'll find the cheapest basket on <b>Blinkit, Instamart and Zepto</b>.

Try: <i>${EXAMPLE}</i>
📍 I'm hunting near ${cityOf(u)}. Tap "Share my location" to change it.

${u.freeUsed < cfg.freeHunts ? '🎁 Your first hunt is free.' : `💳 A hunt costs ${cfg.huntFee} 0G (${rs(cfg.huntFee)}).`} I pay for my own AI brain on 0G with what I earn.

More: /watch (I re-check your list every morning) · /deals (live deals) · /brain (my wallet and receipts)`;

function meText(u) {
  const free = u.freeUsed < cfg.freeHunts ? cfg.freeHunts - u.freeUsed : 0;
  return `🙋 <b>${u.credits}</b> paid hunt${u.credits === 1 ? '' : 's'}${free ? ` + ${free} free` : ''} left.
Hunts so far: ${u.hunts || 0} · you saved ≈ ₹${u.savedRs || 0}.
📍 ${cityOf(u)}`;
}

const SMALL_TALK = /^(hi+|hello+|hey+|yo|ok(ay)?|yes|yeah|yep|no|nope|cancel|stop|thanks?|thank you|thx|ty|good (morning|night|evening|afternoon)|hola|namaste|test|start|help|menu|\?)[!. ]*$/i;

async function payPrompt(chatId) {
  const amt = 1;
  return send(chatId, `💳 <b>A hunt costs ${cfg.huntFee} 0G</b> (${rs(cfg.huntFee)}). 1 0G = ${Math.floor(amt / cfg.huntFee + 1e-9)} hunts. Your 0G pays for my AI brain, so I keep running without anyone topping me up.

<b>Easiest:</b> send 0G on <b>0G mainnet</b> from any wallet to
<code>${ivaAddress}</code>
then paste the transaction hash here.

Or use the <a href="${payLink(chatId, amt)}">pay page</a> (MetaMask), then tap "Return to Iva".`, KEYBOARD);
}

async function claimPayment(chatId, hash) {
  if (!hash.startsWith('0x')) hash = '0x' + hash;
  if (txUsed(hash)) return send(chatId, '⚠️ That payment was already used.');
  const m = await send(chatId, '⏳ Checking your payment on 0G mainnet…');
  const v = await verifyPayment(hash);
  if (!v.ok) return edit(chatId, m.message_id, `❌ ${v.reason}.`);
  if (txUsed(hash)) return edit(chatId, m.message_id, '⚠️ That payment was already used.');
  markTx(hash, chatId);
  const hunts = Math.floor(v.amount0G / cfg.huntFee + 1e-9);
  const u = user(chatId);
  updateUser(chatId, { credits: u.credits + hunts, paid0G: (u.paid0G || 0) + v.amount0G });
  recordIncome({ tx: hash, from: v.from, amount0G: v.amount0G, via: 'claimed in chat' });
  logEvent('payment', { tx: hash, amount0G: v.amount0G, from: v.from, chat: String(chatId), kind: v.kind, hunts });
  await edit(chatId, m.message_id, `✅ Got <b>${fmt0G(v.amount0G)}</b> — <a href="${txUrl(hash)}">tx</a>
+${hunts} hunts (you have ${user(chatId).credits}).
${v.kind === 'wallet' ? '⚡ I\'ll now move it into my 0G compute account myself…' : '⚡ It went straight into my 0G compute account.'}`);
  let ev = await treasuryTick('payment');
  // the treasury loop may have deposited it already (it checks every 30 s)
  if (ev?.type !== 'deposit') {
    const last = recentEvents('deposit', 1)[0];
    if (last && Date.now() - Date.parse(last.at) < 15 * 60_000) ev = last;
  }
  if (ev?.type === 'deposit') await send(chatId, `⚡ Topped up my own brain: deposited <b>${fmt0G(ev.amount0G)}</b> into my 0G compute account — <a href="${txUrl(ev.tx)}">tx</a>`);
}

let busy = 0;
const lastItems = new Map(); // chatId -> items of the last hunt (for Zepto ordering)

async function doHunt(chatId, input) {
  const u = user(chatId);
  let paidWith;
  if (u.credits > 0) paidWith = 'credit';
  else if (u.freeUsed < cfg.freeHunts) paidWith = 'free';
  else return payPrompt(chatId);
  if (busy >= 2) return send(chatId, '🧺 I\'m on two hunts already — send it again in a minute.');
  busy++;
  if (paidWith === 'credit') updateUser(chatId, { credits: u.credits - 1 });
  else updateUser(chatId, { freeUsed: u.freeUsed + 1 });
  const b = await brainState({ fresh: true }).catch(() => null);
  const head = b ? `${TIER_BADGE[b.tier]} brain${b.models ? ` (${input.kind === 'photo' ? b.models.vision : input.kind === 'voice' ? b.models.audio : b.models.text})` : ''}` : '';
  const m = await send(chatId, `🧠 Reading your ${input.kind === 'text' ? 'list' : input.kind} with my ${head}…`);
  const loc = { lat: u.lat ?? cfg.defaultLat, lng: u.lng ?? cfg.defaultLng };
  try {
    const r = await hunt(input, loc, (msg) => edit(chatId, m.message_id, msg));
    await edit(chatId, m.message_id, huntMessage(r));
    if (input.kind === 'text') rememberHunt(chatId, input.text, r, loc); // so a bare /watch can save this list
    publishDeals(r, loc); // Arkiv: fire-and-forget, never throws, never delays the reply
    lastItems.set(String(chatId), r.items); // Zepto: what "order" will buy
    if (String(chatId) === cfg.zeptoOwnerChat && zeptoConnected()) await send(chatId, '🛒 Want me to order this on Zepto (cash on delivery)? Reply <b>order</b>.');
    updateUser(chatId, { hunts: (u.hunts || 0) + 1, savedRs: (u.savedRs || 0) + (r.basket.saving || 0) });
    logEvent('hunt', { chat: String(chatId), kind: input.kind, items: r.items.length, tier: r.brain.tier,
      calls: r.receipts.map((x) => x.requestId), cost0G: r.receipts.reduce((a, x) => a + x.cost0G, 0),
      best: r.basket.best, saving: r.basket.saving, paidWith });
    const after = user(chatId);
    if (after.credits === 0 && after.freeUsed >= cfg.freeHunts) {
      await send(chatId, paidWith === 'free'
        ? `🎁 That was your free hunt. Want more? 1 0G = ${Math.floor(1 / cfg.huntFee + 1e-9)} hunts (${rs(1)}): tap 💳 Pay. Tip: /watch re-checks this list every morning.`
        : `That was your last hunt. Tap 💳 Pay for more: it keeps my brain running.`);
    }
  } catch (e) {
    console.error('[hunt]', e);
    if (paidWith === 'credit') updateUser(chatId, { credits: user(chatId).credits + 1 });
    else updateUser(chatId, { freeUsed: user(chatId).freeUsed - 1 });
    await edit(chatId, m.message_id, `😕 ${e.message}\n(Your hunt was not charged.)`);
  } finally {
    busy--;
  }
}

async function voiceToWav(buf) {
  const dir = mkdtempSync(join(tmpdir(), 'iva-'));
  try {
    writeFileSync(join(dir, 'in.ogg'), buf);
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(dir, 'in.ogg'), '-ac', '1', '-ar', '16000', '-t', '60', join(dir, 'out.wav')]);
    return readFileSync(join(dir, 'out.wav')).toString('base64');
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const isZeptoOwner = (chatId) => String(chatId) === cfg.zeptoOwnerChat;

async function zeptoOrder(chatId) {
  if (!isZeptoOwner(chatId)) return send(chatId, '🛒 Ordering on Zepto is in private beta. For now, tap the product links in my reply to order in the app.', KEYBOARD);
  if (!zeptoConnected()) return send(chatId, 'Zepto isn\'t connected yet.');
  const items = lastItems.get(String(chatId));
  if (!items?.length) return send(chatId, 'Send me a list first, then say <b>order</b>.');
  const m = await send(chatId, '🛒 Filling your Zepto cart… (my 0G brain is picking the products)');
  try {
    const o = await prepareZeptoOrder(chatId, items, { addressId: cfg.zeptoAddressId });
    const lines = o.lines.map((l) => `• ${esc(l.name)} (${esc(l.pack || '')})${l.packs > 1 ? ` ×${l.packs}` : ''}: ₹${Math.round(l.price)}`).join('\n');
    const miss = o.missing.length ? `\n⚠️ Not on Zepto here: ${esc(o.missing.join(', '))}` : '';
    const brainLine = o.receipt ? `\n🧠 Products picked by 0G: <code>${esc(o.receipt.requestId)}</code>` : '';
    await edit(chatId, m.message_id, `🛒 <b>Your Zepto order</b> (cash on delivery)\n${lines}${miss}\n\n<b>Zepto's bill:</b>\n${esc(o.preview).slice(0, 1500)}${brainLine}\n\nReply <b>YES</b> within 3 minutes to place this order, or <b>NO</b> to cancel.`);
  } catch (e) {
    console.error('[zepto]', e);
    await edit(chatId, m.message_id, `😕 Couldn't prepare the Zepto order: ${esc(friendlyZeptoError(e))}`);
  }
}

async function zeptoConfirm(chatId) {
  if (!isZeptoOwner(chatId)) return;
  const m = await send(chatId, '⏳ Placing your order on Zepto…');
  try {
    const o = await confirmZeptoOrder(chatId);
    await edit(chatId, m.message_id, `✅ <b>Order placed on Zepto</b> (cash on delivery)${o.orderId ? ` · #${esc(o.orderId)}` : ''}\n\n${esc(o.text).slice(0, 1500)}\n\nSend /track for the delivery status.`);
  } catch (e) {
    console.error('[zepto]', e);
    await edit(chatId, m.message_id, `😕 The order did not go through: ${esc(friendlyZeptoError(e))}`);
  }
}

async function zeptoTrack(chatId) {
  if (!isZeptoOwner(chatId) || !zeptoConnected()) return send(chatId, 'Order tracking works for Zepto orders placed through me.', KEYBOARD);
  try { return send(chatId, `📦 <b>Your latest Zepto order</b>\n${esc(await trackZeptoOrder()).slice(0, 2000)}`); }
  catch (e) { return send(chatId, `😕 Couldn't fetch the order: ${esc(friendlyZeptoError(e))}`); }
}

const esc = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function onUpdate(up) {
  const msg = up.message;
  if (!msg || msg.chat.type !== 'private') return;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const u = user(chatId);

  if (msg.location) {
    updateUser(chatId, { lat: msg.location.latitude, lng: msg.location.longitude, cityName: null });
    return send(chatId, '📍 Got it. I\'ll hunt near you now. Send your list.', KEYBOARD);
  }
  if (msg.photo) {
    const ph = msg.photo[msg.photo.length - 1];
    const { buf } = await download(ph.file_id);
    return doHunt(chatId, { kind: 'photo', b64: buf.toString('base64'), mime: 'image/jpeg' });
  }
  if (msg.voice || msg.audio) {
    const { buf } = await download((msg.voice || msg.audio).file_id);
    return doHunt(chatId, { kind: 'voice', b64: await voiceToWav(buf), format: 'wav' });
  }
  if (!text) return;

  // Zepto ordering: "order" -> bill preview -> "YES" -> cash-on-delivery order. Owner-only demo.
  if (/^\/?(order|buy|buy it|order it|order this|order on zepto)[.! ]*$/i.test(text)) return zeptoOrder(chatId);
  if (/^(yes|yes order it|confirm|place it|place order)[.! ]*$/i.test(text) && hasPending(chatId)) return zeptoConfirm(chatId);
  if (/^(no|cancel|stop)[.! ]*$/i.test(text) && hasPending(chatId)) { cancelPending(chatId); return send(chatId, 'OK, nothing ordered.', KEYBOARD); }
  if (/^\/track$/i.test(text)) return zeptoTrack(chatId);

  // Buttons and small talk never cost a hunt.
  if (text === BTN.example) return doHunt(chatId, { kind: 'text', text: EXAMPLE });
  if (text === BTN.deals) return send(chatId, await dealsReply({ lat: u.lat ?? cfg.defaultLat, lng: u.lng ?? cfg.defaultLng, item: '' }));
  if (text === BTN.brain) { const s = await brainState({ fresh: true }); return send(chatId, brainMessage(s, totals(), recentEvents(null, 40), ivaAddress)); }
  if (text === BTN.pay) return payPrompt(chatId);
  if (text === BTN.me) return send(chatId, meText(u), KEYBOARD);
  if (SMALL_TALK.test(text) || text.length < 2) return send(chatId, WELCOME(u), KEYBOARD);

  // A pasted transaction hash on its own (with or without /paid) is a payment claim.
  const hashOnly = text.match(/^(?:\/paid\s*)?((?:0x)?[0-9a-fA-F]{64})$/);
  if (hashOnly) return claimPayment(chatId, hashOnly[1]);

  const [cmd, ...rest] = text.split(/\s+/);
  const arg = rest.join(' ');
  switch (cmd.toLowerCase().replace(/@.*$/, '')) {
    case '/start':
      if (/^(0x)?[0-9a-fA-F]{64}$/.test(arg)) return claimPayment(chatId, arg);
      return send(chatId, WELCOME(u), KEYBOARD);
    case '/help': return send(chatId, WELCOME(u), KEYBOARD);
    case '/pay': return payPrompt(chatId);
    case '/paid':
      if (!/^(0x)?[0-9a-fA-F]{64}$/.test(arg)) return send(chatId, 'Send it like: <code>/paid 0x…</code> (the transaction hash)');
      return claimPayment(chatId, arg);
    case '/me': return send(chatId, meText(u), KEYBOARD);
    case '/city': {
      const key = arg.toLowerCase().trim();
      const c = CITIES[key];
      if (!c) return send(chatId, `Send one of: ${Object.keys(CITIES).map((x) => x[0].toUpperCase() + x.slice(1)).join(', ')}. Or tap "📍 Share my location".`, KEYBOARD);
      const cityName = key[0].toUpperCase() + key.slice(1);
      updateUser(chatId, { lat: c[0], lng: c[1], cityName });
      return send(chatId, `📍 Done. I'll hunt in <b>${cityName}</b> now. Send your list.`, KEYBOARD);
    }
    case '/deals': // Arkiv: live deals near you, read from the public feed
      return send(chatId, await dealsReply({ lat: u.lat ?? cfg.defaultLat, lng: u.lng ?? cfg.defaultLng, item: arg }));
    case '/brain': {
      const s = await brainState({ fresh: true });
      return send(chatId, brainMessage(s, totals(), recentEvents(null, 40), ivaAddress));
    }
    case '/watch': case '/watches': case '/unwatch': case '/watchnow': // /watch daily alert (src/watch.mjs)
      return watchCommand(chatId, cmd.toLowerCase().replace(/@.*$/, ''), text.slice(cmd.length).trim(), { send, edit });
    default:
      if (cmd.startsWith('/')) return send(chatId, 'I didn\'t get that command. Just send your shopping list, or use the buttons below.', KEYBOARD);
      return doHunt(chatId, { kind: 'text', text });
  }
}

function singleInstance() {
  // Telegram allows one poller per bot; refuse to start a second copy.
  const pidFile = join(cfg.dataDir, 'bot.pid');
  try {
    const old = Number(readFileSync(pidFile, 'utf8'));
    if (old && old !== process.pid) { process.kill(old, 0); throw new Error(`already running as pid ${old}`); }
  } catch (e) { if (!/ENOENT|ESRCH|NaN/.test(e.code || e.message)) throw e; }
  writeFileSync(pidFile, String(process.pid));
}

async function main() {
  if (!cfg.telegramToken) throw new Error('TELEGRAM_BOT_TOKEN missing');
  singleInstance();
  const me = await tg('getMe');
  cfg.botUsername ||= me.username;
  await tg('setMyCommands', { commands: [
    { command: 'start', description: 'How Iva works' },
    { command: 'brain', description: "Iva's wallet, 0G balance, receipts" },
    { command: 'pay', description: 'Buy hunts with 0G' },
    { command: 'paid', description: 'Claim a payment: /paid <txhash>' },
    { command: 'me', description: 'Your credits and location' },
    { command: 'city', description: 'Set city: /city pune' },
    ...WATCH_COMMANDS,
    { command: 'deals', description: 'Live deals near you (Arkiv): /deals eggs' },
  ] });
  console.log(`Iva up as @${me.username} · wallet ${ivaAddress}`);
  startTreasury((ev) => console.log('[treasury]', ev.type, ev.amount0G, ev.tx));
  startWatchScheduler({ send }); // /watch daily alert
  await poll(onUpdate);
}

// Run the bot only when started directly (node src/bot.mjs); scripts can import onUpdate.
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, async () => {
      setTimeout(() => process.exit(0), 3000).unref();
      await closeAll().catch(() => {});
      process.exit(0);
    });
  }
  main().catch((e) => { console.error(e); process.exit(1); });
}

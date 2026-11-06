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
import { user, updateUser, txUsed, markTx, logEvent, recentEvents, totals } from './ledger.mjs';
import { txUrl } from './config.mjs';

const run = promisify(execFile);

const CITIES = {
  mumbai: [19.0662, 72.8697], bandra: [19.0596, 72.8295], andheri: [19.1136, 72.8697],
  pune: [18.5204, 73.8567], bengaluru: [12.9716, 77.5946], bangalore: [12.9716, 77.5946],
  delhi: [28.6139, 77.209], gurugram: [28.4595, 77.0266], hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707], kochi: [10.0261, 76.3125], kolkata: [22.5726, 88.3639],
};

const fmt0G = (x) => `${Number(x).toFixed(Number(x) < 1 ? 2 : 1)} 0G`;

function payLink(chatId, amount) {
  const p = new URLSearchParams({ to: ivaAddress, amount: String(amount), bot: cfg.botUsername });
  return `${cfg.payPageUrl}?${p}`;
}

const WELCOME = (u) => `👋 <b>Hi, I'm Iva</b> — your grocery deal hunter.

Send me your shopping list and I'll check <b>Blinkit, Instamart and Zepto</b> near you and tell you the cheapest basket.
• type it: <i>12 eggs, 1 kg onion, amul butter 500g</i>
• or send a 📷 photo of a handwritten list
• or a 🎙 voice note (Hindi / English / Malayalam)

📍 Share your location (📎 → Location) or send <code>/city pune</code>. Default: Mumbai.

💸 I pay for my own brain. Each hunt costs <b>${cfg.huntFee} 0G</b>, and that money tops up my 0G compute account. ${u.freeUsed < cfg.freeHunts ? `Your first ${cfg.freeHunts > 1 ? cfg.freeHunts + ' hunts are' : 'hunt is'} on me.` : ''}
/brain — see my wallet, balance and 0G receipts
/pay — buy hunts · /me — your credits`;

async function payPrompt(chatId) {
  const amt = Number((cfg.huntFee * 5).toFixed(2));
  return send(chatId, `💸 Each hunt is <b>${cfg.huntFee} 0G</b>. That money pays for my 0G brain, so I keep working without anyone topping me up.

1️⃣ <a href="${payLink(chatId, amt)}">Open the pay page</a> (MetaMask / any EVM wallet on <b>0G mainnet</b>, chain 16661)
2️⃣ Come back with the button there, or send <code>/paid 0x…txhash</code>

Or send any amount of 0G to my wallet directly:
<code>${ivaAddress}</code>
${amt} 0G = ${Math.floor(amt / cfg.huntFee + 1e-9)} hunts.`);
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
  logEvent('payment', { tx: hash, amount0G: v.amount0G, from: v.from, chat: String(chatId), kind: v.kind, hunts });
  await edit(chatId, m.message_id, `✅ Got <b>${fmt0G(v.amount0G)}</b> — <a href="${txUrl(hash)}">tx</a>
+${hunts} hunts (you have ${user(chatId).credits}).
${v.kind === 'wallet' ? '⚡ I\'ll now move it into my 0G compute account myself…' : '⚡ It went straight into my 0G compute account.'}`);
  const ev = await treasuryTick('payment');
  if (ev?.type === 'deposit') await send(chatId, `⚡ Topped up my own brain: deposited <b>${fmt0G(ev.amount0G)}</b> into 0G compute — <a href="${txUrl(ev.tx)}">tx</a>`);
}

let busy = 0;

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
    updateUser(chatId, { hunts: (u.hunts || 0) + 1, savedRs: (u.savedRs || 0) + (r.basket.saving || 0) });
    logEvent('hunt', { chat: String(chatId), kind: input.kind, items: r.items.length, tier: r.brain.tier,
      calls: r.receipts.map((x) => x.requestId), cost0G: r.receipts.reduce((a, x) => a + x.cost0G, 0),
      best: r.basket.best, saving: r.basket.saving, paidWith });
    const after = user(chatId);
    if (after.credits === 0 && after.freeUsed >= cfg.freeHunts) await send(chatId, 'That was your last hunt. /pay to get more — it keeps my brain running.');
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

async function onUpdate(up) {
  const msg = up.message;
  if (!msg || msg.chat.type !== 'private') return;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const u = user(chatId);

  if (msg.location) {
    updateUser(chatId, { lat: msg.location.latitude, lng: msg.location.longitude });
    return send(chatId, '📍 Got it — I\'ll hunt near you. Now send your list.');
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

  const [cmd, ...rest] = text.split(/\s+/);
  const arg = rest.join(' ');
  switch (cmd.toLowerCase().replace(/@.*$/, '')) {
    case '/start':
      if (/^(0x)?[0-9a-fA-F]{64}$/.test(arg)) return claimPayment(chatId, arg);
      return send(chatId, WELCOME(u));
    case '/help': return send(chatId, WELCOME(u));
    case '/pay': return payPrompt(chatId);
    case '/paid':
      if (!/^(0x)?[0-9a-fA-F]{64}$/.test(arg)) return send(chatId, 'Send it like: <code>/paid 0x…</code> (the transaction hash)');
      return claimPayment(chatId, arg);
    case '/me': return send(chatId, `🙋 You have <b>${u.credits}</b> paid hunts${u.freeUsed < cfg.freeHunts ? ` + ${cfg.freeHunts - u.freeUsed} free` : ''}. Hunts so far: ${u.hunts || 0} · saved ≈ ₹${u.savedRs || 0}.\n📍 ${u.lat ? `${u.lat.toFixed(3)}, ${u.lng.toFixed(3)}` : 'Mumbai (default)'}`);
    case '/city': {
      const c = CITIES[arg.toLowerCase()];
      if (!c) return send(chatId, `Cities: ${Object.keys(CITIES).join(', ')} — or share your location.`);
      updateUser(chatId, { lat: c[0], lng: c[1] });
      return send(chatId, `📍 Hunting in <b>${arg}</b> now.`);
    }
    case '/brain': {
      const s = await brainState({ fresh: true });
      return send(chatId, brainMessage(s, totals(), recentEvents(null, 40), ivaAddress));
    }
    default:
      if (cmd.startsWith('/')) return send(chatId, 'I know /start /pay /paid /me /city /brain — or just send your list.');
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
  ] });
  console.log(`Iva up as @${me.username} · wallet ${ivaAddress}`);
  startTreasury((ev) => console.log('[treasury]', ev.type, ev.amount0G, ev.tx));
  await poll(onUpdate);
}

main().catch((e) => { console.error(e); process.exit(1); });

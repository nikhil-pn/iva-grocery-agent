// Iva's live deal feed on Arkiv (Rabdi testnet).
//
// Grocery discounts on Blinkit / Instamart / Zepto last hours, so Iva's deals do too.
// After every hunt she publishes the product she matched per item per shop as an Arkiv
// entity that EXPIRES after cfg.arkiv.dealHours (6 h). The chain drops it then; there is no
// cleanup job and no database to run. Anyone can read the feed with an attribute query
// (city + item), filtered to Iva's writer wallet so nobody can spoof deals into it.
//
//   publishDeals(huntResult, loc)  write side, fire-and-forget, never throws
//   liveDeals({ lat, lng, item })  read side, used by /deals and scripts/arkiv-query.mjs
//   dealsMessage(feed)             Telegram (HTML) rendering of liveDeals()
//   dealsReply({ lat, lng, item }) liveDeals + dealsMessage, never throws (for the bot)
import { createPublicClient, createWalletClient, ExpirationTime } from '@arkiv-network/sdk';
import { rabdi } from '@arkiv-network/sdk/chains';
import { and, asc, desc, eq } from '@arkiv-network/sdk/query';
import { bool, bytes, dec, defineSchema, str, u64 } from '@arkiv-network/sdk/schema';
import { http, hexToString, stringToHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { cfg } from './config.mjs';

/** One deal = one product Iva matched for one list item in one shop, at one place and time. */
export const Deals = defineSchema('iva.deal.v1', {
  item: str().indexed(),         // normalised item key: "egg", "onion", "amul butter"
  query: str(),                  // the search text Iva sent the shop
  want: str(),                   // what the user asked for: "12 eggs"
  shop: str().indexed(),         // blinkit | instamart | zepto
  product: str(),                // product name as the shop lists it
  priceRs: dec().indexed(),      // price of one pack, ₹
  mrpRs: dec().optional(),       // printed MRP, ₹, when the shop gives it
  pack: str(),                   // pack text: "12 pcs", "1 kg"
  unit: str().indexed(),         // kg | piece | pack
  unitPriceRs: dec().indexed(),  // ₹ per kg / per piece / per pack (comparable across shops)
  best: bool().indexed(),        // the cheapest shop for this item in this hunt
  city: str().indexed(),         // nearest metro within 40 km, or "other"
  cell: str().indexed(),         // lat,lng rounded to 0.05° (~5 km), e.g. "19.05,72.85"
  huntAt: u64().indexed(),       // unix seconds when Iva saw the price
  url: bytes(),                  // product link (UTF-8; links can exceed the 128-byte str cap)
  matchedBy: str(),              // the 0G model that matched it, or "plain" in survival mode
});

const BLOCK_SECONDS = 2; // Rabdi's nominal block time (arkiv_getBlockTiming reports 2)
const BATCH = 12;        // entities per transaction

// Metro buckets. A user anywhere in a metro sees the whole metro's deals.
const METROS = {
  mumbai: [19.0662, 72.8697], pune: [18.5204, 73.8567], bengaluru: [12.9716, 77.5946],
  delhi: [28.6139, 77.209], gurugram: [28.4595, 77.0266], noida: [28.5355, 77.391],
  hyderabad: [17.385, 78.4867], chennai: [13.0827, 80.2707], kochi: [10.0261, 76.3125],
  kolkata: [22.5726, 88.3639], ahmedabad: [23.0225, 72.5714],
};
const LABEL = { blinkit: 'Blinkit', instamart: 'Instamart', zepto: 'Zepto' };

// ---------- helpers ----------

function km(a, b) {
  const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** { city, cell } for a location: the nearest metro within 40 km (else "other"), and a 0.05° cell. */
export function bucket({ lat, lng }) {
  let city = 'other', best = 40;
  for (const [name, c] of Object.entries(METROS)) {
    const d = km([lat, lng], c);
    if (d < best) { best = d; city = name; }
  }
  const r = (x) => (Math.round(x * 20) / 20).toFixed(2);
  return { city, cell: `${r(lat)},${r(lng)}` };
}

/** "Eggs (brown)!" → "egg brown". Words singular, so "eggs", "egg" and "Eggs" meet. */
export function itemKey(s) {
  return String(s || '').toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/).filter((w) => w && !/^\d/.test(w))
    .map((w) => (w.length > 3 && /ies$/.test(w) ? w.slice(0, -3) + 'y'
      : w.length > 4 && /oes$/.test(w) ? w.slice(0, -2)
        : w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w))
    .join(' ').slice(0, 60);
}

/** Cut a string to fit Arkiv's 128-byte str limit without splitting a character. */
function clip(s, maxBytes = 120) {
  let out = String(s ?? '');
  while (Buffer.byteLength(out, 'utf8') > maxBytes) out = out.slice(0, -1);
  return out;
}
const rs = (x) => dec(Number(x).toFixed(2));

// ---------- clients ----------

let _pub, _wallet;
const chain = () => rabdi({ accessKey: cfg.arkiv.accessKey });
export function publicClient() {
  return (_pub ||= createPublicClient({ chain: chain(), transport: http() }));
}
function walletClient() {
  if (!cfg.arkiv.privateKey) throw new Error('ARKIV_PRIVATE_KEY is not set');
  return (_wallet ||= createWalletClient({
    chain: chain(), transport: http(), account: privateKeyToAccount(cfg.arkiv.privateKey),
  }));
}
export const entityUrl = (key) => `${cfg.arkiv.explorer}/entity/${key}`;
export const arkivTxUrl = (hash) => `${cfg.arkiv.explorer}/tx/${hash}`;
export const writerUrl = () => `${cfg.arkiv.explorer}/address/${cfg.arkiv.address}`;

// ---------- write ----------

/** Turn a hunt result into Arkiv entity values: one per item per shop that had a match. */
export function dealsFromHunt(r, loc, at = r.at || Date.now()) {
  const { city, cell } = bucket(loc);
  const matchedBy = r.receipts?.length ? (r.receipts.at(-1).model || r.brain?.tier || 'model') : 'plain';
  const out = [];
  r.items.forEach((it, i) => {
    const picks = Object.entries(r.picks[i] || {}).filter(([, x]) => x && x.p);
    if (!picks.length) return;
    const cheapest = Math.min(...picks.map(([, x]) => x.p.price * x.packs));
    for (const [shop, x] of picks) {
      const p = x.p;
      const [unit, unitPrice] = p.perKg != null ? ['kg', p.perKg]
        : p.perPiece != null ? ['piece', p.perPiece] : ['pack', p.price];
      const values = {
        item: clip(itemKey(it.query) || itemKey(it.want) || 'item'),
        query: clip(it.query), want: clip(it.want || it.query),
        shop, product: clip(p.name), priceRs: rs(p.price), pack: clip(p.pack || ''),
        unit, unitPriceRs: rs(unitPrice), best: p.price * x.packs === cheapest,
        city, cell, huntAt: u64(Math.floor(at / 1000)),
        url: bytes(stringToHex(String(p.url || ''))), matchedBy: clip(matchedBy),
      };
      if (p.mrp) values.mrpRs = rs(p.mrp);
      out.push(values);
    }
  });
  return out;
}

let queue = Promise.resolve(); // one write at a time, so two hunts never race on the nonce

/**
 * Publish a hunt's deals to Arkiv, each expiring after cfg.arkiv.dealHours.
 * Fire-and-forget: never throws. Resolves to { ok, keys, txs } or { ok: false, error }.
 */
export function publishDeals(r, loc) {
  const job = queue.then(() => publishNow(r, loc));
  queue = job.catch(() => {});
  return job;
}

async function publishNow(r, loc) {
  const keys = [], txs = [];
  try {
    if (!cfg.arkiv.enabled) return { ok: false, error: 'disabled' };
    if (!cfg.arkiv.privateKey) return { ok: false, error: 'no ARKIV_PRIVATE_KEY' };
    const deals = dealsFromHunt(r, loc);
    if (!deals.length) return { ok: true, keys: [], txs: [] };
    const w = walletClient();
    const expiration = ExpirationTime.fromHours(cfg.arkiv.dealHours);
    for (let i = 0; i < deals.length; i += BATCH) {
      const creates = deals.slice(i, i + BATCH).map((values) => ({ schema: Deals, values, expiration }));
      const res = await w.executeBatch({ creates });
      keys.push(...res.createdEntities);
      txs.push(res.txHash);
    }
    const { city } = bucket(loc);
    console.log(`[arkiv] published ${keys.length} deals (${city}) in ${txs.length} tx: ${txs.join(', ')}`);
    try {
      const { logEvent } = await import('./ledger.mjs');
      logEvent('arkiv', { deals: keys.length, city, txs, keys, expiresInH: cfg.arkiv.dealHours });
    } catch { /* receipts are best-effort */ }
    return { ok: true, keys, txs };
  } catch (e) {
    let msg = String(e?.shortMessage || e?.message || e).split('\n')[0];
    // an unfunded writer fails gas estimation with a bare "Execution error"; say what it is
    const bal = await publicClient().getBalance({ address: cfg.arkiv.address }).catch(() => null);
    if (bal === 0n) msg = `writer ${cfg.arkiv.address} has no tGLM for gas (faucet: https://hub.arkiv.network/faucet). ${msg}`;
    console.error('[arkiv] publish failed:', msg, keys.length ? `(${keys.length} published before it: ${txs.join(', ')})` : '');
    return { ok: false, error: msg, keys, txs };
  }
}

// ---------- read ----------

const PICK = {
  $key: true, $expiresAt: true, item: true, want: true, shop: true, product: true, priceRs: true,
  pack: true, unit: true, unitPriceRs: true, best: true, city: true, cell: true, huntAt: true, url: true,
};

/**
 * Live (not yet expired) deals near a location, cheapest first.
 * item is optional ("eggs", "amul butter"). Returns { city, cell, item, deals, blockNumber, queries }.
 * Expired entities are gone from Arkiv, so everything returned is still live.
 */
export async function liveDeals({ lat = cfg.defaultLat, lng = cfg.defaultLng, item = '', limit = 100 } = {}) {
  const { city, cell } = bucket({ lat, lng });
  const where = city !== 'other' ? eq('city', city) : eq('cell', cell);
  const key = itemKey(item);
  const queries = [];
  const run = (expr, order) => {
    const q = publicClient().select(PICK).from(Deals).where(expr)
      .ownedBy(cfg.arkiv.address).orderBy(order).limit(limit);
    queries.push(q.toString()); // the query string the node parses, for scripts and docs
    return q.fetch();
  };

  let res = key ? await run(and(where, eq('item', key)), asc('unitPriceRs')) : null;
  // nothing under that exact key: look through the area's newest deals for a partial match
  // ("butter" finds "amul butter")
  let fuzzy = false;
  if (!res || (key && !res.entities.length)) {
    res = await run(where, desc('huntAt'));
    fuzzy = !!key;
  }
  const now = res.blockNumber;
  let rows = res.entities.map((e) => ({
    key: e.$key,
    item: e.item.value, want: e.want.value, shop: e.shop.value, product: e.product.value,
    priceRs: Number(e.priceRs.value), pack: e.pack.value, unit: e.unit.value,
    unitPriceRs: Number(e.unitPriceRs.value), best: e.best.value, city: e.city.value, cell: e.cell.value,
    huntAt: Number(e.huntAt.value) * 1000,
    url: hexToString(e.url.value),
    expiresInS: Number(BigInt(e.$expiresAt) - now) * BLOCK_SECONDS,
  })).filter((d) => d.expiresInS > 0);
  if (fuzzy) {
    const words = key.split(' ');
    rows = rows.filter((d) => words.every((w) => d.item.includes(w) || itemKey(d.product).includes(w)));
  }
  // the same product seen in several hunts: keep the newest sighting
  const seen = new Map();
  for (const d of rows.sort((a, b) => b.huntAt - a.huntAt)) {
    const k = `${d.item}|${d.shop}|${d.product}|${d.pack}`;
    if (!seen.has(k)) seen.set(k, d);
  }
  const deals = [...seen.values()].sort((a, b) =>
    (key ? 0 : a.item.localeCompare(b.item)) || a.unitPriceRs - b.unitPriceRs || a.priceRs - b.priceRs);
  return { city, cell, item: key, deals, blockNumber: now, queries };
}

// ---------- render ----------

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function ago(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
const perUnit = (d) => (d.unit === 'pack' ? '' : ` · ₹${d.unitPriceRs % 1 ? d.unitPriceRs.toFixed(2) : d.unitPriceRs}/${d.unit === 'kg' ? 'kg' : 'pc'}`);

/** Telegram HTML for a liveDeals() result. With an item: its cheapest deals. Without: cheapest per item. */
export function dealsMessage(feed, { perItem = 3, maxItems = 6 } = {}) {
  const place = feed.city !== 'other' ? feed.city[0].toUpperCase() + feed.city.slice(1) : `area ${feed.cell}`;
  const L = [`🏷 <b>Live deals near ${esc(place)}</b>${feed.item ? ` for <b>${esc(feed.item)}</b>` : ''}`];
  if (!feed.deals.length) {
    L.push(feed.item
      ? `\nNo live deals for that here yet. Deals expire ${cfg.arkiv.dealHours} h after a hunt. Send me a list with it and I'll publish what I find.`
      : `\nNo live deals here yet. Deals expire ${cfg.arkiv.dealHours} h after a hunt. Send me a shopping list and the deals I find go live for everyone nearby.`);
  } else {
    const byItem = new Map();
    for (const d of feed.deals) byItem.set(d.item, [...(byItem.get(d.item) || []), d]);
    const items = [...byItem.entries()]
      .sort((a, b) => Math.max(...b[1].map((d) => d.huntAt)) - Math.max(...a[1].map((d) => d.huntAt)))
      .slice(0, feed.item ? 1 : maxItems);
    // an item search can match several keys ("butter" → "amul butter", "butter"): show them all
    const groups = feed.item ? [[feed.item, feed.deals]] : items;
    for (const [item, ds] of groups) {
      L.push(`\n<b>${esc(item)}</b>`);
      ds.slice(0, feed.item ? 6 : perItem).forEach((d, k) => {
        L.push(`${k === 0 ? '   ✅' : '   ▫️'} ${LABEL[d.shop] || esc(d.shop)} <b>₹${d.priceRs}</b> — ${d.url ? `<a href="${esc(d.url)}">${esc(d.product)}</a>` : esc(d.product)} (${esc(d.pack)})${perUnit(d)}`);
        L.push(`      ⏳ expires in ${ago(d.expiresInS * 1000)} · seen ${ago(Date.now() - d.huntAt)} ago`);
      });
    }
  }
  L.push(`\n📡 Public feed on <a href="${writerUrl()}">Arkiv</a>: deals expire on their own after ${cfg.arkiv.dealHours} h. Anyone can query it.`);
  return L.join('\n');
}

/** For the bot: never throws. */
export async function dealsReply(q) {
  try {
    return dealsMessage(await liveDeals(q));
  } catch (e) {
    console.error('[arkiv] read failed:', e?.shortMessage || e?.message || e);
    return '😕 I could not reach the Arkiv deal feed just now. Try again in a minute.';
  }
}

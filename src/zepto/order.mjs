// "Buy it": Iva orders the basket on Zepto through Zepto's official MCP server.
//  1. pick the delivery address (store context follows it)
//  2. search Zepto for every item, and let Iva's 0G brain pick the right product + packs
//  3. fill the Zepto cart, get payment methods, then create_order(confirmOrder:false) = bill preview
//  4. ONLY after the user replies YES: create_order(confirmOrder:true), cash on delivery
// Owner-only in this demo (one connected Zepto account). Every order needs an explicit YES.
import { connectZepto, isConnected } from './mcp.mjs';
import { parsePack } from '../shops/pack.mjs';
import { chat, parseJson, BrokeError } from '../zg/router.mjs';
import { brainState } from '../brain.mjs';
import { logEvent } from '../ledger.mjs';

const CONFIRM_MS = 3 * 60_000;
let client = null;
const pending = new Map(); // chatId -> { at, addressId, lines, total }

export const zeptoConnected = () => isConnected();

// Writes that change the real world are never retried: a retry could double-order,
// or land in a fresh MCP session that has no cart.
const NO_RETRY = new Set(['create_order', 'create_online_payment_order', 'create_wallet_order', 'create_upi_reserve_pay_order', 'update_cart']);
export let lastRaw = null; // last raw Zepto response, for debugging

async function call(name, args = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    let r;
    try {
      client ||= await connectZepto({ interactive: false });
      r = await client.callTool({ name, arguments: args });
    } catch (e) {
      // transport problem (expired session, network): reconnect once, but only for safe calls
      client = null;
      if (attempt || NO_RETRY.has(name)) throw e;
      continue;
    }
    lastRaw = { name, args, text: text(r), structured: r.structuredContent || null, isError: !!r.isError };
    if (r.isError) {
      console.error(`[zepto] ${name} error:`, text(r).slice(0, 1500));
      throw new Error(text(r).slice(0, 400) || `${name} failed`);
    }
    return r;
  }
}
const text = (r) => (r.content || []).map((c) => c.text || '').join('\n');
// Zepto's texts carry internal IDs and notes meant for the model, not for people.
const clean = (t) => String(t).split('\n---')[0].split('\n[SYSTEM NOTE')[0]
  .split('\n').filter((l) => !/\b(pvid|spid|ID:|address ID)\b/i.test(l)).join('\n').trim();

const rupees = (paise) => Math.round(Number(paise || 0)) / 100;

function packsFor(item, prod) {
  const p = parsePack(prod.packSize);
  if (item.grams && p.grams) return Math.max(1, Math.ceil(item.grams / p.grams - 0.05));
  if (item.pieces && p.pieces) return Math.max(1, Math.ceil(item.pieces / p.pieces - 0.05));
  return 1;
}

/** Plain fallback: the cheapest in-stock product whose name shares the query's words. */
function pickPlain(item, prods) {
  const words = item.query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const ok = prods.filter((p) => (p.availableQuantity ?? 1) > 0 &&
    words.every((w) => p.name.toLowerCase().includes(w.replace(/s$/, ''))));
  const pool = ok.length ? ok : prods.filter((p) => (p.availableQuantity ?? 1) > 0);
  return pool.map((p) => ({ p, packs: packsFor(item, p) }))
    .sort((a, b) => a.p.price * a.packs - b.p.price * b.packs)[0] || null;
}

/** Iva's 0G brain picks the matching Zepto product and pack count for each item. */
async function pickWith0G(items, sections, brain) {
  const byCode = {};
  let prompt = '';
  items.forEach((it, i) => {
    prompt += `\nItem ${i + 1}: "${it.want || it.query}"\n`;
    (sections[i]?.products || []).slice(0, 8).forEach((p, k) => {
      const code = `Z${i + 1}_${k + 1}`;
      byCode[code] = p;
      prompt += `${code} | ₹${rupees(p.price)} | ${p.name} | ${p.packSize || ''} | stock ${p.availableQuantity ?? '?'}\n`;
    });
  });
  const r = await chat({
    model: brain.models.text, tier: brain.tier, purpose: 'pick Zepto products to order', json: true,
    maxTokens: brain.tier === 'rich' ? 1500 : 700, privateTee: brain.tier === 'rich' && brain.models.text === 'glm-5.3',
    messages: [
      { role: 'system', content: 'You fill a real grocery order on Zepto. For each requested item pick the ONE in-stock product that is the same thing the user asked for (prefer the best value that covers the wanted quantity), and how many packs to buy (1–10). Use null if nothing matches. Return JSON {"picks":[{"n":itemNumber,"code":"Z1_2","packs":1}|{"n":2,"code":null}]}.' },
      { role: 'user', content: prompt },
    ],
  });
  const picks = items.map(() => null);
  for (const x of parseJson(r.text).picks || []) {
    const p = x.code && byCode[x.code];
    if (p && picks[x.n - 1] === null) picks[x.n - 1] = { p, packs: Math.max(1, Math.min(10, Number(x.packs) || 1)) };
  }
  return { picks, receipt: r };
}

/**
 * Build the Zepto cart for these items and return Zepto's own bill preview.
 * items: [{ query, want, grams, pieces }] from the last hunt.
 */
export async function prepareZeptoOrder(chatId, items, { addressId }) {
  if (!isConnected()) throw new Error('Zepto is not connected yet.');
  if (!addressId) throw new Error('No Zepto delivery address is set.');
  await call('select_saved_address', { addressId });
  await call('get_past_order_items').catch(() => {}); // Zepto asks clients to call this first
  const res = await call('search_multiple_products', { queries: items.map((i) => i.query) });
  const sections = items.map((it, i) => (res.structuredContent?.sections || []).find((s) => s.query === it.query)
    || res.structuredContent?.sections?.[i] || { products: [] });

  let picks, receipt = null;
  const brain = await brainState({ fresh: true }).catch(() => null);
  if (brain?.models) {
    try { ({ picks, receipt } = await pickWith0G(items, sections, brain)); }
    catch (e) { if (!(e instanceof BrokeError)) console.error('[zepto] 0G pick failed:', e.message); }
  }
  picks ||= items.map((it, i) => pickPlain(it, sections[i].products || []));

  const chosen = picks.map((x, i) => (x ? { ...x, item: items[i] } : null)).filter(Boolean);
  if (!chosen.length) throw new Error('None of these items are available on Zepto at that address.');
  await call('update_cart', {
    deviceId: `iva-${chatId}`, replaceCart: true,
    cartItems: chosen.map(({ p, packs }) => ({
      productVariantId: p.productVariantId, storeProductId: p.storeProductId, quantity: packs,
      name: p.name, price: p.price, mrp: p.mrp, packSize: p.packSize,
    })),
  });
  // Which payment Zepto allows for THIS order: cash on delivery if offered, else its secure payment link.
  const methodsText = text(await call('get_payment_methods'));
  const codOff = /Cash on Delivery[^\n]*not available/i.test(methodsText) || !/Cash on Delivery/i.test(methodsText.split('Unavailable')[0]);
  const linkOn = /PAYMENT_LINK|create_online_payment_order/i.test(methodsText.split('Unavailable')[0]);
  const method = !codOff ? 'cod' : linkOn ? 'link' : null;
  if (!method) throw new Error('Zepto offers no payment method I can use for this order (no cash on delivery, no payment link).');
  const methods = method === 'cod' ? 'Cash on delivery' : 'Pay online (UPI / cards) with Zepto\'s secure link, since cash on delivery isn\'t available for this order';
  const preview = await call(method === 'cod' ? 'create_order' : 'create_online_payment_order', { confirmOrder: false, userAddressId: addressId });
  const lines = chosen.map(({ p, packs, item }) => ({ want: item.want || item.query, name: p.name, pack: p.packSize, packs, price: rupees(p.price) * packs }));
  const missing = items.filter((_, i) => !picks[i]).map((i) => i.want || i.query);
  pending.set(String(chatId), { at: Date.now(), addressId, lines, method });
  logEvent('zepto_preview', { items: lines.length, requestId: receipt?.requestId || null });
  return { lines, missing, preview: summarizeBill(text(preview)).replace(/^Payment Method:.*$/m, ''), methods, method, receipt };
}

/** Keep only the lines a person needs from Zepto's preview (address, payment, totals). */
function summarizeBill(t) {
  const plain = String(t).replace(/\*\*/g, '');
  const keep = [];
  const lines = plain.split('\n').map((l) => l.trim());
  const at = lines.findIndex((l) => /^📍?\s*Delivering to/i.test(l));
  if (at >= 0) keep.push(`📍 ${lines[at + 1] || lines[at].replace(/^📍?\s*Delivering to:?/i, '').trim()}`.slice(0, 120));
  for (const l of lines) {
    if (/^(Payment Method|Item Total|Delivery Fee|Handling|Small Cart|Platform|Surge|Rain|Late Night|Amount To Pay|Total Savings)/i.test(l)) keep.push(l);
  }
  return keep.length ? keep.join('\n') : clean(t).slice(0, 600);
}

export function hasPending(chatId) {
  const p = pending.get(String(chatId));
  return !!p && Date.now() - p.at < CONFIRM_MS;
}

/** Place the order. Only called after the user replied YES to the preview. */
export async function confirmZeptoOrder(chatId) {
  const p = pending.get(String(chatId));
  if (!p || Date.now() - p.at > CONFIRM_MS) { pending.delete(String(chatId)); throw new Error('That preview expired. Say "order" again.'); }
  pending.delete(String(chatId));
  const tool = p.method === 'link' ? 'create_online_payment_order' : 'create_order';
  const r = await call(tool, { confirmOrder: true, userAddressId: p.addressId });
  const raw = text(r);
  const sc = r.structuredContent || {};
  const all = JSON.stringify(sc) + ' ' + raw;
  const orderId = sc.orderId || sc.order_id || sc.id || all.match(/order\s*id["':\s]*([A-Za-z0-9-]{6,})/i)?.[1] || null;
  const payUrl = sc.paymentLink || sc.paymentUrl || sc.payment_link || all.match(/https?:\/\/[^\s"'<>)\]]+/i)?.[0] || null;
  logEvent('zepto_order', { items: p.lines.length, orderId, method: p.method });
  return { text: clean(raw), orderId, payUrl, method: p.method };
}

/** One payment-status check for an online-payment order. Returns { state, text }. */
export async function zeptoPaymentStatus(orderId) {
  const r = await call('check_payment_status', { orderId, poll: false });
  const t = text(r);
  const s = (JSON.stringify(r.structuredContent || {}) + ' ' + t).toUpperCase();
  const state = /SUCCESS|PAID|COMPLETED|CONFIRMED/.test(s) ? 'paid'
    : /FAILED|CANCELLED|CANCELED|EXPIRED|DECLINED/.test(s) ? 'failed' : 'pending';
  return { state, text: clean(t).slice(0, 600) };
}

export function cancelPending(chatId) { pending.delete(String(chatId)); }

/** Latest order status from Zepto (order tracking), as a short readable summary. */
export async function trackZeptoOrder() {
  const r = await call('list_order_history', { limit: 1 });
  let o = r.structuredContent?.orders?.[0];
  if (!o) { try { const t = text(r); o = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)).orders?.[0]; } catch { /* plain text */ } }
  if (!o) return clean(text(r)).slice(0, 800);
  const items = (o.productsNamesAndCounts || []).slice(0, 6).map((x) => `• ${x.name.split('|')[0].trim()}${x.count > 1 ? ` ×${x.count}` : ''}`).join('\n');
  const eta = o.totalArrivalTimeInMinutes ? ` · arriving in ~${o.totalArrivalTimeInMinutes} min` : '';
  return `Order ${o.code || o.id}: ${o.formattedStatus || o.status || 'unknown'}${eta}\n${o.itemQuantityCount || ''} items · ₹${rupees(o.grandTotalAmount)}\n${items}`;
}

/** Turn Zepto's errors into something a person can act on. */
export function friendlyZeptoError(e) {
  const m = String(e?.message || e);
  if (/STORE_CLOSED/i.test(m)) return 'Zepto\'s store for that delivery address is closed right now (many stores close at night). Try again in the morning, or deliver to an area where Zepto runs 24/7.';
  if (/not deliverable|unserviceable|SERVICEABLE/i.test(m)) return 'Zepto can\'t deliver this cart to that address right now.';
  if (/unauthor|401|token/i.test(m)) return 'My Zepto login expired. Reconnect Zepto and try again.';
  return m.replace(/^Error:\s*/, '').slice(0, 300);
}

export async function zeptoAddresses() {
  return text(await call('list_saved_addresses'));
}

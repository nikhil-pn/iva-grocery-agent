// A hunt: shopping list in → cheapest basket across Blinkit, Instamart and Zepto out.
//  1. understand the list (text / photo / voice) — 0G model, or plain parsing in survival
//  2. search every shop for every item at the user's location
//  3. match the same product across shops and work out how many packs are needed — 0G model,
//     or cheapest-per-unit in survival
//  4. build the basket and the saving
import { SHOPS, searchAll } from './shops/index.mjs';
import { chat, parseJson, BrokeError } from './zg/router.mjs';
import { brainState, markRefused } from './brain.mjs';

const LIST_PROMPT = `You turn an Indian grocery shopping list into search queries for quick-commerce apps (Blinkit, Zepto, Instamart).
The list may be English, Hindi, Hinglish or Malayalam, typed or handwritten. Translate to the common English product name a shop search understands.
Return JSON: {"items":[{"query":"short search text, e.g. 'eggs' or 'chicken curry cut' or 'amul butter'","want":"what the user asked, e.g. '12 eggs' or '1 kg'","grams":number|null,"pieces":number|null}]}
Use grams for weight/volume (1 kg = 1000, 1 litre = 1000). Use pieces for countable items (eggs, bread loaves = 1 pack). Max 8 items. No commentary.`;

const MATCH_PROMPT = `You are Iva, a careful grocery price analyst. For each requested item you get candidate products from up to three shops (B=Blinkit, I=Instamart, Z=Zepto), each as "code | ₹price | name | pack".
For each item and each shop, pick the ONE candidate that is the same kind of product the user wants (same product type; brand may differ unless the user named one; skip combos/unrelated items), and how many packs are needed to cover the wanted quantity (round up; 1 if no quantity).
If no candidate in a shop is a real match, use null for that shop.
Return JSON: {"items":[{"n":itemNumber,"B":{"code":"B3","packs":1}|null,"I":...|null,"Z":...|null}],"tip":"one short, useful sentence for the shopper (e.g. which shop wins and why)"}`;

function tokens(s) { return String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2); }

/** Plain parsing for survival mode: one item per line or comma. */
function parseListPlain(text) {
  return String(text).split(/\n|,|;| and /i).map((s) => s.trim()).filter(Boolean).slice(0, 8).map((line) => {
    const g = line.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|grams?|l|litres?|ml)\b/i);
    const pcs = line.match(/(\d+)\s*(pcs?|pieces?|nos?|x)?\b/i);
    let grams = null, pieces = null;
    if (g) grams = Number(g[1]) * (/^(kg|l|litres?)$/i.test(g[2]) ? 1000 : 1);
    else if (pcs) pieces = Number(pcs[1]);
    const query = line.replace(/(\d+(?:\.\d+)?)\s*(kg|g|gm|grams?|l|litres?|ml|pcs?|pieces?|nos?|x)?\b/gi, '').replace(/\s+/g, ' ').trim() || line;
    return { query, want: line, grams, pieces };
  });
}

export async function understand(input, brain, receipts) {
  const m = brain.models;
  if (input.kind === 'text' && (!m || input.text.length < 3)) return parseListPlain(input.text);
  if (!m) throw new Error('survival');
  let content;
  if (input.kind === 'text') content = input.text;
  else if (input.kind === 'photo') content = [
    { type: 'text', text: 'Read this shopping list (it may be handwritten or a screenshot) and convert it.' },
    { type: 'image_url', image_url: { url: `data:${input.mime || 'image/jpeg'};base64,${input.b64}` } },
  ];
  else if (input.kind === 'voice') content = [
    { type: 'text', text: 'This voice note is a shopping list. Listen and convert it.' },
    { type: 'input_audio', input_audio: { data: `data:audio/${input.format || 'wav'};base64,${input.b64}`, format: input.format || 'wav' } },
  ];
  const model = input.kind === 'photo' ? m.vision : input.kind === 'voice' ? m.audio : m.text;
  const r = await chat({
    model, purpose: `read ${input.kind} list`, tier: brain.tier, json: input.kind === 'text',
    maxTokens: brain.tier === 'rich' ? 1500 : 600, privateTee: brain.tier === 'rich' && model === 'glm-5.3',
    messages: [{ role: 'system', content: LIST_PROMPT }, { role: 'user', content }],
  });
  receipts.push(r);
  const items = (parseJson(r.text).items || []).filter((x) => x && x.query).slice(0, 8);
  if (!items.length) throw new Error('I could not find any grocery items in that.');
  return items;
}

function shortlist(item, products) {
  const qt = tokens(item.query);
  const scored = products.filter((p) => p.inStock).map((p) => {
    const nt = tokens(p.name);
    // whole-word hits count fully; prefix hits ("egg" ~ "eggs") count half, so
    // "butter" does not happily match "buttermilk"
    let hit = 0;
    for (const w of qt) {
      if (nt.includes(w) || nt.includes(w + 's') || nt.includes(w.replace(/s$/, ''))) hit += 1;
      else if (nt.some((x) => x.startsWith(w) || w.startsWith(x))) hit += 0.3;
    }
    return { p, score: qt.length ? hit / qt.length : 0 };
  }).filter((x) => x.score >= 0.75);
  scored.sort((a, b) => b.score - a.score || unitPrice(a.p) - unitPrice(b.p));
  return scored.slice(0, 8).map((x) => ({ ...x.p, score: x.score }));
}
const unitPrice = (p) => p.perKg ?? (p.perPiece != null ? p.perPiece * 1000 : p.price * 1000);

function packsFor(item, p) {
  if (item.grams && p.grams) return Math.max(1, Math.ceil(item.grams / p.grams - 0.05));
  if (item.pieces && p.pieces) return Math.max(1, Math.ceil(item.pieces / p.pieces - 0.05));
  return 1;
}

/** Survival-mode matching: the cheapest way to cover the wanted quantity. */
function coverCost(item, p) {
  const wantsUnit = item.pieces ? 'pieces' : item.grams ? 'grams' : null;
  // can't measure this pack in the unit the user asked for → push it down the list
  if (wantsUnit && !p[wantsUnit]) return p.price * 50;
  return p.price * packsFor(item, p);
}
function matchPlain(items, lists) {
  return items.map((item, i) => {
    const picks = {};
    for (const s of SHOPS) {
      const c = lists[i][s.id];
      if (!c.length) { picks[s.id] = null; continue; }
      const top = Math.max(...c.map((p) => p.score));
      const best = c.filter((p) => p.score >= top - 0.01).sort((a, b) => coverCost(item, a) - coverCost(item, b))[0];
      picks[s.id] = { p: best, packs: packsFor(item, best) };
    }
    return picks;
  });
}

async function matchWithModel(items, lists, brain, receipts) {
  const letter = { blinkit: 'B', instamart: 'I', zepto: 'Z' };
  const byCode = {};
  let prompt = '';
  items.forEach((item, i) => {
    prompt += `\nItem ${i + 1}: "${item.want || item.query}" (search: ${item.query})\n`;
    for (const s of SHOPS) {
      lists[i][s.id].forEach((p, k) => {
        const code = `${letter[s.id]}${i + 1}_${k + 1}`;
        byCode[code] = p;
        prompt += `${code} | ₹${p.price} | ${p.name} | ${p.pack}\n`;
      });
    }
  });
  const r = await chat({
    model: brain.models.text, purpose: 'match products across shops', tier: brain.tier, json: true,
    maxTokens: brain.tier === 'rich' ? 2500 : 900, privateTee: brain.tier === 'rich' && brain.models.text === 'glm-5.3',
    messages: [{ role: 'system', content: MATCH_PROMPT }, { role: 'user', content: prompt.slice(0, 24000) }],
  });
  receipts.push(r);
  const j = parseJson(r.text);
  const picks = items.map(() => ({}));
  for (const row of j.items || []) {
    const i = Number(row.n) - 1;
    if (!picks[i]) continue;
    for (const s of SHOPS) {
      const sel = row[letter[s.id]];
      const p = sel && byCode[sel.code];
      // the model picks WHICH product; pack count is arithmetic, so compute it when sizes are known
      const sized = (items[i].grams && p?.grams) || (items[i].pieces && p?.pieces);
      picks[i][s.id] = p ? { p, packs: sized ? packsFor(items[i], p) : Math.max(1, Math.min(10, Number(sel.packs) || 1)) } : null;
    }
  }
  return { picks, tip: j.tip || '' };
}

/**
 * Run a hunt. input = { kind: 'text'|'photo'|'voice', text?, b64?, mime?, format? }
 * onProgress(msg) gets short status updates for the chat.
 */
export async function hunt(input, loc, onProgress = () => {}) {
  const receipts = [];
  let brain = await brainState({ fresh: true });
  let items, degraded = '';
  try {
    items = await understand(input, brain, receipts);
  } catch (e) {
    if (e instanceof BrokeError) { markRefused(e.code); brain = await brainState({ fresh: true }); degraded = e.message; }
    if (input.kind !== 'text') throw new Error(e.message === 'survival'
      ? 'I am in survival mode (out of compute), so I can only read typed lists right now.' : e.message);
    items = parseListPlain(input.text);
  }
  onProgress(`🔎 Checking ${items.length} item${items.length > 1 ? 's' : ''} on Blinkit, Instamart and Zepto…`);

  const lists = [];
  for (let i = 0; i < items.length; i += 3) {
    const batch = await Promise.all(items.slice(i, i + 3).map((it) => searchAll(it.query, loc)));
    batch.forEach((res, k) => {
      const it = items[i + k];
      lists.push(Object.fromEntries(SHOPS.map((s) => [s.id, shortlist(it, res[s.id] || [])])));
    });
  }

  let picks, tip = '';
  if (brain.models && brain.tier !== 'survival') {
    try { ({ picks, tip } = await matchWithModel(items, lists, brain, receipts)); }
    catch (e) {
      if (e instanceof BrokeError) { markRefused(e.code); degraded = e.message; }
      picks = matchPlain(items, lists);
    }
  } else picks = matchPlain(items, lists);

  if (!picks.some((pk) => SHOPS.some((s) => pk && pk[s.id]))) {
    throw new Error('I couldn\'t find any of those in the shops near you. Try product names, like "12 eggs, 1 kg onion".');
  }
  return { items, picks, tip, receipts, brain, degraded, basket: basket(items, picks) };
}

export function basket(items, picks) {
  const totals = {};
  for (const s of SHOPS) {
    let sum = 0, missing = 0;
    picks.forEach((pk) => { const x = pk[s.id]; if (x) sum += x.p.price * x.packs; else missing++; });
    totals[s.id] = { sum: Math.round(sum), missing };
  }
  const full = SHOPS.filter((s) => totals[s.id].missing === 0);
  const ranked = (full.length ? full : SHOPS).slice().sort((a, b) =>
    totals[a.id].missing - totals[b.id].missing || totals[a.id].sum - totals[b.id].sum);
  const best = ranked[0], worst = full.length > 1 ? full.slice().sort((a, b) => totals[b.id].sum - totals[a.id].sum)[0] : null;
  let split = 0;
  picks.forEach((pk) => {
    const opts = SHOPS.map((s) => pk[s.id]).filter(Boolean).map((x) => x.p.price * x.packs);
    if (opts.length) split += Math.min(...opts);
  });
  return {
    totals, best: best.id, bestSum: totals[best.id].sum, split: Math.round(split),
    saving: worst ? totals[worst.id].sum - totals[best.id].sum : 0, worst: worst?.id || null,
  };
}

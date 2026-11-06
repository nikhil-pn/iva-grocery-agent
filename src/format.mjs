// Telegram (HTML) rendering for hunt results and Iva's brain status.
import { SHOPS } from './shops/index.mjs';
import { TIER_BADGE } from './brain.mjs';
import { cfg, txUrl, addrUrl } from './config.mjs';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const LABEL = Object.fromEntries(SHOPS.map((s) => [s.id, s.label]));
const og = (x, d = 4) => (x == null ? '—' : `${Number(x).toFixed(d)} 0G`);

export function huntMessage(r) {
  const lines = [];
  r.items.forEach((it, i) => {
    lines.push(`\n<b>${i + 1}. ${esc(it.want || it.query)}</b>`);
    const opts = SHOPS.map((s) => ({ s, x: r.picks[i]?.[s.id] })).filter((o) => o.x)
      .sort((a, b) => a.x.p.price * a.x.packs - b.x.p.price * b.x.packs);
    if (!opts.length) lines.push('   not found in any shop nearby');
    opts.forEach((o, k) => {
      const tot = Math.round(o.x.p.price * o.x.packs);
      const qty = o.x.packs > 1 ? ` ×${o.x.packs}` : '';
      lines.push(`${k === 0 ? '   ✅' : '   ▫️'} ${LABEL[o.s.id]} <b>₹${tot}</b> — <a href="${o.x.p.url}">${esc(o.x.p.name)}</a> (${esc(o.x.p.pack)}${qty})`);
    });
  });
  const b = r.basket;
  const t = SHOPS.map((s) => {
    const x = b.totals[s.id];
    if (x.missing >= r.items.length) return `${LABEL[s.id]} no results here`;
    return `${LABEL[s.id]} ₹${x.sum}${x.missing ? ` (${x.missing} missing)` : ''}`;
  }).join(' · ');
  lines.push(`\n🧺 <b>Whole basket:</b> ${t}`);
  lines.push(`🏆 <b>Cheapest single app: ${LABEL[b.best]} ₹${b.bestSum}</b>${b.saving > 0 ? ` — saves <b>₹${b.saving}</b> vs ${LABEL[b.worst]}` : ''}`);
  if (b.split < b.bestSum) lines.push(`✂️ Split across apps: ₹${b.split} (before delivery fees)`);
  if (r.tip) lines.push(`💡 ${esc(r.tip)}`);
  lines.push('\n' + receiptLine(r));
  return lines.join('\n');
}

export function receiptLine(r) {
  const cost = r.receipts.reduce((a, x) => a + x.cost0G, 0);
  const tee = r.receipts.some((x) => x.teeVerified || x.sealed) ? ' · 🔒 sealed TEE' : '';
  const head = `🧠 ${TIER_BADGE[r.brain.tier]} brain`;
  if (!r.receipts.length) return `${head} · no LLM used (${esc(r.brain.why)})${r.degraded ? ` · ${esc(r.degraded)}` : ''}`;
  const ids = r.receipts.map((x) => `<code>${esc(x.requestId)}</code> ${esc(x.model)}`).join('\n   ');
  return `${head} · ${r.receipts.length} call${r.receipts.length > 1 ? 's' : ''} · ${og(cost, 5)} paid from Iva's own 0G compute${tee}\n   ${ids}`;
}

export function brainMessage(s, t, evs, ivaAddress) {
  const L = [];
  L.push(`🧠 <b>Iva's brain</b> — ${TIER_BADGE[s.tier]} (${esc(s.why)})`);
  L.push(`\n💳 Wallet: <b>${og(s.wallet)}</b>  <a href="${addrUrl(ivaAddress)}">${ivaAddress.slice(0, 8)}…</a>`);
  L.push(`⚡ 0G compute: <b>${og(s.compute)}</b> spendable${s.vault != null ? ` (vault ${og(s.vault)})` : ''}`);
  L.push(`📉 Spent today: ${og(s.spentToday)} of ${s.cap} 0G cap`);
  L.push(`\n📒 Lifetime: earned ${og(t.earned, 3)}${t.refunded ? ` (refunded ${og(t.refunded, 2)})` : ''} · self-deposited ${og(t.deposited, 3)} · creator dividends ${og(t.dividends, 3)} · ${t.inferences} 0G calls (${og(t.spent, 4)}) · ${t.hunts} hunts`);
  const pay = evs.filter((e) => ['income', 'deposit', 'dividend'].includes(e.type)).slice(0, 4);
  if (pay.length) {
    L.push('\n🔗 <b>Recent money moves</b>');
    for (const e of pay) L.push(`   ${e.type === 'income' ? '💰 in' : e.type === 'deposit' ? '⚡ deposit' : '🎁 dividend'} ${og(e.amount0G, 3)} — <a href="${txUrl(e.tx)}">${e.tx.slice(0, 10)}…</a>`);
  }
  const inf = evs.filter((e) => e.type === 'inference').slice(0, 4);
  if (inf.length) {
    L.push('\n🧾 <b>Recent 0G requests</b>');
    for (const e of inf) L.push(`   <code>${esc(e.requestId)}</code> ${esc(e.model)} ${og(e.cost0G, 5)}${e.teeVerified || e.sealed ? ' 🔒' : ''}`);
  }
  L.push(`\nTiers: 🟢 ≥${cfg.richMin} 0G · 🟡 ≥${cfg.leanMin} 0G · 🔴 below (no LLM, paid hunts still work)`);
  return L.join('\n');
}

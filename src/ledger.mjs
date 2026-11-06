// Iva's memory of money and work. Two files under data/:
//  - state.json: users (credits, location), used payment txs, today's spend
//  - events.jsonl: append-only log of every payment, deposit, dividend and inference.
//    This is the public "receipt" trail shown by /brain and in the README.
import { readFileSync, writeFileSync, appendFileSync, existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { cfg } from './config.mjs';

const STATE = join(cfg.dataDir, 'state.json');
const EVENTS = join(cfg.dataDir, 'events.jsonl');

const fresh = () => ({ users: {}, usedTxs: {}, income: {}, spend: { day: '', neuron: '0' } });
let state = existsSync(STATE) ? { ...fresh(), ...JSON.parse(readFileSync(STATE, 'utf8')) } : fresh();

function save() {
  writeFileSync(STATE + '.tmp', JSON.stringify(state, null, 1));
  renameSync(STATE + '.tmp', STATE);
}

export function user(chatId) {
  const k = String(chatId);
  state.users[k] ||= { credits: 0, freeUsed: 0, lat: null, lng: null, hunts: 0, savedRs: 0, paid0G: 0 };
  return state.users[k];
}
export function updateUser(chatId, patch) { Object.assign(user(chatId), patch); save(); }

/** Record money in exactly once per tx, whether the payer claimed it in chat or not. */
export function recordIncome({ tx, from, amount0G, via }) {
  state.income ||= {};
  const k = tx.toLowerCase();
  if (state.income[k]) return null;
  state.income[k] = { from, amount0G };
  save();
  return logEvent('income', { tx, from, amount0G, via });
}

export function txUsed(hash) { return !!state.usedTxs[hash.toLowerCase()]; }
export function markTx(hash, chatId) { state.usedTxs[hash.toLowerCase()] = String(chatId); save(); }

const today = () => new Date().toISOString().slice(0, 10);
export function addSpend(neuron) {
  if (state.spend.day !== today()) state.spend = { day: today(), neuron: '0' };
  state.spend.neuron = (BigInt(state.spend.neuron) + BigInt(neuron || 0)).toString();
  save();
}
export function spentToday() {
  return state.spend.day === today() ? BigInt(state.spend.neuron) : 0n;
}

export function logEvent(type, data) {
  const ev = { at: new Date().toISOString(), type, ...data };
  appendFileSync(EVENTS, JSON.stringify(ev) + '\n');
  return ev;
}
export function recentEvents(type, n = 5) {
  if (!existsSync(EVENTS)) return [];
  const lines = readFileSync(EVENTS, 'utf8').trim().split('\n').filter(Boolean);
  const out = [];
  for (let i = lines.length - 1; i >= 0 && out.length < n; i--) {
    const e = JSON.parse(lines[i]);
    if (!type || e.type === type) out.push(e);
  }
  return out;
}
export function totals() {
  const t = { earned: 0, refunded: 0, deposited: 0, dividends: 0, inferences: 0, spent: 0, hunts: 0 };
  if (!existsSync(EVENTS)) return t;
  for (const l of readFileSync(EVENTS, 'utf8').split('\n')) {
    if (!l) continue;
    const e = JSON.parse(l);
    if (e.type === 'income') t.earned += e.amount0G;
    if (e.type === 'refund') t.refunded += e.amount0G;
    if (e.type === 'deposit') t.deposited += e.amount0G;
    if (e.type === 'dividend') t.dividends += e.amount0G;
    if (e.type === 'inference') { t.inferences++; t.spent += e.cost0G || 0; }
    if (e.type === 'hunt') t.hunts++;
  }
  return t;
}

// Credit a verified payment to a Telegram chat by hand (run while the bot is stopped).
// node scripts/credit-claim.mjs <chatId> <txhash>
import { verifyPayment } from '../src/chain.mjs';
import { user, updateUser, txUsed, markTx, logEvent, recordIncome } from '../src/ledger.mjs';
import { cfg } from '../src/config.mjs';
const [chatId, hash] = process.argv.slice(2);
if (txUsed(hash)) { console.log('already claimed'); process.exit(0); }
const v = await verifyPayment(hash);
if (!v.ok) { console.log('not valid:', v.reason); process.exit(1); }
const hunts = Math.floor(v.amount0G / cfg.huntFee + 1e-9);
markTx(hash, chatId);
const u = user(chatId);
updateUser(chatId, { credits: u.credits + hunts, paid0G: (u.paid0G || 0) + v.amount0G });
recordIncome({ tx: hash, from: v.from, amount0G: v.amount0G, via: 'claimed in chat' });
logEvent('payment', { tx: hash, amount0G: v.amount0G, from: v.from, chat: String(chatId), kind: v.kind, hunts });
console.log(`credited ${hunts} hunts to ${chatId} for ${v.amount0G} 0G`);

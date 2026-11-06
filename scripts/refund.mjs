// Refund a payer from Iva's wallet (run while the bot is stopped).
// node scripts/refund.mjs <toAddress> <amount0G> [chatId]
import { sendNative } from '../src/chain.mjs';
import { user, updateUser, logEvent } from '../src/ledger.mjs';
import { cfg, txUrl } from '../src/config.mjs';
const [to, amountStr, chatId] = process.argv.slice(2);
const amount = Number(amountStr);
const tx = await sendNative(to, amount);
logEvent('refund', { tx, amount0G: amount, to, chat: chatId || null });
if (chatId) {
  const u = user(chatId);
  const minus = Math.floor(amount / cfg.huntFee + 1e-9);
  updateUser(chatId, { credits: Math.max(0, u.credits - minus), paid0G: Math.max(0, (u.paid0G || 0) - amount) });
  console.log(`credits ${u.credits + minus} -> ${user(chatId).credits}`);
}
console.log('refunded', amount, '0G', txUrl(tx));

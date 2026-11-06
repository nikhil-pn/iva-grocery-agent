// Play a scripted conversation through the bot without Telegram, as a brand-new user.
//   node scripts/simulate.mjs            → cheap run (no hunts)
//   node scripts/simulate.mjs --hunt     → also runs one real hunt (costs Iva ~0.03 0G)
// Uses a throwaway data dir, so the live bot's users and books are untouched.
process.env.IVA_DRY_TELEGRAM = '1';
process.env.IVA_DATA_DIR ||= '/tmp/iva-sim';
const { rmSync } = await import('node:fs');
rmSync(process.env.IVA_DATA_DIR, { recursive: true, force: true });
const { onUpdate } = await import('../src/bot.mjs');
const { closeAll } = await import('../src/shops/browser.mjs');

const chat = { id: 4242, type: 'private' };
const say = async (text) => { console.log(`\n\n▶ user: ${text}`); await onUpdate({ message: { chat, text } }); };
const steps = ['/start', 'hi', '🙋 Me', '/city pune', '/me', '/city atlantis', '💳 Pay', '/foo', '/paid 0x1234'];
if (process.argv.includes('--hunt')) steps.push('qwertyuiop zzz', '🙋 Me', '🧺 Try: 12 eggs, 1 kg onion, 1 litre milk', '/watch', '/watches', '🙋 Me');
for (const s of steps) await say(s);
await closeAll();
process.exit(0);

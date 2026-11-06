// Dry-run the Zepto order flow as the owner WITHOUT placing an order: hunt -> "order" (preview) -> "no".
process.env.IVA_DRY_TELEGRAM = '1';
process.env.IVA_DATA_DIR ||= '/tmp/iva-zepto-sim';
const { rmSync } = await import('node:fs');
rmSync(process.env.IVA_DATA_DIR, { recursive: true, force: true });
const { onUpdate } = await import('../src/bot.mjs');
const { closeAll } = await import('../src/shops/browser.mjs');
const chat = { id: Number(process.env.IVA_ZEPTO_OWNER_CHAT || 6608476525), type: 'private' };
const say = async (text) => { console.log(`\n\n▶ user: ${text}`); await onUpdate({ message: { chat, text } }); };
for (const s of (process.argv[2] || '12 eggs|order|no|/track').split('|')) await say(s);
await closeAll();
process.exit(0);

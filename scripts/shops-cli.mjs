// Quick check: node scripts/shops-cli.mjs "eggs" [lat] [lng]
import { searchAll } from '../src/shops/index.mjs';
import { closeAll } from '../src/shops/browser.mjs';
import { cfg } from '../src/config.mjs';
const [q = 'eggs', lat = cfg.defaultLat, lng = cfg.defaultLng] = process.argv.slice(2);
const t = Date.now();
const res = await searchAll(q, { lat: Number(lat), lng: Number(lng) });
for (const [shop, items] of Object.entries(res)) {
  console.log(`\n${shop}: ${items.length} items`);
  for (const i of items.slice(0, 4)) console.log(`  ₹${i.price} ${i.name} [${i.pack}] g=${i.grams} pcs=${i.pieces} ${i.inStock ? '' : '(OOS)'}`);
}
console.log(`\n${Date.now() - t} ms`);
await closeAll();

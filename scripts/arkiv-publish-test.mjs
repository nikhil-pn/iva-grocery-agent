// One real hunt → publish its deals to Arkiv → read them back (end-to-end check).
// node scripts/arkiv-publish-test.mjs "12 eggs, 1 kg onion, 1 litre milk"
import { hunt } from '../src/hunt.mjs';
import { publishDeals, liveDeals, dealsMessage, entityUrl, arkivTxUrl } from '../src/arkiv.mjs';
import { closeAll } from '../src/shops/browser.mjs';
import { cfg } from '../src/config.mjs';
const loc = { lat: cfg.defaultLat, lng: cfg.defaultLng };
const r = await hunt({ kind: 'text', text: process.argv[2] || '12 eggs, 1 kg onion, 1 litre milk' }, loc, (m) => console.log(m));
await closeAll();
console.log('hunt done:', r.items.length, 'items,', r.receipts.map((x) => x.requestId).join(', '));
const pub = await publishDeals(r, loc);
console.log('publish:', pub.ok, pub.error || '', pub.keys.length, 'entities');
for (const t of pub.txs) console.log('  tx', arkivTxUrl(t));
if (pub.keys[0]) console.log('  entity', entityUrl(pub.keys[0]));
await new Promise((res) => setTimeout(res, 4000));
const feed = await liveDeals(loc);
console.log('read back:', feed.deals.length, 'live deals in', feed.city);
console.log(dealsMessage(feed).replace(/<[^>]+>/g, ''));

// Read Iva's live grocery deal feed from Arkiv. No keys and no wallet needed: it's a public read.
//
//   node scripts/arkiv-query.mjs                 live deals in Mumbai
//   node scripts/arkiv-query.mjs eggs            live egg deals in Mumbai
//   node scripts/arkiv-query.mjs onion --city pune
//   node scripts/arkiv-query.mjs --at 19.07,72.87 --json
import { liveDeals, dealsMessage, entityUrl, ago, bucket } from '../src/arkiv.mjs';
import { cfg } from '../src/config.mjs';

const CITY = {
  mumbai: [19.0662, 72.8697], pune: [18.5204, 73.8567], bengaluru: [12.9716, 77.5946],
  delhi: [28.6139, 77.209], hyderabad: [17.385, 78.4867], chennai: [13.0827, 80.2707],
  kochi: [10.0261, 76.3125], kolkata: [22.5726, 88.3639],
};

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : null; };
const json = args.includes('--json') && args.splice(args.indexOf('--json'), 1);
const city = flag('--city');
const at = flag('--at');
let [lat, lng] = CITY.mumbai;
if (city) [lat, lng] = CITY[city.toLowerCase()] || (() => { throw new Error(`cities: ${Object.keys(CITY).join(', ')}`); })();
if (at) [lat, lng] = at.split(',').map(Number);
const item = args.join(' ');

const feed = await liveDeals({ lat, lng, item });
if (json) {
  console.log(JSON.stringify(feed, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2));
  process.exit(0);
}

const b = bucket({ lat, lng });
console.log(`Arkiv Rabdi testnet · writer ${cfg.arkiv.address} · ${b.city} (${b.cell}) · block ${feed.blockNumber}`);
for (const q of feed.queries) console.log(`query: ${q}`);
console.log(`${feed.deals.length} live deal${feed.deals.length === 1 ? '' : 's'}\n`);
for (const d of feed.deals) {
  const unit = d.unit === 'pack' ? '' : ` (₹${d.unitPriceRs}/${d.unit === 'kg' ? 'kg' : 'pc'})`;
  console.log(`${d.best ? '✅' : '  '} ${d.item.padEnd(14)} ${d.shop.padEnd(9)} ₹${String(d.priceRs).padEnd(7)} ${d.product} · ${d.pack}${unit}`);
  console.log(`   expires in ${ago(d.expiresInS * 1000)} · seen ${ago(Date.now() - d.huntAt)} ago · ${entityUrl(d.key)}`);
}
console.log('\n--- as /deals shows it in Telegram ---');
console.log(dealsMessage(feed).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));

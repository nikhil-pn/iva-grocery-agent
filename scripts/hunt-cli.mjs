// node scripts/hunt-cli.mjs "12 eggs, 1 kg onion, amul butter 500g"
import { hunt } from '../src/hunt.mjs';
import { huntMessage } from '../src/format.mjs';
import { closeAll } from '../src/shops/browser.mjs';
import { cfg } from '../src/config.mjs';
const text = process.argv[2] || '12 eggs, 1 kg onion, amul butter 500g';
const t = Date.now();
const r = await hunt({ kind: 'text', text }, { lat: cfg.defaultLat, lng: cfg.defaultLng }, (m) => console.log(m));
console.log(huntMessage(r).replace(/<[^>]+>/g, ''));
console.log(`\n${Date.now() - t} ms`);
await closeAll();

// All shops behind one call, with a short cache so repeated hunts are cheap.
import * as blinkit from './blinkit.mjs';
import * as instamart from './instamart.mjs';
import * as zepto from './zepto.mjs';

export const SHOPS = [blinkit, instamart, zepto];
const cache = new Map();
const TTL = 20 * 60 * 1000;

export async function searchShop(shop, query, loc) {
  const key = `${shop.id}|${query.toLowerCase()}|${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.items;
  let items = [];
  for (let attempt = 0; attempt < 2 && !items.length; attempt++) {
    try { items = await shop.search(query, loc); } catch (e) { console.error(`[${shop.id}] ${e.message}`); }
  }
  if (items.length) cache.set(key, { at: Date.now(), items });
  return items;
}

/** Search every shop for one query, in parallel. */
export async function searchAll(query, loc) {
  const res = await Promise.all(SHOPS.map((s) => searchShop(s, query, loc)));
  return Object.fromEntries(SHOPS.map((s, i) => [s.id, res[i]]));
}

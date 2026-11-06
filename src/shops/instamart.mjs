// Swiggy Instamart: the store is picked from the browser's geolocation, so the
// context sets geolocation (see browser.mjs) and we read the search JSON.
import { contextFor, captureJson, walk, resetContext } from './browser.mjs';
import { item } from './pack.mjs';

export const id = 'instamart';
export const label = 'Instamart';

const rupees = (p) => (p ? Number(p.units || 0) + Number(p.nanos || 0) / 1e9 : null);

let lastAt = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const throttled = (bodies) => bodies.some((b) => b?.statusCode === 429);

async function fetchBodies(query, lat, lng) {
  // keep a polite gap between Instamart searches; they rate-limit bursts (429)
  const wait = lastAt + 2500 - Date.now();
  if (wait > 0) await sleep(wait);
  lastAt = Date.now();
  const ctx = await contextFor(id, lat, lng);
  return captureJson(ctx,
    `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`,
    (u) => u.includes('/api/instamart/search'), { timeoutMs: 18000 });
}

export async function search(query, { lat, lng }) {
  let bodies = await fetchBodies(query, lat, lng);
  // Instamart sometimes lands on a login / "no store" page and never searches.
  // A brand-new session usually gets a store; try that once or twice.
  for (let i = 0; i < 2 && (!bodies.length || throttled(bodies)); i++) {
    if (throttled(bodies)) await sleep(4000 * (i + 1));
    else await resetContext(id, lat, lng);
    bodies = await fetchBodies(query, lat, lng);
  }
  const out = new Map();
  walk(bodies, (n) => {
    if (!Array.isArray(n.variations) || !n.displayName) return;
    for (const v of n.variations) {
      const price = rupees(v.price?.offerPrice) ?? rupees(v.price?.mrp);
      if (!v.spinId || !price || out.has(v.spinId)) continue;
      out.set(v.spinId, item({
        shop: id, id: v.spinId, name: v.displayName || n.displayName, brand: v.brandName || n.brand,
        price, mrp: rupees(v.price?.mrp), packText: v.quantityDescription,
        grams: v.weightInGrams && !/piece|pcs/i.test(v.quantityDescription || '') ? v.weightInGrams : null,
        inStock: v.inventory?.inStock ?? n.inStock,
        url: `https://www.swiggy.com/instamart/item/${v.spinId}`,
      }));
    }
  });
  return [...out.values()];
}

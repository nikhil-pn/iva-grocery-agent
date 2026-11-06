// Swiggy Instamart: the store is picked from the browser's geolocation, so the
// context sets geolocation (see browser.mjs) and we read the search JSON.
import { contextFor, captureJson, walk } from './browser.mjs';
import { item } from './pack.mjs';

export const id = 'instamart';
export const label = 'Instamart';

const rupees = (p) => (p ? Number(p.units || 0) + Number(p.nanos || 0) / 1e9 : null);

export async function search(query, { lat, lng }) {
  const ctx = await contextFor(id, lat, lng);
  const bodies = await captureJson(ctx,
    `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`,
    (u) => u.includes('/api/instamart/search'));
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

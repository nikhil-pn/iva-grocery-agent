// Blinkit: read the layout-search JSON its own search page fetches.
// Each product card carries an add-to-cart payload with clean fields.
import { contextFor, captureJson, walk } from './browser.mjs';
import { item, slug } from './pack.mjs';

export const id = 'blinkit';
export const label = 'Blinkit';

export async function search(query, { lat, lng }) {
  const ctx = await contextFor(id, lat, lng, (c) => c.addCookies([
    { name: 'gr_1_lat', value: String(lat), domain: 'blinkit.com', path: '/' },
    { name: 'gr_1_lon', value: String(lng), domain: 'blinkit.com', path: '/' },
  ]));
  const bodies = await captureJson(ctx, `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
    (u) => u.includes('/v1/layout/search'));
  const out = new Map();
  walk(bodies, (n) => {
    const c = n.cart_item;
    if (!c || typeof c.price !== 'number' || !c.product_id || out.has(c.product_id)) return;
    const name = c.display_name || c.product_name;
    out.set(c.product_id, item({
      shop: id, id: c.product_id, name, brand: c.brand,
      price: c.price, mrp: c.mrp, packText: c.unit,
      inStock: (c.inventory ?? 1) > 0,
      url: `https://blinkit.com/prn/${slug(name)}/prid/${c.product_id}`,
    }));
  });
  return [...out.values()];
}

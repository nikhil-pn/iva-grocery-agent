// Zepto: location comes from cookies; products come from the search-federator
// JSON (Zepto moved search there in Nov 2026). Prices are in paise.
import { contextFor, captureJson, walk } from './browser.mjs';
import { item, slug } from './pack.mjs';

export const id = 'zepto';
export const label = 'Zepto';

export async function search(query, { lat, lng }) {
  const ctx = await contextFor(id, lat, lng, (c) => c.addCookies(
    [['latitude', String(lat)], ['longitude', String(lng)],
     ['user_position', JSON.stringify({ latitude: lat, longitude: lng })]]
      .map(([name, value]) => ({ name, value, domain: '.zepto.com', path: '/' }))));
  const bodies = await captureJson(ctx, `https://www.zepto.com/search?query=${encodeURIComponent(query)}`,
    (u) => u.includes('search-federator-service') || /user-search-service\/api\/v\d+\/search(\?|$)/.test(u));
  const out = new Map();
  walk(bodies, (n) => {
    if (typeof n.sellingPrice !== 'number' || !('outOfStock' in n)) return;
    const p = n.product || {}, v = n.productVariant || {};
    const vid = v.id || n.id;
    if (!p.name || !vid || out.has(vid)) return;
    out.set(vid, item({
      shop: id, id: vid, name: p.name, brand: p.brand,
      price: n.sellingPrice / 100, mrp: (n.mrp ?? n.sellingPrice) / 100,
      packText: v.formattedPacksize, grams: v.unitOfMeasure === 'PIECE' ? null : v.weightInGms,
      inStock: !n.outOfStock,
      url: `https://www.zepto.com/pn/${slug(p.name)}/pvid/${vid}`,
    }));
  });
  return [...out.values()];
}

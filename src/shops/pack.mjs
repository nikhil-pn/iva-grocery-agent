// Turn pack text ("2 x 450 g", "12 Pieces x 2", "1 L", "30 pcs") into a comparable
// size: { grams, pieces }. Liquids count 1 ml as 1 g, which is close enough to rank.
export function parsePack(text) {
  if (!text) return { grams: null, pieces: null };
  const t = String(text).toLowerCase().replace(/,/g, '');
  let mult = 1;
  const xBefore = t.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|grams?|l|ltr|litres?|liters?|ml|pcs?|pieces?|pc)\b/);
  const xAfter = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|grams?|l|ltr|litres?|liters?|ml|pcs?|pieces?|pc)\s*[x×]\s*(\d+)/);
  let qty, unit;
  if (xBefore) { mult = Number(xBefore[1]); qty = Number(xBefore[2]); unit = xBefore[3]; }
  else if (xAfter) { qty = Number(xAfter[1]); unit = xAfter[2]; mult = Number(xAfter[3]); }
  else {
    const m = t.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|grams?|l|ltr|litres?|liters?|ml|pcs?|pieces?|pc)\b/);
    if (!m) return { grams: null, pieces: null };
    qty = Number(m[1]); unit = m[2];
  }
  const total = qty * mult;
  if (/^(kg)$/.test(unit)) return { grams: total * 1000, pieces: null };
  if (/^(g|gm|gms|grams?)$/.test(unit)) return { grams: total, pieces: null };
  if (/^(l|ltr|litres?|liters?)$/.test(unit)) return { grams: total * 1000, pieces: null };
  if (unit === 'ml') return { grams: total, pieces: null };
  return { grams: null, pieces: total };
}

/** Build the common item shape every shop returns. */
export function item({ shop, id, name, brand, price, mrp, packText, grams, inStock, url }) {
  const p = parsePack(packText);
  const g = grams || p.grams;
  return {
    shop, id: String(id), name, brand: brand || null,
    price: Math.round(price * 100) / 100,
    mrp: mrp ? Math.round(mrp * 100) / 100 : null,
    pack: packText || (g ? `${g} g` : ''),
    grams: g || null,
    pieces: p.pieces,
    perKg: g ? Math.round((price / g) * 1000) : null,
    perPiece: p.pieces ? Math.round((price / p.pieces) * 100) / 100 : null,
    inStock: inStock !== false,
    url,
  };
}

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);

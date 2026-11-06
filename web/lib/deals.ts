// Live Iva deals read straight from Arkiv (Rabdi testnet). Same query as liveDeals() in
// src/arkiv.mjs: schema iva.deal.v1, city = mumbai, owner = Iva's wallet, newest first.
// Runs on the server through Arkiv's public endpoint (rate limited, no key), cached ~60 s
// and shared by every visitor. Never throws: a failed read comes back as deals: null.
import { cacheLife } from "next/cache";
import { createPublicClient } from "@arkiv-network/sdk";
import { rabdi } from "@arkiv-network/sdk/chains";
import { desc, eq } from "@arkiv-network/sdk/query";
import { bool, bytes, dec, defineSchema, str, u64 } from "@arkiv-network/sdk/schema";
import { hexToString, http } from "viem";
import { ARKIV, IVA_WALLET } from "./iva";

/** Must match Deals in src/arkiv.mjs (the read checks rows against it). */
const Deals = defineSchema("iva.deal.v1", {
  item: str().indexed(),
  query: str(),
  want: str(),
  shop: str().indexed(),
  product: str(),
  priceRs: dec().indexed(),
  mrpRs: dec().optional(),
  pack: str(),
  unit: str().indexed(),
  unitPriceRs: dec().indexed(),
  best: bool().indexed(),
  city: str().indexed(),
  cell: str().indexed(),
  huntAt: u64().indexed(),
  url: bytes(),
  matchedBy: str(),
});

const PICK = {
  $key: true, $expiresAt: true, item: true, want: true, shop: true, product: true, priceRs: true,
  pack: true, unit: true, unitPriceRs: true, best: true, city: true, cell: true, huntAt: true, url: true,
} as const;

const BLOCK_SECONDS = 2; // Rabdi's block time

export type Deal = {
  key: string;
  item: string;
  want: string;
  shop: string;
  product: string;
  priceRs: number;
  pack: string;
  unitPriceRs: number;
  url: string;
  huntAt: number; // unix ms
  expiresInS: number; // as of fetchedAt
};

export type ItemDeals = { item: string; cheapest: Deal; others: Deal[] };

export type LiveDeals = {
  fetchedAt: number; // unix ms
  city: string;
  items: ItemDeals[] | null; // null = Arkiv didn't answer
  query: string;
};

export async function getLiveDeals(city = "mumbai"): Promise<LiveDeals> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  const fetchedAt = Date.now();
  let query = "";
  try {
    const client = createPublicClient({ chain: rabdi({ accessKey: "" }), transport: http() });
    const q = client
      .select(PICK)
      .from(Deals)
      .where(eq("city", city))
      .ownedBy(IVA_WALLET)
      .orderBy(desc("huntAt"))
      .limit(100);
    query = q.toString();
    const res = await q.fetch();
    const now = res.blockNumber;
    const rows: Deal[] = res.entities
      .map((e) => ({
        key: e.$key,
        item: e.item.value,
        want: e.want.value,
        shop: e.shop.value,
        product: e.product.value,
        priceRs: Number(e.priceRs.value),
        pack: e.pack.value,
        unitPriceRs: Number(e.unitPriceRs.value),
        url: hexToString(e.url.value),
        huntAt: Number(e.huntAt.value) * 1000,
        expiresInS: Number(BigInt(e.$expiresAt) - BigInt(now)) * BLOCK_SECONDS,
      }))
      .filter((d) => d.expiresInS > 0);

    // newest sighting per item+shop, then the cheapest shop per item
    const perShop = new Map<string, Deal>();
    for (const d of rows.sort((a, b) => b.huntAt - a.huntAt)) {
      const k = `${d.item}|${d.shop}`;
      if (!perShop.has(k)) perShop.set(k, d);
    }
    const byItem = new Map<string, Deal[]>();
    for (const d of perShop.values()) byItem.set(d.item, [...(byItem.get(d.item) ?? []), d]);
    const items = [...byItem.entries()]
      .map(([item, ds]) => {
        const sorted = ds.sort((a, b) => a.unitPriceRs - b.unitPriceRs || a.priceRs - b.priceRs);
        return { item, cheapest: sorted[0], others: sorted.slice(1) };
      })
      .sort((a, b) => b.cheapest.huntAt - a.cheapest.huntAt || a.item.localeCompare(b.item))
      .slice(0, 12);
    return { fetchedAt, city, items, query };
  } catch (e) {
    console.error("[arkiv] live deals read failed:", (e as Error)?.message ?? e);
    return { fetchedAt, city, items: null, query };
  }
}

export const arkivEntityUrl = (key: string) => `${ARKIV.explorer}/entity/${key}`;
export const arkivTxUrl = (hash: string) => `${ARKIV.explorer}/tx/${hash}`;
export const arkivAddrUrl = (addr: string) => `${ARKIV.explorer}/address/${addr}`;

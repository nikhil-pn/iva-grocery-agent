# Arkiv schema: `iva.deal.v1`

One entity is **one deal**: the product Iva matched for one item on a shopping list, in one shop
(Blinkit, Instamart or Zepto), at one place and time. A hunt over 3 items publishes up to 9 deals.

| | |
|---|---|
| Network | Arkiv **Rabdi testnet**, chain id `7794095`, RPC `https://rpc.rabdi.db-chain.testnet.arkiv.network`, gas token tGLM |
| Explorer | <https://rabdi.explorer.arkiv.network> (`/entity/<key>`, `/tx/<hash>`, `/address/<addr>`) |
| Schema name | `iva.deal.v1`. A named SDK schema, so every entity carries the indexed tag `arkiv.schema = "iva.deal.v1"` |
| Owner | Iva's Arkiv writer wallet [`0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d`](https://rabdi.explorer.arkiv.network/address/0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d). It is the same wallet Iva uses on 0G (her payments and self-deposits), so one identity owns her money, her brain account and her deal feed. |
| Expiry | **6 hours** after the hunt (`ExpirationTime.fromHours(6)` = 10,800 blocks at 2 s). Arkiv deletes the entity then. Override with `IVA_DEAL_HOURS`. |
| Written by | `publishDeals()` in [`src/arkiv.mjs`](../src/arkiv.mjs), up to 12 creates per `executeBatch` transaction |
| Defined in | `Deals = defineSchema('iva.deal.v1', {...})` in [`src/arkiv.mjs`](../src/arkiv.mjs) |

## Attributes

| Attribute | Type | Indexed | Example | Notes |
|---|---|---|---|---|
| `item` | `str` | ✅ | `egg`, `onion`, `amul butter` | Normalised item key: lower case, no numbers or units, singular words (`itemKey()`). `/deals eggs` and `/deals Egg` both become `egg`. |
| `query` | `str` | | `eggs` | The search text Iva sent the shops |
| `want` | `str` | | `12 eggs` | What the user asked for |
| `shop` | `str` | ✅ | `zepto` | `blinkit` \| `instamart` \| `zepto` |
| `product` | `str` | | `Fresh White Eggs` | As the shop lists it, cut to 120 bytes (Arkiv's `str` limit is 128) |
| `priceRs` | `dec` | ✅ | `106` | Price of one pack, ₹ |
| `mrpRs` | `dec` | optional | `120` | Printed MRP when the shop gives it |
| `pack` | `str` | | `1 pack (12 pcs)` | Pack text |
| `unit` | `str` | ✅ | `piece` | `kg` \| `piece` \| `pack`: the unit of `unitPriceRs` |
| `unitPriceRs` | `dec` | ✅ | `8.83` | ₹ per kg, per piece, or per pack, so packs of different sizes compare. `/deals <item>` sorts on it. |
| `best` | `bool` | ✅ | `true` | This shop was the cheapest for this item in this hunt (ties are all `true`) |
| `city` | `str` | ✅ | `mumbai` | Nearest metro within 40 km of the hunt location, else `other` |
| `cell` | `str` | ✅ | `19.05,72.85` | Lat/lng rounded to 0.05° (~5 km). Used when `city` is `other`, and as the key for a map. |
| `huntAt` | `u64` | ✅ | `1794000000` | Unix seconds when Iva saw the price |
| `url` | `bytes` | | UTF-8 of `https://www.zepto.com/pn/...` | Product link. Stored as bytes because shop URLs often go past the 128-byte `str` limit. |
| `matchedBy` | `str` | | `glm-5.3` | The 0G model that matched the product across shops, or `plain` in survival mode |

The schema tag makes 17 attributes, under the 32-attribute cap.

## Queries Iva runs

These are the query strings the SDK sends (`liveDeals()` returns them as `queries`):

```
# /deals: newest deals in the user's metro
arkiv.schema = str('iva.deal.v1') AND city = str('mumbai') AND $owner = addr(0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d) ORDER BY huntAt:u64 DESC

# /deals eggs: that item, cheapest per unit first
arkiv.schema = str('iva.deal.v1') AND city = str('mumbai') AND item = str('egg') AND $owner = addr(0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d) ORDER BY unitPriceRs:dec ASC
```

Expired entities are gone from Arkiv, so every row returned is live. "Expires in" is
`($expiresAt − page.blockNumber) × 2 s`.

## Why `$owner` is in every query

Anyone can write an entity with the `iva.deal.v1` tag. Filtering on Iva's writer address means
only deals Iva actually saw are shown. Another agent that wants its own feed can reuse the schema
under its own wallet, and readers choose whose deals to trust.

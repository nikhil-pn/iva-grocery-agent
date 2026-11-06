# How Iva uses Arkiv

> **In plain words:** Arkiv is a public notice board where every note deletes itself on a timer.
> 1. Iva hunts a grocery list and finds, say, Zepto's 12 eggs at ₹106 in Mumbai.
> 2. She pins that price on Arkiv, signed by her own wallet, set to delete itself in 6 hours.
> 3. Anyone reads it (`/deals eggs` in the bot, the website, or any script) until it disappears by itself.
>
> Users get free, never-stale deals near them. We run no database, server or cleanup job.
> Proof: [every deal Iva has posted](https://rabdi.explorer.arkiv.network/address/0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d) ·
> [first publish, 7 deals in 1 tx](https://rabdi.explorer.arkiv.network/tx/0x89f91c6c19c3b055bf37c3f215c57a5492aa28a4d544b00e5bcc551737bd7c56) ·
> [live on the website](https://iva-grocery-agent.vercel.app/#deals).

All Arkiv code is in [`src/arkiv.mjs`](../src/arkiv.mjs) and uses `@arkiv-network/sdk` 1.0.1
with `viem` on the **Rabdi testnet**. The bot has three small hooks into it, all in
[`src/bot.mjs`](../src/bot.mjs).

```
 user list ─▶ hunt() ─▶ reply in Telegram ─▶ publishDeals() ─▶ Arkiv: one entity per item × shop
                                                (background)      owner = Iva's writer, expires in 6 h
                                                                          │
 /deals eggs ─▶ liveDeals() ─▶ attribute query (city, item, $owner) ◀─────┘
                    │
                    └─▶ dealsMessage() ─▶ "✅ Zepto ₹106 … ⏳ expires in 5h 12m"
 scripts/arkiv-query.mjs ─▶ the same liveDeals(), for anyone
```

## Write: publish after every hunt

1. `doHunt()` in `src/bot.mjs` sends the hunt result to the user first. Then it calls
   `publishDeals(r, loc)` without awaiting it. The user never waits on Arkiv.
2. `dealsFromHunt()` turns the result into entity values. For each list item and each shop
   with a match, it builds:
   - `item` with `itemKey(query)`;
   - `unitPriceRs` from ₹/kg, ₹/piece or ₹/pack;
   - `best` for the cheapest shop;
   - `city` and `cell` from the user's location with `bucket()`;
   - `huntAt`;
   - the product URL as `bytes`.
3. `publishNow()` sends them with **`walletClient.executeBatch({ creates })`**: up to 12
   entities per transaction, each with `expiration: ExpirationTime.fromHours(6)`. It signs with the
   writer key `ARKIV_PRIVATE_KEY`, which lives in the env file outside the repo.
4. Writes go through a promise queue, so two hunts at once never race on the writer's nonce.
5. It **never throws**. On failure it logs one line and returns `{ ok: false, error }`. If the
   writer has no tGLM, it says so (see [friction.md](friction.md)). On success it logs an `arkiv`
   event with the entity keys and tx hashes to `data/events.jsonl`, Iva's receipt trail.

## Read: `/deals` (user-visible)

`/deals` or `/deals eggs` in Telegram calls `dealsReply()`, which calls `liveDeals()`:

```js
publicClient().select({ $key: true, $expiresAt: true, item: true, shop: true, priceRs: true, ... })
  .from(Deals)                                           // arkiv.schema = 'iva.deal.v1'
  .where(and(eq('city', 'mumbai'), eq('item', 'egg')))   // indexed attribute filters
  .ownedBy(cfg.arkiv.address)                            // only deals Iva wrote
  .orderBy(asc('unitPriceRs'))                           // cheapest per kg / per piece first
  .limit(100)
  .fetch()
```

- Without an item, it filters on `city` alone and sorts on `desc('huntAt')`.
- The user's metro comes from their shared location or `/city`. Outside the known metros, the
  filter uses the ~5 km `cell` instead.
- If the exact `item` key has no rows, it falls back to the newest deals in the area and matches
  the words on the client side, so `/deals butter` finds `amul butter`.
- Expired deals no longer exist, so there's no "is it still valid" filter. "Expires in Xh Ym" is
  `($expiresAt − page.blockNumber) × 2 s`.
- Sightings of the same product from several hunts are collapsed to the newest one.
- `dealsMessage()` renders the reply: the cheapest few per item, with shop, ₹, ₹/unit, a link to
  the product, time to expiry and time since Iva saw the price.

The read needs no key and no wallet, so a fresh clone can run it:

```bash
node scripts/arkiv-query.mjs eggs            # Mumbai by default; --city pune, --at lat,lng, --json
```

## Code pointers

| What | Where |
|---|---|
| Schema | `Deals` in `src/arkiv.mjs` |
| Location → `city` / `cell` | `bucket()` |
| Item normalisation | `itemKey()` |
| Hunt → entity values | `dealsFromHunt()` |
| Batched, queued, non-throwing write | `publishDeals()` / `publishNow()` |
| Attribute query | `liveDeals()` |
| Telegram rendering | `dealsMessage()`, `dealsReply()` |
| Bot hooks | `src/bot.mjs`: the import, `publishDeals(r, loc)` after the hunt reply, `case '/deals'`, and the `setMyCommands` entry |
| Config | `cfg.arkiv` in `src/config.mjs` (`ARKIV_PRIVATE_KEY`, `ARKIV_ADDRESS`, optional `ARKIV_ACCESS_KEY`, `IVA_DEAL_HOURS`, `IVA_ARKIV=0` to switch it off) |
| Public query script | `scripts/arkiv-query.mjs` |

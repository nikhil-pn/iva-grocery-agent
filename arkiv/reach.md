# Reach: who else can read Iva's deal feed

The feed is public. Reading it needs:
- the schema name `iva.deal.v1`;
- the writer address `0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d`;
- an Arkiv RPC.

There is no API key from us, no account and no Iva server in between. Every hunt any user runs
adds live prices to it.

## Who it's for, and can they try it today?

Yes, today, with no sign-up:
- **Shoppers in Indian metros** who buy on Blinkit, Instamart and Zepto: message [@IvaGroceryAgentbot](https://t.me/IvaGroceryAgentbot) and send `/deals`.
- **Anyone on the web:** the live board at [iva-grocery-agent.vercel.app/#deals](https://iva-grocery-agent.vercel.app/#deals).
- **Developers and agents:** `node scripts/arkiv-query.mjs eggs --json`.

## Today

- **Iva's own users:** `/deals` and `/deals <item>` in Telegram show what Iva found nearby in the
  last 6 hours. A deal one person paid a hunt for helps everyone in the same city for free.
- **Anyone with a terminal:** `node scripts/arkiv-query.mjs eggs --city pune --json` gives
  machine-readable live deals. The SDK prints the query string, so it can be ported to any client.

## Who it is built for next

- **Other agents.** A meal-planning agent can price tonight's recipe from the feed. A
  household-budget agent can do the same for a weekly shop. Neither needs to scrape three shops
  or pay for its own matching. Both can filter on `city`, `item`, `unit` and `unitPriceRs`.
  This is the "agents sharing ephemeral state" pattern: Iva does the expensive work (headless
  browsing plus 0G inference to match products across shops), and other agents read the result
  while it is still true.
- **A "deals near you" map.** Every deal carries a `cell` (lat/lng at 0.05°, about 5 km), a
  `shop` and `huntAt`. A static web page can query by `cell` and draw a live heat map of
  cheap eggs or onions across Mumbai. When deals expire the map empties on its own.
- **Price trackers and researchers.** Anyone who wants history can subscribe with
  `watchEntityEvents` and archive what they see. Iva's feed stays "now only" by design, and
  history becomes a reader's choice, not our storage bill. For example, a researcher could study
  how quick-commerce prices differ between neighbourhoods.
- **Group chats and other bots.** A WhatsApp or Discord bot can post "cheapest atta in Pune right
  now" from one query, with links that go straight to the product in the shop app.
- **More writers.** The schema is open. Another deal-hunting agent, or a second Iva running in
  another city, can publish `iva.deal.v1` entities under its own wallet. Readers widen
  `ownedBy(...)` to the writers they trust and get a bigger feed. Nobody has to merge databases.

## Limits we'd want to fix

- Testnet only for now (Rabdi). A mainnet feed needs a funded writer and a budget for
  roughly 3 entities per item per hunt.
- Prices are only as fresh as the last hunt in that area. Busy cities get a live feed, and quiet
  ones show "no live deals". That's honest: it is better than showing stale prices.

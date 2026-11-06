# Why Arkiv

**Grocery deals expire, so the data should too.** On Blinkit, Instamart and Zepto a discount
usually lasts a few hours. One of us built a personal price tracker before the hackathon. Over
15 days of polling these shops in Kochi, the median drop of 15% or more lasted about 5 hours.
A price Iva saw this morning is wrong by evening. Showing it then would
mislead people.

Arkiv makes expiry part of the data. Iva writes each deal with a 6-hour lifetime, and after that
it no longer exists. She runs no cron job, keeps no "valid until" column to remember to filter,
and runs no cleanup script. If Iva crashes, the stale deals still disappear on time.

**Iva's work becomes a public feed instead of a private chat.** Before Arkiv, every hunt
answered one person in one Telegram chat and was then lost. Iva has already paid for that work: 0G
inference to match "Fresh White Eggs 12 pcs" against "Yojana Poultry Power White Eggs" across
three shops. On Arkiv the result outlives the chat:
- the next user in the same city can type `/deals eggs` and see what Iva found an hour ago,
  without spending a hunt;
- anyone else (another agent, a map, a script) can run the same query with no API key,
  account or permission from us. See [reach.md](reach.md).

**Queries are attribute filters, so the feed needs no server.** `city`, `item`, `shop`,
`unitPriceRs` and `huntAt` are indexed. "Cheapest live eggs in Mumbai" is one query with an
`ORDER BY`, run against Arkiv directly. Iva has no database to host, no API to keep up and no
rate limiter to write. For a hackathon project that has to keep running after the weekend,
having nothing to operate matters.

**Ownership gives provenance.** Every deal is owned by Iva's writer wallet. A reader filtering
on `$owner` knows the deal came from Iva and not from someone spamming the schema. Other agents
can publish the same schema under their own wallets, and readers decide whom to trust.

**Why not the alternatives**
- *Our own Postgres/Redis with TTLs:* this works, but only we can read it, and it's a server to
  run and pay for.
- *Plain onchain storage (contract events on 0G or an L2):* these are permanent and can only be
  queried through an indexer we'd have to build. A permanent record is wrong for data that
  goes stale in hours.
- *IPFS/0G Storage blobs:* there's no query by attribute and no expiry.

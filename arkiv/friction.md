# Friction log: building on Arkiv (ETHGlobal Mumbai, night of 2026-11-06)

These are honest notes from wiring Iva's deal feed into Arkiv in one evening, using
`@arkiv-network/sdk` 1.0.1, Node 24 and plain ESM JavaScript (no TypeScript). They're in the
order we hit them.

## 1. An agent can't fund its own writer (the biggest blocker)

The Rabdi faucet (hub.arkiv.network/faucet) needs a **wallet sign-in (SIWE) and a CAPTCHA**. That
is reasonable abuse protection, but it means an autonomous agent can't get gas for a key it just
generated. We had to stop and ask a human to sign in with his own wallet, paste Iva's writer
address and solve the CAPTCHA.

For Arkiv's "agents" use case, a headless path would help: a small proof-of-work faucet, a
per-IP drip API, or a faucet that a signed request from an already-funded wallet can trigger.

## 2. An unfunded wallet fails with a misleading error

`executeBatch` from a zero-balance account failed with:

```
Transaction failed: Execution error without revert data
```

It didn't say "insufficient funds". We lost a few minutes checking our entity encoding before
we checked the balance. Iva now reads the writer's balance when a publish fails and says
"writer … has no tGLM for gas (faucet: …)".

## 3. Public RPC and access keys

Without an access key the SDK prints a warning that the public endpoint is "heavily rate
limited" (once per process, which is fine). Getting a key also needs the SIWE sign-in on the hub.
For our read volume the public endpoint was enough. Iva takes an optional `ARKIV_ACCESS_KEY`.

## 4. Typed literals: a `bigint` is a `u256`

Our first exploratory query was `gt('$expiresAt', 0n)`, and it threw:

```
"$expiresAt" is a u64, but the value is a u256. System attributes have a fixed type — write u64(...) around the value.
```

The message is excellent and the fix was immediate (`u64(0n)`). It's still a trap for JS users,
since TypeScript would have caught it at compile time.

## 5. `str` is capped at 128 bytes

Shop product names and URLs can be longer. A Zepto URL is `/pn/<70-char slug>/pvid/<uuid>`. The
SDK error even suggests the fix ("Store the long form in a bytes column"), so we did that:
- the URL is a `bytes` attribute, decoded with `hexToString` on read;
- product names are cut to 120 bytes, without splitting a multi-byte character.

This was easy once known, but 128 bytes isn't in the getting-started tutorial and is easy to
assume away.

## 6. Expiry is in blocks, while users think in hours

`$expiresAt` is a **block number**, not a timestamp. Showing "expires in 5h 12m" needs the
current block. `QueryResult.blockNumber` gives it for free with every page, which is nice, and
we multiply the difference by the nominal 2 s block time. `ExpirationTime.fromHours(6)` is also
converted to blocks at 2 s, so it is approximate.

The SDK documents both points clearly. A `expiresAtTime` estimate on query rows would remove
the arithmetic from every app.

## 7. Decimals must be strings

`dec(89.5)` throws, because a fractional JS number isn't exact. You need `dec("89.50")`. This is
the right design and the error says what to do; we wrap prices in `dec(x.toFixed(2))`.

## 8. One sort key per query

`orderBy` takes exactly one key. For `/deals eggs` we sort on `unitPriceRs` on the node. For the
city-wide view we sort on `huntAt` and then group and sort per item in JS. That was fine for our
volume.

## 9. Explorer URLs

The explorer is a single-page app. Every path returns 200, so we couldn't probe for the entity
URL format and found `/entity/<key>` by reading the bundle. A line in the SDK README ("view your
entity at …/entity/<key>") would save that step.

## What was smooth

- **The schema API.** It describes columns once and marks which are indexed. Values are checked
  at runtime even from plain JS, and named schemas tag their entities so queries stay scoped.
- **`executeBatch`.** Up to 12 deals go in one transaction, with the created keys returned in
  order.
- **The query builder.** `.where(and(eq(...), eq(...))).ownedBy(addr).orderBy(asc(...))` reads
  like SQL, and `toString()` shows the exact query string sent to the node. We print it in
  `scripts/arkiv-query.mjs` so readers can copy it into any client.
- **The npm README.** The SDK's own README was the best doc we found: complete, current and
  honest about footguns. Reading the SDK source answered the rest.
- **Expiry.** It's a parameter on create, and the chain does the cleanup. That's the feature we
  came for, and it needed no code on our side.

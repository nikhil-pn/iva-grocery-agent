# ETHGlobal submission form: paste-ready answers

## Page 1: Create Project
- **Project name:** Iva
- **Category:** Artificial Intelligence (if it's not in the list: Consumer)
- **Emoji:** 🧺

## Short description (max 100 characters)
Telegram grocery agent that finds your cheapest basket and pays for her own AI on 0G, from her fees.

## Description
Most AI agents stop working the day their owner stops paying the API bill. Iva pays her own.

Iva is a Telegram grocery agent for India. You send her a shopping list: as text, a photo of a handwritten note, or a voice note. She checks Blinkit, Swiggy Instamart and Zepto at your address, matches the same product across all three apps (different brands, names and pack sizes), and tells you the cheapest basket, what you save and a link to each product. On a real 3-item list in Mumbai she found Zepto ₹213 vs Instamart ₹288, a ₹75 saving.

How she keeps herself alive:
- Each hunt costs 0.2 0G, paid into Iva's own wallet. She verifies the payment on 0G mainnet herself, then signs depositFor on the 0G Payment Layer to top up her own 0G compute account. No human tops her up. On mainnet a customer paid 4.8 0G, and 7 seconds later Iva deposited 1.6 0G into her compute.
- A hunt costs her about 0.02 0G of inference, so she earns roughly 10× what she spends.
- She reads her own balance before every job and picks the best brain she can afford: rich (glm-5.3 sealed in a TEE), lean (a model about 50× cheaper) or survival (no AI, still answers). Her API key has a 2 0G/day credit limit enforced by 0G. When money runs low she degrades instead of crashing.

Why people come back: /watch re-checks your saved list every morning and tells you if it got cheaper (each check is a paid hunt that funds her brain), and /deals shows live deals near you for free.

Arkiv: after every hunt Iva publishes each winning price to Arkiv as an entity, signed by her wallet, that expires on its own after 6 hours, because grocery deals only last hours. /deals and the website read this public, never-stale feed. No database to run.

She can do the whole job: say "order" and Iva fills your Zepto cart through Zepto's official MCP, shows Zepto's bill and orders only after you reply YES (tested with a real order).

What breaks without 0G: Iva can't understand your list or match products across apps, and has no way to pay for her own thinking. She becomes a dumb keyword script.

## How it's made
Node.js agent running as a service, plus a Next.js 16 website on Vercel.

- Shops: one shared headless Chrome (playwright-core) with an isolated context per shop and location. Instead of scraping HTML we read the JSON that each shop's own search page fetches (Blinkit, Instamart, Zepto), normalised to one item shape: price, MRP, pack, ₹/kg or ₹/piece, stock, link. Direct API calls are blocked by request signing and Cloudflare, so letting the real page fetch was the reliable route.
- AI on 0G Private Computer: the 0G Router (OpenAI-compatible). glm-5.3 sealed in a TEE reads the list and matches products across shops; qwen3-vl-plus reads photos; qwen3-omni-flash reads voice notes; qwen3.7-flash is the cheap "lean" brain. Every call's request ID and cost are read from x_0g_trace and shown to the user and logged in an append-only receipt file.
- Self-paying loop (viem on 0G mainnet, chain 16661): a treasury loop runs every 30 s and on each payment. It verifies a payment from its receipt (to Iva, succeeded, never claimed before), credits hunts, then calls depositFor(address) on the 0G Payment Layer (0xA3b15Bd2aD18BFB6b5f92D8AA9F444Dd59d1cE32) to top up her compute. Surplus above a ceiling goes to the creator as a dividend.
- Budget awareness: before each job she reads the Router's /account/funds and the Payment Layer balanceOf, then picks rich, lean or survival. The sk- API key has a 0G-enforced daily credit_limit; 402/429 from the Router drop her to survival instead of crashing.
- Arkiv (Rabdi testnet, @arkiv-network/sdk): schema iva.deal.v1 with indexed city, item, shop, unit price, cell and time. Each hunt publishes up to 12 entities in one executeBatch tx with ExpirationTime.fromHours(6), through a queue so concurrent hunts never clash on the nonce, after the user already has their answer. Reads filter on $owner = Iva's wallet so nobody can inject fake deals.
- Zepto ordering: an MCP SDK client for Zepto's official MCP server with OAuth (dynamic client registration + PKCE). It shows Zepto's bill, needs an explicit YES, reads the real payment methods (the preview can claim COD when it isn't allowed) and never retries an order call.
- Hacky bits: some wallets underprice gas on 0G and their txs never land, so the pay page sends legacy txs with a gas-price floor and waits for the receipt. OKX Wallet's in-app browser returns fake hashes for 0G, so users can also send from any wallet and paste the hash. The demo video is an HTML timeline rendered frame by frame in headless Chrome with ffmpeg.

## Links
- GitHub: https://github.com/nikhil-pn/iva-grocery-agent
- Live demo: https://iva-grocery-agent.vercel.app (bot: https://t.me/IvaGroceryAgentbot)
- Demo video (2:57): https://youtu.be/h34HixEbvUA (upload the same file if the form wants a file)

## Tech stack
- Ethereum developer tools: viem
- Blockchain networks: 0G Mainnet, Arkiv (Rabdi testnet)
- Programming languages: JavaScript, TypeScript
- Web frameworks: Next.js, React, Tailwind CSS
- Databases: Arkiv (deal feed); append-only JSONL for receipts
- Design tools: none
- Other: Node.js, Telegram Bot API, playwright-core (headless Chrome), Model Context Protocol (Zepto MCP), Vercel, ffmpeg
- AI models (runtime, on 0G): glm-5.3, qwen3.7-flash, qwen3-vl-plus, qwen3-omni-flash
- AI tools used to build: Claude Code (see AI_USAGE.md)

## Images
- Logo: https://iva-grocery-agent.vercel.app/brand/iva-avatar-dark.png
- Cover: https://iva-grocery-agent.vercel.app/brand/iva-telegram-intro.png
- Screenshots: the website (iva-grocery-agent.vercel.app), a hunt reply in Telegram, the Arkiv explorer tx, and the two chainscan txs.

## Contract addresses
No contracts of our own. Iva uses the 0G Payment Layer 0xA3b15Bd2aD18BFB6b5f92D8AA9F444Dd59d1cE32 (0G mainnet). Iva's agent wallet, which earns, deposits and writes Arkiv deals: 0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d.

## Prize type
Finalist and Partner Prizes.

## Partner prize: 0G (Agents That Pay for Themselves + Build with 0G Private Computer)
**How are you using 0G?**
Iva's whole brain runs on 0G Private Computer through the 0G Router. glm-5.3 sealed in a TEE reads lists and matches products across shops, and qwen vision and omni models read photos and voice notes. Every call's request ID and cost are shown to users. Customers pay 0.2 0G per hunt into Iva's wallet; she verifies it and calls depositFor on the 0G Payment Layer herself to fund her own compute, with no human top-up (proof: customer pays 4.8 0G in tx 0xdba49f…, then 7 s later Iva deposits 1.6 0G in tx 0xce31fb…). She reads /account/funds and balanceOf before every job to pick rich, lean or survival, and her API key has a 0G-enforced 2 0G/day credit limit.

**Feedback:**
The Router's OpenAI compatibility plus x_0g_trace (request ID + cost on every response) made a self-paying agent easy to prove. Things we'd improve: the management key can't edit API-key limits (we had to use the dashboard), there's no API to read the daily reset time, and the testnet Router wasn't reachable from our network, so we built on mainnet directly.

## Partner prize: Arkiv (Build on Arkiv, from scratch)
**How are you using Arkiv?**
Arkiv is Iva's public deal feed. After every hunt she publishes one entity per item per shop (schema iva.deal.v1: item, shop, ₹ price, ₹/unit, city, ~5 km cell, time seen, product link), owned by her wallet and expiring after 6 hours, because grocery discounts only last hours. Up to 12 entities go in one batched tx, after the user already has their answer. /deals in the bot and the live deals board on our website read it with an attribute query (city + item, cheapest first, $owner = Iva), so users get free, never-stale deals from hunts other people paid for. We run no database. Proof: https://rabdi.explorer.arkiv.network/address/0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d. All five /arkiv docs are in the repo.

**Feedback:**
See arkiv/friction.md (9 items). Top ones: an agent can't fund its own writer without a human faucet step; an unfunded wallet fails with a misleading error; str attributes are capped at 128 bytes; expiry is in blocks while users think in hours; and only one sort key per query.

## Pre-existing code / AI disclosure
Built from scratch at ETHGlobal Mumbai (first commit 6 Nov 17:49, 68+ commits). Public libraries only: viem, @arkiv-network/sdk, playwright-core, @modelcontextprotocol/sdk, Next.js. AI assistance: Claude Code, documented in AI_USAGE.md.

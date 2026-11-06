# Iva vs the official track briefs

Each row puts the sponsor's own words (from ethglobal.com/events/mumbai/prizes, checked 7 Nov 2026) next to what Iva does,
with a link you can click.
Iva is entered for **2 partners: 0G (2 tracks, one pick) and Arkiv (1 track)**.

Chain explorers: 0G mainnet = `chainscan.0g.ai`, Arkiv Rabdi testnet = `rabdi.explorer.arkiv.network`.
Iva's wallet (earns, deposits, writes deals): `0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d`.

---

## 💸 0G: Agents That Pay for Themselves ($2,000, up to 2 × $1,000)

> "Most agents stop running the day their owner stops paying the API bill. Build one that earns its keep. It should
> make money, and that money should pay for its own inference on 0G Compute without a human topping it up."
> "Other ways of earning count too, such as charging for a service… The money just has to reach 0G Compute without a human in the loop."

| 0G says | Iva |
|---|---|
| **Must show:** "money in" | Customers pay 0.2 0G per hunt to Iva's wallet. [4.8 0G in](https://chainscan.0g.ai/tx/0xdba49fc9f870bb7620adf65a6e4fef7c57ae1a7ace750905886c233befa3b51e) · [0.2 0G in](https://chainscan.0g.ai/tx/0x58eec12440bd324ce894e1c03a159259471838cf1368dfa15ed1650f0524bb67) |
| **Must show:** "credit landing in the agent's 0G compute account" | Iva signs `depositFor()` on the 0G Payment Layer herself, about 10 s later. [1.6 0G](https://chainscan.0g.ai/tx/0xce31fb72627472c3eb489c47a1597f207c3801ceb541f0e4bd78e20f466cbec6) · [0.19 0G](https://chainscan.0g.ai/tx/0x5de7f01ae836e81731268f06638b7c99dfa96d6133e01b5aa3c6b9c671c48698) |
| **Must show:** "inference paid from that balance, with tx hashes and request IDs" | Every hunt shows its 0G request IDs and cost, e.g. `15a5ecb3-3c05-4f6e-92c9-1001c73af475`. Full log: [receipts.json](https://iva-grocery-agent.vercel.app/receipts.json) |
| **Must show:** "the agent running on its own during the demo with no manual top-up" | She runs as a service. Her treasury loop checks every 30 s and deposits on her own. Nobody has ever refilled her wallet. |
| **Must show:** "a spend cap, and what the agent does when funds run low (degrade gracefully, not crash)" | 0G-enforced `credit_limit` of 0.5 0G/day on her API key, plus her own cap. When money runs low she steps down: **rich** (glm-5.3, sealed) → **lean** (~50× cheaper model) → **survival** (no AI, still answers). |
| **Would love:** "agents that do a job worth paying for" | The cheapest grocery basket across Blinkit, Instamart and Zepto. A real hunt saved ₹75 on 3 items. She can also place the order on Zepto. |
| **Would love:** "budget-aware agents that read their own balance and adapt… cheaper model… pausing" | She reads her own balance before every job and picks the brain she can afford (the 3 tiers above). |
| **Would love:** "agents that hire or pay other agents" | ❌ Not built. |
| **Not wanted:** "a token launch with a chatbot", "revenue from trading its own token", "an agent whose wallet a human refills" | ✅ No token. Revenue = real per-hunt service fees. No human refills. |
| **Recommended path:** comfy | We used the other allowed path, "charging for a service". comfy's hire board was closed and registration returned 503/429. |

**Earns vs spends:** a hunt earns 0.2 0G and costs her about 0.02–0.03 0G of inference, so she earns roughly 7–10× what she spends.

---

## ♾️ 0G: Build with 0G Private Computer ($5,000: $2,500 / $1,500 / $1,000)

> "Build a consumer app where AI on 0G is the product: something people open, use, and come back to tomorrow."

| 0G says | Iva |
|---|---|
| **Must show:** "inference on 0G Private Computer in your main user flow, with request IDs" | Every hunt runs on the 0G Router. The rich tier is `glm-5.3` **sealed in a TEE** (Intel TDX attested). Request IDs show in every reply and in `/brain`. |
| **Must show:** "a working app a judge can try" | [@IvaGroceryAgentbot](https://t.me/IvaGroceryAgentbot). The first hunt is free. |
| **Must show:** "a clear reason someone comes back tomorrow" | `/watch` saves your list, and every morning at 08:30 Iva re-checks it and tells you if it got cheaper. `/deals` shows fresh deals near you. |
| **Must show:** "one sentence on what breaks if 0G is removed" | "Iva can't understand your list or match products across apps, and she has no way to pay for her own thinking: she becomes a dumb keyword script." (README) |
| **Welcome:** "creative image, video and voice apps" | She reads **photos** of shopping lists (qwen vision) and **voice notes** in Hindi or English (qwen omni). |
| **Not wanted:** "apps where the AI call could be removed without anyone noticing" | Remove 0G and "Amul Butter Cookies" counts as butter. Survival mode shows exactly that drop in quality. |
| **Bonus:** iAI sign-in (users spend their own daily credits) | ❌ Not built (optional). |

---

## 🧩 Arkiv: Build on Arkiv, from scratch ($4,000: $3,000 / $1,000)

> "Build a new app whose data lives in Arkiv. You query its entities with SQL-like filters, and each one has an owner
> wallet and an expiration you choose." Their example directions include "Markets: listings or offers that expire at
> their deadline" and "Agents: ephemeral coordination state… that agents share, query and let expire."

**In plain words:** Arkiv is a public notice board where every note deletes itself on a timer. After every hunt, Iva pins
each winning price (signed by her wallet, set to delete itself in 6 h). `/deals` and the website read it.

| Arkiv says | Iva |
|---|---|
| **Must:** "writes to Arkiv's current testnet with @arkiv-network/sdk" | Rabdi testnet, `@arkiv-network/sdk` 1.0.1. [First publish, 7 deals in 1 tx](https://rabdi.explorer.arkiv.network/tx/0x89f91c6c19c3b055bf37c3f215c57a5492aa28a4d544b00e5bcc551737bd7c56) · [9 deals, 7 Nov 05:00](https://rabdi.explorer.arkiv.network/tx/0xf0852d9de068bd63836754c07dd05ffa5a1fc28265e574140175ed5c9b0e966c) |
| **Must:** "at least one feature users see reads its data from Arkiv" | `/deals` in the bot, and the [live deals board](https://iva-grocery-agent.vercel.app/#deals) on the website. |
| **Must:** "README: the wallet that wrote your entities, and one query we can run" | README "Arkiv: live deal feed": writer `0xbbd2…918d` and `node scripts/arkiv-query.mjs eggs`. |
| **Must:** `/arkiv/schema.md`, `/arkiv/friction.md` + one file per judging criterion | ✅ `schema.md` · `friction.md` · `reach.md` · `why-arkiv.md` · `how-you-use-arkiv.md` |
| **Must:** "open-source license; say how you used AI" | MIT · `AI_USAGE.md` |
| **Not counted:** "SDK installed but never used to read, or Arkiv used only as a log that nothing reads" | ✅ The deals are read constantly: they *are* the `/deals` feature and the website board. |
| **Direction:** "listings or offers that expire at their deadline" | A grocery deal is exactly that: a price that's only true for a few hours. |
| **Direction:** "ephemeral state that agents share, query and let expire" | Any other agent can read Iva's feed with no key, e.g. a meal planner pricing tonight's recipe (`reach.md`). |

**How Arkiv judges (25% each), and where we answer:**
| Criterion | Their question | Our answer |
|---|---|---|
| Feedback · `friction.md` | What got in your way? | 9 real problems we hit, e.g. an agent can't fund its own writer, misleading error for an unfunded wallet, 128-byte string cap, expiry in blocks not hours. |
| Reach · `reach.md` | Who is it for, and can they try it today? | Shoppers in Indian metros, other agents, maps. Yes, today: bot, website, script. |
| Why Arkiv · `why-arkiv.md` | What would users lose with Postgres? What did you keep off Arkiv? | Self-expiring prices + an open feed with no server. Kept off: users, exact locations, payments, receipts, Zepto logins. |
| How · `how-you-use-arkiv.md` | Does each feature change something users see? | A table: expiry → "expires in Xh"; owner → no fake prices; filters → `/deals eggs`; batch → no slower replies. |

---

## Submission checklist (both sponsors ask for the same things)

| Item | Status |
|---|---|
| Project name + short description | ✅ `docs/SUBMISSION.md` |
| Public repo, README + setup | ✅ github.com/nikhil-pn/iva-grocery-agent |
| **Demo video under 3 minutes** + live demo link | ⏳ video · ✅ https://iva-grocery-agent.vercel.app |
| Contract addresses | None of our own. 0G Payment Layer `0xA3b15Bd2aD18BFB6b5f92D8AA9F444Dd59d1cE32` |
| Team names + Telegram + X | ⏳ |

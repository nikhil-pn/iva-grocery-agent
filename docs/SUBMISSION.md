# ETHGlobal submission draft

**Project name:** Iva

**Short description (one line):** A Telegram grocery agent that finds the cheapest basket across Blinkit,
Instamart and Zepto, and pays for her own brain on 0G Compute out of the fees she earns.

**Description:**
Most agents stop the day their owner stops paying the API bill. Iva earns her keep. You send her a
shopping list, and she checks Blinkit, Swiggy Instamart and Zepto at your location. She matches the same product
across apps (different brands, names and pack sizes) using 0G models, and tells you the cheapest basket and what you save.

Each hunt costs 0.2 0G, paid to Iva's own wallet. She verifies the payment onchain, then signs
`depositFor` on the 0G Payment Layer to top up her own 0G compute account. A hunt costs her about 0.02 0G
of inference, so she earns about ten times what she spends.

She reads her own balance before every job and picks the best brain she can afford:
- `glm-5.3`, sealed into a TEE, when rich;
- a model about 50× cheaper when lean;
- no AI at all in survival (still answering), at her spend cap.

The spend cap is a 2 0G daily `credit_limit` enforced by 0G on her API key.

**And she can buy it (private beta):** say *order* and Iva fills your Zepto cart through **Zepto's official MCP**,
with her 0G brain picking the products. She shows Zepto's bill and orders only after you reply YES (cash on delivery,
or Zepto's UPI link). This was tested with a real order on 2026-11-07.

**Why people come back tomorrow:** `/watch` saves your list, and every morning Iva re-checks it and tells you today's cheapest basket
and whether it got cheaper. Each daily check is 1 paid hunt, which keeps funding her brain.

**What breaks if 0G is removed:** Iva can't understand your list or match products across apps,
and she has no way to pay for her own thinking. She becomes a dumb keyword script.

**How it's made:** Node.js; viem on 0G mainnet; the 0G Router (OpenAI-compatible, `x_0g_trace` request IDs
and costs); the 0G Payment Layer `depositFor`; playwright-core reading each shop's own search page; and the Telegram Bot API.
All payments, deposits and inference request IDs are logged and listed in the README.

**Sponsors / tracks (2 partner picks):**
- **0G**: Agents That Pay for Themselves · Build with 0G Private Computer
- **Arkiv**: Build on Arkiv (from scratch). In plain words, Arkiv is a public notice board where every note deletes itself on a timer.
  After every hunt Iva pins each price she found (item, shop, ₹, city, link), signed by her own wallet and set to delete itself in 6 h.
  Users get `/deals`: free, never-stale deals near them from hunts other people already paid for. Anyone can query the feed with no key,
  and we run no database. Proof: [every deal](https://rabdi.explorer.arkiv.network/address/0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d) ·
  [first publish tx](https://rabdi.explorer.arkiv.network/tx/0x89f91c6c19c3b055bf37c3f215c57a5492aa28a4d544b00e5bcc551737bd7c56) ·
  [live on the site](https://iva-grocery-agent.vercel.app/#deals). Docs in `arkiv/`.

**Links:** repo https://github.com/nikhil-pn/iva-grocery-agent · bot https://t.me/IvaGroceryAgentbot · site https://iva-grocery-agent.vercel.app

**Contracts:** none deployed. Iva uses the 0G Payment Layer `0xA3b15Bd2aD18BFB6b5f92D8AA9F444Dd59d1cE32`.
Agent wallet `0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d`.

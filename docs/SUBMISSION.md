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

The spend cap is a 0.5 0G daily `credit_limit` enforced by 0G on her API key.

**What breaks if 0G is removed:** Iva can't understand your list or match products across apps,
and she has no way to pay for her own thinking. She becomes a dumb keyword script.

**How it's made:** Node.js; viem on 0G mainnet; the 0G Router (OpenAI-compatible, `x_0g_trace` request IDs
and costs); the 0G Payment Layer `depositFor`; playwright-core reading each shop's own search page; and the Telegram Bot API.
All payments, deposits and inference request IDs are logged and listed in the README.

**Tracks:** 0G Agents That Pay for Themselves · 0G Build with 0G Private Computer

**Links:** repo https://github.com/nikhil-pn/iva-grocery-agent · bot https://t.me/IvaGroceryAgentbot

**Contracts:** none deployed. Iva uses the 0G Payment Layer `0xA3b15Bd2aD18BFB6b5f92D8AA9F444Dd59d1cE32`.
Agent wallet `0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d`.

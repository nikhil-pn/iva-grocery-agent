# Demo video script (target 2:40, hard limit under 3:00)

Record the screen (Telegram Desktop or web.telegram.org, plus a browser tab for chainscan.0g.ai).
Use your own voice in English: no AI voiceover, no speed-up, at least 720p.

| Time | Show | Say |
|---|---|---|
| 0:00–0:15 | Bot chat header | "Most AI agents die the day their owner stops paying the API bill. This is Iva, a grocery agent that pays for her own brain on 0G, out of the money she saves you." |
| 0:15–0:50 | Type `12 eggs, 1 kg onion, 1 litre milk` → result | "I send my list. Iva checks Blinkit, Instamart and Zepto at my location, matches the same product across apps and finds the cheapest basket: Zepto, saving ₹75. Every answer shows the 0G request IDs it paid for, and this one ran sealed inside a TEE." |
| 0:50–1:05 | `/brain` | "This is Iva's brain: her own wallet, her 0G compute balance, today's spend against a 0.5 0G cap that 0G itself enforces, and every payment, deposit and request." |
| 1:05–1:35 | OKX Wallet → Send 0.2 0G to Iva → paste hash in the bot → "Got 0.2 0G" + "⚡ Topped up my own brain" → open the deposit tx on chainscan | "A customer pays 0.2 0G per hunt. Iva verifies it onchain, and within seconds she signs `depositFor` herself, moving the money into her own 0G compute account. No human tops her up." |
| 1:35–2:10 | Run `scripts/demo-tier.sh lean` (off camera) → send a list → 🟡 lean, `qwen3.7-flash`; then `demo-tier.sh survival` → send `amul butter 500g` → 🔴 survival reply | "She is budget-aware. When money runs low she switches to a model 50 times cheaper. At her spend cap she drops to survival: no AI, still answering, and she tells you why. Without her 0G brain she even confuses butter cookies with butter. She degrades; she doesn't crash." |
| 2:10–2:35 | README diagram / repo | "What breaks without 0G: Iva can't understand your list, can't match products across apps, and can't pay for her own thinking. Iva is tool-less: she never orders for you and can't be steered into anything but price hunting." |
| 2:35–2:45 | Bot link | "Iva earns, Iva pays, Iva keeps working. Try her at t.me/IvaGroceryAgentbot." |

After recording: `scripts/demo-tier.sh reset`.

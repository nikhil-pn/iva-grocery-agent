# Demo video script (target 2:45, hard limit under 3:00)

Record the screen (Telegram Desktop or web.telegram.org, plus a browser tab for chainscan.0g.ai and the website).
Use your own voice in English: no AI voiceover, no speed-up, at least 720p.
Before recording, run one hunt so the Arkiv feed has live deals (they expire after 6 h).

| Time | Show | Say |
|---|---|---|
| 0:00–0:15 | Bot chat with the buttons | "Most AI agents die the day their owner stops paying the API bill. This is Iva, a grocery agent that pays for her own brain on 0G, out of the money she saves you." |
| 0:15–0:45 | Tap **🧺 Try: 12 eggs, 1 kg onion, 1 litre milk** → result | "I send my list. Iva checks Blinkit, Instamart and Zepto near me, matches the same product across apps and finds the cheapest basket. Every answer shows the 0G request IDs she paid for, sealed inside a TEE." |
| 0:45–1:00 | Reply **order** → Zepto bill → **YES** → order placed (or play the recording from the real order) | "And she can buy it. Through Zepto's official MCP she fills my cart, her 0G brain picks the products, and she only orders after I say YES." |
| 1:00–1:30 | Tap **💳 Pay** → send 0.2 0G from a wallet → paste the hash → "Got 0.2 0G" + "⚡ Topped up my own brain" → open the deposit tx on chainscan | "Each hunt costs 0.2 0G. Iva verifies the payment onchain, and within seconds she signs `depositFor` herself into her own 0G compute account. No human tops her up." |
| 1:30–1:45 | Tap **🧠 Iva's brain** | "Her wallet, her 0G compute balance, today's spend against a 0.5 0G cap that 0G enforces, and every payment, deposit and request." |
| 1:45–2:10 | `scripts/demo-tier.sh lean` (off camera) → a list → 🟡 lean; `demo-tier.sh survival` → `amul butter 500g` → 🔴 survival | "She is budget-aware: when money runs low she switches to a model 50× cheaper; at her cap she drops to survival, with no AI but still answering. She degrades; she doesn't crash." |
| 2:10–2:30 | **🏷 Live deals** in the bot + the website's "fresh deals, live on Arkiv" + one entity on the Arkiv explorer | "Arkiv is a public notice board where every note deletes itself on a timer. After every hunt Iva pins the prices she found, signed by her wallet, gone in 6 hours, because grocery deals don't last. So /deals is free and never stale, and anyone can read the feed." |
| 2:30–2:45 | `/watch` reply, then the website | "With /watch she re-checks my list every morning. Iva earns, Iva pays, Iva keeps working. Try her at t.me/IvaGroceryAgentbot." |

After recording: `scripts/demo-tier.sh reset`.

# Demo video: script, shots and captions (2:57, no audio)

1920×1080, 30 fps, H.264. Captions are burned in, and also shipped as `iva-demo.en.srt` for YouTube/ETHGlobal.
Fonts and colours match the website: Instrument Serif italic + Inter Tight, lime `#7ed854` on asphalt `#1d2421`.
Everything shown is real: the website is the live site, the chat is a real hunt (Mumbai, 6 Nov), and the
explorer pages are real transactions on 0G mainnet and Arkiv.

If you want a voiceover, read the captions in order. They are written to be spoken at a relaxed pace.

| Time | Chapter | On screen | Caption |
|---|---|---|---|
| 0:00 | Title | The basket photo. The logo handle draws itself, then "*your* basket sorted." and the 0G / Arkiv / Zepto stickers pop on. | Iva, the grocery agent that pays for her own brain. |
| 0:06 | Problem | "Most AI agents die the day their owner stops paying the API bill." → "*iva* pays her own." | Most AI agents die the day their owner stops paying the API bill. · Iva earns her keep, and pays for her own thinking on 0G. |
| 0:13 | 01 the product | The live website in a browser, slow zoom. | Send her a grocery list on Telegram, or open the website. · She checks Blinkit, Instamart and Zepto at your address. |
| 0:24 | 02 a real hunt | The 3 steps on the left. A Telegram chat on a phone: the list → "checking 3 shops" → the result. Callouts: ₹75 saved, sealed in a TEE, 0G request IDs. | A real hunt in Mumbai… · Cheapest basket: Zepto ₹213 vs Instamart ₹288. You save ₹75. · Her brain runs on 0G, sealed in a TEE… |
| 0:46 | 03 under the hood | The website's "behind one hunt" section scrolls: 9 steps, each tagged with its system. | Behind one hunt: nine real steps in about 30 seconds. · 0G models read the list and match the same product across shops. |
| 0:58 | 04 the 0G loop | Animated loop: a 0G coin travels round 6 stations and each step lights up. | You pay 0.2 0G a hunt… · She signs depositFor… · She earns 0.2 0G a hunt and spends about 0.02 0G thinking. |
| 1:20 | 05 on-chain proof | chainscan: a customer pays Iva 4.8 0G → "+7 s" → Iva's own depositFor() into her compute account. | Proof on 0G mainnet… · …seconds later Iva deposits into her own compute account, signed by her wallet. |
| 1:40 | 06 budget-aware | rich / lean / survival cards, the active one shifting. "🛑 spend cap · 2 0G / day". | She reads her own balance before every job… · Spend cap of 2 0G a day, enforced by 0G… |
| 1:52 | 07 arkiv | "a public notice board where every note deletes itself on a timer". The live deals board scrolls; the Arkiv explorer shows 9 deals in 1 tx, with a ticking "expires in" countdown. | Arkiv is a public notice board… · Every hunt pins its winning prices there… · /deals reads them back… |
| 2:12 | 08 zepto | "order" → Zepto's bill → "YES" → ordered. Facts: official MCP, YES gate, a real ₹242 order. | Say "order": Iva fills your Zepto cart… · Zepto's bill first, and nothing is ordered without your YES. |
| 2:24 | 09 tracks | Three cards with stickers and ticks: Agents That Pay for Themselves, 0G Private Computer, Build on Arkiv. | Built for 0G Agents That Pay for Themselves, 0G Private Computer and Build on Arkiv. |
| 2:36 | 10 live now | The whole website scrolls next to the phone version. | Live now: the bot, the website, and every transaction on-chain. |
| 2:43 | 11 the team | The dog sticker pops in, then three cards: Supreme leader @NikhilEth, Halal baddy @Sherhin55, Degen @0xnandhu. | Built by three humans and one very confident dog. |
| 2:50 | end | "*iva* earns. iva pays." + bot, website and GitHub links. | Iva earns. Iva pays. Iva keeps working. |

## Proof shown in the video
- Customer payment, 4.8 0G: `0xdba49fc9f870bb7620adf65a6e4fef7c57ae1a7ace750905886c233befa3b51e`
- Iva's own depositFor, 1.6 0G, 7 s later: `0xce31fb72627472c3eb489c47a1597f207c3801ceb541f0e4bd78e20f466cbec6`
- Arkiv publish, 9 deals in 1 tx: `0xf0852d9de068bd63836754c07dd05ffa5a1fc28265e574140175ed5c9b0e966c`
- The hunt's 0G request IDs: `7dcbb0a0-881b-46a1-82c6-12f6cfc858cf`, `2a4ffab3-f933-4126-8514-19b2d14acfa2`

## How it's made
One HTML timeline in the site's design tokens, rendered frame by frame in headless Chrome (deterministic, so motion
is smooth and text is crisp), then encoded with ffmpeg. Website and explorer images are fresh screenshots of the live pages.

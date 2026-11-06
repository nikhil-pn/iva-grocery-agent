# 🧺 Iva: the grocery agent that pays for her own brain

> Most AI agents die the day their owner stops paying the API bill.
> **Iva pays her own bill, out of the money she saves you.**

**Try it:** [t.me/IvaGroceryAgentbot](https://t.me/IvaGroceryAgentbot) · **Pay page:** [nikhil-pn.github.io/iva-grocery-agent/pay.html](https://nikhil-pn.github.io/iva-grocery-agent/pay.html)
· **Iva's wallet:** [`0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d`](https://chainscan.0g.ai/address/0xbbd2beC1DFd26272c171d174BeEb4eE0488b918d) (0G mainnet)

Built at **ETHGlobal Mumbai 2026** for 0G's *Agents That Pay for Themselves* and *Build with 0G Private Computer*.

---

## What Iva does

India buys groceries from three 10-minute apps: **Blinkit, Swiggy Instamart and Zepto**. The
same basket can cost noticeably different amounts on each, and nobody checks all three.

Send Iva your list on Telegram, in any of three forms:

- typed: `12 eggs, 1 kg onion, amul butter 500g`
- a 📷 **photo of a handwritten list**
- a 🎙 **voice note** in Hindi, English or Malayalam

Iva **reads it with 0G models** and searches all three apps **at your location**. She then **matches the
same product across apps**, even when the brands, names and pack sizes differ ("2 × 6 pcs" against "12 Pieces").
She works out how many packs you need and replies with the cheapest app, the split basket, and ₹ saved.

## How she pays for herself

```
 customer ──0.2 0G per hunt──▶ Iva's wallet ──depositFor(iva)──▶ Iva's 0G compute account
                                   │   (she signs it herself)          │
                                   │                                   ▼
                     surplus ──▶ creator dividend         0G Router inference
                                                           (request_id + cost per call)
```

1. **Money in.** A customer pays 0G to Iva's wallet from the [pay page](docs/pay.html) and returns to
   Telegram with one tap. Iva checks the transaction onchain herself: it went to her, succeeded and wasn't
   used before. Then she credits the hunts. Paying her compute account directly (`depositFor(iva)`) is
   accepted too.
2. **Credit lands in her 0G compute account.** Iva's treasury loop (`src/treasury.mjs`) runs every 30 s and
   on every payment:
   - she keeps a gas reserve;
   - when her compute balance is below target, she **signs `depositFor(herself)` on the 0G Payment Layer**
     (`0xA3b15Bd2aD18BFB6b5f92D8AA9F444Dd59d1cE32`);
   - once her compute is full, she sends surplus to her creator.

   No human touches her wallet.
3. **Inference is paid from that balance.** Every call goes to the **0G Router**
   (`router-api.0g.ai`, the 0G Private Computer API). Iva records the `x_0g_trace.request_id` and the exact
   cost, and shows them under every answer and in `/brain`.

## Budget-aware brain

Before every job Iva reads her own balance: the Router `/account/funds` endpoint plus the Payment Layer
`balanceOf` call onchain. Then she picks the best brain she can afford:

| Tier | When | Brain |
|---|---|---|
| 🟢 **rich** | ≥ 1 0G of compute | `glm-5.3` **sealed** end-to-end into a TEE provider, plus vision for photo lists and audio for voice notes |
| 🟡 **lean** | ≥ 0.2 0G | `qwen3.7-flash` (~50× cheaper), with cheap vision still on |
| 🔴 **survival** | below that, today's cap reached, or 0G answers 402/429 | **no LLM.** Plain keyword matching and price sorting. Typed lists still work, and paid hunts refill her. |

**Spend cap:** Iva's 0G API key is created with a daily `credit_limit`, which **0G enforces**. Iva also
keeps her own daily cap (`IVA_DAILY_CAP`). When either is hit she degrades to survival instead of crashing,
and tells users why.

### What breaks if 0G is removed
Iva can no longer read photos or voice notes, and she can't tell that "Amul Salted Butter 500 g" is butter
but "Amul Butter Cookies" isn't. Her survival mode shows exactly that. She also loses the way to pay for her
own thinking, so she stops being an agent and becomes a script.

## Proof: the live run on 0G mainnet (2026-11-06)

| Step | Proof |
|---|---|
| 💰 Customer pays Iva 4.8 0G (wallet → Iva) | [`0xdba49fc9…a3b51e`](https://chainscan.0g.ai/tx/0xdba49fc9f870bb7620adf65a6e4fef7c57ae1a7ace750905886c233befa3b51e) |
| ⚡ **7 s later Iva signs `depositFor` herself**: 1.6 0G → her 0G compute account | [`0xce31fb72…cbec6`](https://chainscan.0g.ai/tx/0xce31fb72627472c3eb489c47a1597f207c3801ceb541f0e4bd78e20f466cbec6) |
| 🧠 Inference paid from that balance (go/no-go, `qwen3.7-flash`, 0.000188 0G) | request `253fd0a9-eb8b-46ec-bcd9-2d4ca1018e27` |
| 🧠 A rich-tier hunt: `glm-5.3`, sealed into a TEE provider (`X-0g-E2ee: sealed`, provider `0xD179…E503`, Intel TDX attested) | requests `15a5ecb3-3c05-4f6e-92c9-1001c73af475`, `5f22cbcf-89ff-403e-8d5e-656787226141` (0.029 0G total) |
| 🛑 Spend cap | API key "Iva": `credit_limit 0.5`, `reset_period daily` (read back from `GET /v1/api-keys`) |

Iva's 0G compute account is `0x91ecffc5fcbb3f568173fc5a74045603533d172b`: the pc.0g.ai account whose capped API key
she holds, set to bill in 0G. Her wallet `0xbbd2…918d` earns from customers and signs the deposits into it
(`depositFor(0x91ec…)` works for any address). After her first billed call, the 0G Router pulled 0.5 0G from
the Payment Layer vault into its own ledger by itself, as documented.

## Run it yourself

Requirements: Node 22+, Google Chrome (headless, for reading shop pages), and `ffmpeg` (for voice notes).

```bash
git clone https://github.com/nikhil-pn/iva-grocery-agent && cd iva-grocery-agent
npm install
cp .env.example .env   # or point IVA_ENV_FILE at a file outside the repo
```

Fill in `.env`:
1. `TELEGRAM_BOT_TOKEN` from @BotFather.
2. `IVA_ADDRESS` / `IVA_PRIVATE_KEY`: a **fresh** wallet for the agent (`cast wallet new`).
3. Import that wallet, sign in at [pc.0g.ai](https://pc.0g.ai) and set billing to **0G**. Then create:
   - an `sk-` API key with a **daily credit limit** → `ZG_API_KEY`;
   - an `mk-` management key with `account:read` and `keys:read` → `ZG_MGMT_KEY`.
4. `CREATOR_ADDRESS`: where Iva sends her surplus.

```bash
npm start                                   # the Telegram bot + treasury loop
node scripts/shops-cli.mjs "eggs"           # check the shop readers
node scripts/hunt-cli.mjs "12 eggs, 1 kg onion"
npm run brain                               # Iva's wallet, compute balance, tier
node scripts/go-nogo.mjs                    # one billed 0G call with before/after balance
```

Bot commands: `/start` · `/brain` (wallet, balance, tier, receipts) · `/pay` · `/paid <tx>` · `/me` ·
`/city <name>` · or share your location.

## How it's built

| File | Role |
|---|---|
| `src/shops/*.mjs` | Blinkit, Instamart and Zepto readers. One shared headless Chrome with an isolated context per shop and location. Each reads the JSON the shop's own search page fetches, normalised to one item shape (price, MRP, pack, ₹/kg, ₹/piece, stock, link). |
| `src/hunt.mjs` | Understand the list → search all shops → match across shops (0G model or plain fallback) → basket and saving |
| `src/zg/router.mjs` | 0G Router client: request IDs, cost, TEE flag, 402/429 handling |
| `src/zg/account.mjs`, `src/chain.mjs` | Iva reads her own balances, verifies payments, signs `depositFor` and dividends (viem, 0G mainnet) |
| `src/brain.mjs` | Tier policy (rich / lean / survival) |
| `src/treasury.mjs` | Autonomous treasury loop |
| `src/bot.mjs`, `src/telegram.mjs` | Telegram front end (long polling, so no public server is needed) |
| `docs/pay.html` | Static pay page (GitHub Pages) |
| `data/events.jsonl` | Append-only receipts: payments, deposits, dividends, every inference |

## Safety

- Iva is a **tool-less** agent. She can only hunt prices. She has no shell and no files, and she can't
  place orders, so a stranger's message can't make her do anything else.
- **She never buys for you.** Every result links to the exact product in the shop app, and you tap buy.
- Her wallet is a small hot wallet. Spending is capped by 0G on the API key and by Iva herself per day.
- Shop data is read the way a browser reads it, at a polite rate, with results cached for 20 minutes.

## Roadmap

- **comfy:** register Iva on comfy and launch her token with the compute share on, so trading fees
  become a second income stream into the same compute account.
- **Agents hiring agents:** Iva pays specialist agents (for example a translator or a receipt reader)
  with `transferCredit`.
- **Price-drop alerts** that people return to every day, plus auto-buy gated by a fresh human
  approval for every real-money order.

## Team

- Nikhil P N: Telegram _tbd_ · X _tbd_

See [AI_USAGE.md](AI_USAGE.md) for how AI tools were used and for the pre-existing-work statement.

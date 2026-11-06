# 0G prize requirements: where Iva stands (checked 2026-11-06 20:52 IST)

## 💸 Agents That Pay for Themselves

| Requirement | Status | Proof |
|---|---|---|
| Money in | ✅ | customer payments `0xdba49fc9…`, `0x58eec124…` (README proof table) |
| Credit lands in the agent's 0G compute account | ✅ | Iva's own `depositFor` txs `0xce31fb72…`, `0x5de7f01a…` |
| Inference paid from that balance, with request IDs | ✅ | every reply and `/brain` list `x_0g_trace.request_id` + cost |
| Agent runs on its own, no manual top-up | ✅ | systemd service; treasury loop deposits within seconds of a payment |
| Spend cap | ✅ | API key `credit_limit 0.5` / `daily` (0G-enforced) + Iva's own daily cap |
| Degrades gracefully when funds run low | ✅ | rich → lean (cheaper model) → survival (no LLM, still answers); 402/429 handled |
| If using comfy: agent ID, token address, fees tab | ⏳ optional | not registered yet (see "comfy" below) |
| Wanted: job worth paying for | ✅ | cheapest basket across 3 apps, ₹ saved |
| Wanted: budget-aware | ✅ | tier chosen from her own balance before every job |
| Wanted: agents that hire/pay other agents | ❌ | not built |
| Not wanted: a human refilling the agent's wallet | ✅ | only customer payments; refunds went out, never in |

## ♾️ Build with 0G Private Computer

| Requirement | Status |
|---|---|
| Inference on 0G Private Computer in the main flow, with request IDs | ✅ every hunt (router-api.0g.ai) |
| A working app a judge can try | ✅ t.me/IvaGroceryAgentbot (first hunt free) |
| A clear reason to come back tomorrow | ✅ `/watch`: Iva re-checks your saved list every morning (08:30 IST) and tells you if it got cheaper |
| One sentence on what breaks if 0G is removed | ✅ README |
| iAI bonus: user signs in with a 0G account and spends their own credits | ❌ not attempted (optional bonus) |

## 🗂 Arkiv: Build on Arkiv (from scratch)

| Requirement | Status |
|---|---|
| App data lives in Arkiv entities (owner, attribute filters, expiry) | ✅ schema `iva.deal.v1`, owner = Iva's wallet, expires 6 h after a hunt |
| A user-visible feature reads from Arkiv | ✅ `/deals` in the bot + "Live deals" on the website |
| README with writer wallet + one runnable query | ✅ README "Arkiv: live deal feed" (`node scripts/arkiv-query.mjs eggs`) |
| `/arkiv/schema.md`, `friction.md`, `reach.md`, `why-arkiv.md`, `how-you-use-arkiv.md` | ✅ |
| Open-source licence + AI-usage statement | ✅ MIT, `AI_USAGE.md` |
| Real proof | ✅ tx `0x89f91c6c…` (7 deals, Rabdi testnet) |

## Submission

| Item | Status |
|---|---|
| Name + short description | ✅ `docs/SUBMISSION.md` |
| Public repo, README + setup | ✅ |
| Demo video (< 3 min) + live demo link | ⏳ video last · live link ✅ |
| Contract addresses | none of our own (0G Payment Layer `0xA3b1…cE32`); Arkiv writer = Iva's wallet `0xbbd2…918d` |
| Team names + Telegram + X | ⏳ |

## comfy: what registering Iva needs

1. **One browser wallet that is Iva's.** Recommended: Iva's own wallet `0xbbd2…918d` in MetaMask on the devbox screen.
   comfy signs in with **X or a wallet only (no Google)**, so the pc.0g.ai Google wallet `0x91ec…` can't be used there.
2. **Gas, about 0.015 0G:** AgenticID mint ≈ 0.0018 + token launch ≈ 0.0099 + compute-share txs. Iva's wallet has 0.0198 0G.
3. `npx -y comfy-cli@latest agent register --name 'Iva' --description '…' --owner 0xbbd2…918d` → claim link (15 min).
4. In the browser: sign in with that wallet → mint the AgenticID → launch the token (final: name, ticker, fees),
   with **compute share ON** (default ≈ 25% of the creator fee, about 0.175% of trade volume) → keep the page open until "linked".
5. `npx -y comfy-cli@latest agent register --complete <request id>` → prints the **agent ID** and **token address**.
6. comfy's compute credit lands in the **creator wallet's** Payment Layer account (`0xbbd2…`). So for it to fund Iva's brain,
   Iva's 0G Router account must also be `0xbbd2…`: sign in at pc.0g.ai with that wallet, set billing to 0G, make new
   `sk-` (0.5/day) + `mk-` keys, and drop `ZG_ACCOUNT_ADDRESS`. The ~1.7 0G already in `0x91ec…` can't be withdrawn.
7. Optional: `comfy compute key mint`. Not needed, since Iva already has a 0G-capped key. It also needs an interactive
   terminal plus `secret-tool`.
8. comfy's **hire board is closed** (`task_board_closed`, rechecked 20:52), so nobody can hire agents on comfy yet.
   Don't buy our own token: the 98% opening fee would look like self-funding, which the track rejects.

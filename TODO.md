# TODO

## Next: Iva website on Next.js + Vercel (replaces the GitHub Pages pay page)

**Why:** more control over the payment flow than static GitHub Pages: no Jekyll build failures, our own
domain and headers, server-side helpers. It also gives Iva a real landing page.

**Plan**
- [ ] New Next.js app (App Router, TypeScript) in `web/` inside this same repo.
- [ ] `/` landing page:
  - what Iva does
  - how she pays for her own brain (the money-loop diagram)
  - **live stats**, read from the chain only with no private keys: Iva's wallet balance, her 0G compute vault balance (`balanceOf`), and recent payments and deposits (0G explorer API)
  - links to the Telegram bot and the repo
- [ ] `/pay` page (port of `docs/pay.html`):
  - wallet connect on 0G mainnet (chain 16661)
  - explicit legacy gas (≥ 4.1 gwei, 21000 gas)
  - wait for the receipt
  - deep link back to `t.me/IvaGroceryAgentbot?start=<txhash>`
- [ ] `/receipts` page (optional): the public money-in / deposit / 0G request trail, for judges.
- [ ] Deploy with the **Vercel CLI**. Connect the **same GitHub repo** (`nikhil-pn/iva-grocery-agent`) with root
      directory `web/`, so pushes to `main` auto-deploy.
- [ ] Point the bot at the new pay URL (`PAY_PAGE_URL`), restart the service, then test one real payment end to end.
- [ ] Keep `docs/` (GitHub Pages) as a fallback until the Vercel pay page is verified with a real payment.

## Done tonight
- ✅ Next.js site on Vercel (landing, live stats, pay page, proof, Arkiv live deals)
- ✅ /watch daily re-check (the come-back-tomorrow reason)
- ✅ Arkiv live deal feed (expiring entities + /deals)

## Later
- comfy: register Iva and launch her token with the compute share on (a second income stream into the same compute account).

# Judging prep: pitches + Q&A

Read this before judging. It's also on the website: https://iva-grocery-agent.vercel.app/how-it-works
Each pitch is about 3 minutes at a relaxed pace. Say it in your own words; the 👉 lines are what to show on screen.

## Iva in plain words
1. Iva is a Telegram bot. You send her a grocery list.
2. She checks Blinkit, Instamart and Zepto at your address and tells you the cheapest basket, with a link to each product. She can also order it on Zepto after you say YES.
3. Each hunt costs 0.2 0G, paid into Iva's own wallet. She moves that money into her own 0G compute account by herself and uses it to pay for her AI. Nobody tops her up.
4. Every price she finds is pinned on Arkiv, a public board where each note deletes itself after 6 hours. /deals reads that board for free.

## Pitch 1: to 0G (Agents That Pay for Themselves + 0G Private Computer)
- **0:00** Most AI agents die the day their owner stops paying the API bill. We built one that pays her own. Meet Iva.
  _👉 show: The website hero._
- **0:15** Iva is a grocery agent on Telegram. In India we buy groceries from three 10-minute apps: Blinkit, Instamart and Zepto. The same eggs cost different prices on each, and nobody checks all three. You send Iva a list, and she checks all three at your address and gives you the cheapest basket. On a real 3-item list in Mumbai she saved ₹75.
  _👉 show: Send “12 eggs, 1 kg onion, 1 litre milk” to @IvaGroceryAgentbot. Show the result._
- **0:45** The AI is the product. 0G models read the list (text, a photo of a note, or a voice note) and decide that “Fresh White Eggs 12 pcs” on Zepto is the same thing as “2 × 6 eggs” on Instamart. Her best brain is glm-5.3 sealed inside a TEE on 0G Private Computer, so your list and location stay private. Every reply shows the 0G request IDs and what they cost.
  _👉 show: Point at the request IDs and “sealed TEE” in the reply._
- **1:15** Now the money loop. Each hunt costs 0.2 0G, paid into Iva's own wallet. She checks the payment on-chain herself, then signs depositFor on the 0G Payment Layer to top up her own compute account. On mainnet a customer paid 4.8 0G, and 7 seconds later Iva deposited 1.6 0G into her own compute. No human in the loop. A hunt costs her about 0.02 0G, so she earns roughly ten times what she spends.
  _👉 show: The two chainscan txs (website → Proof, or the video)._
- **1:50** She's budget-aware. Before every job she reads her own balance and picks the best brain she can afford: rich is glm-5.3 in a TEE, lean is a model 50× cheaper, and survival is no AI at all, but she still answers. Her API key has a spend cap of 2 0G a day, enforced by 0G itself. When money runs low she degrades, she doesn't crash.
  _👉 show: Tap 🧠 Iva's brain in the bot: wallet, compute balance, tier, today's spend vs cap._
- **2:20** People come back: /watch re-checks your list every morning, and each check is a paid hunt that keeps funding her brain. And she can do the whole job. Say “order” and she fills your Zepto cart through Zepto's official MCP, shows Zepto's bill, and orders only after you say YES. We tested it with a real order.
  _👉 show: /watch, then the order section on the website._
- **2:45** Without 0G, Iva can't understand your list, can't match products, and can't pay for her own thinking. She'd be a dumb keyword script. With 0G she's an agent that keeps itself alive. Try @IvaGroceryAgentbot: your first hunt is free.

## Pitch 2: to Arkiv (Build on Arkiv)
- **0:00** A grocery deal is only true for a few hours. In our own price tracking, a 15% discount on these apps lasted about 5 hours. So Iva's deal data should die too, and that's why we built it on Arkiv.
- **0:20** Iva is a Telegram grocery agent. You send a list, and she finds the cheapest basket across Blinkit, Instamart and Zepto in your city.
  _👉 show: The website hero, or a hunt in the bot._
- **0:35** The simple way to think of Arkiv: a public notice board where every note deletes itself on a timer. After every hunt, Iva pins one note per item per shop: item, shop, price, price per kg, city, a 5 km area, and the product link. Each note is signed by Iva's own wallet and set to expire in 6 hours. One hunt goes out as one transaction of up to 12 notes, after the user already has their answer, so it never slows them down.
  _👉 show: The Arkiv explorer: the tx with 9 operations, then one entity and its attributes._
- **1:15** Users see it. /deals in the bot and the deals board on our website both read straight from Arkiv: the cheapest live prices near you, from hunts other people already paid for. It's free, and it's never stale, because old prices delete themselves. We run no database, no server and no cleanup job.
  _👉 show: /deals eggs in the bot, then the website's “fresh deals” section with the countdowns._
- **1:45** Every Arkiv feature changes something users see. Expiry gives the “expires in” countdown and no stale prices. The owner filter means only deals Iva signed show up, so nobody can inject fake prices. Indexed attributes give “cheapest eggs in Mumbai” as one query. And because reads need no key, any other app or agent can use the same feed. A meal planner could price tonight's recipe without scraping three shops.
- **2:20** We kept personal things off Arkiv on purpose: who asked, exact locations, payments and logins. Only public prices go on. All five Arkiv docs are in the repo, including a friction log of nine real problems we hit, like an agent that can't fund its own writer and expiry counted in blocks instead of hours.
- **2:45** Arkiv isn't a log in our app. It is the /deals feature. Try /deals in @IvaGroceryAgentbot, or run one command from our README and query it yourself.

## Questions 0G judges will likely ask
**1. Who actually pays? Isn't this just your team sending money?**
Anyone can pay. The pay page and the bot accept 0.2 0G per hunt from any wallet. Two different wallets have paid so far, and Iva self-deposited both within about 10 s. The first hunt is free and Iva funds it herself, which is how new users try her.

**2. Show me the full loop: money in, credit in compute, inference paid.**
Customer → Iva 4.8 0G (0xdba49f…), then 7 s later Iva → depositFor 1.6 0G (0xce31fb…), then billed calls with request IDs listed in every reply and in receipts.json. /brain shows the balances live.

**3. How does she know a payment is real?**
She reads the transaction receipt from 0G mainnet herself: it must be sent to her wallet, it must have succeeded, and its hash must never have been claimed before. Then she credits the hunts.

**4. What stops someone draining her?**
Three layers. 0G enforces a 2 0G/day credit limit on her API key. Iva has her own daily cap. And she's tool-less: she can only hunt prices, with no shell and no files. One free hunt per user, and every payment is checked on-chain.

**5. What happens when she runs out of money?**
She degrades: rich (glm-5.3, sealed TEE) → lean (about 50× cheaper model) → survival (no AI, plain keyword matching). She still answers and tells users why. A paid hunt refills her.

**6. Is the AI really doing something, or is it a wrapper?**
It's the core. It reads photos and voice notes, and matches “Amul Salted Butter 500 g” to butter but not to “Amul Butter Cookies”. Survival mode shows what happens without it: wrong matches.

**7. Why a TEE / Private Computer?**
Shopping lists and locations are personal. Her best brain, glm-5.3, runs sealed in an Intel TDX TEE provider, so the model host can't read them.

**8. What are the economics?**
She earns 0.2 0G a hunt and spends about 0.02–0.03 0G thinking, so roughly 7–10× margin. When her compute is full, surplus above 3 0G goes to her creator as a dividend.

**9. Why didn't you use comfy?**
We tried. Registration returned 503/429 all night and comfy's hire board is closed. The track allows “charging for a service”, which is what Iva does.

**10. Does she hire or pay other agents?**
Not yet, honestly. The first step is there: her Arkiv deal feed lets other agents use her work for free. Paying other agents for data is next.

**11. Why would someone come back tomorrow?**
/watch: she re-checks your saved list every morning at 08:30 and tells you if it got cheaper. /deals is free. And she saves real money every time.

**12. Is it mainnet? Is it running right now?**
Yes. 0G mainnet (chain 16661), running 24/7 as a service. Her treasury loop checks every 30 seconds. Try it live.

**13. Did you do the iAI bonus?**
No, we focused on the self-paying loop and the consumer app.

## Questions Arkiv judges will likely ask
**1. Why Arkiv and not Postgres or Redis with a TTL?**
A database only we can read is a private chat. On Arkiv the feed is public: anyone can query it with no key, and deals expire natively. Ownership proves which deals Iva wrote. And there's no server for us to run or pay for.

**2. What did you keep off Arkiv, and why?**
Who asked (Telegram IDs), exact locations (only city plus a ~5 km area go on), payments (those live on 0G mainnet), receipts, and Zepto logins. Personal or permanent things stay off; temporary public prices go on.

**3. Why 6 hours?**
Our own earlier price tracking showed a 15%+ discount on these apps lasts about 5 hours (median). 6 hours keeps a deal while it's likely still true.

**4. How do you stop fake deals?**
Every read filters on $owner = Iva's wallet, so only deals Iva signed are shown. Others can publish the same schema under their own wallets, and readers choose whom to trust.

**5. What does one entity look like?**
Schema iva.deal.v1: item, shop, price, MRP, pack, unit, price per unit, best, city, cell, huntAt, product URL, and matched-by. City, item, shop, price per unit, best, cell and huntAt are indexed.

**6. Show me a query.**
city = mumbai AND item = egg AND $owner = Iva, ORDER BY unitPriceRs. Run `node scripts/arkiv-query.mjs eggs` from the repo: no key needed.

**7. Does writing to Arkiv slow the user down?**
No. The answer goes to the user first. Then the deals publish in the background in one batched tx (up to 12 per tx), through a queue so two hunts never clash. If Arkiv fails, the user never notices.

**8. Who will use this feed?**
Today: Iva's users through /deals and the website. Next: other agents (a meal planner pricing a recipe), a “deals near you” map, and researchers comparing neighbourhoods.

**9. What friction did you hit?**
Nine items in friction.md. The biggest: an agent can't fund its own writer, an unfunded wallet gives a misleading error, strings are capped at 128 bytes, and expiry is in blocks while users think in hours.

**10. What does it cost?**
On testnet a 9-deal publish cost 0.00169 tGLM in gas. It's one tx per hunt.

**11. Will you keep building after Mumbai?**
[Your call. Answer honestly.] The bot and the feed keep running today.

**12. Did you use Swarm?**
No. Our data is small structured records, not files.

## Live demo checklist
1. Before judging: send the bot one list so the deals board is fresh (deals expire after 6 h).
2. Phone: @IvaGroceryAgentbot open. Laptop: the website open on /#deals and /how-it-works.
3. Live: send “12 eggs, 1 kg onion, 1 litre milk” → the result with request IDs and “sealed TEE”.
4. Tap 🧠 Iva's brain: wallet, compute balance, tier, spend vs cap.
5. /deals eggs → the same deals the website shows, read from Arkiv.
6. If the Wi-Fi dies: play the demo video (YouTube link on the site).

## Why we should win (one line each)
- **0G Agents That Pay:** the full loop is live on mainnet, with tx hashes (customer pays → Iva's own depositFor 7 s later → billed calls with request IDs), a 0G-enforced cap and three-tier graceful degradation.
- **0G Private Computer:** a real consumer app where the AI *is* the product (matching products across shops), sealed in a TEE, with a daily reason to return (/watch).
- **Arkiv:** expiry fits the data (deals die in hours), ownership stops spoofing, /deals is a user-visible read, and all five docs are answered with links and numbers.

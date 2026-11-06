import { Suspense } from "react";
import Image from "next/image";
import hero from "@/public/img/hero.jpg";
import LiveDeals, { LiveDealsSkeleton } from "./components/LiveDeals";
import LiveStats, { LiveStatsSkeleton } from "./components/LiveStats";
import Loop from "./components/Loop";
import PayIva from "./components/PayIva";
import CopyButton from "./components/CopyButton";
import receipts from "@/public/receipts.json";
import { ArkivSticker, PriceLabel, ZeptoSticker, ZeroGSticker } from "./components/Stickers";
import {
  ARKIV,
  BOT_URL,
  BOT_USERNAME,
  CHAIN,
  COMPUTE_ACCOUNT,
  DAILY_CAP_0G,
  HUNT_FEE_0G,
  IVA_WALLET,
  LINKS,
  PAYMENT_LAYER,
  PROOF,
  REPO_URL,
  SAMPLE_HUNT,
  TIERS,
  addrUrl,
  short,
  txUrl,
} from "@/lib/iva";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

function Title({ i, rest }: { i: string; rest: React.ReactNode }) {
  return (
    <h2 className="display text-[3rem] text-lime md:text-[4.5rem]">
      <span className="serif-i">{i}</span> {rest}
    </h2>
  );
}

function Section({
  id,
  i,
  rest,
  lead,
  children,
  className = "",
}: {
  id: string;
  i: string;
  rest: React.ReactNode;
  lead?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-5 py-20 md:py-28 ${className}`}>
      <Title i={i} rest={rest} />
      {lead && <p className="mt-5 max-w-xl text-lg text-pretty text-muted">{lead}</p>}
      <div className="mt-12">{children}</div>
    </section>
  );
}

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-30">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/brand/iva-mark-96.png" alt="" className="size-9 rounded-xl" />
          <span className="serif-i text-3xl text-lime">iva</span>
        </a>
        <nav className="flex items-center gap-1 rounded-full bg-bg/70 p-1 text-sm backdrop-blur-md">
          {[
            ["#loop", "Loop"],
            ["#deals", "Deals"],
            ["#stack", "Stack"],
            ["#pay", "Pay"],
          ].map(([h, l]) => (
            <a key={h} href={h} className="hidden rounded-full px-3 py-1.5 text-fg/80 hover:text-fg sm:block">
              {l}
            </a>
          ))}
          <a href={BOT_URL} {...ext} className="tap rounded-full bg-lime px-4 py-1.5 font-semibold text-ink">
            Try Iva
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative">
      <div className="mx-auto grid max-w-6xl md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:items-end md:gap-12 md:px-5 md:pt-20">
        {/* The poster: fixed 4:5 box so the stickers stay on the bottle and the basket. */}
        <div className="@container relative aspect-[4/5] w-full overflow-hidden md:rounded-[1.75rem]">
          <Image
            src={hero}
            alt="A hand carrying a green grocery basket with strawberries and a green juice"
            priority
            placeholder="blur"
            sizes="(min-width: 768px) 560px, 100vw"
            className="absolute inset-0 size-full object-cover"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-bg/85 via-bg/30 to-transparent" />

          <ZeroGSticker
            label=""
            className="float-y absolute left-[44%] top-[44%] text-[4.6cqw] [--r:38deg]"
          />
          <ArkivSticker className="float-y absolute left-[63%] top-[57%] text-[3.4cqw] [--r:-7deg] [animation-delay:1.5s]" />
          <PriceLabel
            name="cheapest · zepto"
            price={`₹${SAMPLE_HUNT.best.total}`}
            className="absolute left-[8%] top-[22%] rotate-[-8deg] text-[3.4cqw]"
          />
          <ZeptoSticker className="absolute right-[5%] top-[9%] rotate-[7deg] text-[3cqw]" />

          <div className="absolute bottom-[5%] right-[5%] text-right">
            <h1 className="display text-[15cqw] text-lime">
              <span className="serif-i">your</span> basket
              <br />
              sorted.
            </h1>
            <p className="mt-[2.5cqw] text-[3.3cqw] leading-snug text-fg">
              One list. Three shops.
              <br />
              Zero second thoughts.
            </p>
          </div>
        </div>

        <div className="px-5 pb-6 pt-10 md:px-0 md:pb-10 md:pt-0">
          <p className="text-xl leading-relaxed text-pretty md:text-2xl">
            Send Iva your grocery list. She checks <b>Blinkit, Instamart and Zepto</b> and hands back the cheapest basket.
          </p>
          <p className="mt-4 text-pretty text-muted">
            Then she does what agents usually can&apos;t: she <span className="text-fg">pays for her own brain</span>{" "}
            on 0G out of the fees she earns, posts every deal to Arkiv, and can order it for you on Zepto.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={BOT_URL} {...ext} className="tap flex items-center gap-2.5 rounded-full bg-lime py-2 pl-2 pr-6 font-semibold text-ink">
              <img src="/brand/iva-mark-96.png" alt="" className="size-9 rounded-full" />
              Open @{BOT_USERNAME}
            </a>
            <a href="#pay" className="tap rounded-full border border-fg/25 px-6 py-3.5 font-semibold">
              Pay {HUNT_FEE_0G} 0G
            </a>
          </div>
          <dl className="mt-10 grid grid-cols-3 border-t border-line pt-6">
            {[
              [`₹${SAMPLE_HUNT.saving}`, "saved on 3 items"],
              [`${HUNT_FEE_0G} 0G`, "per hunt"],
              ["~10 s", "pay → self-deposit"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="text-3xl font-medium tracking-tight tabular-nums">{v}</dd>
                <dd className="mt-1 text-xs text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Receipt() {
  const h = SAMPLE_HUNT;
  const lines = [
    ["12 eggs", "Zepto"],
    ["1 kg onion", "Zepto"],
    ["1 L milk", "Zepto"],
  ];
  return (
    <figure className="receipt mx-auto w-full max-w-sm rotate-[1.5deg] rounded-t-xl p-6 font-mono text-[13px] shadow-2xl">
      <p className="text-center font-sans text-2xl">
        <span className="serif-i">iva</span>
      </p>
      <p className="text-center text-[11px] uppercase tracking-widest text-ink/60">Mumbai · 6 Nov 2026</p>
      <div className="my-4 border-t border-dashed border-ink/30" />
      {lines.map(([a, b]) => (
        <p key={a} className="flex justify-between">
          <span>{a}</span>
          <span className="text-ink/60">{b}</span>
        </p>
      ))}
      <div className="my-4 border-t border-dashed border-ink/30" />
      <p className="flex justify-between">
        <span>Instamart</span>
        <span className="line-through decoration-ink/50">₹{h.worst.total}</span>
      </p>
      <p className="flex justify-between text-base font-bold">
        <span>Zepto</span>
        <span>₹{h.best.total}</span>
      </p>
      <p className="mt-2 flex justify-between rounded bg-lime px-2 py-1 font-bold">
        <span>YOU SAVE</span>
        <span>₹{h.saving}</span>
      </p>
      <div className="my-4 border-t border-dashed border-ink/30" />
      <p className="text-[11px] uppercase tracking-wide text-ink/60">Paid by Iva&apos;s own 0G compute</p>
      <p className="flex justify-between">
        <span>
          {h.calls.length} × glm-5.3 · sealed TEE
        </span>
        <span>{h.cost0G} 0G</span>
      </p>
      {h.calls.map((c) => (
        <p key={c.requestId} className="truncate text-[10.5px] text-ink/55">
          {c.requestId}
        </p>
      ))}
      <p aria-hidden className="mt-4 overflow-hidden whitespace-nowrap text-center text-3xl leading-none tracking-[-0.12em] text-ink/80">
        ||| || ||| | |||| || |||
      </p>
      <figcaption className="mt-1 text-center text-[10.5px] text-ink/55">a real hunt · thank you for shopping</figcaption>
    </figure>
  );
}

function How() {
  const steps = [
    ["Send a list", "Type it, snap a photo of a note, or send a voice note on Telegram."],
    ["She checks three shops", "“12 eggs” is “2 × 6 pcs” on another app. Iva matches the same product across apps and does the pack math."],
    ["Get the cheapest basket", "The cheapest app, the ₹ saved, a link to each product. Or say “order”."],
  ];
  return (
    <Section id="how" i="one" rest="list, three shops.">
      <div className="grid grid-cols-1 [&>*]:min-w-0 gap-14 md:grid-cols-2 md:items-center">
        <ol className="space-y-8">
          {steps.map(([t, d], n) => (
            <li key={t} className="flex gap-5">
              <span className="serif-i text-5xl leading-none text-lime">{n + 1}</span>
              <div>
                <p className="text-xl font-semibold">{t}</p>
                <p className="mt-1 text-muted">{d}</p>
              </div>
            </li>
          ))}
          <li className="flex flex-wrap gap-2 pl-12 text-sm">
            <code className="rounded-full border border-line px-3 py-1">/watch</code>
            <span className="py-1 text-muted">re-checks your list every morning</span>
          </li>
        </ol>
        <Receipt />
      </div>
    </Section>
  );
}

function Behind() {
  const r = receipts as { summary: Record<string, number> };
  const steps: [string, string, string][] = [
    ["Telegram", "Your list arrives", "Text, a photo of a note, or a voice note."],
    ["0G mainnet", "Iva checks her own money", "Her wallet and her 0G compute balance, then she picks the best brain she can afford."],
    ["0G", "She reads the list", "A 0G model turns it into items and quantities. Photos use vision, voice notes use audio."],
    ["Shops", "Three shops, at your address", "Headless Chrome opens Blinkit, Instamart and Zepto and reads each shop's own search results."],
    ["Iva", "Every product normalised", "Price, MRP, pack size, ₹/kg, ₹/piece, stock and a link, in one shape."],
    ["0G · TEE", "Same product, across shops", "A sealed model picks real matches: butter, not butter cookies. Each call has a request ID."],
    ["Iva", "Pack maths and the basket", "Cheapest single app, cheapest split, and the ₹ you save."],
    ["Arkiv", "Deals published", "The winning prices go to Arkiv in one transaction, each set to expire in 6 h."],
    ["Telegram · Zepto", "Answer, then order", "The basket with links. Say “order” and Zepto's official MCP takes over, behind your YES."],
  ];
  return (
    <Section
      id="behind"
      i="behind"
      rest="one hunt."
      lead="About 30 seconds from list to basket. This is everything that happens in between, and every step is real."
    >
      <ol className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {steps.map(([sys, t, d], n) => (
          <li key={t} className="bg-bg p-6">
            <p className="flex items-center justify-between">
              <span className="serif-i text-3xl leading-none text-lime">{n + 1}</span>
              <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-muted">{sys}</span>
            </p>
            <p className="mt-4 font-semibold">{t}</p>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 rounded-3xl bg-basket p-6 md:flex md:items-center md:justify-between md:gap-8">
        <p className="max-w-md text-fg/80">
          <span className="font-semibold text-fg">And always, in the background:</span> every 30 s her treasury loop
          watches her wallet, verifies new payments onchain and tops up her 0G compute with depositFor().
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 md:mt-0 md:grid-cols-4">
          {[
            [String(r.summary.inferences), "paid 0G calls"],
            [String(r.summary.sealedInferences), "sealed in a TEE"],
            [`${r.summary.income0G} 0G`, "earned"],
            [`${Number(r.summary.deposited0G).toFixed(2)} 0G`, "self-deposited"],
          ].map(([v, l]) => (
            <div key={l}>
              <dd className="text-3xl font-medium tracking-tight tabular-nums text-lime">{v}</dd>
              <dt className="text-xs text-fg/60">{l}</dt>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

function LoopSection() {
  return (
    <section id="loop" className="bg-basket">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
        <Title i="her" rest="brain pays for itself." />
        <p className="mt-5 max-w-xl text-lg text-pretty text-fg/75">
          Most agents die when their owner stops paying the API bill. Iva earns {HUNT_FEE_0G} 0G a hunt, spends about
          0.02 0G thinking, and tops up her own compute. No human tops her up.
        </p>
        <div className="mt-14">
          <Loop />
        </div>
        <div className="mt-14 grid gap-3 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-white/10 p-5">
              <p className="serif-i text-3xl text-lime">{t.name}</p>
              <p className="text-xs text-fg/60">{t.when}</p>
              <p className="mt-2 text-sm text-fg/75">{t.brain}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-fg/60">
          She reads her own balance before every job and picks the best brain she can afford. Spend cap {DAILY_CAP_0G}{" "}
          0G a day, enforced by 0G on her API key. She degrades, she doesn&apos;t crash.
        </p>
      </div>
    </section>
  );
}

function DealsSection() {
  return (
    <Section
      id="deals"
      i="fresh"
      rest="deals, live on Arkiv."
      lead={
        <>
          Every hunt publishes its winning prices to Arkiv. A grocery deal lasts hours, so each one expires on its own
          after {ARKIV.dealHours} h. Anyone can read the feed. Ask the bot for <code className="text-fg">/deals</code>.
        </>
      }
    >
      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3 [&>*]:min-w-0">
        <div className="card p-6">
          <span className="serif-i text-3xl text-lime">1</span>
          <p className="mt-3 font-semibold">A hunt finds a price</p>
          <p className="mt-1 text-sm text-muted">Say Zepto has 12 eggs for ₹106 in Mumbai, cheaper than Instamart and Blinkit.</p>
        </div>
        <div className="card p-6">
          <span className="serif-i text-3xl text-lime">2</span>
          <p className="mt-3 font-semibold">Iva writes it to Arkiv</p>
          <div className="mt-3 rounded-xl bg-ink p-3 font-mono text-[11.5px] leading-5 text-fg/80">
            <p>
              <span className="text-lime">item</span> egg · <span className="text-lime">shop</span> zepto
            </p>
            <p>
              <span className="text-lime">price</span> 106 · <span className="text-lime">city</span> mumbai
            </p>
            <p>
              <span className="text-lime">owner</span> {short(IVA_WALLET)}
            </p>
            <p>
              <span className="text-lime">expires</span> in {ARKIV.dealHours} h
            </p>
          </div>
        </div>
        <div className="card p-6">
          <span className="serif-i text-3xl text-lime">3</span>
          <p className="mt-3 font-semibold">Anyone reads it, then it&apos;s gone</p>
          <p className="mt-1 text-sm text-muted">
            The bot&apos;s /deals and this page query it by city. After {ARKIV.dealHours} h Arkiv deletes it by itself, so
            you never see a stale price. No database, no cleanup job.
          </p>
        </div>
      </div>
      <Suspense fallback={<LiveDealsSkeleton />}>
        <LiveDeals />
      </Suspense>
    </Section>
  );
}

function Order() {
  const chat: [string, string][] = [
    ["you", "order"],
    ["iva", "Filled your Zepto cart. 0G picked the products. Zepto's bill: 3 items · ₹242 · to Jio World Centre. Reply YES to order."],
    ["you", "YES"],
    ["iva", "Ordered ✓ Pay with Zepto's secure link. /track for status."],
  ];
  return (
    <Section
      id="order"
      i="say"
      rest="“order”."
      lead="After a hunt, Iva can buy the basket for you through Zepto's official MCP server. Zepto's own bill first, and nothing is ordered without your YES."
    >
      <div className="grid grid-cols-1 [&>*]:min-w-0 gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-3">
          {chat.map(([who, text], n) => (
            <p
              key={n}
              className={`w-fit max-w-[85%] rounded-3xl px-5 py-3 ${who === "you" ? "ml-auto rounded-br-md bg-lime font-semibold text-ink" : "rounded-bl-md bg-raised"}`}
            >
              {text}
            </p>
          ))}
        </div>
        <ul className="space-y-4 text-muted">
          <li>
            <span className="text-fg">Real, not a mock.</span> Tested end to end on 7 Nov with a real ₹242 Zepto order,
            placed by Iva and paid through Zepto&apos;s link.
          </li>
          <li>
            <span className="text-fg">Safe by design.</span> Log in with Zepto (OAuth), bill preview, an explicit YES
            for every order, never a retry on an order call.
          </li>
          <li>
            <span className="text-fg">Private beta.</span> One connected account today. Next: a Connect Zepto button for
            everyone.
          </li>
          <li className="pt-2">
            <ZeptoSticker className="rotate-[-3deg] text-sm" label="zepto mcp · beta" />
          </li>
        </ul>
      </div>
    </Section>
  );
}

function Stack() {
  const tracks: { sticker: React.ReactNode; track: string; did: string; proof: { label: string; href: string }[] }[] = [
    {
      sticker: <ZeroGSticker label="compute" className="rotate-[-4deg] text-base" />,
      track: "Agents That Pay for Themselves",
      did: `Customers pay Iva's wallet. She verifies the tx onchain, then signs depositFor() on the 0G Payment Layer to fund her own inference. Live on 0G mainnet.`,
      proof: [
        { label: "customer pays", href: txUrl(PROOF[0].tx!) },
        { label: "Iva self-deposits", href: txUrl(PROOF[1].tx!) },
        { label: "her wallet", href: addrUrl(IVA_WALLET) },
      ],
    },
    {
      sticker: <ZeroGSticker label="private computer" className="rotate-[3deg] text-base" />,
      track: "Build with 0G Private Computer",
      did: "Rich-tier hunts run glm-5.3 sealed end to end into an Intel TDX TEE provider. Your list never sits in plain text at a model host.",
      proof: [{ label: "request 15a5ecb3…", href: "#proof" }],
    },
    {
      sticker: <ArkivSticker label="arkiv" className="rotate-[-2deg] text-base" />,
      track: "Build on Arkiv",
      did: "Deals are Arkiv entities (iva.deal.v1) with a 6 h TTL, indexed by city, item, shop and price. Stale prices vanish with no cleanup job and no database.",
      proof: [
        { label: "first publish tx", href: `${ARKIV.explorer}/tx/${ARKIV.proofTx}` },
        { label: "all of Iva's deals", href: `${ARKIV.explorer}/address/${IVA_WALLET}` },
      ],
    },
  ];
  return (
    <Section id="stack" i="the" rest="stack.">
      <div className="grid gap-4 md:grid-cols-3">
        {tracks.map((t) => (
          <div key={t.track} className="card flex flex-col p-6">
            <div className="h-12">{t.sticker}</div>
            <p className="mt-6 text-xl font-semibold">{t.track}</p>
            <p className="mt-2 flex-1 text-sm text-muted">{t.did}</p>
            <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {t.proof.map((p) => (
                <a key={p.label} href={p.href} {...(p.href.startsWith("#") ? {} : ext)} className="text-lime underline-offset-4 hover:underline">
                  {p.label} ↗
                </a>
              ))}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <p className="text-sm uppercase tracking-widest text-muted">
          Iva&apos;s books, live from 0G mainnet · compute account{" "}
          <a href={addrUrl(COMPUTE_ACCOUNT)} {...ext} className="font-mono normal-case text-fg underline-offset-2 hover:underline">
            {short(COMPUTE_ACCOUNT)}
          </a>
        </p>
        <div className="mt-4">
          <Suspense fallback={<LiveStatsSkeleton />}>
            <LiveStats />
          </Suspense>
        </div>
      </div>
    </Section>
  );
}

function Start() {
  const cmds = [
    "git clone https://github.com/nikhil-pn/iva-grocery-agent",
    "cd iva-grocery-agent && npm install",
    "cp .env.example .env   # bot token, fresh wallet, 0G keys",
    "npm start              # bot + treasury loop",
  ];
  return (
    <Section id="start" i="get" rest="started.">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 [&>*]:min-w-0">
        <ol className="space-y-6">
          {[
            ["Open the bot", <>Message <a href={BOT_URL} {...ext} className="text-lime underline-offset-4 hover:underline">@{BOT_USERNAME}</a>. Your first hunt is free.</>],
            ["Send a list", <>“12 eggs, 1 kg onion, 1 litre milk”. Mumbai by default, <code>/city pune</code> or share a location.</>],
            ["Top up", <>{HUNT_FEE_0G} 0G a hunt, on this page or from any wallet. Paste the tx hash in the chat.</>],
          ].map(([t, d], n) => (
            <li key={n} className="flex gap-5">
              <span className="serif-i text-4xl leading-none text-lime">{n + 1}</span>
              <div>
                <p className="text-lg font-semibold">{t}</p>
                <p className="mt-1 text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div>
          <p className="text-sm text-muted">Run your own Iva (Node 22+, Chrome, ffmpeg)</p>
          <div className="mt-3 overflow-x-auto rounded-2xl bg-ink p-5 font-mono text-[13px] leading-7">
            {cmds.map((c) => (
              <p key={c} className="whitespace-pre">
                <span className="text-lime">$ </span>
                {c}
              </p>
            ))}
          </div>
          <a href={REPO_URL} {...ext} className="mt-4 inline-block text-lime underline-offset-4 hover:underline">
            README on GitHub ↗
          </a>
        </div>
      </div>
    </Section>
  );
}

function Proof() {
  return (
    <section id="proof" className="mx-auto w-full max-w-6xl px-5 pb-20">
      <details className="card group">
        <summary className="tap flex cursor-pointer items-center justify-between gap-4 px-6 py-5">
          <span className="text-lg font-semibold">Onchain receipts: every step of the live run</span>
          <span className="chev text-2xl leading-none text-lime transition-transform" aria-hidden>
            +
          </span>
        </summary>
        <ol className="divide-y divide-line border-t border-line">
          {PROOF.map((p) => (
            <li key={p.step} className="px-6 py-4">
              <p className="text-sm">{p.step}</p>
              {p.tx && (
                <a href={txUrl(p.tx)} {...ext} className="mt-1 inline-block font-mono text-xs text-lime underline-offset-2 hover:underline">
                  {short(p.tx, 12, 8)} ↗
                </a>
              )}
              {p.requests?.map((id) => (
                <p key={id} className="mt-1 break-all font-mono text-xs text-muted">
                  request {id}
                </p>
              ))}
              {p.links?.map((l) => (
                <a key={l.href} href={l.href} {...ext} className="mr-3 mt-1 inline-block font-mono text-xs text-lime underline-offset-2 hover:underline">
                  {l.label} ↗
                </a>
              ))}
              {p.note && <p className="mt-1 text-xs text-muted">{p.note}</p>}
            </li>
          ))}
        </ol>
        <p className="border-t border-line px-6 py-4 text-xs text-muted">
          Full receipt log (no user data): <a href="/receipts.json" className="text-lime underline">receipts.json</a>
        </p>
      </details>
    </section>
  );
}

function Footer() {
  const links: [string, string][] = [
    ["GitHub", REPO_URL],
    [`@${BOT_USERNAME}`, BOT_URL],
    ["0G", LINKS.zeroG],
    ["Arkiv", LINKS.arkiv],
    ["Iva's wallet", addrUrl(IVA_WALLET)],
    ["0G Payment Layer", addrUrl(PAYMENT_LAYER)],
  ];
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 pb-[max(3.5rem,env(safe-area-inset-bottom))] md:flex-row md:items-end md:justify-between">
        <div>
          <p className="display text-6xl text-lime">
            <span className="serif-i">iva</span> earns.
            <br />
            iva pays.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <ZeroGSticker label="" className="rotate-[-6deg] text-sm" />
            <ArkivSticker className="rotate-[4deg] text-sm" />
          </div>
        </div>
        <div className="md:text-right">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm md:justify-end">
            {links.map(([l, h]) => (
              <li key={l}>
                <a href={h} {...ext} className="text-muted underline-offset-4 hover:text-fg hover:underline">
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">MIT licensed · 0G mainnet (chain {CHAIN.id}) · Arkiv {ARKIV.network}</p>
          <div className="mt-3 flex items-center gap-2 md:justify-end">
            <code className="font-mono text-xs text-muted">{short(IVA_WALLET, 10, 6)}</code>
            <CopyButton text={IVA_WALLET} />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <How />
        <Behind />
        <LoopSection />
        <DealsSection />
        <Order />
        <Stack />
        <Section
          id="pay"
          i="pay"
          rest="Iva."
          lead="Pay from your wallet right here, or send 0G from any wallet and paste the tx hash into the bot. Iva verifies it onchain and credits your hunts."
        >
          <PayIva />
        </Section>
        <Start />
        <Proof />
      </main>
      <Footer />
    </>
  );
}

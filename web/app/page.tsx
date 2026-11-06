import { Suspense } from "react";
import LiveStats, { LiveStatsSkeleton } from "./components/LiveStats";
import PayIva from "./components/PayIva";
import CopyButton from "./components/CopyButton";
import receipts from "@/public/receipts.json";
import {
  BOT_URL,
  BOT_USERNAME,
  CHAIN,
  COMFY,
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
  ZG_ROUTER,
  addrUrl,
  short,
  txUrl,
} from "@/lib/iva";

type Receipt = {
  type: string;
  at: string;
  tx?: string;
  amount0G?: number;
  requestId?: string;
  model?: string;
  cost0G?: number;
  tier?: string;
  sealed?: boolean;
};

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

function Section({
  id,
  kicker,
  title,
  lead,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">{kicker}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-balance md:text-3xl">{title}</h2>
      {lead && <p className="mt-3 max-w-2xl text-pretty text-muted">{lead}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function TgIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21.94 4.3a1.2 1.2 0 0 0-1.62-1.3L2.86 9.76c-1.1.44-1.08 2 .03 2.4l4.3 1.53 1.66 5.2c.25.8 1.26 1.04 1.84.43l2.4-2.5 4.43 3.27c.7.52 1.7.13 1.88-.72L21.94 4.3ZM9.4 13.3l8.06-6.1-6.6 7.3-.27 2.73-1.19-3.93Z" />
    </svg>
  );
}

function GhIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden>🧺</span> Iva
        </a>
        <nav className="flex items-center gap-1 text-sm">
          <a href="#live" className="hidden rounded-lg px-3 py-1.5 text-muted hover:text-fg sm:block">
            Live
          </a>
          <a href="#proof" className="hidden rounded-lg px-3 py-1.5 text-muted hover:text-fg sm:block">
            Proof
          </a>
          <a href="#pay" className="tap rounded-lg px-3 py-1.5 text-muted hover:text-fg">
            Pay
          </a>
          <a
            href={BOT_URL}
            {...ext}
            className="tap ml-1 flex items-center gap-1.5 rounded-lg bg-tg px-3 py-1.5 font-semibold text-white"
          >
            <TgIcon className="size-4" /> Try
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[28rem] max-w-3xl rounded-full bg-[radial-gradient(closest-side,rgba(245,165,36,0.18),transparent)] blur-2xl"
      />
      <div className="relative mx-auto max-w-5xl px-5 pb-12 pt-12 md:pb-20 md:pt-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-raised px-3 py-1 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden /> Live on 0G mainnet · ETHGlobal Mumbai
          2026
        </p>
        <h1 className="mt-5 text-[2.15rem] font-extrabold leading-[1.08] tracking-tight text-balance md:text-6xl">
          Iva: the grocery agent that <span className="text-amber-300">pays for her own brain</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-pretty text-muted">
          Most AI agents die the day their owner stops paying the API bill. Iva pays her own, out of the money she
          saves you: she finds the cheapest basket across Blinkit, Swiggy Instamart and Zepto, and spends her fees on
          her own AI on 0G Compute.
        </p>
        <div className="mt-8 grid gap-3 sm:flex">
          <a
            href={BOT_URL}
            {...ext}
            className="tap flex items-center justify-center gap-2 rounded-xl bg-tg px-5 py-3.5 font-bold text-white"
          >
            <TgIcon /> Open in Telegram
          </a>
          <a
            href="#pay"
            className="tap flex items-center justify-center rounded-xl bg-amber-400 px-5 py-3.5 font-bold text-black"
          >
            Pay Iva · {HUNT_FEE_0G} 0G a hunt
          </a>
          <a
            href={REPO_URL}
            {...ext}
            className="tap flex items-center justify-center gap-2 rounded-xl border border-line px-5 py-3.5 font-semibold"
          >
            <GhIcon /> GitHub
          </a>
        </div>
        <dl className="mt-10 grid grid-cols-3 gap-3 text-center md:max-w-xl">
          {[
            ["3", "shops checked"],
            [`${HUNT_FEE_0G} 0G`, "per hunt"],
            ["~10 s", "pay → self-deposit"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-line bg-raised px-2 py-3">
              <dt className="sr-only">{l}</dt>
              <dd className="text-lg font-bold tabular-nums">{v}</dd>
              <dd className="text-[11px] leading-tight text-muted">{l}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function TelegramMock() {
  const h = SAMPLE_HUNT;
  return (
    <div className="card overflow-hidden" role="img" aria-label="A real Iva hunt result in Telegram">
      <div className="flex items-center gap-3 border-b border-line bg-raised px-4 py-3">
        <div className="grid size-9 place-items-center rounded-full bg-amber-400/20 text-lg" aria-hidden>
          🧺
        </div>
        <div>
          <p className="text-sm font-semibold">Iva</p>
          <p className="text-xs text-muted">bot · @{BOT_USERNAME}</p>
        </div>
      </div>
      <div className="space-y-3 bg-[#0e1621] p-4 text-[13.5px] leading-relaxed">
        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#2b5278] px-3.5 py-2">{h.list}</div>
        <div className="w-fit max-w-[94%] rounded-2xl rounded-bl-md bg-[#182533] px-3.5 py-2.5">
          <p className="text-muted">1. 12 eggs · 2. 1 kg onion · 3. 1 litre milk</p>
          <p className="mt-2">
            🧺 <b>Whole basket:</b> Zepto ₹{h.best.total} · Instamart ₹{h.worst.total}
          </p>
          <p>
            🏆 <b>Cheapest single app: Zepto ₹{h.best.total}</b> — saves{" "}
            <b className="text-emerald-300">₹{h.saving}</b> vs Instamart
          </p>
          <p className="mt-2 text-[12.5px] text-muted">
            🧠 🟢 rich brain · {h.calls.length} calls · {h.cost0G} 0G paid from Iva&apos;s own 0G compute · 🔒 sealed
            TEE
          </p>
          {h.calls.map((c) => (
            <p key={c.requestId} className="font-mono text-[11px] text-sky-300/90 break-all">
              {c.requestId} <span className="text-muted">{c.model}</span>
            </p>
          ))}
        </div>
      </div>
      <p className="border-t border-line px-4 py-2 text-[11px] text-muted">
        A real hunt in Mumbai, 6 Nov 2026. Item lines with product links trimmed.
      </p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    ["📝", "Send a list", "Type it, or send a 📷 photo of a list or a 🎙 voice note. 0G models read it."],
    [
      "🔎",
      "She checks 3 shops",
      "Blinkit, Swiggy Instamart and Zepto, at your location. She matches the same product across apps, even when names and pack sizes differ.",
    ],
    ["🏆", "Cheapest basket", "The cheapest app, the split basket and the ₹ saved, with a link to each exact product."],
  ];
  return (
    <Section
      id="how"
      kicker="How it works"
      title="Your list → three shops → the cheapest basket"
      lead={`"12 eggs" on one app is "2 × 6 pcs" on another. Iva works out what matches and how many packs you need, then adds it up.`}
    >
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <ol className="space-y-3">
          {steps.map(([icon, t, d], i) => (
            <li key={t} className="card flex gap-4 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-raised text-xl" aria-hidden>
                {icon}
              </span>
              <div>
                <p className="font-semibold">
                  <span className="text-muted">{i + 1}. </span>
                  {t}
                </p>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <TelegramMock />
      </div>
    </Section>
  );
}

function LoopNode({ icon, title, sub, accent }: { icon: string; title: string; sub: React.ReactNode; accent: string }) {
  return (
    <div className={`card relative p-4 ${accent}`}>
      <p className="flex items-center gap-2 font-semibold">
        <span aria-hidden>{icon}</span>
        {title}
      </p>
      <p className="mt-1 text-sm text-muted">{sub}</p>
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-6 text-xs text-muted md:flex-col md:justify-center md:p-0 md:text-center">
      <span className="text-lg leading-none text-amber-300 md:rotate-[-90deg]" aria-hidden>
        ↓
      </span>
      <span className="font-mono">{label}</span>
    </div>
  );
}

function MoneyLoop() {
  return (
    <Section
      id="loop"
      kicker="The money loop"
      title="She earns, then pays for her own thinking"
      lead="No human tops her up. Her treasury loop runs every 30 s and on every payment."
    >
      <div className="grid gap-1 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-3">
        <LoopNode
          icon="🙋"
          title="Customer"
          sub={`Pays ${HUNT_FEE_0G} 0G per hunt from any wallet.`}
          accent="border-emerald-400/30"
        />
        <Arrow label={`${HUNT_FEE_0G} 0G`} />
        <LoopNode
          icon="👛"
          title="Iva's wallet"
          sub="She verifies it onchain: to her, succeeded, not used before. Then credits the hunts."
          accent="border-sky-400/30"
        />
        <Arrow label="depositFor()" />
        <LoopNode
          icon="⚡"
          title="Her 0G compute"
          sub={
            <>
              She signs <code className="text-fg">depositFor</code> on the 0G Payment Layer herself.
            </>
          }
          accent="border-amber-400/30"
        />
        <Arrow label="pays for" />
        <LoopNode
          icon="🧠"
          title="0G Router inference"
          sub={
            <>
              Every call to <code className="text-fg">{ZG_ROUTER}</code> returns a <code className="text-fg">request_id</code>{" "}
              and a cost.
            </>
          }
          accent="border-violet-400/30"
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
          ↺ The answer goes back to the customer, with the request IDs she paid for. When her compute is full, surplus
          goes to her creator as a dividend.
        </p>
        <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
          💸 A hunt costs her about 0.02 0G of inference and earns {HUNT_FEE_0G} 0G, so she earns roughly ten times what
          she spends.
        </p>
      </div>
    </Section>
  );
}

function Tiers() {
  return (
    <Section
      id="brain"
      kicker="Budget-aware brain"
      title="She picks the best brain she can afford"
      lead="Before every job Iva reads her own balance (Router /account/funds and the Payment Layer balanceOf) and picks a tier. She degrades; she doesn't crash."
    >
      <div className="grid gap-3 md:grid-cols-3">
        {TIERS.map((t) => (
          <div key={t.name} className="card p-5">
            <p className="text-lg font-bold">
              {t.badge} {t.name}
            </p>
            <p className="mt-1 text-xs font-medium text-amber-200/90">{t.when}</p>
            <p className="mt-3 text-sm text-muted">{t.brain}</p>
          </div>
        ))}
      </div>
      <div className="card mt-3 flex gap-4 p-5">
        <span className="text-2xl" aria-hidden>
          🛑
        </span>
        <div>
          <p className="font-semibold">Spend cap: {DAILY_CAP_0G} 0G a day, enforced by 0G</p>
          <p className="mt-1 text-sm text-muted">
            Iva&apos;s 0G API key is created with a daily <code className="text-fg">credit_limit</code> of{" "}
            {DAILY_CAP_0G}. She also keeps her own daily cap. When either is hit she drops to survival and tells users
            why, instead of crashing.
          </p>
        </div>
      </div>
    </Section>
  );
}

function Proof() {
  const r = receipts as { exportedAt: string; summary: Record<string, number>; events: Receipt[] };
  const inf = r.events.filter((e) => e.type === "inference" && e.requestId).slice(0, 8);
  return (
    <Section
      id="proof"
      kicker="Proof"
      title="The live run on 0G mainnet"
      lead="Every step is a real transaction or a real 0G request ID. Tap a hash to open it on chainscan."
    >
      <ol className="card divide-y divide-line overflow-hidden">
        {PROOF.map((p) => (
          <li key={p.step} className="flex gap-3 p-4">
            <span className="text-lg" aria-hidden>
              {p.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{p.step}</p>
              {p.tx && (
                <a
                  href={txUrl(p.tx)}
                  {...ext}
                  className="mt-1 inline-block font-mono text-xs text-sky-300 underline-offset-2 hover:underline"
                >
                  {short(p.tx, 12, 8)} ↗
                </a>
              )}
              {p.requests?.map((id) => (
                <p key={id} className="mt-1 break-all font-mono text-xs text-muted">
                  request {id}
                </p>
              ))}
              {p.note && <p className="mt-1 text-xs text-muted">{p.note}</p>}
            </div>
          </li>
        ))}
      </ol>

      {inf.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold">Recent 0G requests</h3>
            <p className="text-xs text-muted">
              {r.summary.inferences} calls · {r.summary.sealedInferences} sealed in a TEE ·{" "}
              {Number(r.summary.inferenceCost0G).toFixed(4)} 0G total ·{" "}
              <a href="/receipts.json" className="text-sky-300 underline-offset-2 hover:underline">
                receipts.json
              </a>
            </p>
          </div>
          <ul className="card mt-3 divide-y divide-line overflow-hidden">
            {inf.map((e) => (
              <li key={e.requestId} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs" aria-hidden>
                  {e.tier === "rich" ? "🟢" : e.tier === "lean" ? "🟡" : "🔴"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs">{e.requestId}</p>
                  <p className="text-xs text-muted">
                    {e.model}
                    {e.sealed ? " · 🔒 sealed" : ""}
                  </p>
                </div>
                <p className="text-xs tabular-nums text-muted">{(e.cost0G ?? 0).toFixed(5)} 0G</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Snapshot exported from Iva&apos;s append-only receipt log (no user data). Snapshot time:{" "}
            {new Date(r.exportedAt).toISOString().slice(0, 16).replace("T", " ")} UTC.
          </p>
        </div>
      )}
    </Section>
  );
}

function Comfy() {
  const rows: [string, string, string?][] = [
    ["Agent ID (AgenticID)", COMFY.agentId, COMFY.agentUrl || undefined],
    [`${COMFY.tokenTicker} token`, COMFY.tokenAddress, COMFY.tokenAddress ? addrUrl(COMFY.tokenAddress) : undefined],
    ["Compute share", COMFY.tokenAddress ? "ON: part of every trade's creator fee → her 0G compute" : ""],
  ];
  return (
    <Section
      id="comfy"
      kicker="comfy"
      title="A second income stream: Iva on comfy"
      lead={
        <>
          <a href={LINKS.comfy} {...ext} className="text-fg underline underline-offset-2">
            comfy
          </a>{" "}
          is the token launchpad on 0G mainnet that 0G recommends for agents. We&apos;re registering Iva there tonight.
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="card p-5">
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <b className="text-fg">An onchain identity.</b> <code className="text-fg">comfy agent register</code> mints
              Iva an AgenticID.
            </li>
            <li>
              <b className="text-fg">{COMFY.tokenTicker} with the compute share on.</b> Part of the creator fee from
              every trade lands as 0G credit in her 0G Payment Layer account, the same account her API key spends from.
            </li>
            <li>
              <b className="text-fg">Honest status.</b> comfy&apos;s hire board is closed today (&quot;hire is coming
              soon on comfy&quot;), so people hire Iva directly on Telegram, at {HUNT_FEE_0G} 0G a hunt. A token only adds
              income when other people trade it, so the service fee stays her main income.
            </li>
          </ul>
        </div>
        <dl className="card divide-y divide-line overflow-hidden">
          {rows.map(([k, v, href]) => (
            <div key={k} className="flex items-center justify-between gap-3 px-5 py-4">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="min-w-0 text-right text-sm">
                {v ? (
                  href ? (
                    <a href={href} {...ext} className="break-all font-mono text-xs text-sky-300 underline-offset-2 hover:underline">
                      {v.length > 20 ? short(v, 8, 6) : v}
                    </a>
                  ) : (
                    <span className="break-all font-mono text-xs">{v}</span>
                  )
                ) : (
                  <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
                    coming soon
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

function Faq() {
  const qa: [string, React.ReactNode][] = [
    [
      "Is it safe?",
      <>
        Iva is a <b>tool-less</b> agent: she can only hunt prices. She has no shell, no files and no shop logins, so a
        stranger&apos;s message can&apos;t make her do anything else. <b>She never orders for you</b>: every result links
        to the exact product in the shop app, and you tap buy. Her wallet is a small hot wallet, and her spending is
        capped by 0G on her API key and by Iva herself per day.
      </>,
    ],
    [
      "Which cities?",
      <>
        Mumbai by default. Send <code>/city pune</code> (also Bengaluru, Delhi, Gurugram, Hyderabad, Chennai, Kochi,
        Kolkata and more) or share your location in Telegram and she hunts there.
      </>,
    ],
    [
      "What breaks without 0G?",
      <>
        Iva can no longer understand your list, and she can&apos;t tell that &quot;Amul Salted Butter 500 g&quot; is
        butter but &quot;Amul Butter Cookies&quot; isn&apos;t. Her survival mode shows exactly that. She also loses the way to
        pay for her own thinking, so she stops being an agent and becomes a script.
      </>,
    ],
    [
      "Is this the ETHGlobal Mumbai build?",
      <>
        Yes. Iva was built at ETHGlobal Mumbai 2026 for 0G&apos;s <i>Agents That Pay for Themselves</i> and{" "}
        <i>Build with 0G Private Computer</i> tracks. The code is on{" "}
        <a href={REPO_URL} {...ext} className="underline">
          GitHub
        </a>
        , and the bot you talk to is the one running from it.
      </>,
    ],
    [
      "Is my first hunt free?",
      <>Yes, one free hunt per new user, funded by Iva herself. After that it&apos;s {HUNT_FEE_0G} 0G a hunt.</>,
    ],
  ];
  return (
    <Section id="faq" kicker="FAQ" title="Questions">
      <div className="space-y-2">
        {qa.map(([q, a]) => (
          <details key={q} className="card group p-0">
            <summary className="tap flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-semibold">
              {q}
              <span className="chev text-xl leading-none text-muted transition-transform" aria-hidden>
                +
              </span>
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-muted">{a}</div>
          </details>
        ))}
      </div>
    </Section>
  );
}

function Footer() {
  const links: [string, string][] = [
    ["GitHub repo", REPO_URL],
    [`@${BOT_USERNAME}`, BOT_URL],
    ["0G", LINKS.zeroG],
    ["comfy", LINKS.comfy],
    ["Iva's wallet", addrUrl(IVA_WALLET)],
    ["0G Payment Layer", addrUrl(PAYMENT_LAYER)],
  ];
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-5xl px-5 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <p className="font-bold">🧺 Iva</p>
        <p className="mt-1 text-sm text-muted">Iva earns, Iva pays, Iva keeps working.</p>
        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {links.map(([l, h]) => (
            <li key={l}>
              <a href={h} {...ext} className="text-muted underline-offset-2 hover:text-fg hover:underline">
                {l}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted">
          Built at ETHGlobal Mumbai 2026 · MIT licensed · 0G mainnet (chain {CHAIN.id})
        </p>
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
        <HowItWorks />
        <MoneyLoop />
        <Section
          id="live"
          kicker="Live"
          title="Iva's books, straight from the chain"
          lead={
            <>
              Her wallet, her 0G compute vault (the Payment Layer balance of{" "}
              <a href={addrUrl(COMPUTE_ACCOUNT)} {...ext} className="font-mono text-fg underline underline-offset-2">
                {short(COMPUTE_ACCOUNT)}
              </a>
              ), and the money moving between them.
            </>
          }
        >
          <Suspense fallback={<LiveStatsSkeleton />}>
            <LiveStats />
          </Suspense>
        </Section>
        <Tiers />
        <Section
          id="pay"
          kicker="Pay Iva"
          title={`${HUNT_FEE_0G} 0G a hunt, straight into her wallet`}
          lead="Pay here with an injected wallet (MetaMask and friends), then tap back to Telegram. Iva verifies it onchain and credits your hunts."
        >
          <PayIva />
          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
            <span>Iva&apos;s wallet:</span>
            <code className="min-w-0 truncate font-mono">{IVA_WALLET}</code>
            <CopyButton text={IVA_WALLET} />
          </div>
        </Section>
        <Proof />
        <Comfy />
        <Faq />
      </main>
      <Footer />
    </>
  );
}

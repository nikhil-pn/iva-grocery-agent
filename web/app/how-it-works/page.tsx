import type { Metadata } from "next";
import { Suspense } from "react";
import LiveStats, { LiveStatsSkeleton } from "../components/LiveStats";
import receipts from "@/public/receipts.json";
import { ARKIV, BOT_URL, BOT_USERNAME, DAILY_CAP_0G, DEMO_URL, HUNT_FEE_0G, PROOF, REPO_URL, txUrl } from "@/lib/iva";
import { DEMO_CHECKLIST, PITCH_0G, PITCH_ARKIV, QA_0G, QA_ARKIV, SIMPLE, type Beat, type QA } from "@/lib/pitch";

export const metadata: Metadata = {
  title: "How Iva works · pitch + judge Q&A",
  description: "How Iva works in plain words, live numbers, the two 3-minute pitches (0G and Arkiv) and the questions judges ask.",
};

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

function H({ i, rest, id }: { i: string; rest: string; id?: string }) {
  return (
    <h2 id={id} className="display scroll-mt-20 text-[2.6rem] text-lime md:text-[3.8rem]">
      <span className="serif-i">{i}</span> {rest}
    </h2>
  );
}

function Pitch({ beats }: { beats: Beat[] }) {
  return (
    <ol className="mt-8 space-y-3">
      {beats.map((b) => (
        <li key={b.t} className="card grid gap-3 p-5 md:grid-cols-[4.5rem_1fr]">
          <span className="font-mono text-sm text-lime">{b.t}</span>
          <div>
            <p className="text-lg leading-relaxed">{b.say}</p>
            {b.show && <p className="mt-2 text-sm text-muted">👉 show: {b.show}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Questions({ qa }: { qa: QA[] }) {
  return (
    <div className="mt-8 space-y-2">
      {qa.map(({ q, a }) => (
        <details key={q} className="card group">
          <summary className="tap flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-semibold">
            {q}
            <span className="chev text-2xl leading-none text-lime transition-transform" aria-hidden>
              +
            </span>
          </summary>
          <p className="px-5 pb-5 leading-relaxed text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}

export default function HowItWorks() {
  const r = receipts as { summary: Record<string, number> };
  const nav = [
    ["#simple", "in plain words"],
    ["#numbers", "numbers"],
    ["#pitch-0g", "0G pitch"],
    ["#pitch-arkiv", "Arkiv pitch"],
    ["#qa-0g", "0G Q&A"],
    ["#qa-arkiv", "Arkiv Q&A"],
    ["#demo-checklist", "demo checklist"],
  ];
  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-8">
      <a href="/" className="text-sm text-muted">
        ← back to <span className="serif-i text-lg text-lime">iva</span>
      </a>
      <h1 className="display mt-6 text-[3.4rem] text-lime md:text-[6rem]">
        <span className="serif-i">how</span> iva works.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        For the team and for judges: what Iva does in plain words, live numbers, both 3-minute pitches and the
        questions we expect.
      </p>
      <nav className="mt-6 flex flex-wrap gap-2 text-sm">
        {nav.map(([h, l]) => (
          <a key={h} href={h} className="rounded-full border border-line px-3 py-1.5 text-fg/80 hover:border-lime hover:text-lime">
            {l}
          </a>
        ))}
        <a href={DEMO_URL} {...ext} className="rounded-full bg-lime px-3 py-1.5 font-semibold text-ink">
          ▶ demo video
        </a>
      </nav>

      <section className="mt-16">
        <H id="simple" i="in" rest="plain words." />
        <ol className="mt-8 space-y-4">
          {SIMPLE.map((s, n) => (
            <li key={n} className="flex gap-5">
              <span className="serif-i text-4xl leading-none text-lime">{n + 1}</span>
              <p className="text-xl leading-relaxed">{s}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ["0G", "pays for her brain", `${HUNT_FEE_0G} 0G a hunt → depositFor → her own inference, sealed in a TEE. Cap ${DAILY_CAP_0G} 0G/day.`],
            ["Arkiv", "remembers the deals", `Every price is an entity that deletes itself after ${ARKIV.dealHours} h. /deals reads them for free.`],
            ["Zepto", "does the shopping", "Official MCP. Zepto's bill first, then your YES. Tested with a real order."],
          ].map(([k, t, d]) => (
            <div key={k} className="card p-5">
              <p className="font-mono text-sm text-lime">{k}</p>
              <p className="mt-1 text-lg font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <H id="numbers" i="the" rest="numbers." />
        <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [String(r.summary.inferences), "paid 0G calls"],
            [String(r.summary.sealedInferences), "sealed in a TEE"],
            [String(r.summary.hunts), "hunts in the log"],
            ["~10 s", "pay → self-deposit"],
            ["₹75", "saved on a 3-item list"],
            ["~10×", "earns vs spends"],
            [`${DAILY_CAP_0G} 0G`, "daily cap, 0G-enforced"],
            [`${ARKIV.dealHours} h`, "deal lifetime on Arkiv"],
          ].map(([v, l]) => (
            <div key={l} className="card p-4">
              <dd className="text-3xl font-medium tracking-tight tabular-nums text-lime">{v}</dd>
              <dt className="mt-1 text-xs text-muted">{l}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-6">
          <Suspense fallback={<LiveStatsSkeleton />}>
            <LiveStats />
          </Suspense>
        </div>
        <ul className="mt-6 space-y-1 text-sm">
          {PROOF.filter((p) => p.tx).map((p) => (
            <li key={p.tx}>
              <a href={txUrl(p.tx!)} {...ext} className="text-lime underline-offset-4 hover:underline">
                {p.step} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20">
        <H id="pitch-0g" i="pitch" rest="to 0G (3 min)." />
        <p className="mt-4 text-muted">
          Tracks: Agents That Pay for Themselves + Build with 0G Private Computer. Focus: the self-paying loop, request
          IDs, the cap and the tiers, and the TEE.
        </p>
        <Pitch beats={PITCH_0G} />
      </section>

      <section className="mt-20">
        <H id="pitch-arkiv" i="pitch" rest="to Arkiv (3 min)." />
        <p className="mt-4 text-muted">
          Track: Build on Arkiv. Focus: expiring entities, owner = Iva, /deals is a user-visible read, nothing to run.
        </p>
        <Pitch beats={PITCH_ARKIV} />
      </section>

      <section className="mt-20">
        <H id="qa-0g" i="0G" rest="judge questions." />
        <Questions qa={QA_0G} />
      </section>

      <section className="mt-20">
        <H id="qa-arkiv" i="arkiv" rest="judge questions." />
        <Questions qa={QA_ARKIV} />
      </section>

      <section className="mt-20">
        <H id="demo-checklist" i="live" rest="demo checklist." />
        <ol className="mt-8 space-y-3">
          {DEMO_CHECKLIST.map((s, n) => (
            <li key={n} className="card flex gap-4 p-4">
              <span className="serif-i text-3xl leading-none text-lime">{n + 1}</span>
              <p className="text-lg">{s}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-lime">
          <a href={BOT_URL} {...ext} className="underline-offset-4 hover:underline">
            @{BOT_USERNAME} ↗
          </a>
          <a href={REPO_URL} {...ext} className="underline-offset-4 hover:underline">
            GitHub ↗
          </a>
          <a href={DEMO_URL} {...ext} className="underline-offset-4 hover:underline">
            demo video ↗
          </a>
        </p>
      </section>
    </main>
  );
}

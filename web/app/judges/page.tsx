import type { Metadata } from "next";
import MeowPlayer from "../components/MeowPlayer";

export const metadata: Metadata = {
  title: "Dear judges · Iva",
  description: "A small, very serious request from the team that built Iva.",
};

export default function Judges() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <MeowPlayer />
      <div className="mx-auto max-w-6xl px-5 pb-28 pt-8">
        <a href="/#team" className="text-sm text-muted">
          ← back to <span className="serif-i text-lg text-lime">iva</span>
        </a>

        {/* the judges' names, very big */}
        <h2 className="display mt-8 text-center text-[19vw] leading-[0.85] text-lime md:text-[11rem]">
          <span className="serif-i">Gathin</span>
          <span className="block text-[0.45em] text-fg">&amp;</span>
          Udhay
        </h2>

        <div className="mt-12 grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] [&>*]:min-w-0">
          {/* the dog, full size */}
          <img src="/team/dog-broke.png" alt="A sad dog holding an empty wallet" className="dog-sticker mx-auto w-full max-w-md -rotate-3" />

          <div>
            <h1 className="display text-[2.6rem] text-fg md:text-[4rem]">
              We are very poor. We don&apos;t have money to book return tickets, so please give us the{" "}
              <span className="text-lime">$1,000 bounty track.</span>
            </h1>
            <p className="serif-i mt-6 text-3xl text-mustard">meow meow meow 🐱</p>
            <p className="text-sm text-muted">(that&apos;s “please” in cat)</p>
          </div>
        </div>

        {/* the judges, as a sticker */}
        <div className="mt-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2 [&>*]:min-w-0">
          <div className="relative mx-auto w-full max-w-lg">
            <img src="/team/judges.png" alt="Judge 1 Gathin and Judge 2 Udhay at the 0G booth" className="dog-sticker w-full rotate-2" />
            <div className="-mt-5 flex justify-center gap-3">
              <span className="sticker -rotate-3 rounded-xl bg-white px-4 py-2 font-semibold text-ink">Judge 1 · Gathin</span>
              <span className="sticker rotate-3 rounded-xl bg-lime px-4 py-2 font-semibold text-ink">Judge 2 · Udhay</span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-6">
              <p className="text-sm uppercase tracking-widest text-muted">dad joke #1</p>
              <p className="mt-2 text-xl">Why does our team love 0G so much?</p>
              <p className="serif-i mt-1 text-3xl text-lime">Because 0G is exactly how much money we have left.</p>
            </div>
            <div className="card p-6">
              <p className="text-sm uppercase tracking-widest text-muted">dad joke #2</p>
              <p className="mt-2 text-xl">Iva pays for her own brain.</p>
              <p className="serif-i mt-1 text-3xl text-lime">We can&apos;t even pay for our own train. 🚆</p>
            </div>
            <p className="text-muted">
              Please fund us like Iva funds her compute: fast, on-chain, and with no human in the loop. 🥺
            </p>
            <p className="text-sm text-muted">— Supreme leader, Halal baddy, Degen (and the dog)</p>
          </div>
        </div>
      </div>
    </main>
  );
}

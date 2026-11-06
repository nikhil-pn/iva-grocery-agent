import type { Metadata } from "next";
import PayIva from "../components/PayIva";
import { BOT_URL, HUNT_FEE_0G } from "@/lib/iva";

export const metadata: Metadata = {
  title: "Pay Iva in 0G",
  description: `Pay Iva ${HUNT_FEE_0G} 0G per grocery hunt on 0G mainnet, then return to Telegram.`,
};

// Standalone pay page for the bot's pay link: /pay?to=<iva>&amount=<0G>&bot=<username>
export default function PayPage() {
  return (
    <main className="mx-auto w-full max-w-md px-5 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <a href="/" className="text-sm text-muted">
        ← Iva
      </a>
      <h1 className="mt-3 text-2xl font-bold">🧺 Pay Iva</h1>
      <p className="mt-2 text-sm text-muted">
        Iva hunts the cheapest groceries across Blinkit, Instamart and Zepto. Your 0G goes into her wallet, and she
        uses it to pay for her own brain on 0G Compute.
      </p>
      <div className="mt-6">
        <PayIva compact />
      </div>
      <a href={BOT_URL} className="mt-6 block text-center text-sm text-muted underline">
        Back to the bot
      </a>
    </main>
  );
}

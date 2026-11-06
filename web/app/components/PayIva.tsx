"use client";

// Port of docs/pay.html: connect an injected wallet, switch to 0G mainnet, send a legacy
// tx with an explicit gas price (>= 4.1 gwei), wait for the receipt, then deep-link back
// to the bot with the tx hash so Iva can credit the hunts.

import { useEffect, useMemo, useState } from "react";
import CopyButton from "./CopyButton";
import { BOT_USERNAME, CHAIN, GAS_PRICE_FLOOR_WEI, HUNT_FEE_0G, IVA_WALLET, txUrl } from "@/lib/iva";

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    ethereum?: Eip1193;
    okxwallet?: unknown;
  }
}

type Phase = "idle" | "working" | "sent" | "confirmed" | "failed" | "stuck";

const CHAIN_PARAMS = {
  chainId: CHAIN.idHex,
  chainName: CHAIN.name,
  nativeCurrency: CHAIN.currency,
  rpcUrls: [CHAIN.rpc],
  blockExplorerUrls: [CHAIN.explorer],
};

function toWeiHex(x: string): string {
  const [i, f = ""] = x.split(".");
  const wei = BigInt(i || "0") * 10n ** 18n + BigInt((f + "0".repeat(18)).slice(0, 18) || "0");
  return "0x" + wei.toString(16);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isAddr = (a: unknown): a is string => typeof a === "string" && /^0x[0-9a-fA-F]{40}$/.test(a);

/**
 * The account to pay from. Some wallets (MetaMask mobile among them) hand back an empty list,
 * or drop the dapp's account permission when the network changes, so ask again, then fall back
 * to eth_accounts. Never send a tx without a real from address.
 */
async function getAccount(eth: Eip1193, prompt: boolean): Promise<string | null> {
  for (const method of prompt ? ["eth_requestAccounts", "eth_accounts"] : ["eth_accounts", "eth_requestAccounts"]) {
    try {
      const list = (await eth.request({ method })) as unknown;
      const a = Array.isArray(list) ? list.find(isAddr) : isAddr(list) ? list : null;
      if (a) return a;
    } catch (e) {
      if ((e as { code?: number }).code === 4001) throw e; // the user said no
    }
  }
  return null;
}

/** Wallet errors, in words a person can act on. */
function friendly(e: unknown): string {
  const err = e as { code?: number; message?: string; shortMessage?: string };
  const m = err.shortMessage || err.message || String(e);
  if (err.code === 4001 || /user (rejected|denied|cancel)/i.test(m)) return "You cancelled in your wallet. Tap pay to try again.";
  if (/must provide an ethereum address|not been authorized|no account/i.test(m))
    return "Your wallet didn't share an account with this page. Unlock it, tap pay again and approve Connect. Still stuck? Use “Or send it yourself”.";
  if (/insufficient funds/i.test(m)) return "Not enough 0G in this wallet for the payment plus a tiny gas fee.";
  return m;
}

async function getReceipt(hash: string, eth?: Eip1193): Promise<{ status: string } | null> {
  // Ask the public 0G RPC first (that's what Iva checks), then the wallet's own provider.
  try {
    const r = await fetch(CHAIN.rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [hash] }),
    }).then((x) => x.json());
    if (r?.result) return r.result;
  } catch {}
  try {
    const r = (await eth?.request({ method: "eth_getTransactionReceipt", params: [hash] })) as { status: string } | null;
    if (r) return r;
  } catch {}
  return null;
}

export default function PayIva({ compact = false }: { compact?: boolean }) {
  const [amount, setAmount] = useState(String(HUNT_FEE_0G));
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [isOkx, setIsOkx] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState("");
  const [hash, setHash] = useState("");
  const [foreignTo, setForeignTo] = useState("");
  const [deepLink, setDeepLink] = useState("");

  useEffect(() => {
    const eth = window.ethereum;
    setHasWallet(!!eth);
    setIsOkx(!!(window.okxwallet || eth?.isOkxWallet || eth?.isOKExWallet));
    setDeepLink("https://metamask.app.link/dapp/" + window.location.href.replace(/^https?:\/\//, ""));
    const q = new URLSearchParams(window.location.search);
    const a = q.get("amount");
    if (a && /^\d*\.?\d+$/.test(a) && Number(a) > 0 && Number(a) <= 100) setAmount(a);
    // The bot links here with ?to=<Iva>. We only ever pay Iva's configured wallet:
    // a link asking for another address is flagged, never followed.
    const to = q.get("to");
    if (to && to.toLowerCase() !== IVA_WALLET.toLowerCase()) setForeignTo(to);
  }, []);

  const hunts = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0 ? Math.floor(n / HUNT_FEE_0G + 1e-9) : 0;
  }, [amount]);

  const busy = phase === "working" || phase === "sent";
  const returnUrl = hash ? `https://t.me/${BOT_USERNAME}?start=${hash.replace(/^0x/, "")}` : "";

  async function pay() {
    const eth = window.ethereum;
    if (!/^\d*\.?\d+$/.test(amount) || !(Number(amount) > 0)) {
      setPhase("failed");
      setMsg("Enter an amount, e.g. 0.2");
      return;
    }
    if (!eth) {
      setPhase("failed");
      setMsg("No wallet found in this browser. Open this page in MetaMask, or use the manual path below.");
      return;
    }
    setPhase("working");
    setHash("");
    try {
      setMsg("Connecting wallet…");
      let from = await getAccount(eth, true);
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN.idHex }] });
      } catch (e) {
        const err = e as { code?: number; message?: string };
        if (err.code === 4902 || /unrecognized|not added|unknown chain/i.test(err.message || "")) {
          await eth.request({ method: "wallet_addEthereumChain", params: [CHAIN_PARAMS] });
        } else throw e;
      }
      // Re-read after the network switch: the account the wallet will actually sign with.
      from = (await getAccount(eth, false)) ?? from;
      if (!from) throw new Error("no account");
      // Legacy pricing with an explicit floor: some wallets underprice fees on 0G and the
      // tx is silently dropped. 0G mainnet's minimum is about 4 gwei.
      let gasPrice = (await eth.request({ method: "eth_gasPrice" }).catch(() => null)) as string | null;
      if (!gasPrice || BigInt(gasPrice) < GAS_PRICE_FLOOR_WEI) gasPrice = "0x" + GAS_PRICE_FLOOR_WEI.toString(16);
      setMsg("Confirm the payment in your wallet…");
      const h = (await eth.request({
        method: "eth_sendTransaction",
        params: [{ from, to: IVA_WALLET, value: toWeiHex(amount), gas: "0x5208", gasPrice, type: "0x0" }],
      })) as string;
      setHash(h);
      setPhase("sent");
      setMsg("Sent. Waiting for 0G to confirm…");
      for (let i = 0; i < 60; i++) {
        const r = await getReceipt(h, eth);
        if (r) {
          if (r.status === "0x1") {
            setPhase("confirmed");
            setMsg("Confirmed on 0G mainnet.");
          } else {
            setPhase("failed");
            setMsg("The transaction failed onchain.");
          }
          return;
        }
        await sleep(2000);
      }
      setPhase("stuck");
      setMsg(
        "Not confirmed after 2 minutes. Some wallets return a hash that never lands. Check the tx link; if it isn't there, use the manual path below.",
      );
    } catch (e) {
      setPhase("failed");
      setMsg(friendly(e));
    }
  }

  return (
    <div className={`grid gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
      <div className="card p-5">
        {foreignTo && (
          <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            This link asked to pay <code className="break-all">{foreignTo}</code>. That is not Iva. This page only
            pays Iva&apos;s wallet below.
          </p>
        )}
        {isOkx && (
          <p className="mb-4 rounded-lg border border-mustard/40 bg-mustard/10 p-3 text-sm text-mustard">
            <b>OKX Wallet detected.</b> Its in-app browser can return a tx hash that never reaches 0G. Use OKX&apos;s
            normal <b>Send</b> instead (see “Or send it yourself”).
          </p>
        )}
        <label htmlFor="amount" className="text-sm text-muted">
          Amount (0G)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="w-full rounded-2xl border border-line bg-bg px-3 py-3 text-2xl font-semibold tabular-nums outline-none focus:border-lime/70"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["0.2", "1", "2"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className={`tap rounded-full border px-3 py-1 text-sm ${amount === v ? "border-lime bg-lime/15 text-lime" : "border-line text-muted"}`}
            >
              {v} 0G · {Math.round(Number(v) / HUNT_FEE_0G)} hunt{v === "0.2" ? "" : "s"}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          = <b className="text-fg">{hunts}</b> hunt{hunts === 1 ? "" : "s"} at {HUNT_FEE_0G} 0G each · 0G Mainnet
          (chain {CHAIN.id})
        </p>

        {hasWallet === false ? (
          <>
            <a
              href={deepLink}
              className="tap mt-4 block w-full rounded-2xl bg-lime px-4 py-3.5 text-center text-base font-bold text-ink"
            >
              Open in MetaMask app
            </a>
            <p className="mt-2 text-xs text-muted">
              No wallet in this browser. Open this page in a wallet&apos;s browser, or send 0G yourself (below).
            </p>
          </>
        ) : (
          <button
            type="button"
            onClick={pay}
            disabled={busy}
            className="tap mt-4 w-full rounded-2xl bg-lime px-4 py-3.5 text-base font-bold text-ink transition-opacity disabled:opacity-50"
          >
            {busy ? "Working…" : "Connect wallet & pay"}
          </button>
        )}

        {msg && (
          <p
            role="status"
            className={`mt-3 text-sm ${phase === "failed" || phase === "stuck" ? "text-red-300" : phase === "confirmed" ? "text-lime" : "text-muted"}`}
          >
            {phase === "confirmed" ? "✅ " : phase === "failed" ? "❌ " : ""}
            {msg}
          </p>
        )}

        {hash && (
          <div className="mt-4 rounded-2xl border border-line bg-bg p-4">
            {phase === "confirmed" ? (
              <p className="font-semibold text-lime">Paid. One more tap:</p>
            ) : (
              <p className="text-sm text-muted">Your transaction:</p>
            )}
            {(phase === "confirmed" || phase === "stuck") && (
              <a
                href={returnUrl}
                className="tap mt-3 block w-full rounded-2xl bg-[#2aabee] px-4 py-3.5 text-center font-bold text-white"
              >
                Return to Iva on Telegram
              </a>
            )}
            <a
              href={txUrl(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block break-all font-mono text-xs text-lime underline-offset-2 hover:underline"
            >
              {hash}
            </a>
          </div>
        )}
      </div>

      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-lime">Works from any wallet</p>
        <h3 className="mt-1 text-lg font-bold">Or send it yourself</h3>
        <ol className="mt-3 space-y-3 text-sm text-muted">
          <li>
            <span className="text-fg">1.</span> In any wallet on <b className="text-fg">0G Mainnet</b> (chain{" "}
            {CHAIN.id}), send <b className="text-fg">{HUNT_FEE_0G} 0G</b> per hunt to Iva:
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-bg p-2">
              <code className="min-w-0 flex-1 break-all font-mono text-xs text-fg">{IVA_WALLET}</code>
              <CopyButton text={IVA_WALLET} />
            </div>
          </li>
          <li>
            <span className="text-fg">2.</span> Copy the transaction hash and paste it into the bot (or send{" "}
            <code className="text-fg">/paid 0x…</code>). Iva checks it onchain: it went to her, succeeded, and
            wasn&apos;t used before.
          </li>
        </ol>
        <a
          href={`https://t.me/${BOT_USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tap mt-4 block w-full rounded-2xl border border-line px-4 py-3 text-center font-semibold"
        >
          Open @{BOT_USERNAME}
        </a>
        <p className="mt-4 text-xs text-muted">
          Learned on launch night: <b className="text-fg">OKX Wallet&apos;s in-app browser</b> returns a hash for
          0G transactions that never lands. A plain Send from the OKX app works, and Iva credited it in ~10 s.
        </p>
      </div>
    </div>
  );
}

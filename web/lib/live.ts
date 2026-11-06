// Live, read-only stats from public 0G data. Runs on the server (no CORS, one cached
// fetch shared by every visitor), revalidated every ~30 s. Never throws: a failed source
// comes back as null and the UI says so.
import { cacheLife } from "next/cache";
import {
  BALANCE_OF_SELECTOR,
  CHAIN,
  COMPUTE_ACCOUNT,
  DEPOSIT_FOR_SELECTOR,
  IVA_WALLET,
  PAYMENT_LAYER,
} from "./iva";

export type Activity = {
  kind: "payment" | "deposit";
  hash: string;
  amount0G: number;
  at: number; // unix seconds
};

export type LiveStats = {
  fetchedAt: string; // ISO
  walletBalance0G: number | null;
  computeBalance0G: number | null;
  activity: Activity[] | null;
  totals: { paymentsIn: number; paidIn0G: number; deposits: number; deposited0G: number } | null;
};

export function weiTo0G(wei: bigint): number {
  // keep 6 decimals of precision without floating-point overflow
  return Number(wei / 10n ** 12n) / 1e6;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(CHAIN.rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`rpc ${method} ${res.status}`);
  const j = (await res.json()) as { result?: T; error?: { message: string } };
  if (j.error || j.result === undefined) throw new Error(j.error?.message || `rpc ${method}: no result`);
  return j.result;
}

async function walletBalance(): Promise<number | null> {
  try {
    const hex = await rpc<string>("eth_getBalance", [IVA_WALLET, "latest"]);
    return weiTo0G(BigInt(hex));
  } catch {
    return null;
  }
}

async function computeBalance(): Promise<number | null> {
  try {
    const data = BALANCE_OF_SELECTOR + COMPUTE_ACCOUNT.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    const hex = await rpc<string>("eth_call", [{ to: PAYMENT_LAYER, data }, "latest"]);
    return weiTo0G(BigInt(hex === "0x" ? "0x0" : hex));
  } catch {
    return null;
  }
}

type ExplorerTx = {
  hash: string;
  from: string;
  to: string;
  value: string;
  input: string;
  isError: string;
  txreceipt_status?: string;
  timestamp: string;
};

async function explorerActivity(): Promise<{ activity: Activity[]; totals: LiveStats["totals"] } | null> {
  try {
    const url = `${CHAIN.explorerApi}?module=account&action=txlist&address=${IVA_WALLET}&sort=desc&page=1&offset=100`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const j = (await res.json()) as { status: string; result: ExplorerTx[] | string };
    if (!Array.isArray(j.result)) return null;
    const iva = IVA_WALLET.toLowerCase();
    const vault = PAYMENT_LAYER.toLowerCase();
    const activity: Activity[] = [];
    for (const t of j.result) {
      if (t.isError !== "0" || t.txreceipt_status === "0") continue;
      const value = BigInt(t.value || "0");
      const to = (t.to || "").toLowerCase();
      const from = (t.from || "").toLowerCase();
      if (to === iva && value > 0n) {
        activity.push({ kind: "payment", hash: t.hash, amount0G: weiTo0G(value), at: Number(t.timestamp) });
      } else if (from === iva && to === vault && (t.input || "").startsWith(DEPOSIT_FOR_SELECTOR)) {
        activity.push({ kind: "deposit", hash: t.hash, amount0G: weiTo0G(value), at: Number(t.timestamp) });
      }
    }
    const pay = activity.filter((a) => a.kind === "payment");
    const dep = activity.filter((a) => a.kind === "deposit");
    return {
      activity,
      totals: {
        paymentsIn: pay.length,
        paidIn0G: pay.reduce((s, a) => s + a.amount0G, 0),
        deposits: dep.length,
        deposited0G: dep.reduce((s, a) => s + a.amount0G, 0),
      },
    };
  } catch {
    return null;
  }
}

export async function getLiveStats(): Promise<LiveStats> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 600 });
  const [w, c, a] = await Promise.all([walletBalance(), computeBalance(), explorerActivity()]);
  return {
    fetchedAt: new Date().toISOString(),
    walletBalance0G: w,
    computeBalance0G: c,
    activity: a?.activity ?? null,
    totals: a?.totals ?? null,
  };
}


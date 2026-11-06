import { getLiveStats } from "@/lib/live";
import { COMPUTE_ACCOUNT, IVA_WALLET, PAYMENT_LAYER, addrUrl, short, txUrl } from "@/lib/iva";
import TimeAgo from "./TimeAgo";

const fmt = (x: number | null, d = 3) => (x == null ? "—" : x.toLocaleString("en-US", { maximumFractionDigits: d }));

function Tile({
  label,
  value,
  unit = "0G",
  sub,
  href,
  ok = true,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: React.ReactNode;
  href?: string;
  ok?: boolean;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {value}
        {ok && <span className="ml-1 text-sm font-semibold text-muted">{unit}</span>}
      </p>
      <p className="mt-1 text-xs text-muted">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
            {sub}
          </a>
        ) : (
          sub
        )}
      </p>
    </div>
  );
}

export default async function LiveStats() {
  const s = await getLiveStats();
  const fetched = Date.parse(s.fetchedAt);
  const recent = (s.activity ?? []).slice(0, 8);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          label="Iva's wallet"
          value={s.walletBalance0G == null ? "unavailable" : fmt(s.walletBalance0G, 4)}
          ok={s.walletBalance0G != null}
          sub={short(IVA_WALLET)}
          href={addrUrl(IVA_WALLET)}
        />
        <Tile
          label="Her 0G compute vault"
          value={s.computeBalance0G == null ? "unavailable" : fmt(s.computeBalance0G, 4)}
          ok={s.computeBalance0G != null}
          sub={`balanceOf(${short(COMPUTE_ACCOUNT)})`}
          href={addrUrl(PAYMENT_LAYER)}
        />
        <Tile
          label="Payments received"
          value={s.totals ? fmt(s.totals.paidIn0G, 3) : "unavailable"}
          ok={!!s.totals}
          sub={s.totals ? `${s.totals.paymentsIn} tx${s.totals.paymentsIn === 1 ? "" : "s"} to her wallet` : "explorer API down"}
        />
        <Tile
          label="Self-deposits (depositFor)"
          value={s.totals ? fmt(s.totals.deposited0G, 3) : "unavailable"}
          ok={!!s.totals}
          sub={s.totals ? `${s.totals.deposits} tx${s.totals.deposits === 1 ? "" : "s"} signed by Iva` : "explorer API down"}
        />
      </div>

      <div className="card mt-3 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-semibold">Recent money moves</p>
          <p className="text-xs text-muted">
            updated <TimeAgo ms={fetched} />
          </p>
        </div>
        {s.activity == null ? (
          <p className="px-4 py-4 text-sm text-muted">
            The 0G explorer API didn&apos;t answer just now. The full history is on{" "}
            <a className="text-sky-300 underline" href={addrUrl(IVA_WALLET)} target="_blank" rel="noopener noreferrer">
              chainscan
            </a>
            .
          </p>
        ) : recent.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted">No payments or deposits yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((a) => (
              <li key={a.hash} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-sm ${a.kind === "payment" ? "bg-emerald-400/15" : "bg-amber-400/15"}`}
                  aria-hidden
                >
                  {a.kind === "payment" ? "💰" : "⚡"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {a.kind === "payment" ? "Customer paid Iva" : "Iva → her 0G compute (depositFor)"}
                  </p>
                  <a
                    href={txUrl(a.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-sky-300 underline-offset-2 hover:underline"
                  >
                    {short(a.hash, 10, 6)}
                  </a>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold tabular-nums ${a.kind === "payment" ? "text-emerald-300" : "text-amber-200"}`}
                  >
                    {a.kind === "payment" ? "+" : "→ "}
                    {fmt(a.amount0G, 4)} 0G
                  </p>
                  <TimeAgo ms={a.at * 1000} className="text-xs text-muted" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        Read-only, public data: <code>eth_getBalance</code> and the Payment Layer&apos;s <code>balanceOf</code> on{" "}
        <code>evmrpc.0g.ai</code>, plus the chainscan open API. Cached for ~30 s on the server.
      </p>
    </div>
  );
}

export function LiveStatsSkeleton() {
  return (
    <div aria-busy="true">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-[92px] animate-pulse p-4">
            <div className="h-3 w-20 rounded bg-line" />
            <div className="mt-3 h-6 w-24 rounded bg-line" />
          </div>
        ))}
      </div>
      <div className="card mt-3 h-48 animate-pulse" />
    </div>
  );
}

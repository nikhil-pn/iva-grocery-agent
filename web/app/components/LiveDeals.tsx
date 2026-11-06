import { arkivAddrUrl, arkivEntityUrl, getLiveDeals } from "@/lib/deals";
import { ARKIV, BOT_URL, IVA_WALLET, short } from "@/lib/iva";
import ExpiresIn from "./ExpiresIn";
import TimeAgo from "./TimeAgo";

const SHOP: Record<string, string> = { blinkit: "Blinkit", instamart: "Instamart", zepto: "Zepto" };
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const rs = (x: number) => `₹${x % 1 ? x.toFixed(2) : x}`;

export default async function LiveDeals() {
  const f = await getLiveDeals("mumbai");
  return (
    <div>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <p className="text-sm font-semibold">Mumbai shelf · cheapest live price per item</p>
          <p className="shrink-0 text-xs text-muted">
            read <TimeAgo ms={f.fetchedAt} />
          </p>
        </div>
        {f.items == null ? (
          <p className="px-4 py-4 text-sm text-muted">
            Arkiv&apos;s public endpoint didn&apos;t answer just now (it&apos;s rate limited). Every deal is still on the{" "}
            <a href={arkivAddrUrl(IVA_WALLET)} {...ext} className="text-lime underline">
              Arkiv explorer
            </a>
            .
          </p>
        ) : f.items.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted">
            No live deals right now; deals expire {ARKIV.dealHours} h after a hunt.{" "}
            <a href={BOT_URL} {...ext} className="text-lime underline">
              Send Iva a list
            </a>{" "}
            to create some.
          </p>
        ) : (
          <ul className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {f.items.map(({ item, cheapest: d, others }) => (
              <li key={item} className="tag flex flex-col p-5">
                <p className="pr-6 text-xs uppercase tracking-widest text-ink/55">{SHOP[d.shop] ?? d.shop} · cheapest</p>
                <p className="mt-1 text-lg font-semibold capitalize leading-tight">{item}</p>
                <p className="mt-3 text-5xl font-medium tracking-tight tabular-nums">{rs(d.priceRs)}</p>
                <p className="mt-2 flex-1 text-sm text-ink/70">
                  {d.url ? (
                    <a href={d.url} {...ext} className="underline-offset-2 hover:underline">
                      {d.product}
                    </a>
                  ) : (
                    d.product
                  )}{" "}
                  ({d.pack})
                  {others.length > 0 && (
                    <span className="mt-1 block text-xs text-ink/55">
                      vs {others.map((o) => `${SHOP[o.shop] ?? o.shop} ${rs(o.priceRs)}`).join(" · ")}
                    </span>
                  )}
                </p>
                <p className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-ink/25 pt-3 text-xs text-ink/60">
                  <ExpiresIn fetchedAt={f.fetchedAt} seconds={d.expiresInS} />
                  <a href={arkivEntityUrl(d.key)} {...ext} className="font-mono underline-offset-2 hover:underline">
                    {short(d.key, 6, 4)} ↗
                  </a>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <details className="mt-2 text-xs text-muted">
        <summary className="tap cursor-pointer">
          Read live from Arkiv&apos;s public network, refreshed every minute. Show the exact query ▾
        </summary>
        <code className="mt-2 block break-all rounded-xl bg-ink p-3 font-mono text-fg/80">
          arkiv.schema = str(&apos;{ARKIV.schema}&apos;) AND city = str(&apos;mumbai&apos;) AND $owner = addr({IVA_WALLET})
          ORDER BY huntAt DESC
        </code>
      </details>
    </div>
  );
}

export function LiveDealsSkeleton() {
  return <div className="card h-56 animate-pulse" aria-busy="true" />;
}

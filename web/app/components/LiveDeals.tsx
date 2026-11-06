import { arkivAddrUrl, arkivEntityUrl, arkivTxUrl, getLiveDeals } from "@/lib/deals";
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
          <p className="text-sm font-semibold">Cheapest live deal per item · Mumbai</p>
          <p className="shrink-0 text-xs text-muted">
            read <TimeAgo ms={f.fetchedAt} />
          </p>
        </div>
        {f.items == null ? (
          <p className="px-4 py-4 text-sm text-muted">
            Arkiv&apos;s public endpoint didn&apos;t answer just now (it&apos;s rate limited). Every deal is still on the{" "}
            <a href={arkivAddrUrl(IVA_WALLET)} {...ext} className="text-sky-300 underline">
              Arkiv explorer
            </a>
            .
          </p>
        ) : f.items.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted">
            No live deals right now; deals expire {ARKIV.dealHours} h after a hunt.{" "}
            <a href={BOT_URL} {...ext} className="text-sky-300 underline">
              Send Iva a list
            </a>{" "}
            to create some.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {f.items.map(({ item, cheapest: d, others }) => (
              <li key={item} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold capitalize">{item}</p>
                  <p className="shrink-0 text-right">
                    <span className="font-bold tabular-nums text-emerald-300">{rs(d.priceRs)}</span>{" "}
                    <span className="text-sm text-muted">{SHOP[d.shop] ?? d.shop}</span>
                  </p>
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {d.url ? (
                    <a href={d.url} {...ext} className="text-fg underline-offset-2 hover:underline">
                      {d.product}
                    </a>
                  ) : (
                    d.product
                  )}{" "}
                  ({d.pack})
                  {others.length > 0 && (
                    <span className="block text-xs">
                      vs{" "}
                      {others.map((o) => `${SHOP[o.shop] ?? o.shop} ${rs(o.priceRs)}`).join(" · ")}
                    </span>
                  )}
                </p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                  <ExpiresIn fetchedAt={f.fetchedAt} seconds={d.expiresInS} />
                  <a href={arkivEntityUrl(d.key)} {...ext} className="font-mono text-sky-300 underline-offset-2 hover:underline">
                    entity {short(d.key, 8, 4)} ↗
                  </a>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-2 break-words text-xs text-muted">
        Read-only, from Arkiv&apos;s public Rabdi endpoint, cached ~60 s. Query:{" "}
        <code className="break-all">
          arkiv.schema = str(&apos;{ARKIV.schema}&apos;) AND city = str(&apos;mumbai&apos;) AND $owner = addr({short(IVA_WALLET)})
        </code>
        . First publish:{" "}
        <a href={arkivTxUrl(ARKIV.proofTx)} {...ext} className="font-mono text-sky-300 underline-offset-2 hover:underline">
          tx {short(ARKIV.proofTx, 8, 4)}
        </a>{" "}
        ·{" "}
        <a href={arkivEntityUrl(ARKIV.proofEntity)} {...ext} className="font-mono text-sky-300 underline-offset-2 hover:underline">
          entity {short(ARKIV.proofEntity, 8, 4)}
        </a>{" "}
        ·{" "}
        <a href={arkivAddrUrl(IVA_WALLET)} {...ext} className="text-sky-300 underline-offset-2 hover:underline">
          all of Iva&apos;s deals
        </a>
      </p>
    </div>
  );
}

export function LiveDealsSkeleton() {
  return <div className="card h-56 animate-pulse" aria-busy="true" />;
}

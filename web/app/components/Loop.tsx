// The money loop as one animated SVG: a 0G coin travels round six stations in 12 s and the
// matching step in the list lights up. Pure SVG + CSS (no JS); reduced motion shows it static.
import { HUNT_FEE_0G } from "@/lib/iva";

const STEPS: { t: string; d: string }[] = [
  { t: "You pay", d: `${HUNT_FEE_0G} 0G a hunt, from any wallet, into Iva's own wallet.` },
  { t: "She tops up her brain", d: "Iva signs depositFor() on the 0G Payment Layer herself. No human in the loop." },
  { t: "Sealed thinking on 0G", d: "glm-5.3 in a TEE reads your list and matches products. Every call has a request ID and a cost." },
  { t: "Hunt three shops", d: "Blinkit, Instamart and Zepto at your address. The cheapest basket and the ₹ saved." },
  { t: "Deals go to Arkiv", d: "Every winning price is published as an entity that expires on its own after 6 h." },
  { t: "Say “order”", d: "Iva fills your Zepto cart, shows Zepto's bill and orders only after YES." },
];

const R = 150;
const C = 200;
const pos = (i: number) => {
  const a = ((-90 + 60 * i) * Math.PI) / 180;
  return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
};
const PATH = `M${C},${C - R} A${R},${R} 0 1 1 ${C},${C + R} A${R},${R} 0 1 1 ${C},${C - R}`;

export default function Loop() {
  return (
    <div className="grid items-center gap-10 md:grid-cols-[minmax(0,26rem)_1fr]">
      <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-[26rem]" role="img" aria-label="Iva's loop: pay, deposit, think, hunt, publish, order">
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--color-line)" strokeWidth="2" />
        <path d={PATH} fill="none" stroke="var(--color-lime)" strokeWidth="2" className="loop-dash" opacity="0.7" />
        {STEPS.map((_, i) => {
          const p = pos(i);
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="24"
                className="loop-node"
                style={{ animationDelay: `${i * 2}s` }}
                fill="var(--color-raised)"
                stroke="var(--color-lime)"
                strokeWidth="2"
              />
              <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--color-fg)" style={{ mixBlendMode: "difference" }}>
                {i + 1}
              </text>
            </g>
          );
        })}
        <g className="loop-coin">
          <circle r="13" fill="var(--color-lime)" stroke="#fff" strokeWidth="3" />
          <text y="4.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--color-ink)">
            0G
          </text>
          <animateMotion dur="12s" repeatCount="indefinite" path={PATH} rotate="0" />
        </g>
        <text x={C} y={C - 10} textAnchor="middle" fontSize="54" fill="var(--color-lime)" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
          iva
        </text>
        <text x={C} y={C + 22} textAnchor="middle" fontSize="13" fill="var(--color-muted)">
          earns {HUNT_FEE_0G} · spends ~0.02
        </text>
        <text x={C} y={C + 40} textAnchor="middle" fontSize="13" fill="var(--color-muted)">
          per hunt, in 0G
        </text>
      </svg>
      <ol className="space-y-1">
        {STEPS.map((s, i) => (
          <li key={s.t} className="loop-step flex gap-4 rounded-2xl px-3 py-2.5" style={{ animationDelay: `${i * 2}s` }}>
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-lime text-sm font-bold text-ink">{i + 1}</span>
            <div>
              <p className="font-semibold">{s.t}</p>
              <p className="text-sm text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

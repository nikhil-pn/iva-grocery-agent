"use client";

import { useEffect, useState } from "react";

const ist = (ms: number) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ms) + " IST";

function ago(ms: number) {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

/** Server renders the absolute IST time; the browser swaps in "x min ago" after hydration. */
export default function TimeAgo({ ms, className = "" }: { ms: number; className?: string }) {
  const [label, setLabel] = useState(() => ist(ms));
  useEffect(() => {
    setLabel(ago(ms));
    const t = setInterval(() => setLabel(ago(ms)), 30_000);
    return () => clearInterval(t);
  }, [ms]);
  return (
    <time dateTime={new Date(ms).toISOString()} title={ist(ms)} className={className} suppressHydrationWarning>
      {label}
    </time>
  );
}

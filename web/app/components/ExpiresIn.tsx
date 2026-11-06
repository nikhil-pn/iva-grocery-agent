"use client";

import { useEffect, useState } from "react";

function label(s: number) {
  if (s <= 0) return "expired";
  const m = Math.max(1, Math.floor(s / 60));
  return `expires in ${m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`}`;
}

/** Server renders the countdown as of the Arkiv read; the browser keeps it ticking. */
export default function ExpiresIn({ fetchedAt, seconds }: { fetchedAt: number; seconds: number }) {
  const at = fetchedAt + seconds * 1000;
  const [text, setText] = useState(() => label(seconds));
  useEffect(() => {
    const tick = () => setText(label((at - Date.now()) / 1000));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [at]);
  return (
    <span title={new Date(at).toISOString()} suppressHydrationWarning>
      ⏳ {text}
    </span>
  );
}

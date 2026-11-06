"use client";

import { useState } from "react";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older in-app browsers: fall back to a hidden textarea.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

export default function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(text);
        setState(ok ? "ok" : "err");
        setTimeout(() => setState("idle"), 1600);
      }}
      className={`tap shrink-0 rounded-lg border border-line bg-raised px-3 py-1.5 text-xs font-semibold text-fg transition-colors active:bg-line ${className}`}
      aria-live="polite"
    >
      {state === "ok" ? "Copied ✓" : state === "err" ? "Copy failed" : label}
    </button>
  );
}
